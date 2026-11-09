import mongoose, { Document, Schema } from 'mongoose';

export const PLAYER_LINES = ['Gardien', 'Défenseur', 'Milieu', 'Attaquant'] as const;

export const PLAYER_KINDS = ['player', 'staff'] as const;

export const PLAYER_STATUSES = ['actif', 'blessé', 'suspendu', 'prêté', 'inactif'] as const;

export const STRONG_FEET = ['droit', 'gauche', 'les deux'] as const;

export interface IPlayer extends Document {
  _id: mongoose.Types.ObjectId;
  kind: (typeof PLAYER_KINDS)[number];
  name: string;
  team: string;
  number: number;
  line: (typeof PLAYER_LINES)[number];
  position: string;
  role: string;
  photo: string;
  status: (typeof PLAYER_STATUSES)[number];
  birthDate: Date | null;
  nationality: string;
  height: number;
  weight: number;
  strongFoot: (typeof STRONG_FEET)[number] | '';
  stats: {
    matches: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
  };
  biography: string;
  joinedYear: number;
  rank: number;
  isVisible: boolean;
  isFeatured: boolean;
}

const playerSchema = new Schema<IPlayer>(
  {
    kind: { type: String, enum: PLAYER_KINDS, default: 'player', index: true },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    team: { type: String, required: true, trim: true, maxlength: 80, index: true },
    number: { type: Number, default: 0, min: 0, max: 99 },
    line: { type: String, enum: PLAYER_LINES, default: 'Milieu', index: true },
    position: { type: String, default: '', maxlength: 100 },
    role: { type: String, default: '', maxlength: 100 },
    photo: { type: String, default: '', maxlength: 500 },
    status: { type: String, enum: PLAYER_STATUSES, default: 'actif', index: true },
    birthDate: { type: Date, default: null },
    nationality: { type: String, default: '', maxlength: 100 },
    height: { type: Number, default: 0, min: 0, max: 260 },
    weight: { type: Number, default: 0, min: 0, max: 200 },
    strongFoot: { type: String, enum: [...STRONG_FEET, ''], default: '' },
    stats: {
      matches: { type: Number, default: 0, min: 0 },
      goals: { type: Number, default: 0, min: 0 },
      assists: { type: Number, default: 0, min: 0 },
      yellowCards: { type: Number, default: 0, min: 0 },
      redCards: { type: Number, default: 0, min: 0 },
    },
    biography: { type: String, default: '', maxlength: 10000 },
    joinedYear: { type: Number, default: 0, min: 0 },
    rank: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
    collection: 'players',
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  }
);

playerSchema.virtual('age').get(function (this: IPlayer): number {
  if (!this.birthDate) return 0;
  const now = new Date();
  const birth = new Date(this.birthDate);
  let age = now.getFullYear() - birth.getFullYear();

  const monthDelta = now.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age > 0 ? age : 0;
});

playerSchema.index(
  { team: 1, number: 1 },
  { unique: true, partialFilterExpression: { number: { $gt: 0 }, kind: 'player' } }
);

export default mongoose.model<IPlayer>('Player', playerSchema);
