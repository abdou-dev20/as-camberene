import { useContext } from 'react';
import { CartContext, CartContextValue } from './CartProvider';

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart doit être utilisé à l’intérieur de <CartProvider>.');
  return ctx;
};
