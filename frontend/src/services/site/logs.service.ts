import { siteApi } from '../../lib/api';
import { UserRole } from '../../lib/roles';
import { ListResponse } from './content.service';

export const ACTIVITY_CATEGORIES = [
  'auth',
  'content',
  'accounts',
  'shop',
  'settings',
  'media',
  'visit',
  'other',
] as const;
export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export interface ActivityLog {
  id: string;
  actor?: string;
  actor_name?: string;
  actor_email?: string;
  actor_role?: UserRole;
  visitor_id?: string;
  action: string;
  category: ActivityCategory;
  description: string;
  method?: string;
  path?: string;
  status?: number;
  target_type?: string;
  target_id?: string;
  ip?: string;
  user_agent?: string;
  created_at: string;
}

export interface ActivityLogParams {
  search?: string;
  category?: ActivityCategory | '';
  action?: string;
  actor?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface ActivityLogMeta {
  categories: ActivityCategory[];
  actions: string[];
}

export interface MonitoringUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  ip?: string;
  started_at: string;
  last_seen_at: string;
  sessions: number;
}

export interface RecentSession {
  session_id: string;
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  ip?: string;
  started_at?: string;
  last_seen_at?: string;
  ended_at?: string;
}

export interface MonitoringVisitor {
  visitor_id: string;
  last_path?: string;
  page_views: number;
  ip?: string;
  user_id?: string;
  first_seen_at?: string;
  last_seen_at?: string;
}

export interface RecentVisit {
  id: string;
  description: string;
  path?: string;
  visitor_id?: string;
  actor_name?: string;
  ip?: string;
  created_at?: string;
}

export interface MonitoringSummary {
  generated_at: string;
  counts: { online: number; today: number; week: number; month: number };
  visitors: { online: number; today: number; week: number; month: number };
  pageviews: { today: number; week: number; month: number };
  online: MonitoringUser[];
  online_visitors: MonitoringVisitor[];
  recent_sessions: RecentSession[];
  recent_visits: RecentVisit[];
  logins_by_day: { date: string; count: number }[];
}

export const listActivityLogs = (
  params: ActivityLogParams = {},
  signal?: AbortSignal
): Promise<ListResponse<ActivityLog>> =>
  siteApi.get<ListResponse<ActivityLog>>('/admin/activity-logs', {
    query: { ...params },
    auth: true,
    signal,
  });

export const getActivityLogMeta = async (signal?: AbortSignal): Promise<ActivityLogMeta> => {
  const response = await siteApi.get<{ success: boolean; data: ActivityLogMeta }>(
    '/admin/activity-logs/meta',
    { auth: true, signal }
  );
  return response.data;
};

const EMPTY_COUNTS = { online: 0, today: 0, week: 0, month: 0 };

const normalizeMonitoring = (raw: Partial<MonitoringSummary> | null | undefined): MonitoringSummary => ({
  generated_at: raw?.generated_at ?? '',
  counts: raw?.counts ?? { ...EMPTY_COUNTS },
  visitors: raw?.visitors ?? { ...EMPTY_COUNTS },
  pageviews: raw?.pageviews ?? { today: 0, week: 0, month: 0 },
  online: raw?.online ?? [],
  online_visitors: raw?.online_visitors ?? [],
  recent_sessions: raw?.recent_sessions ?? [],
  recent_visits: raw?.recent_visits ?? [],
  logins_by_day: raw?.logins_by_day ?? [],
});

export const getMonitoring = async (signal?: AbortSignal): Promise<MonitoringSummary> => {
  const response = await siteApi.get<{ success: boolean; data: Partial<MonitoringSummary> }>(
    '/admin/monitoring',
    { auth: true, signal }
  );
  return normalizeMonitoring(response.data);
};
