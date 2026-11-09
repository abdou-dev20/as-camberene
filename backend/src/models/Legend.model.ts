import mongoose, { Document, Schema } from 'mongoose';

export const LEGEND_ERAS = ['Golden Age', 'Modern Era', 'Classic Era'] as const;

export interface ILegend extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  position: string;
  period: string;
  nationality: string;
  photo: string;
  achievements: string[];
  stats: { matches: number; goals: number; assists: number; trophies: number };
  biography: string;
  quote: string;
  jerseyNumber: number;
  era: (typeof LEGEND_ERAS)[number];
  isHallOfFame: boolean;
  rank: number;
}

const legendSchema = new Schema<ILegend>(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    position: { type: String, default: '', maxlength: 100 },
    period: { type: String, default: '', maxlength: 50 },
    nationality: { type: String, default: '', maxlength: 100 },
    photo: { type: String, default: '', maxlength: 500 },
    achievements: { type: [String], default: [] },
    stats: {
      matches: { type: Number, default: 0, min: 0 },
      goals: { type: Number, default: 0, min: 0 },
      assists: { type: Number, default: 0, min: 0 },
      trophies: { type: Number, default: 0, min: 0 },
    },
    biography: { type: String, default: '', maxlength: 10000 },
    quote: { type: String, default: '', maxlength: 500 },
    jerseyNumber: { type: Number, default: 0, min: 0, max: 99 },
    era: { type: String, enum: LEGEND_ERAS, default: 'Modern Era', index: true },
    isHallOfFame: { type: Boolean, default: false, index: true },
    rank: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
    collection: 'legends',
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  }
);

export default mongoose.model<ILegend>('Legend', legendSchema);
