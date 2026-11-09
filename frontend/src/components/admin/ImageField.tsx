import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { uploadImage } from '../../services/site/content.service';
import { siteMediaUrl } from '../../services/site/media';
import { ApiError } from '../../lib/api';

const ImageField: React.FC<{
  value: string;
  onChange: (value: string) => void;
  label?: string;
  hidePreview?: boolean;
}> = ({ value, onChange, label = 'Image', hidePreview = false }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      onChange(await uploadImage(file));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.fullMessage : 'Téléversement impossible');
    } finally {
      setUploading(false);

      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`${label} — adresse ou fichier`}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-club-yellow"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-white hover:bg-white/20 disabled:opacity-50"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
          {uploading ? 'Envoi…' : 'Fichier'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
      </div>

      {error && <p className="text-[11px] text-red-300">{error}</p>}

      {value && !hidePreview && (
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-2">
          <img
            src={siteMediaUrl(value)}
            alt=""
            className="h-16 w-16 shrink-0 rounded-md border border-white/10 object-cover"
          />
          <p className="min-w-0 flex-1 truncate text-[11px] text-white/50">{value}</p>
        </div>
      )}
    </div>
  );
};

export default ImageField;
