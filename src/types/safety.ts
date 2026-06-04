export type ReportReason =
  | 'harassment'
  | 'spam'
  | 'unsafe_behavior'
  | 'no_show'
  | 'other';

export type ReportContextType = 'profile' | 'activity' | 'chat' | 'other';

export interface UserBlock {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
  blocked_profile?: { id: string; username: string };
}

export interface UserReport {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: ReportReason;
  detail?: string | null;
  context_type?: ReportContextType | null;
  context_id?: string | null;
  status: 'pending' | 'reviewed' | 'dismissed';
  created_at: string;
}

/** Admin queue row from `admin_get_report_queue` RPC. */
export interface AdminReportQueueItem extends UserReport {
  reporter_username: string;
  reported_username: string;
  reported_is_suspended: boolean;
  reported_pending_count: number;
}

export type AdminTriageAction = 'dismiss' | 'reviewed' | 'suspend' | 'restore';

export interface ProfileTrustStats {
  no_show_count: number;
  flake_count: number;
  pending_reports: number;
}

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  harassment: 'Harassment or bullying',
  spam: 'Spam or scam',
  unsafe_behavior: 'Unsafe or inappropriate behavior',
  no_show: 'No-show for a game',
  other: 'Other',
};
