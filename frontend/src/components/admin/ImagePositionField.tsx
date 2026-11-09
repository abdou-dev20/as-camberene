import React from 'react';
import { Crosshair } from 'lucide-react';
import { siteMediaUrl } from '../../services/site/media';

export const DEFAULT_IMAGE_POSITION = '50% 50%';

const parse = (value: string): [number, number] => {
  const match = /^(\d{1,3})% (\d{1,3})%$/.exec(value);
  return match ? [Number(match[1]), Number(match[2])] : [50, 50];
};

const ImagePositionField: React.FC<{
  image: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ image, value, onChange }) => {
  if (!image) return null;

  const src = siteMediaUrl(image);
  const [x, y] = parse(value);
  const position = `${x}% ${y}%`;

  const pick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)));
    onChange(
      `${clamp(((event.clientX - rect.left) / rect.width) * 100)}% ${clamp(((event.clientY - rect.top) / rect.height) * 100)}%`
    );
  };

  return (
    <div className="space-y-2 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-white/80">
          <Crosshair size={13} /> Cadrage — cliquez sur le sujet de la photo
        </span>
        {position !== DEFAULT_IMAGE_POSITION && (
          <button type="button" onClick={() => onChange(DEFAULT_IMAGE_POSITION)} className="text-white/50 hover:text-white">
            Recentrer
          </button>
        )}
      </div>

      <div className="relative mx-auto w-fit cursor-crosshair" onClick={pick}>
        <img src={src} alt="" draggable={false} className="block max-h-48 w-auto max-w-full select-none rounded" />
        <span
          className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-club-yellow bg-club-yellow/30 shadow"
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      </div>

      <div className="flex gap-2">
        <figure className="w-1/3">
          <img src={src} alt="" className="aspect-[4/5] w-full rounded object-cover" style={{ objectPosition: position }} />
          <figcaption className="mt-1 text-center text-[10px] text-white/50">Carte</figcaption>
        </figure>
        <figure className="flex-1">
          <img src={src} alt="" className="aspect-[16/7] w-full rounded object-cover" style={{ objectPosition: position }} />
          <figcaption className="mt-1 text-center text-[10px] text-white/50">Bannière de l'article</figcaption>
        </figure>
      </div>
    </div>
  );
};

export default ImagePositionField;
