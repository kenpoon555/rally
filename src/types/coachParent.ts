import { SportType } from '../constants/sports';

export type StudentProfile = {
  id: string;
  parent_user_id: string;
  display_name: string;
  active_class_summary: string;
  status: 'active' | 'archived';
};

export type ClassRosterStudent = {
  id: string;
  display_name: string;
  status: 'confirmed' | 'not_responded' | 'cant_make_it';
  guardian_name?: string;
  attendance_status?: 'present' | 'absent' | null;
  enrollment_id?: string;
};

export type ClassEnrollmentInvite = {
  id: string;
  invite_token: string;
  coach_user_id: string;
  class_id: string;
  class_title: string;
  sport_type: SportType;
  expires_at: string | null;
  created_at: string;
};

export type CoachClassListing = {
  id: string;
  coach_user_id: string;
  title: string;
  sport_type: SportType;
  location_name: string;
  start_time: string;
  duration_minutes: number;
  enrolled_count: number;
  confirmed_count: number;
  fee_note?: string;
  regular_group_id?: string | null;
  session_status?: 'scheduled' | 'deferred' | 'cancelled';
  effective_start_time?: string;
};

export type ParentClassEnrollment = {
  id: string;
  student_profile_id: string;
  student_name: string;
  class_id: string;
  class_title: string;
  sport_type: SportType;
  start_time: string;
  response_status: 'confirmed' | 'not_responded' | 'cant_make_it';
  session_status?: 'scheduled' | 'deferred' | 'cancelled';
  effective_start_time?: string;
};

export type ClassAnnouncementInboxItem = {
  id: string;
  class_title: string;
  preview: string;
  sent_at: string;
  audience: 'parents';
  operation?: 'defer' | 'cancel' | 'notify';
};

export type ClassSessionOperation = 'defer' | 'cancel';

export type ClassDetailTab = 'overview' | 'schedule' | 'roster' | 'chat';
