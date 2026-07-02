import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/api/supabase';
import { sendDebugLog } from '../utils/debugIngest';
import { withTimeout } from '../utils/withTimeout';
import { User } from '../types/user';
import { getCurrentUser, getUserById, createUserProfile, ensureUserDefaultSport, ensureUserAgeCategory } from '../services/userService';
import { parseAgeCategory } from '../types/ageCategory';
import { processDeepLink } from '../navigation/processDeepLink';
import { consumePendingDeepLink } from '../services/pendingDeepLinkService';
import {
  isRecentlyCreatedAuthUser,
  trackSignupCompletedOnce,
} from '../services/analyticsService';

export type SignOutResult = {
  warning?: string;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string, ageCategory?: import('../types/ageCategory').AgeCategory) => Promise<void>;
  signInWithPhone: (phone: string) => Promise<void>;
  verifyPhone: (phone: string, code: string) => Promise<void>;
  signOut: () => Promise<SignOutResult>;
  resetPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const EMAIL_REDIRECT_TO = 'rallyapp://auth/callback';

/** Max wait for Supabase session read on cold start (iPad / slow network). */
const BOOTSTRAP_GET_SESSION_MS = 8_000;
/** Max wait for profile load during bootstrap — then show Welcome and clear stale session. */
const BOOTSTRAP_LOAD_USER_MS = 10_000;
/** Hard backstop if bootstrap flow never reaches `finally`. */
const BOOTSTRAP_LOADING_BACKSTOP_MS = 12_000;
/** Max wait for profile load after explicit sign-in before showing actionable error. */
const SIGN_IN_LOAD_USER_MS = 12_000;

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

  const clearStaleBootstrapSession = useCallback(async () => {
    setUser(null);
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // ignore — goal is to unblock Welcome on next paint
    }
  }, []);

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
          const metadataAge = parseAgeCategory(authUser.user_metadata?.age_category);
          let createdOrExisting: User | null = null;
          try {
            createdOrExisting = await createUserProfile(authUser.id, {
              username: metadataUsername || fallbackUsername,
              email: authUser.email || undefined,
              phone: authUser.phone || undefined,
              age_category: metadataAge ?? undefined,
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
      userData = await ensureUserAgeCategory(userData);

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
            const promptShown = await AsyncStorage.getItem('notif_permission_prompt_shown');
            if (!promptShown) {
              await AsyncStorage.setItem('notif_permission_prompt_shown', 'true');
              Alert.alert(
                'Enable notifications',
                'Turn on notifications in Settings to get game reminders and messages.',
                [
                  { text: 'Not now', style: 'cancel' },
                  { text: 'Go to Settings', onPress: () => Linking.openSettings() },
                ]
              );
            }
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
      } = await withTimeout(supabase.auth.getSession(), BOOTSTRAP_GET_SESSION_MS, 'getSession');

      if (session?.user) {
        try {
          await withTimeout(loadUser(session.user.id), BOOTSTRAP_LOAD_USER_MS, 'loadUser');
        } catch (loadError) {
          console.warn(
            'Bootstrap profile load failed; clearing stale session:',
            loadError instanceof Error ? loadError.message : loadError
          );
          await clearStaleBootstrapSession();
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
      await clearStaleBootstrapSession();
    } finally {
      // #region agent log
      sendDebugLog('AuthContext.tsx:setLoadingFalse', 'Auth loading=false', {}, 'H1');
      // #endregion
      setLoading(false);
    }
  }, [clearStaleBootstrapSession, loadUser]);

  useEffect(() => {
    const handleAuthDeepLink = async (url: string) => {
      try {
        const params = parseAuthParamsFromUrl(url);
        const isAuthUrl =
          url.includes('auth/callback') ||
          Boolean(params.access_token || params.code || params.token_hash);

        if (isAuthUrl) {
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
          return;
        }

        await processDeepLink(url);
      } catch (error) {
        console.error('Error handling auth deep link:', error);
      }
    };

    // Check for existing session
    checkSession();

    // Hard backstop: never leave bootstrap spinner indefinitely (App Store iPad review).
    const safetyTimer = setTimeout(() => setLoading(false), BOOTSTRAP_LOADING_BACKSTOP_MS);

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
        if (event === 'SIGNED_IN' && isRecentlyCreatedAuthUser(session.user.created_at)) {
          void trackSignupCompletedOnce(session.user.id);
        }
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

  useEffect(() => {
    if (!user?.id) {
      return;
    }
    let cancelled = false;
    (async () => {
      const pending = await consumePendingDeepLink();
      if (!pending || cancelled) {
        return;
      }
      await processDeepLink(pending, { allowStorePending: false });
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (data.user) {
      try {
        await withTimeout(loadUser(data.user.id), SIGN_IN_LOAD_USER_MS, 'signIn.loadUser');
      } catch (loadError: any) {
        const message = loadError instanceof Error ? loadError.message : String(loadError);
        if (message.includes('signIn.loadUser')) {
          throw new Error('Signed in, but setup is taking too long. Please retry in a moment.');
        }
        throw loadError;
      }
    }
  };

  const signUp = async (
    email: string,
    password: string,
    username: string,
    ageCategory: import('../types/ageCategory').AgeCategory = 'adult_18_plus'
  ) => {
    // Step 1: Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: EMAIL_REDIRECT_TO,
        data: {
          username,
          age_category: ageCategory,
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
        age_category: ageCategory,
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

    void trackSignupCompletedOnce(data.user.id);
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

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: EMAIL_REDIRECT_TO,
    });
    if (error) {
      throw error;
    }
  };

  const signOut = async (): Promise<SignOutResult> => {
    let warning: string | undefined;
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
        warning = 'Push notifications may still reach this device until you sign in elsewhere.';
      }
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    return { warning };
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
        resetPassword,
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
