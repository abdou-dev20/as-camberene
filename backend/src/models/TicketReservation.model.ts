import crypto from 'crypto';
import mongoose, { Document, Schema } from 'mongoose';

export const RESERVATION_STATUSES = ['nouvelle', 'confirmee', 'honoree', 'annulee'] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  nouvelle: 'À traiter',
  confirmee: 'Confirmée',
  honoree: 'Retirée au guichet',
  annulee: 'Annulée',
};

export const generateReservationReference = (): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const suffix = Array.from(crypto.randomBytes(6))
    .map((byte) => alphabet[byte % alphabet.length])
    .join('');
  return `BIL-${suffix}`;
};

export interface ITicketReservation extends Document {
  _id: mongoose.Types.ObjectId;
  reference: string;
  match: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  seats: number;
  status: ReservationStatus;
  message: string;
  note: string;
}

const ticketReservationSchema = new Schema<ITicketReservation>(
  {
    reference: { type: String, required: true, unique: true, uppercase: true, trim: true },
    match: { type: Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 40 },
    email: { type: String, lowercase: true, trim: true, maxlength: 255 },
    seats: { type: Number, required: true, min: 1, max: 20, default: 1 },
    status: { type: String, enum: RESERVATION_STATUSES, default: 'nouvelle', index: true },
    message: { type: String, default: '', maxlength: 1000 },
    note: { type: String, default: '', maxlength: 1000 },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
    collection: 'ticket_reservations',
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        if (ret.match && typeof ret.match !== 'object') ret.match = String(ret.match);
        return ret;
      },
    },
  }
);

export default mongoose.model<ITicketReservation>('TicketReservation', ticketReservationSchema);
