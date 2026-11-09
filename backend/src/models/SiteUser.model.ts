import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, UserRole } from '../lib/roles';

export interface ISiteUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  favorite_team?: string;
  is_active: boolean;
  last_login_at?: Date;
  created_by?: mongoose.Types.ObjectId;
  validatePassword(candidate: string): Promise<boolean>;
}

const siteUserSchema = new Schema<ISiteUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },

    password_hash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'subscriber', index: true },
    favorite_team: { type: String, trim: true, maxlength: 120 },
    is_active: { type: Boolean, default: true },
    last_login_at: { type: Date },
    created_by: { type: Schema.Types.ObjectId, ref: 'SiteUser' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
    collection: 'site_users',
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.password_hash;
        return ret;
      },
    },
  }
);

siteUserSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password_hash')) return next();
  this.password_hash = await bcrypt.hash(this.password_hash, 10);
  next();
});

siteUserSchema.methods.validatePassword = function validatePassword(
  candidate: string
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password_hash);
};

export default mongoose.model<ISiteUser>('SiteUser', siteUserSchema);
