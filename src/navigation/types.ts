import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { ClassDetailTab, ClassEnrollmentInvite, ParentClassEnrollment } from '../types/coachParent';
import type { AgeCategory } from '../types/ageCategory';
import type { RallyHubTab } from '../components/rally/RallyTabBar';

export type AuthStackParamList = {
  Welcome: undefined;
  AgeGate: undefined;
  Under13Blocked: undefined;
  Login: undefined;
  Signup: { ageCategory: AgeCategory };
};

export type MainTabParamList = {
  DynamicHome: undefined;
  Home:
    | {
        sportFilter?: string;
        highlightOpenSpots?: boolean;
        discoverMode?: string;
      }
    | undefined;
  Chats: undefined;
  Profile: undefined;
  MyGames: undefined;
  Friends: { openSearch?: boolean } | undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  ActivityDetail: {
    activityId?: string;
    inviteToken?: string;
    hostInvite?: boolean;
    fromGameRoom?: boolean;
  };
  CreateActivity:
    | {
        createMode?: 'sport' | 'class';
        prefillTitle?: string;
        prefillStartTime?: string;
        prefillGroupId?: string;
      }
    | undefined;
  PostGameAttendance: { activityId: string };
  ChatThread: {
    conversationId: string;
    title?: string;
    activityId?: string;
    groupId?: string;
  };
  Friends: { openSearch?: boolean } | undefined;
  MyGames: undefined;
  RegularsCrew: {
    groupId: string;
    initialTab?: RallyHubTab;
    promptShareInvite?: boolean;
  };
  MiniTournament: { tournamentId: string };
  Admin: undefined;
  Feedback: { screen?: string; activityId?: string } | undefined;
  SportLanding: { sportSlug: string };
  Map: undefined;
  FamilyProfiles: undefined;
  AddChildProfile: { returnToInvite?: ClassEnrollmentInvite } | undefined;
  GuardianConsent: { returnToInvite?: ClassEnrollmentInvite };
  ClassDetail: { classId: string; initialTab?: ClassDetailTab };
  ChildProfilePicker: {
    classTitle?: string;
    invite?: ClassEnrollmentInvite;
  };
  ParentClassInvite: { inviteToken: string };
  EnrollmentConfirmation: { enrollment: ParentClassEnrollment };
  CoachProfile: undefined;
};

// Global augmentation — eliminates as never at all navigate() call sites
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;
