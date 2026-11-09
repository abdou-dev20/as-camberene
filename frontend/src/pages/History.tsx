import React from 'react';
import { Link } from 'react-router-dom';
import { useHistoryEvents } from '../hooks/useContent';
import PageHero from '../components/ui/PageHero';

const History: React.FC = () => {
  const { data: events } = useHistoryEvents();
  const phases = Array.from(new Set(events.map((event) => event.phase).filter(Boolean)));

  return (
    <div className="bg-graphite">
      <PageHero
        kicker="Depuis 1965"
        title="Histoire du club"
        description="Des fondations locales à la structuration moderne, la trajectoire construite par les générations de Cambérène."
      >
        {phases.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {phases.map((phase) => (
              <span key={phase} className="chip border border-white/20 bg-black/25 text-white/80">
                {phase}
              </span>
            ))}
          </div>
        )}
      </PageHero>

      <section className="band-charcoal py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          {events.length === 0 ? (
            <p className="panel p-12 text-center text-white/60">
              Aucune étape historique disponible pour le moment.
            </p>
          ) : (
            <div className="relative">
              <div className="pointer-events-none absolute bottom-0 left-[7px] top-0 w-px bg-white/15 md:left-1/2 md:-translate-x-1/2" />

              <ol className="space-y-14 md:space-y-20">
                {events.map((event, index) => {
                  const flipped = index % 2 === 1;
                  return (
                    <li key={String(event.id)} className="relative pl-8 md:pl-0">
                      <span className="absolute left-0 top-1.5 h-4 w-4 rounded-full bg-club-yellow ring-4 ring-charcoal md:left-1/2 md:-translate-x-1/2" />

                      <div className="grid items-center gap-6 md:grid-cols-2 md:gap-12">
                        <div className={`${flipped ? 'md:order-2 md:pl-12' : 'md:pr-12 md:text-right'}`}>
                          <div className={`flex items-center gap-3 ${flipped ? '' : 'md:justify-end'}`}>
                            <span className="text-sm font-extrabold tracking-[0.2em] text-club-yellow">
                              {event.dateLabel || event.year}
                            </span>
                            {event.phase && (
                              <span className="chip border border-club-yellow/40 text-club-yellow">{event.phase}</span>
                            )}
                          </div>

                          <h2 className="mt-3 text-2xl font-extrabold uppercase leading-tight text-white md:text-3xl">
                            {event.title}
                          </h2>
                          <p className="mt-3 text-sm leading-relaxed text-white/70 md:text-base">
                            {event.description}
                          </p>

                          {event.tags && event.tags.length > 0 && (
                            <div className={`mt-4 flex flex-wrap gap-2 ${flipped ? '' : 'md:justify-end'}`}>
                              {event.tags.map((tag) => (
                                <span key={tag} className="chip bg-white/[0.06] text-white/70">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className={`${flipped ? 'md:order-1 md:pr-12' : 'md:pl-12'}`}>
                          <div className="relative h-52 overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.04] md:h-64">
                            {event.image ? (
                              <img
                                src={event.image}
                                alt={event.title}
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="flex h-full items-center justify-center text-xs uppercase tracking-[0.2em] text-white/30">
                                Visuel à venir
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          <div className="mt-16 flex justify-center gap-3">
            <Link to="/legends" className="btn-yellow">Nos légendes</Link>
            <Link to="/" className="btn-ghost">Retour à l'accueil</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default History;
