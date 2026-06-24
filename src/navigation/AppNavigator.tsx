import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './navigationRef';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../hooks/useAuth';
import { useJoinRequestNotifications } from '../hooks/useJoinRequestNotifications';
import { useGameLifecycleNotifications } from '../hooks/useGameLifecycleNotifications';
import { ROUTES } from '../constants/routes';
import { fetchCachedUnreadCount } from '../services/chatUnreadCache';
import { colors, PRIMARY_COLOR } from '../constants/theme';
import { AppTabBar } from '../components/navigation/AppTabBar';

import WelcomeScreen from '../pages/Auth/WelcomeScreen';
import AgeGateScreen from '../pages/Auth/AgeGateScreen';
import Under13BlockedScreen from '../pages/Auth/Under13BlockedScreen';
import LoginScreen from '../pages/Auth/LoginScreen';
import SignupScreen from '../pages/Auth/SignupScreen';
import HomeScreen from '../pages/Home/HomeScreen';
import DynamicHomeScreen from '../pages/Home/DynamicHomeScreen';
import CreateActivityScreen from '../pages/Activity/CreateActivityScreen';
import ActivityDetailScreen from '../pages/Activity/ActivityDetailScreen';
import PostGameAttendanceScreen from '../pages/Activity/PostGameAttendanceScreen';
import FriendsScreen from '../pages/Friends/FriendsScreen';
import ProfileScreen from '../pages/Profile/ProfileScreen';
import ChatListScreen from '../pages/Chat/ChatListScreen';
import ChatThreadScreen from '../pages/Chat/ChatThreadScreen';
import MyGamesScreen from '../pages/Games/MyGamesScreen';
import AdminScreen from '../pages/Admin/AdminScreen';
import BetaFeedbackScreen from '../pages/Feedback/BetaFeedbackScreen';
import MiniTournamentScreen from '../pages/Tournament/MiniTournamentScreen';
import RegularsCrewScreen from '../pages/Regulars/RegularsCrewScreen';
import SportLandingScreen from '../pages/Landing/SportLandingScreen';
import FamilyProfilesScreen from '../pages/CoachParent/FamilyProfilesScreen';
import AddChildProfileScreen from '../pages/CoachParent/AddChildProfileScreen';
import GuardianConsentScreen from '../pages/CoachParent/GuardianConsentScreen';
import ClassDetailScreen from '../pages/CoachParent/ClassDetailScreen';
import ChildProfilePickerScreen from '../pages/CoachParent/ChildProfilePickerScreen';
import ParentClassInviteScreen from '../pages/CoachParent/ParentClassInviteScreen';
import EnrollmentConfirmationScreen from '../pages/CoachParent/EnrollmentConfirmationScreen';
import CoachProfileScreen from '../pages/CoachParent/CoachProfileScreen';
import { OnboardingModal } from '../components/OnboardingModal';
import { linking } from './deepLinking';
import TosAcceptanceGate from '../components/TosAcceptanceGate';
import { needsLegalAcceptance } from '../services/userService';
import { TOS_VERSION } from '../constants/legal';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

import { AGE_GATE_ONBOARDING } from '../constants/parentStudentFlags';

const AuthStack = () => (
  <Stack.Navigator
    initialRouteName={ROUTES.AUTH.WELCOME}
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name={ROUTES.AUTH.WELCOME} component={WelcomeScreen} />
    {AGE_GATE_ONBOARDING ? (
      <>
        <Stack.Screen name={ROUTES.AUTH.AGE_GATE} component={AgeGateScreen} />
        <Stack.Screen name={ROUTES.AUTH.UNDER_13_BLOCKED} component={Under13BlockedScreen} />
      </>
    ) : null}
    <Stack.Screen name={ROUTES.AUTH.LOGIN} component={LoginScreen} />
    <Stack.Screen name={ROUTES.AUTH.SIGNUP} component={SignupScreen} />
  </Stack.Navigator>
);

const MainTabs = () => {
  const { user } = useAuth();
  const [chatUnread, setChatUnread] = useState(0);

  const refreshUnread = useCallback(async (force = false) => {
    if (!user?.id) {
      setChatUnread(0);
      return;
    }
    try {
      setChatUnread(await fetchCachedUnreadCount(user.id, force));
    } catch {
      setChatUnread(0);
    }
  }, [user?.id]);

  useEffect(() => {
    void refreshUnread();
  }, [refreshUnread]);

  return (
    <Tab.Navigator
      initialRouteName={ROUTES.HOME.DYNAMIC}
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        lazy: true,
      }}
    >
      <Tab.Screen
        name={ROUTES.HOME.DYNAMIC}
        component={DynamicHomeScreen}
        options={{ tabBarLabel: 'Today' }}
      />
      <Tab.Screen
        name={ROUTES.HOME.MAIN}
        component={HomeScreen}
        options={{ tabBarLabel: 'Play' }}
      />
      <Tab.Screen
        name={ROUTES.CHAT.TAB}
        component={ChatListScreen}
        options={{
          tabBarLabel: 'Inbox',
          tabBarBadge: chatUnread > 0 ? (chatUnread > 9 ? '9+' : chatUnread) : undefined,
        }}
        listeners={{
          focus: () => {
            void refreshUnread(false);
          },
        }}
      />
      <Tab.Screen
        name={ROUTES.PROFILE.MAIN}
        component={ProfileScreen}
        options={{ tabBarLabel: 'You' }}
      />
    </Tab.Navigator>
  );
};

const MainStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
    <Stack.Screen
      name={ROUTES.ACTIVITY.DETAIL}
      component={ActivityDetailScreen}
      options={{ title: 'Game card', presentation: 'modal' }}
    />
    <Stack.Screen
      name={ROUTES.ACTIVITY.CREATE}
      component={CreateActivityScreen}
      options={{ title: 'Create Game', headerLargeTitle: false }}
    />
    <Stack.Screen
      name={ROUTES.ACTIVITY.POST_GAME_ATTENDANCE}
      component={PostGameAttendanceScreen}
      options={{ title: 'Attendance' }}
    />
    <Stack.Screen
      name={ROUTES.CHAT.THREAD}
      component={ChatThreadScreen}
      options={{ title: 'Chat', headerBackTitle: 'Inbox' }}
    />
    <Stack.Screen name={ROUTES.FRIENDS.LIST} component={FriendsScreen} options={{ title: 'Friends' }} />
    <Stack.Screen name={ROUTES.MY_GAMES.TAB} component={MyGamesScreen} options={{ title: 'My Games' }} />
    <Stack.Screen
      name={ROUTES.REGULAR_GROUP.CREW}
      component={RegularsCrewScreen}
      options={{ title: 'Rally' }}
    />
    <Stack.Screen
      name={ROUTES.TOURNAMENT.MINI}
      component={MiniTournamentScreen}
      options={{ title: 'Mini tournament' }}
    />
    <Stack.Screen name={ROUTES.ADMIN.MAIN} component={AdminScreen} options={{ title: 'Admin' }} />
    <Stack.Screen
      name={ROUTES.FEEDBACK.BETA}
      component={BetaFeedbackScreen}
      options={{ title: 'Send feedback' }}
    />
    <Stack.Screen
      name={ROUTES.LANDING.SPORT}
      component={SportLandingScreen}
      options={{ title: 'Rally' }}
    />
    <Stack.Screen
      name={ROUTES.COACH_PARENT.FAMILY_PROFILES}
      component={FamilyProfilesScreen}
      options={{ title: 'Family Profiles' }}
    />
    <Stack.Screen
      name={ROUTES.COACH_PARENT.GUARDIAN_CONSENT}
      component={GuardianConsentScreen}
      options={{ title: 'Guardian Consent' }}
    />
    <Stack.Screen
      name={ROUTES.COACH_PARENT.ADD_CHILD_PROFILE}
      component={AddChildProfileScreen}
      options={{ title: 'Add Child Profile' }}
    />
    <Stack.Screen
      name={ROUTES.COACH_PARENT.CLASS_DETAIL}
      component={ClassDetailScreen}
      options={{ title: 'Class' }}
    />
    <Stack.Screen
      name={ROUTES.COACH_PARENT.CHILD_PICKER}
      component={ChildProfilePickerScreen}
      options={{ title: 'Enroll' }}
    />
    <Stack.Screen
      name={ROUTES.COACH_PARENT.PARENT_CLASS_INVITE}
      component={ParentClassInviteScreen}
      options={{ title: 'Class Invite' }}
    />
    <Stack.Screen
      name={ROUTES.COACH_PARENT.ENROLLMENT_CONFIRMATION}
      component={EnrollmentConfirmationScreen}
      options={{ title: 'Enrolled' }}
    />
    <Stack.Screen
      name={ROUTES.COACH_PARENT.COACH_PROFILE}
      component={CoachProfileScreen}
      options={{ title: 'Coach Profile' }}
    />
  </Stack.Navigator>
);

export const AppNavigator = () => {
  const { user, loading, refreshUser } = useAuth();
  useJoinRequestNotifications(user?.id);
  useGameLifecycleNotifications(user?.id);
  const showLegalGate = Boolean(user && needsLegalAcceptance(user));
  const needsTos = Boolean(
    user && (!user.tos_accepted_at || user.tos_version !== TOS_VERSION)
  );
  const needsLocationAck = Boolean(user && !user.location_privacy_ack_at);
  const needsOnboarding = Boolean(user && !user.onboarding_completed);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  const navKey = user ? 'main' : 'auth';

  return (
    <NavigationContainer key={navKey} ref={navigationRef} linking={user ? linking : undefined}>
      {user ? <MainStack /> : <AuthStack />}
      {user ? (
        <TosAcceptanceGate
          visible={showLegalGate}
          userId={user.id}
          needsTos={needsTos}
          needsLocationAck={needsLocationAck}
          onAccepted={() => refreshUser()}
        />
      ) : null}
      {user && !showLegalGate ? (
        <OnboardingModal
          visible={needsOnboarding}
          userId={user.id}
          onComplete={() => refreshUser()}
        />
      ) : null}
    </NavigationContainer>
  );
};
