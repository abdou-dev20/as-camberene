import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, Star, X } from 'lucide-react';
import { uploadImage } from '../../services/site/content.service';
import { siteMediaUrl } from '../../services/site/media';
import { ApiError } from '../../lib/api';

const GalleryField: React.FC<{
  value: string[];
  onChange: (value: string[]) => void;
}> = ({ value, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const add = (image: string) => {
    const trimmed = image.trim();

    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;

    setUploading(true);
    setError('');
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        uploaded.push(await uploadImage(file));
      }
      onChange([...value, ...uploaded.filter((image) => !value.includes(image))]);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.fullMessage : 'Téléversement impossible');
    } finally {
      setUploading(false);

      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (image: string) => onChange(value.filter((entry) => entry !== image));

  const promote = (image: string) => onChange([image, ...value.filter((entry) => entry !== image)]);

  return (
    <div className="space-y-2">
      <p className="text-white/60">
        Visuels <span className="text-white/30">— le premier sert de vignette</span>
      </p>

      <div className="flex gap-2">
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            add(url);
            setUrl('');
          }}
          placeholder="Adresse d'une image, puis Entrée"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-club-yellow"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-white hover:bg-white/20 disabled:opacity-50"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
          {uploading ? 'Envoi…' : 'Fichiers'}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          className="hidden"
          onChange={(event) => void handleFiles(event.target.files)}
        />
      </div>

      {error && <p className="text-[11px] text-red-300">{error}</p>}

      {value.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {value.map((image, index) => (
            <div key={image} className="group relative overflow-hidden rounded-lg border border-white/10">
              <img src={siteMediaUrl(image)} alt="" className="h-20 w-full object-cover" />

              {index === 0 && (
                <span className="absolute left-1 top-1 rounded-full bg-club-yellow px-1.5 py-0.5 text-[9px] font-bold text-black">
                  Vignette
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-black/70 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => promote(image)}
                    title="Utiliser comme vignette"
                    className="rounded bg-white/15 p-1 text-white hover:bg-white/25"
                  >
                    <Star size={11} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(image)}
                  title="Retirer"
                  className="rounded bg-red-500/40 p-1 text-red-100 hover:bg-red-500/60"
                >
                  <X size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GalleryField;
