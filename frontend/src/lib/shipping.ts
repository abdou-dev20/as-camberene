export const FREE_SHIPPING_THRESHOLD = 50_000;

export const SHIPPING_COST = 3_500;

export const shippingFor = (subtotal: number, fulfilment: 'retrait' | 'livraison'): number =>
  fulfilment === 'retrait' || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
