import React, { useEffect, useRef, useState } from 'react';
import Header from './Header';

/**
 * Ouverture officielle du site : le 18 octobre 2026 à 15h00, heure de Dakar
 * (UTC+0). Avant cette date, le public ne voit que l'écran de lancement.
 */
export const LAUNCH_DATE = new Date('2026-10-18T15:00:00Z');

// Passer à true pour réafficher l'écran de lancement jusqu'à LAUNCH_DATE.
export const LAUNCH_SCREEN_ENABLED = false;

export const isLaunched = (now = Date.now()) =>
  !LAUNCH_SCREEN_ENABLED || now >= LAUNCH_DATE.getTime();

const remainingParts = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  return [
    { label: 'Jours', value: Math.floor(total / 86400) },
    { label: 'Heures', value: Math.floor((total % 86400) / 3600) },
    { label: 'Minutes', value: Math.floor((total % 3600) / 60) },
    { label: 'Secondes', value: total % 60 },
  ];
};

const LaunchScreen: React.FC<{ onLaunch: () => void }> = ({ onLaunch }) => {
  const [now, setNow] = useState(Date.now());
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (isLaunched(current)) onLaunch();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [onLaunch]);

  // L'en-tête reste visible mais inerte : ni clic, ni focus clavier.
  useEffect(() => {
    headerRef.current?.setAttribute('inert', '');
  }, []);

  const parts = remainingParts(LAUNCH_DATE.getTime() - now);

  return (
    <div className="min-h-screen bg-graphite">
      <div ref={headerRef} aria-disabled="true" className="pointer-events-none select-none">
        <Header />
      </div>

      <section className="relative flex min-h-[calc(100vh-80px)] items-end overflow-hidden bg-graphite">
        <img
          src="/assets/img/asc-camberene-equipe-2025.webp"
          alt="L'équipe de l'ASC Cambérène"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(24,25,28,.55), rgba(24,25,28,.1) 85%, rgba(24,25,28,.5)), linear-gradient(rgba(24,25,28,0) 30%, rgba(24,25,28,.95) 99%)',
          }}
        />

        <div className="relative z-10 mx-auto w-full max-w-site px-5 pb-12 pt-32 lg:px-10 lg:pb-20">
          <p className="text-shadow-hero text-lg font-bold uppercase text-club-yellow md:text-2xl">
            Lancement officiel
          </p>
          <h1 className="text-shadow-hero mt-2 max-w-3xl text-3xl font-extrabold uppercase leading-tight text-white md:text-5xl lg:text-[60px] lg:leading-[1.15]">
            Le nouveau site de l'ASC Cambérène arrive
          </h1>
          <p className="mt-4 text-base text-white/80 md:text-lg">
            Rendez-vous le dimanche 18 octobre 2026 à 15h00.
          </p>

          <div role="timer" aria-live="off" className="mt-8 grid max-w-xl grid-cols-4 gap-2 sm:gap-4">
            {parts.map(({ label, value }) => (
              <div key={label} className="border-t-4 border-club-yellow bg-black/50 px-2 py-3 text-center backdrop-blur-sm sm:py-4">
                <span className="block text-3xl font-extrabold tabular-nums text-white sm:text-5xl">
                  {String(value).padStart(2, '0')}
                </span>
                <span className="mt-1 block text-[10px] font-bold uppercase tracking-[2px] text-white/70 sm:text-xs">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LaunchScreen;
