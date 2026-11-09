import React, { useEffect } from 'react';
import { AlertCircle, Check, Info, X } from 'lucide-react';

interface NotificationProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  isVisible: boolean;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

const VARIANTS = {
  success: { icon: Check, accent: 'text-club-yellow', bar: 'bg-club-yellow' },
  error: { icon: AlertCircle, accent: 'text-red-400', bar: 'bg-red-500' },
  warning: { icon: AlertCircle, accent: 'text-orange-300', bar: 'bg-orange-400' },
  info: { icon: Info, accent: 'text-white', bar: 'bg-white/50' },
} as const;

const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  isVisible,
  onClose,
  autoClose = true,
  duration = 5000,
}) => {
  useEffect(() => {
    if (!isVisible || !autoClose) return undefined;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [isVisible, autoClose, duration, onClose]);

  if (!isVisible) return null;

  const { icon: Icon, accent, bar } = VARIANTS[type];

  return (
    <div className="fixed right-4 top-24 z-[70] w-full max-w-sm animate-fade-up">
      <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-graphite p-4 shadow-2xl">
        <span className={`absolute inset-y-0 left-0 w-1 ${bar}`} />
        <div className="flex items-start gap-3 pl-2">
          <Icon size={20} className={`shrink-0 ${accent}`} />
          <p className="flex-1 text-sm font-medium text-white">{message}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="shrink-0 text-white/40 transition-colors hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;
