import React from 'react';

type AdminConfirmDeleteProps = {
  title: React.ReactNode;
  children?: React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  saving?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  backdropClassName?: string;
  cardClassName?: string;
  cancelClassName?: string;
  confirmClassName?: string;
};

const AdminConfirmDelete: React.FC<AdminConfirmDeleteProps> = ({
  title,
  children,
  onCancel,
  onConfirm,
  saving = false,
  confirmLabel = 'Supprimer',
  cancelLabel = 'Annuler',
  backdropClassName = 'absolute inset-0 bg-graphite/90 backdrop-blur-sm',
  cardClassName = 'relative w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.05] p-6',
  cancelClassName = 'rounded-full bg-white/5 px-4 py-1.5 text-xs text-white/70 hover:bg-white/10',
  confirmClassName =
    'rounded-full bg-red-500/30 px-4 py-1.5 text-xs text-red-200 hover:bg-red-500/40 disabled:opacity-60',
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className={backdropClassName} onClick={onCancel} />
    <div className={cardClassName}>
      <h4 className="mb-2 text-sm font-semibold text-white">{title}</h4>
      {typeof children === 'string' ? (
        <p className="mb-4 text-xs text-white/60">{children}</p>
      ) : (
        children
      )}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className={cancelClassName}>
          {cancelLabel}
        </button>
        <button type="button" onClick={onConfirm} disabled={saving} className={confirmClassName}>
          {saving ? 'Suppression…' : confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

export default AdminConfirmDelete;