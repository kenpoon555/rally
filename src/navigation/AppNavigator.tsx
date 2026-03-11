import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../constants/routes';

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
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, lazy: true }}>
      <Tab.Screen
        name={ROUTES.HOME.MAIN}
        component={HomeScreen}
        options={{ tabBarLabel: 'Discover' }}
      />
      <Tab.Screen
        name={ROUTES.HOME.MAP}
        component={MapScreen}
        options={{ tabBarLabel: 'Map' }}
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
        options={{ title: 'Create Activity' }}
      />
      <Stack.Screen
        name={ROUTES.PROFILE.MAIN}
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name={ROUTES.CHAT.LIST}
        component={ChatListScreen}
        options={{ title: 'Chats' }}
      />
      <Stack.Screen
        name={ROUTES.CHAT.THREAD}
        component={ChatThreadScreen}
        options={{ title: 'Chat' }}
      />
    </Stack.Navigator>
  );
};

export const AppNavigator = () => {
  const { user, loading } = useAuth();

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
    <NavigationContainer>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};
