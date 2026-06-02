import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Linking, Platform, Alert } from 'react-native';
import { supabase } from '../services/api/supabase';
import { sendDebugLog } from '../utils/debugIngest';
import { User } from '../types/user';
import { getCurrentUser, getUserById, createUserProfile, ensureUserDefaultSport } from '../services/userService';
import { navigationRef } from '../navigation/navigationRef';
import { parseAppDeepLink } from '../navigation/deepLinking';
import { joinGroupAndNextGame } from '../services/regularGroupService';
import { ensureActivityGroupConversation } from '../services/chatService';
import { ROUTES } from '../constants/routes';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signInWithPhone: (phone: string) => Promise<void>;
  verifyPhone: (phone: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const EMAIL_REDIRECT_TO = 'rallyapp://auth/callback';

const parseAuthParamsFromUrl = (url: string): Record<string, string> => {
  // Supabase can send auth params in query (?a=b) or fragment (#a=b).
  const queryPart = url.split('?')[1]?.split('#')[0] ?? '';
  const hashPart = url.split('#')[1] ?? '';
  const combined = [queryPart, hashPart].filter(Boolean).join('&');
  const result: Record<string, string> = {};

  if (!combined) {
    return result;
  }

  const pairs = combined.split('&');
  for (const pair of pairs) {
    if (!pair) {
      continue;
    }
    const [rawKey, rawValue = ''] = pair.split('=');
    const key = decodeURIComponent(rawKey);
    const value = decodeURIComponent(rawValue);
    result[key] = value;
  }

  return result;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationCleanup, setNotificationCleanup] = useState<(() => void) | null>(null);
  const notificationCleanupRef = useRef<(() => void) | null>(null);
  const loadUserPromisesRef = useRef<Map<string, Promise<void>>>(new Map());
  notificationCleanupRef.current = notificationCleanup;

  const loadUser = useCallback(async (userId: string) => {
    // Deduplicate: checkSession() and onAuthStateChange() both call loadUser; share one in-flight promise.
    const inFlight = loadUserPromisesRef.current.get(userId);
    if (inFlight) {
      return inFlight;
    }

    const run = (async () => {
    try {
      // Prefer fetch by userId (session is already set); getCurrentUser() can be stale/empty right after sign-in.
      let userData = await getUserById(userId);

      if (!userData) {
        userData = await getCurrentUser();
      }

      // If auth user exists but profile is missing, auto-create it.
      if (!userData) {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser?.id) {
          const metadataUsername =
            typeof authUser.user_metadata?.username === 'string'
              ? authUser.user_metadata.username
              : undefined;
          const fallbackUsername =
            (authUser.email?.split('@')[0] || authUser.phone?.replace(/\D/g, '').slice(-8) || 'user').slice(0, 30);
          let createdOrExisting: User | null = null;
          try {
            createdOrExisting = await createUserProfile(authUser.id, {
              username: metadataUsername || fallbackUsername,
              email: authUser.email || undefined,
              phone: authUser.phone || undefined,
            });
          } catch (createProfileError: any) {
            // Signup can still be successful if DB trigger already created profile.
            // Avoid surfacing this as a fatal auth subscriber error.
            console.warn(
              'Auto-create profile fallback failed; attempting profile re-fetch:',
              createProfileError?.message || createProfileError
            );
          }
          // Use createUserProfile result when it returned existing profile; else refetch.
          userData = createdOrExisting ?? (await getUserById(authUser.id)) ?? (await getCurrentUser());
        }
      }

      if (!userData) {
        throw new Error('Profile not found after auto-create attempt.');
      }

      userData = await ensureUserDefaultSport(userData);

      setUser(userData);
      // Do not block auth/navigation on notification setup.
      // On Android, defer notification init so the main UI can mount first (avoids native crash when Firebase is not fully configured).
      const runNotificationInit = async () => {
        try {
          const { initializeNotificationsForUser } = require('../services/notificationService');
          const previousCleanup = notificationCleanupRef.current;
          if (previousCleanup) {
            previousCleanup();
          }
          const cleanup = await initializeNotificationsForUser(userId);
          if (cleanup) {
            setNotificationCleanup(() => cleanup);
          } else {
            setNotificationCleanup(null);
          }
        } catch (notificationError: any) {
          console.warn(
            'Notification initialization skipped:',
            (notificationError as any)?.message || notificationError
          );
        }
      };
      if (Platform.OS === 'android') {
        setTimeout(runNotificationInit, 800);
      } else {
        runNotificationInit();
      }
    } catch (error: any) {
      console.error('Error loading user:', error);
      // Re-throw so sign-in/signup show clear message.
      // However, avoid surfacing benign signup races as fatal runtime errors.
      if (error?.message?.includes('Database setup incomplete')) {
        const profileAfterError = await getCurrentUser();
        if (profileAfterError) {
          setUser(profileAfterError);
          return;
        }
        throw error;
      }
      if (error?.message?.includes('Profile not found')) {
        throw error;
      }
      if (error?.message?.includes('Failed to register device token')) {
        throw new Error('Signed in, but push notification setup failed. Please retry from settings.');
      }
      if (error?.message?.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please try again.');
      }
      throw new Error('Unable to complete account setup right now. Please try again.');
    } finally {
      loadUserPromisesRef.current.delete(userId);
    }
    })();

    loadUserPromisesRef.current.set(userId, run);
    return run;
  }, []);

  const checkSession = useCallback(async () => {
    // #region agent log
    sendDebugLog('AuthContext.tsx:checkSession', 'Auth checkSession started', {}, 'H1');
    // #endregion
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        // Wait for profile load before leaving bootstrap — avoids login flash + blank main nav on Android.
        await loadUser(session.user.id);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      // #region agent log
      sendDebugLog('AuthContext.tsx:setLoadingFalse', 'Auth loading=false', {}, 'H1');
      // #endregion
      setLoading(false);
    }
  }, [loadUser]);

  useEffect(() => {
    const handleAuthDeepLink = async (url: string) => {
      try {
        const parsed = parseAppDeepLink(url);
        if (parsed.type === 'game' && parsed.activityId && navigationRef.isReady()) {
          (navigationRef as any).navigate(ROUTES.ACTIVITY.DETAIL, {
            activityId: parsed.activityId,
          });
          return;
        }
        if (parsed.type === 'invite' && parsed.inviteToken && navigationRef.isReady()) {
          (navigationRef as any).navigate(ROUTES.ACTIVITY.DETAIL, {
            inviteToken: parsed.inviteToken,
          });
          return;
        }
        if (parsed.type === 'groupInvite' && parsed.groupInviteToken) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session?.user) {
            Alert.alert('Sign in required', 'Log in to join this Regulars group.');
            return;
          }
          try {
            const { activityId, conversationId, groupId, joinedGame, joinGameError } =
              await joinGroupAndNextGame(parsed.groupInviteToken);
            if (joinGameError === 'full') {
              Alert.alert(
                'Joined crew',
                "You're in the crew. The next game is full — tap Join when a spot opens."
              );
            }
            if (conversationId && navigationRef.isReady()) {
              (navigationRef as any).navigate(ROUTES.CHAT.THREAD, {
                conversationId,
                activityId: activityId ?? undefined,
                groupId,
                title: 'Crew chat',
              });
              return;
            }
            if (activityId && navigationRef.isReady()) {
              try {
                const gameConvoId = await ensureActivityGroupConversation(activityId);
                (navigationRef as any).navigate(ROUTES.CHAT.THREAD, {
                  conversationId: gameConvoId,
                  activityId,
                });
                return;
              } catch {
                // Joined the crew but couldn't open the room — fall back to a confirmation.
              }
            }
            if (joinedGame) {
              Alert.alert('Joined crew', "You're in! Your next game will show up in Chats.");
            } else if (!joinGameError) {
              Alert.alert('Joined crew', "You're in the crew. Open Chats when a game is scheduled.");
            }
          } catch (err: any) {
            Alert.alert('Group invite', err?.message || 'Could not join group.');
          }
          return;
        }

        const params = parseAuthParamsFromUrl(url);

        if (params.access_token && params.refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (error) {
            console.error('Failed to set auth session from deep link:', error);
          }
          return;
        }

        if (params.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(params.code);
          if (error) {
            console.error('Failed to exchange code for session:', error);
          }
          return;
        }

        if (params.token_hash && params.type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: params.token_hash,
            type: params.type as any,
          });
          if (error) {
            console.error('Failed to verify OTP from deep link:', error);
          }
        }
      } catch (error) {
        console.error('Error handling auth deep link:', error);
      }
    };

    // Check for existing session
    checkSession();

    // Safety: ensure loading is cleared even if getSession() or loadUser() hangs (e.g. on iOS)
    const safetyTimer = setTimeout(() => setLoading(false), 5000);

    Linking.getInitialURL()
      .then((initialUrl) => {
        if (initialUrl) {
          handleAuthDeepLink(initialUrl);
        }
      })
      .catch((error) => {
        console.error('Error reading initial deep link URL:', error);
      });

    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      handleAuthDeepLink(url);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Fire-and-forget: do not await loadUser here. Awaiting can deadlock because
        // loadUser -> getCurrentUser -> supabase.auth.getUser() may wait for this
        // auth state handler to complete, so signIn/signUp never resolve and buttons spin forever.
        loadUser(session.user.id).catch((authLoadError: any) => {
          console.warn('Auth state change user load failed:', authLoadError?.message || authLoadError);
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
      linkingSubscription.remove();
    };
  }, [checkSession, loadUser]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (data.user) {
      await loadUser(data.user.id);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    // Step 1: Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: EMAIL_REDIRECT_TO,
        data: {
          username,
        },
      },
    });

    if (error) {
      console.error('Auth signup failed:', error);

      // Provide user-friendly error messages
      if (error.message?.toLowerCase().includes('rate limit')) {
        throw new Error(
          'Email rate limit exceeded. Please wait a few minutes before trying again, or check your email for a verification link from a previous attempt.'
        );
      }

      if (error.message?.toLowerCase().includes('already registered')) {
        throw new Error('This email is already registered. Please sign in instead.');
      }

      // Throw original error for other cases
      throw error;
    }

    if (!data.user) {
      console.error('No user returned from signup');
      throw new Error('Signup failed: No user created');
    }

    // If email confirmation is enabled, Supabase may not return a session yet.
    // In that case profile creation will happen after the first confirmed sign-in.
    if (!data.session) {
      return;
    }

    // Step 2: Create user profile
    try {
      await createUserProfile(data.user.id, {
        username,
        email,
      });
    } catch (profileError: any) {
      console.warn('Profile create retry path used during signup:', profileError?.message || profileError);
      // Don't throw here - auth user is already created
      // We'll try to load user anyway
    }

    // Step 3: Load user data
    try {
      await loadUser(data.user.id);
    } catch (loadError: any) {
      console.warn('Post-signup user load retry path used:', loadError?.message || loadError);
      // This is non-fatal - user is created, just can't load profile yet
    }
  };

  const signInWithPhone = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (error) throw error;
  };

  const verifyPhone = async (phone: string, code: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: 'sms',
    });

    if (error) throw error;
    if (data.user) {
      // Check if user profile exists, create if not
      const existingUser = await getCurrentUser();
      if (!existingUser) {
        await createUserProfile(data.user.id, {
          username: phone.replace(/\D/g, '').slice(-8), // Use last 8 digits as username
          phone,
        });
      }
      await loadUser(data.user.id);
    }
  };

  const signOut = async () => {
    if (notificationCleanup) {
      notificationCleanup();
      setNotificationCleanup(null);
    }

    if (user?.id) {
      try {
        const { getDeviceToken, unregisterDeviceToken } = require('../services/notificationService');
        const token = await getDeviceToken();
        if (token) {
          await unregisterDeviceToken(user.id, token);
        }
      } catch {
        // ignore
      }
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  const refreshUser = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser?.id) {
      setUser(null);
      return;
    }
    const profile = await getUserById(authUser.id);
    if (profile) {
      setUser(profile);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signInWithPhone,
        verifyPhone,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
