/**
 * Dons en ligne.
 *
 * Le site ne touche jamais à l'argent : il crée le don, puis envoie le
 * donateur sur la page de paiement de PayTech, qui prévient le serveur une
 * fois le paiement fait.
 */

import { siteApi } from '../../lib/api';
import { Donation, DonationStatus } from '../../types';
import { ItemResponse, ListResponse } from './content.service';

export interface DonationConfig {
  /** Les clés PayTech sont-elles en place sur le serveur ? */
  enabled: boolean;
  min: number;
  max: number;
}

export interface DonationRequest {
  amount: number;
  name: string;
  email?: string;
  phone?: string;
  anonymous: boolean;
  message?: string;
}

export const getDonationConfig = async (signal?: AbortSignal): Promise<DonationConfig> => {
  const response = await siteApi.get<ItemResponse<DonationConfig>>('/donations/config', { signal });
  return response.data;
};

/** Crée le don et rend l'adresse de la page de paiement PayTech. */
export const startDonation = async (
  payload: DonationRequest
): Promise<{ reference: string; redirectUrl: string }> => {
  const response = await siteApi.post<ItemResponse<{ reference: string; redirectUrl: string }>>(
    '/donations',
    payload
  );
  return response.data;
};

export const getDonationStatus = async (
  reference: string,
  signal?: AbortSignal
): Promise<{ reference: string; amount: number; status: DonationStatus }> => {
  const response = await siteApi.get<
    ItemResponse<{ reference: string; amount: number; status: DonationStatus }>
  >(`/donations/status/${encodeURIComponent(reference)}`, { signal });
  return response.data;
};

export const listDonations = async (signal?: AbortSignal): Promise<Donation[]> => {
  const response = await siteApi.get<ListResponse<Donation>>('/donations', { auth: true, signal });
  return response.data;
};

export const updateDonation = async (
  id: string,
  payload: { status?: DonationStatus; note?: string }
): Promise<Donation> => {
  const response = await siteApi.put<ItemResponse<Donation>>(`/donations/${id}`, payload, {
    auth: true,
  });
  return response.data;
};
