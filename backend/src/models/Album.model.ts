import mongoose, { Document, Schema } from 'mongoose';

export const ALBUM_CATEGORIES = ['match', 'entrainement', 'club'] as const;
export type AlbumCategory = (typeof ALBUM_CATEGORIES)[number];

export interface IAlbum extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  cover: string;
  category: AlbumCategory;
  match?: mongoose.Types.ObjectId | null;
  date: string;
  rank: number;
  isVisible: boolean;
}

const albumSchema = new Schema<IAlbum>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 2000 },
    cover: { type: String, default: '', maxlength: 500 },
    category: { type: String, enum: ALBUM_CATEGORIES, default: 'club', index: true },
    match: { type: Schema.Types.ObjectId, ref: 'Match', default: null, index: true },
    date: {
      type: String,
      trim: true,
      default: '',
      match: [/^(\d{4}-\d{2}-\d{2})?$/, 'La date doit être au format AAAA-MM-JJ'],
    },
    rank: { type: Number, default: 0, index: true },
    isVisible: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
    collection: 'albums',
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        if (ret.match) ret.match = String(ret.match);
        return ret;
      },
    },
  }
);

export default mongoose.model<IAlbum>('Album', albumSchema);
