import mongoose, { Document, Schema } from 'mongoose';

export const TEAM_CATEGORIES = ['senior', 'youth'] as const;
export type TeamCategory = (typeof TEAM_CATEGORIES)[number];

export interface ITeam extends Document {
  _id: mongoose.Types.ObjectId;
  slug: string;
  name: string;
  category: TeamCategory;
  ageRange: string;
  subtitle: string;
  description: string;
  coach: string;
  training: string;
  stadium: string;
  achievements: string[];
  stats: { wins: number; draws: number; losses: number };
  established: string;
  image: string;
  rank: number;
  isVisible: boolean;
}

const teamSchema = new Schema<ITeam>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 80,
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Identifiant invalide : minuscules, chiffres et tirets uniquement',
      ],
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, enum: TEAM_CATEGORIES, default: 'youth', index: true },
    ageRange: { type: String, trim: true, maxlength: 40, default: '' },
    subtitle: { type: String, trim: true, maxlength: 120, default: '' },
    description: { type: String, maxlength: 2000, default: '' },
    coach: { type: String, trim: true, maxlength: 120, default: '' },
    training: { type: String, trim: true, maxlength: 200, default: '' },
    stadium: { type: String, trim: true, maxlength: 200, default: '' },
    achievements: { type: [String], default: [] },
    stats: {
      wins: { type: Number, default: 0, min: 0 },
      draws: { type: Number, default: 0, min: 0 },
      losses: { type: Number, default: 0, min: 0 },
    },
    established: { type: String, trim: true, maxlength: 20, default: '' },
    image: { type: String, maxlength: 500, default: '' },
    rank: { type: Number, default: 0, index: true },
    isVisible: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
    collection: 'teams',
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  }
);

export default mongoose.model<ITeam>('Team', teamSchema);
