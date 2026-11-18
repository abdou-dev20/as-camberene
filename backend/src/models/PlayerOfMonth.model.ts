import mongoose, { Document, Schema } from 'mongoose';

export const POTM_STATUSES = ['open', 'closed'] as const;
export type PotmStatus = (typeof POTM_STATUSES)[number];

export interface IPlayerOfMonth extends Document {
  _id: mongoose.Types.ObjectId;
  month: string;
  title: string;
  nominees: mongoose.Types.ObjectId[];
  status: PotmStatus;
}

const playerOfMonthSchema = new Schema<IPlayerOfMonth>(
  {
    month: { type: String, required: true, unique: true, match: /^\d{4}-\d{2}$/ },
    title: { type: String, trim: true, maxlength: 150, default: '' },
    nominees: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
    status: { type: String, enum: POTM_STATUSES, default: 'open', index: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
    collection: 'player_of_month',
  }
);

export default mongoose.model<IPlayerOfMonth>('PlayerOfMonth', playerOfMonthSchema);

export interface IPlayerOfMonthVote extends Document {
  poll: mongoose.Types.ObjectId;
  player: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  voter_key?: string;
  visitor_id?: string;
  ip?: string;
}

const voteSchema = new Schema<IPlayerOfMonthVote>(
  {
    poll: { type: Schema.Types.ObjectId, ref: 'PlayerOfMonth', required: true },
    player: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'SiteUser' },
    voter_key: { type: String },
    visitor_id: { type: String },
    ip: { type: String },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    versionKey: false,
    collection: 'player_of_month_votes',
  }
);

voteSchema.index({ poll: 1, voter_key: 1 }, { unique: true, sparse: true });
voteSchema.index({ poll: 1, player: 1 });

export const PlayerOfMonthVote = mongoose.model<IPlayerOfMonthVote>('PlayerOfMonthVote', voteSchema);
