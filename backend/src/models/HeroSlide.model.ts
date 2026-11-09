import mongoose, { Document, Schema } from 'mongoose';

export interface IHeroSlide extends Document {
  _id: mongoose.Types.ObjectId;
  image?: string;
  youtube?: string;
  kicker: string;
  title: string;
  link: string;
  linkLabel: string;
  rank: number;
  isVisible: boolean;
}

const heroSlideSchema = new Schema<IHeroSlide>(
  {
    image: { type: String, trim: true, maxlength: 500 },
    youtube: { type: String, trim: true, maxlength: 500 },
    kicker: { type: String, required: true, trim: true, maxlength: 80 },
    title: { type: String, required: true, trim: true, maxlength: 250 },
    link: { type: String, trim: true, maxlength: 500, default: '/news' },
    linkLabel: { type: String, trim: true, maxlength: 80, default: 'En savoir plus' },
    rank: { type: Number, default: 0, index: true },
    isVisible: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
    collection: 'hero_slides',
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  }
);

export default mongoose.model<IHeroSlide>('HeroSlide', heroSlideSchema);
