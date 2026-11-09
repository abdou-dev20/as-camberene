import mongoose, { Document, Schema } from 'mongoose';

export interface IHistoryEvent extends Document {
  _id: mongoose.Types.ObjectId;
  year: number;
  dateLabel?: string;
  title: string;
  description: string;
  tags: string[];
  image?: string;
  phase?: string;
}

const historyEventSchema = new Schema<IHistoryEvent>(
  {
    year: { type: Number, required: true, min: 1800, index: true },
    dateLabel: { type: String, trim: true, maxlength: 60 },
    title: { type: String, required: true, trim: true, maxlength: 250 },
    description: { type: String, default: '', maxlength: 5000 },
    tags: { type: [String], default: [] },
    image: { type: String, maxlength: 500 },
    phase: { type: String, trim: true, maxlength: 80, index: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
    collection: 'history_events',
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  }
);

export default mongoose.model<IHistoryEvent>('HistoryEvent', historyEventSchema);
