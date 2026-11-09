import crypto from 'crypto';
import mongoose, { Document, Schema } from 'mongoose';

export const ORDER_STATUSES = ['recue', 'preparee', 'remise', 'annulee'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const FULFILMENTS = ['retrait', 'livraison'] as const;
export const PAYMENT_METHODS = ['a_la_remise', 'mobile_money'] as const;

export interface IOrderItem {
  product?: mongoose.Types.ObjectId;
  name: string;
  unit_price: number;
  size: string;
  quantity: number;
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  reference: string;
  customer: { name: string; phone: string; email?: string };
  items: IOrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  fulfilment: (typeof FULFILMENTS)[number];
  address?: string;
  payment_method: (typeof PAYMENT_METHODS)[number];
  status: OrderStatus;
  note?: string;
  placed_by?: mongoose.Types.ObjectId;
}

export const generateReference = (): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const suffix = Array.from(crypto.randomBytes(6))
    .map((byte) => alphabet[byte % alphabet.length])
    .join('');
  return `CMD-${suffix}`;
};

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true, maxlength: 200 },
    unit_price: { type: Number, required: true, min: 0 },
    size: { type: String, default: '', maxlength: 20 },
    quantity: { type: Number, required: true, min: 1, max: 99 },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    reference: { type: String, required: true, unique: true, index: true },
    customer: {
      name: { type: String, required: true, trim: true, maxlength: 120 },
      phone: { type: String, required: true, trim: true, maxlength: 40 },
      email: { type: String, trim: true, lowercase: true, maxlength: 255 },
    },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    shipping: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    fulfilment: { type: String, enum: FULFILMENTS, default: 'retrait' },
    address: { type: String, trim: true, maxlength: 300 },
    payment_method: { type: String, enum: PAYMENT_METHODS, default: 'a_la_remise' },
    status: { type: String, enum: ORDER_STATUSES, default: 'recue', index: true },
    note: { type: String, trim: true, maxlength: 1000 },
    placed_by: { type: Schema.Types.ObjectId, ref: 'SiteUser' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
    collection: 'orders',
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  }
);

export default mongoose.model<IOrder>('Order', orderSchema);
