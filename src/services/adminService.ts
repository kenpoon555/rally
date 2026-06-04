import { supabase } from './api/supabase';
import { AdminReportQueueItem, AdminTriageAction, UserReport } from '../types/safety';

export async function listPendingReports(limit = 50): Promise<UserReport[]> {
  const { data, error } = await supabase.rpc('admin_list_pending_reports', { p_limit: limit });
  if (error) {
    throw new Error(`Failed to load reports: ${error.message}`);
  }
  return (data || []) as UserReport[];
}

/** Enriched pending reports with usernames and suspension state. */
export async function listAdminReportQueue(limit = 50): Promise<AdminReportQueueItem[]> {
  const { data, error } = await supabase.rpc('admin_get_report_queue', { p_limit: limit });
  if (error) {
    throw new Error(`Failed to load report queue: ${error.message}`);
  }
  return (data || []) as AdminReportQueueItem[];
}

export async function triageReport(reportId: string, action: AdminTriageAction): Promise<void> {
  const { error } = await supabase.rpc('admin_triage_report', {
    p_report_id: reportId,
    p_action: action,
  });
  if (error) {
    throw new Error(`Failed to triage report: ${error.message}`);
  }
}

export async function updateReportStatus(
  reportId: string,
  status: 'reviewed' | 'dismissed'
): Promise<void> {
  const { error } = await supabase.rpc('admin_update_report_status', {
    p_report_id: reportId,
    p_status: status,
  });
  if (error) {
    throw new Error(`Failed to update report: ${error.message}`);
  }
}

export async function setUserSuspended(userId: string, suspend: boolean): Promise<void> {
  const { error } = await supabase.rpc('admin_set_user_suspended', {
    p_user_id: userId,
    p_suspend: suspend,
  });
  if (error) {
    throw new Error(`Failed to update suspension: ${error.message}`);
  }
}
