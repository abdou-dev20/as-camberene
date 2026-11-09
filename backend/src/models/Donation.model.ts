/**
 * Don au club, réglé en ligne par PayTech.
 *
 * Le don naît « en attente » au moment où le donateur part vers la page de
 * paiement, et ne devient « payé » que sur la notification signée de PayTech
 * (IPN). Le retour du navigateur sur la page de remerciement ne prouve rien :
 * n'importe qui peut taper l'adresse. Seul le serveur de PayTech fait foi.
 *
 * La référence est celle transmise à PayTech (`ref_command`) : c'est par elle
 * que la notification retrouve le don. Tirée au sort, comme celle des billets,
 * pour ne pas dire combien de dons le club a reçus.
 */

import crypto from 'crypto';
import mongoose, { Document, Schema } from 'mongoose';

export const DONATION_STATUSES = ['en_attente', 'payee', 'annulee', 'echouee'] as const;
export type DonationStatus = (typeof DONATION_STATUSES)[number];

/** En dessous, les frais de la passerelle mangent l'essentiel du don. */
export const DONATION_MIN = 500;
/** Au-delà, le club préfère un virement et un échange de vive voix. */
export const DONATION_MAX = 5_000_000;

export const generateDonationReference = (): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const suffix = Array.from(crypto.randomBytes(8))
    .map((byte) => alphabet[byte % alphabet.length])
    .join('');
  return `DON-${suffix}`;
};

export interface IDonation extends Document {
  _id: mongoose.Types.ObjectId;
  reference: string;
  /** Montant demandé, en francs CFA. */
  amount: number;
  /** Montant réellement encaissé selon PayTech (après promotion éventuelle). */
  paidAmount?: number;
  name: string;
  email?: string;
  phone?: string;
  /** Le donateur ne veut pas que son nom soit affiché. */
  anonymous: boolean;
  message: string;
  status: DonationStatus;
  /** Jeton de la session de paiement PayTech. */
  paytechToken?: string;
  /** Moyen choisi sur la page PayTech : Wave, Orange Money, carte… */
  paymentMethod?: string;
  paidAt?: Date;
  /** Note interne du club ; jamais rendue au donateur. */
  note: string;
}

const donationSchema = new Schema<IDonation>(
  {
    reference: { type: String, required: true, unique: true, uppercase: true, trim: true },
    amount: { type: Number, required: true, min: DONATION_MIN, max: DONATION_MAX },
    paidAmount: { type: Number },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, lowercase: true, trim: true, maxlength: 255 },
    phone: { type: String, trim: true, maxlength: 40 },
    anonymous: { type: Boolean, default: false },
    message: { type: String, default: '', maxlength: 1000 },
    status: { type: String, enum: DONATION_STATUSES, default: 'en_attente', index: true },
    paytechToken: { type: String },
    paymentMethod: { type: String, maxlength: 60 },
    paidAt: { type: Date },
    note: { type: String, default: '', maxlength: 1000 },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
    collection: 'donations',
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  }
);

export default mongoose.model<IDonation>('Donation', donationSchema);
