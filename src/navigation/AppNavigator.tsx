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
import { getTotalUnreadCount } from '../services/chatService';

// Auth Screens
import LoginScreen from '../pages/Auth/LoginScreen';
import SignupScreen from '../pages/Auth/SignupScreen';

// Home Screens
import HomeScreen from '../pages/Home/HomeScreen';
import MapScreen from '../pages/Home/MapScreen';

// Activity Screens
import ActivityDetailScreen from '../pages/Activity/ActivityDetailScreen';
import CreateActivityScreen from '../pages/Activity/CreateActivityScreen';

// Friends Screen
import FriendsScreen from '../pages/Friends/FriendsScreen';
import ProfileScreen from '../pages/Profile/ProfileScreen';
import ChatListScreen from '../pages/Chat/ChatListScreen';
import ChatThreadScreen from '../pages/Chat/ChatThreadScreen';
import MyGamesScreen from '../pages/Games/MyGamesScreen';
import { linking } from './deepLinking';
import TosAcceptanceGate from '../components/TosAcceptanceGate';
import { needsLegalAcceptance } from '../services/userService';
import { TOS_VERSION } from '../constants/legal';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ROUTES.AUTH.LOGIN} component={LoginScreen} />
      <Stack.Screen name={ROUTES.AUTH.SIGNUP} component={SignupScreen} />
    </Stack.Navigator>
  );
};

const MainTabs = () => {
  const { user } = useAuth();
  const [chatUnread, setChatUnread] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!user?.id) {
      setChatUnread(0);
      return;
    }
    try {
      setChatUnread(await getTotalUnreadCount(user.id));
    } catch {
      setChatUnread(0);
    }
  }, [user?.id]);

  useEffect(() => {
    void refreshUnread();
  }, [refreshUnread]);

  return (
    <Tab.Navigator
      initialRouteName={ROUTES.CHAT.TAB}
      screenOptions={{ headerShown: false, lazy: true }}
    >
      <Tab.Screen
        name={ROUTES.CHAT.TAB}
        component={ChatListScreen}
        options={{
          tabBarLabel: chatUnread > 0 ? `Chats (${chatUnread})` : 'Chats',
        }}
        listeners={{
          focus: () => {
            void refreshUnread();
          },
        }}
      />
      <Tab.Screen
        name={ROUTES.MY_GAMES.TAB}
        component={MyGamesScreen}
        options={{ tabBarLabel: 'My Games' }}
      />
      <Tab.Screen
        name={ROUTES.HOME.MAIN}
        component={HomeScreen}
        options={{ tabBarLabel: 'Discover' }}
      />
      <Tab.Screen
        name={ROUTES.FRIENDS.LIST}
        component={FriendsScreen}
        options={{ tabBarLabel: 'Friends' }}
      />
      <Tab.Screen
        name={ROUTES.PROFILE.MAIN}
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

const MainStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.ACTIVITY.DETAIL}
        component={ActivityDetailScreen}
        options={{ title: 'Activity Details' }}
      />
      <Stack.Screen
        name={ROUTES.ACTIVITY.CREATE}
        component={CreateActivityScreen}
        options={{ title: 'Create Game', headerLargeTitle: false }}
      />
      <Stack.Screen
        name={ROUTES.HOME.MAP}
        component={MapScreen}
        options={{ title: 'Nearby courts' }}
      />
      <Stack.Screen
        name={ROUTES.CHAT.THREAD}
        component={ChatThreadScreen}
        options={{ title: 'Chat' }}
      />
      <Stack.Screen
        name={ROUTES.ADMIN.MAIN}
        component={AdminScreen}
        options={{ title: 'Admin' }}
      />
    </Stack.Navigator>
  );
};

export const AppNavigator = () => {
  const { user, loading, refreshUser } = useAuth();
  useJoinRequestNotifications(user?.id);
  useGameLifecycleNotifications(user?.id);
  const showLegalGate = Boolean(user && needsLegalAcceptance(user));
  const needsTos = Boolean(
    user && (!user.tos_accepted_at || user.tos_version !== TOS_VERSION)
  );
  const needsLocationAck = Boolean(user && !user.location_privacy_ack_at);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
        }}
      >
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
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
    </NavigationContainer>
  );
};
