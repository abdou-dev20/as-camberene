import mongoose, { Document, Schema } from 'mongoose';

export const GALLERY_CATEGORIES = ['match', 'entrainement', 'club'] as const;
export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number];

export interface IGalleryItem extends Document {
  _id: mongoose.Types.ObjectId;
  image: string;
  title: string;
  description: string;
  category: GalleryCategory;
  match?: mongoose.Types.ObjectId | null;
  album?: mongoose.Types.ObjectId | null;
  date: string;
  rank: number;
  isVisible: boolean;
}

const galleryItemSchema = new Schema<IGalleryItem>(
  {
    image: { type: String, required: true, maxlength: 500 },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 2000 },
    category: { type: String, enum: GALLERY_CATEGORIES, default: 'club', index: true },
    match: { type: Schema.Types.ObjectId, ref: 'Match', default: null, index: true },
    album: { type: Schema.Types.ObjectId, ref: 'Album', default: null, index: true },
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
    collection: 'gallery_items',
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;

        if (ret.match) ret.match = String(ret.match);
        if (ret.album) ret.album = String(ret.album);
        return ret;
      },
    },
  }
);

export default mongoose.model<IGalleryItem>('GalleryItem', galleryItemSchema);
