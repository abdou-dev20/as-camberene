import { useContext } from 'react';
import { ApiError } from '../lib/api';
import { AuthContext, AuthContextValue } from './AuthProvider';

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé à l’intérieur de <AuthProvider>.');
  return ctx;
};

export const authErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) return error.fullMessage;
  return 'Erreur de connexion. Veuillez réessayer.';
};
