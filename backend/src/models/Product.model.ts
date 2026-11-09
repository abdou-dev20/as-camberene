import mongoose, { Document, Schema } from 'mongoose';

export const PRODUCT_CATEGORIES = ['Maillots', 'Accessoires'] as const;
export const PRODUCT_TYPES = ['Domicile', 'Extérieur', 'Third', 'Autre'] as const;

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  price: number;
  category: (typeof PRODUCT_CATEGORIES)[number];
  type: (typeof PRODUCT_TYPES)[number];
  image: string;
  images: string[];
  description: string;
  sizes: string[];
  inStock: boolean;
  isVisible: boolean;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, enum: PRODUCT_CATEGORIES, default: 'Accessoires', index: true },
    type: { type: String, enum: PRODUCT_TYPES, default: 'Autre' },
    image: { type: String, default: '', maxlength: 500 },
    images: { type: [String], default: [] },
    description: { type: String, default: '', maxlength: 5000 },
    sizes: { type: [String], default: [] },
    inStock: { type: Boolean, default: true },
    isVisible: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
    collection: 'products',
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  }
);

productSchema.pre('save', function alignImages(next) {
  if (!this.image && this.images.length > 0) this.image = this.images[0];
  if (this.images.length === 0 && this.image) this.images = [this.image];
  next();
});

export default mongoose.model<IProduct>('Product', productSchema);
