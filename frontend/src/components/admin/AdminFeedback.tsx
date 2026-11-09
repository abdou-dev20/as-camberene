import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { ApiError } from '../../lib/api';

export const AdminError: React.FC<{ error: ApiError | null; onRetry?: () => void }> = ({
  error,
  onRetry,
}) => {
  if (!error) return null;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3">
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-300" />
      <div className="flex-1 text-xs text-red-100">
        <p className="font-semibold">{error.fullMessage}</p>
        {error.isNetworkError && (
          <p className="mt-1 text-red-200/70">
            L’API du site est-elle démarrée ? <code>cd server &amp;&amp; npm run dev</code>
          </p>
        )}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[11px] text-white hover:bg-white/20"
        >
          Réessayer
        </button>
      )}
    </div>
  );
};

export const AdminLoading: React.FC<{ label?: string }> = ({ label = 'Chargement…' }) => (
  <div className="flex items-center justify-center gap-2 py-16 text-xs text-white/60">
    <Loader2 size={14} className="animate-spin" />
    {label}
  </div>
);

export const AdminEmpty: React.FC<{ label: string }> = ({ label }) => (
  <div className="py-16 text-center text-xs text-white/40">{label}</div>
);
