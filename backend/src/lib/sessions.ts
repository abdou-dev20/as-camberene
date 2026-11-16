import crypto from 'crypto';
import UserSession from '../models/UserSession.model';
import { UserRole } from './roles';

export interface SessionOwner {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface SessionContext {
  ip?: string;
  userAgent?: string;
}

const TOUCH_INTERVAL_MS = 60 * 1000;
const recentlyTouched = new Map<string, number>();

export const startSession = async (
  owner: SessionOwner,
  context: SessionContext = {}
): Promise<string> => {
  const sessionId = crypto.randomUUID();
  const now = new Date();

  await UserSession.create({
    session_id: sessionId,
    user: owner.id,
    user_name: owner.name,
    user_email: owner.email,
    user_role: owner.role,
    ip: context.ip,
    user_agent: context.userAgent,
    started_at: now,
    last_seen_at: now,
  });

  recentlyTouched.set(sessionId, now.getTime());
  return sessionId;
};

export const touchSession = (sessionId: string | undefined, force = false): void => {
  if (!sessionId) return;

  const now = Date.now();
  if (!force && (recentlyTouched.get(sessionId) ?? 0) > now - TOUCH_INTERVAL_MS) return;

  if (recentlyTouched.size > 5000) recentlyTouched.clear();
  recentlyTouched.set(sessionId, now);

  void UserSession.updateOne(
    { session_id: sessionId, ended_at: { $exists: false } },
    { $set: { last_seen_at: new Date() } }
  ).catch(() => undefined);
};

export const endSession = async (sessionId: string | undefined): Promise<void> => {
  if (!sessionId) return;

  recentlyTouched.delete(sessionId);
  await UserSession.updateOne(
    { session_id: sessionId },
    { $set: { ended_at: new Date(), last_seen_at: new Date() } }
  );
};

export const continueSession = async (
  sessionId: string | undefined,
  owner: SessionOwner,
  context: SessionContext = {}
): Promise<string> => {
  if (sessionId) {
    const session = await UserSession.findOne({
      session_id: sessionId,
      ended_at: { $exists: false },
    });

    if (session) {
      session.last_seen_at = new Date();
      await session.save();
      recentlyTouched.set(sessionId, Date.now());
      return sessionId;
    }
  }

  return startSession(owner, context);
};
