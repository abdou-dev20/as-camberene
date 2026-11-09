import { siteApi } from '../../lib/api';
import { Fulfilment, Order, OrderStatus, PaymentMethod } from '../../types';

export interface PlaceOrderPayload {
  customer: { name: string; phone: string; email?: string };
  items: { product_id: string; size: string; quantity: number }[];
  fulfilment: Fulfilment;
  address?: string;
  payment_method: PaymentMethod;
  note?: string;
}

export interface OrderListParams {
  search?: string;
  status?: OrderStatus | '';
  page?: number;
  limit?: number;
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  recue: 'Reçue',
  preparee: 'Préparée',
  remise: 'Remise',
  annulee: 'Annulée',
};

export const FULFILMENT_LABELS: Record<Fulfilment, string> = {
  retrait: 'Retrait au club',
  livraison: 'Livraison',
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  a_la_remise: 'À la remise',
  mobile_money: 'Mobile money',
};

export const placeOrder = async (payload: PlaceOrderPayload): Promise<Order> => {
  const response = await siteApi.post<{ success: boolean; data: Order }>('/orders', payload, {
    auth: true,
  });
  return response.data;
};

export const listOrders = async (
  params: OrderListParams = {},
  signal?: AbortSignal
): Promise<Order[]> => {
  const response = await siteApi.get<{ success: boolean; data: Order[] }>('/orders', {
    query: { ...params },
    auth: true,
    signal,
  });
  return response.data;
};

export const updateOrder = async (
  id: string,
  payload: { status?: OrderStatus; note?: string }
): Promise<Order> => {
  const response = await siteApi.put<{ success: boolean; data: Order }>(`/orders/${id}`, payload, {
    auth: true,
  });
  return response.data;
};
