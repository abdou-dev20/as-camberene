import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RailProps {
  children: React.ReactNode;
  className?: string;
}

const Rail: React.FC<RailProps> = ({ children, className = '' }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setAtStart(track.scrollLeft <= 4);
    setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - 4);
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, [sync, children]);

  const scrollBy = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * Math.max(track.clientWidth - 272, 272), behavior: 'smooth' });
  };

  return (
    <div className="group/rail relative">
      <div ref={trackRef} onScroll={sync} className={`rail ${className}`}>
        {children}
      </div>

      <button
        type="button"
        onClick={() => scrollBy(-1)}
        disabled={atStart}
        aria-label="Faire défiler vers la gauche"
        className="rail-arrow absolute left-0 top-1/2 z-20 -translate-y-1/2 opacity-0 group-hover/rail:opacity-100"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        onClick={() => scrollBy(1)}
        disabled={atEnd}
        aria-label="Faire défiler vers la droite"
        className="rail-arrow absolute right-0 top-1/2 z-20 -translate-y-1/2 opacity-0 group-hover/rail:opacity-100"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

export default Rail;
