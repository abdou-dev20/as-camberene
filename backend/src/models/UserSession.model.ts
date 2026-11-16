import mongoose, { Document, Schema } from 'mongoose';
import { ROLES, UserRole } from '../lib/roles';

export interface IUserSession extends Document {
  _id: mongoose.Types.ObjectId;
  session_id: string;
  user: mongoose.Types.ObjectId;
  user_name: string;
  user_email: string;
  user_role: UserRole;
  ip?: string;
  user_agent?: string;
  started_at: Date;
  last_seen_at: Date;
  ended_at?: Date;
}

const userSessionSchema = new Schema<IUserSession>(
  {
    session_id: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'SiteUser', required: true },
    user_name: { type: String, required: true, trim: true, maxlength: 120 },
    user_email: { type: String, required: true, trim: true, lowercase: true, maxlength: 255 },
    user_role: { type: String, enum: ROLES, required: true },
    ip: { type: String, trim: true, maxlength: 60 },
    user_agent: { type: String, trim: true, maxlength: 300 },
    started_at: { type: Date, required: true, default: Date.now },
    last_seen_at: { type: Date, required: true, default: Date.now },
    ended_at: { type: Date },
  },
  {
    versionKey: false,
    collection: 'user_sessions',
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  }
);

userSessionSchema.index({ user: 1, last_seen_at: -1 });
userSessionSchema.index({ last_seen_at: -1 });
userSessionSchema.index({ started_at: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

export default mongoose.model<IUserSession>('UserSession', userSessionSchema);
