import { siteApi } from '../../lib/api';
import { ReservationStatus, TicketReservation } from '../../types';
import { ItemResponse, ListResponse } from './content.service';

export interface ReservationRequest {
  match: string;
  name: string;
  phone: string;
  email?: string;
  seats: number;
  message?: string;
}

export interface ReservationConfirmation {
  reference: string;
  seats: number;
  match: { opponent: string; date: string; time: string; venue: string };
}

export const reserveTickets = async (
  payload: ReservationRequest
): Promise<{ confirmation: ReservationConfirmation; message: string }> => {
  const response = await siteApi.post<ItemResponse<ReservationConfirmation> & { message: string }>(
    '/tickets',
    payload
  );
  return { confirmation: response.data, message: response.message };
};

export const listReservations = async (
  params: { status?: string; match?: string } = {},
  signal?: AbortSignal
): Promise<TicketReservation[]> => {
  const response = await siteApi.get<ListResponse<TicketReservation>>('/tickets', {
    query: params,
    auth: true,
    signal,
  });
  return response.data;
};

export const updateReservation = async (
  id: string,
  payload: { status?: ReservationStatus; note?: string; seats?: number }
): Promise<TicketReservation> => {
  const response = await siteApi.put<ItemResponse<TicketReservation>>(`/tickets/${id}`, payload, {
    auth: true,
  });
  return response.data;
};

export const deleteReservation = async (id: string): Promise<void> => {
  await siteApi.del(`/tickets/${id}`, { auth: true });
};
