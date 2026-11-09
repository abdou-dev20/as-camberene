import mongoose, { Document, Schema } from 'mongoose';

export const MATCH_VENUES = ['Domicile', 'Extérieur'] as const;
export type MatchVenue = (typeof MATCH_VENUES)[number];

export const MATCH_STATUSES = ['À venir', 'En cours', 'Terminé'] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const SCORER_SIDES = ['club', 'opponent'] as const;
export type ScorerSide = (typeof SCORER_SIDES)[number];

export interface IMatchScorer {
  player: mongoose.Types.ObjectId | null;
  name: string;
  minute: number;
  side: ScorerSide;
  assistName: string;
  assistPlayer: mongoose.Types.ObjectId | null;
}

export interface IMatch extends Document {
  _id: mongoose.Types.ObjectId;
  opponent: string;
  date: string;
  time: string;
  venue: MatchVenue;
  competition: string;
  result?: { home: number; away: number };
  status: MatchStatus;
  scorers: IMatchScorer[];
  liveTime: string;
  image: string;
}

const scorerSchema = new Schema<IMatchScorer>(
  {
    player: { type: Schema.Types.ObjectId, ref: 'Player', default: null },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    minute: { type: Number, default: 0, min: 0, max: 130 },
    side: { type: String, enum: SCORER_SIDES, default: 'club' },
    assistName: { type: String, trim: true, maxlength: 150, default: '' },
    assistPlayer: { type: Schema.Types.ObjectId, ref: 'Player', default: null },
  },
  { _id: false }
);

const matchSchema = new Schema<IMatch>(
  {
    opponent: { type: String, required: true, trim: true, maxlength: 150 },
    date: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'La date doit être au format AAAA-MM-JJ'],
      index: true,
    },
    time: {
      type: String,
      trim: true,
      default: '16:00',
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "L'heure doit être au format HH:MM"],
    },
    venue: { type: String, enum: MATCH_VENUES, default: 'Domicile' },
    competition: { type: String, trim: true, maxlength: 120, default: 'Ligue 1 Sénégal' },
    result: {
      type: {
        home: { type: Number, min: 0, max: 99, required: true },
        away: { type: Number, min: 0, max: 99, required: true },
      },

      default: undefined,
      _id: false,
    },
    status: { type: String, enum: MATCH_STATUSES, default: 'À venir', index: true },
    scorers: {
      type: [scorerSchema],
      default: [],
      validate: [(value: IMatchScorer[]) => value.length <= 30, 'Trop de buteurs saisis'],
    },
    liveTime: { type: String, trim: true, maxlength: 20, default: '' },
    image: { type: String, maxlength: 500, default: '' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
    collection: 'matches',
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  }
);

export default mongoose.model<IMatch>('Match', matchSchema);
