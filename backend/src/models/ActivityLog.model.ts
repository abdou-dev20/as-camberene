import mongoose, { Document, Schema } from 'mongoose';
import { ROLES, UserRole } from '../lib/roles';

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

export interface IActivityLog extends Document {
  _id: mongoose.Types.ObjectId;
  actor?: mongoose.Types.ObjectId;
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
  metadata?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'SiteUser', index: true },
    actor_name: { type: String, trim: true, maxlength: 120 },
    actor_email: { type: String, trim: true, lowercase: true, maxlength: 255 },
    actor_role: { type: String, enum: ROLES },
    visitor_id: { type: String, trim: true, maxlength: 64, index: true },
    action: { type: String, required: true, trim: true, maxlength: 120, index: true },
    category: { type: String, enum: ACTIVITY_CATEGORIES, required: true, index: true },
    description: { type: String, required: true, trim: true, maxlength: 255 },
    method: { type: String, trim: true, maxlength: 10 },
    path: { type: String, trim: true, maxlength: 500 },
    status: { type: Number },
    target_type: { type: String, trim: true, maxlength: 60 },
    target_id: { type: String, trim: true, maxlength: 60 },
    ip: { type: String, trim: true, maxlength: 60 },
    user_agent: { type: String, trim: true, maxlength: 300 },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
    collection: 'activity_logs',
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  }
);

activityLogSchema.index({ created_at: -1 });
activityLogSchema.index({ actor: 1, created_at: -1 });
activityLogSchema.index({ category: 1, created_at: -1 });

export default mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);
