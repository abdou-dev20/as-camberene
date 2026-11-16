import { Router } from 'express';
import mongoose, { FilterQuery } from 'mongoose';
import ActivityLog, {
  ACTIVITY_CATEGORIES,
  ActivityCategory,
  IActivityLog,
} from '../models/ActivityLog.model';
import UserSession from '../models/UserSession.model';
import Visitor from '../models/Visitor.model';
import { handler } from '../lib/http';
import { UserRole } from '../lib/roles';
import { authenticate, requirePermission } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

const DAY_MS = 24 * 60 * 60 * 1000;
const ONLINE_WINDOW_MS = 5 * 60 * 1000;
const MAX_LIMIT = 100;

const startOfUtcDay = (date: Date): Date => {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  return start;
};

const startOfUtcWeek = (date: Date): Date => {
  const start = startOfUtcDay(date);
  const day = start.getUTCDay();
  const offset = day === 0 ? 6 : day - 1;
  start.setUTCDate(start.getUTCDate() - offset);
  return start;
};

const startOfUtcMonth = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

const distinctUsersSince = async (since: Date): Promise<number> =>
  (await UserSession.distinct('user', { last_seen_at: { $gte: since } })).length;

interface LeanSession {
  _id: unknown;
  session_id: string;
  user: unknown;
  user_name?: string;
  user_email?: string;
  user_role?: UserRole;
  ip?: string;
  started_at?: Date;
  last_seen_at?: Date;
  ended_at?: Date;
}

interface LeanVisitor {
  visitor_id: string;
  user?: unknown;
  last_path?: string;
  page_views?: number;
  ip?: string;
  first_seen_at?: Date;
  last_seen_at?: Date;
}

interface LeanVisit {
  _id: unknown;
  description: string;
  path?: string;
  visitor_id?: string;
  actor_name?: string;
  ip?: string;
  created_at?: Date;
}

router.get(
  '/activity-logs',
  requirePermission('logs:read'),
  handler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(req.query.limit) || 25));
    const query: FilterQuery<IActivityLog> = {};

    const category = typeof req.query.category === 'string' ? req.query.category : '';
    if (ACTIVITY_CATEGORIES.includes(category as ActivityCategory)) {
      query.category = category as ActivityCategory;
    }

    const action = typeof req.query.action === 'string' ? req.query.action.trim() : '';
    if (action) query.action = action;

    const actor = typeof req.query.actor === 'string' ? req.query.actor : '';
    if (actor && mongoose.isValidObjectId(actor)) query.actor = actor;

    const from = typeof req.query.from === 'string' ? new Date(req.query.from) : null;
    const to = typeof req.query.to === 'string' ? new Date(req.query.to) : null;
    const createdAt: { $gte?: Date; $lte?: Date } = {};
    if (from && !Number.isNaN(from.getTime())) createdAt.$gte = from;
    if (to && !Number.isNaN(to.getTime())) createdAt.$lte = to;
    if (Object.keys(createdAt).length > 0) query.created_at = createdAt;

    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    if (search) {
      const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { actor_name: pattern },
        { actor_email: pattern },
        { description: pattern },
        { action: pattern },
      ];
    }

    const [items, total] = await Promise.all([
      ActivityLog.find(query)
        .sort('-created_at')
        .skip((page - 1) * limit)
        .limit(limit),
      ActivityLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  })
);

router.get(
  '/activity-logs/meta',
  requirePermission('logs:read'),
  handler(async (_req, res) => {
    const [categories, actions] = await Promise.all([
      ActivityLog.distinct('category'),
      ActivityLog.distinct('action'),
    ]);

    res.json({
      success: true,
      data: {
        categories: (categories as string[]).sort(),
        actions: (actions as string[]).sort(),
      },
    });
  })
);

router.get(
  '/monitoring',
  requirePermission('monitoring:read'),
  handler(async (_req, res) => {
    const now = new Date();
    const startOfToday = startOfUtcDay(now);
    const startOfWeek = startOfUtcWeek(now);
    const startOfMonth = startOfUtcMonth(now);
    const onlineSince = new Date(now.getTime() - ONLINE_WINDOW_MS);

    const onlineUsers = await UserSession.distinct('user', {
      last_seen_at: { $gte: onlineSince },
      ended_at: { $exists: false },
    });
    const [today, week, month] = await Promise.all([
      distinctUsersSince(startOfToday),
      distinctUsersSince(startOfWeek),
      distinctUsersSince(startOfMonth),
    ]);
    const online = onlineUsers.length;

    const onlineRows = (await UserSession.find({
      last_seen_at: { $gte: onlineSince },
      ended_at: { $exists: false },
    })
      .sort('-last_seen_at')
      .limit(200)
      .lean()) as unknown as LeanSession[];

    interface OnlineUser {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      ip?: string;
      started_at: string;
      last_seen_at: string;
      sessions: number;
    }

    const onlineById = new Map<string, OnlineUser>();

    for (const row of onlineRows) {
      const id = String(row.user);
      const lastSeen = row.last_seen_at ?? now;
      const started = row.started_at ?? lastSeen;
      const existing = onlineById.get(id);

      if (existing) {
        existing.sessions += 1;
        if (lastSeen.toISOString() > existing.last_seen_at) {
          existing.last_seen_at = lastSeen.toISOString();
          existing.started_at = started.toISOString();
          existing.ip = row.ip;
        }
      } else {
        onlineById.set(id, {
          id,
          name: row.user_name ?? '',
          email: row.user_email ?? '',
          role: row.user_role ?? 'subscriber',
          ip: row.ip,
          started_at: started.toISOString(),
          last_seen_at: lastSeen.toISOString(),
          sessions: 1,
        });
      }
    }

    const connected = Array.from(onlineById.values())
      .sort((a, b) => b.last_seen_at.localeCompare(a.last_seen_at))
      .slice(0, 50);

    const recentRows = (await UserSession.find()
      .sort('-last_seen_at')
      .limit(12)
      .lean()) as unknown as LeanSession[];

    const recentSessions = recentRows.map((row) => ({
      session_id: row.session_id,
      user_id: String(row.user),
      name: row.user_name ?? '',
      email: row.user_email ?? '',
      role: row.user_role ?? 'subscriber',
      ip: row.ip,
      started_at: row.started_at,
      last_seen_at: row.last_seen_at,
      ended_at: row.ended_at,
    }));

    const windowStart = new Date(startOfToday.getTime() - 13 * DAY_MS);
    const rawLogins = await ActivityLog.aggregate<{ _id: string; count: number }>([
      { $match: { action: 'auth.login', created_at: { $gte: windowStart } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$created_at', timezone: 'UTC' },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const loginCounts = new Map(rawLogins.map((row) => [row._id, row.count]));
    const loginsByDay = Array.from({ length: 14 }, (_, index) => {
      const date = new Date(windowStart.getTime() + index * DAY_MS);
      const key = date.toISOString().slice(0, 10);
      return { date: key, count: loginCounts.get(key) ?? 0 };
    });

    const [visitorsToday, visitorsWeek, visitorsMonth] = await Promise.all([
      Visitor.countDocuments({ last_seen_at: { $gte: startOfToday } }),
      Visitor.countDocuments({ last_seen_at: { $gte: startOfWeek } }),
      Visitor.countDocuments({ last_seen_at: { $gte: startOfMonth } }),
    ]);
    const onlineVisitors = await Visitor.countDocuments({ last_seen_at: { $gte: onlineSince } });

    const [viewsToday, viewsWeek, viewsMonth] = await Promise.all([
      ActivityLog.countDocuments({ action: 'visit.page', created_at: { $gte: startOfToday } }),
      ActivityLog.countDocuments({ action: 'visit.page', created_at: { $gte: startOfWeek } }),
      ActivityLog.countDocuments({ action: 'visit.page', created_at: { $gte: startOfMonth } }),
    ]);

    const onlineVisitorRows = (await Visitor.find({ last_seen_at: { $gte: onlineSince } })
      .sort('-last_seen_at')
      .limit(50)
      .lean()) as unknown as LeanVisitor[];

    const recentVisitRows = (await ActivityLog.find({ action: 'visit.page' })
      .sort('-created_at')
      .limit(12)
      .lean()) as unknown as LeanVisit[];

    const onlineVisitorsList = onlineVisitorRows.map((row) => ({
      visitor_id: row.visitor_id,
      last_path: row.last_path,
      page_views: row.page_views ?? 0,
      ip: row.ip,
      user_id: row.user ? String(row.user) : undefined,
      first_seen_at: row.first_seen_at,
      last_seen_at: row.last_seen_at,
    }));

    const recentVisits = recentVisitRows.map((row) => ({
      id: String(row._id),
      description: row.description,
      path: row.path,
      visitor_id: row.visitor_id,
      actor_name: row.actor_name,
      ip: row.ip,
      created_at: row.created_at,
    }));

    res.json({
      success: true,
      data: {
        generated_at: now.toISOString(),
        counts: { online, today, week, month },
        visitors: {
          online: onlineVisitors,
          today: visitorsToday,
          week: visitorsWeek,
          month: visitorsMonth,
        },
        pageviews: { today: viewsToday, week: viewsWeek, month: viewsMonth },
        online: connected,
        online_visitors: onlineVisitorsList,
        recent_sessions: recentSessions,
        recent_visits: recentVisits,
        logins_by_day: loginsByDay,
      },
    });
  })
);

export default router;
