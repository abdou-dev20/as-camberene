import mongoose, { Document, Schema } from 'mongoose';

export interface IVisitor extends Document {
  _id: mongoose.Types.ObjectId;
  visitor_id: string;
  first_seen_at: Date;
  last_seen_at: Date;
  last_path?: string;
  page_views: number;
  user?: mongoose.Types.ObjectId;
  ip?: string;
  user_agent?: string;
}

const visitorSchema = new Schema<IVisitor>(
  {
    visitor_id: { type: String, required: true, unique: true },
    first_seen_at: { type: Date, required: true, default: Date.now },
    last_seen_at: { type: Date, required: true, default: Date.now },
    last_path: { type: String, trim: true, maxlength: 500 },
    page_views: { type: Number, default: 0, min: 0 },
    user: { type: Schema.Types.ObjectId, ref: 'SiteUser' },
    ip: { type: String, trim: true, maxlength: 60 },
    user_agent: { type: String, trim: true, maxlength: 300 },
  },
  {
    versionKey: false,
    collection: 'visitors',
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  }
);

visitorSchema.index({ last_seen_at: -1 });
visitorSchema.index({ first_seen_at: -1 });

export default mongoose.model<IVisitor>('Visitor', visitorSchema);
