import React from 'react';
import { Link } from 'react-router-dom';
import { Quote } from 'lucide-react';
import PageHero from '../components/ui/PageHero';
import { president, presidentAxes } from '../data/president';
import { handleImageError } from '../lib/imagePlaceholder';

const President: React.FC = () => (
  <div className="bg-graphite">
    <PageHero
      kicker="Le club"
      title="Mot du président"
      description={`${president.name} — ${president.role}. Élu le ${president.electedOn}.`}
    />

    <section className="band-charcoal py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[320px_1fr] lg:gap-14">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.04]">
              <img
                src={president.photo}
                alt={`${president.name}, ${president.role}`}
                onError={handleImageError}
                className="aspect-[4/5] w-full object-cover object-top"
              />
              <div className="border-t-2 border-club-yellow p-5">
                <p className="text-xl font-extrabold uppercase leading-tight text-white">
                  {president.name}
                </p>
                <p className="mt-1 text-sm text-white/60">{president.role}</p>
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-club-yellow">
                  Élu le {president.electedOn}
                </p>
              </div>
            </div>
          </aside>

          <article className="max-w-3xl">
            <header className="border-l-2 border-club-yellow pl-5">
              <p className="text-lg font-extrabold uppercase leading-tight text-white md:text-xl">
                {president.salutation}
              </p>
              <p className="mt-1 text-base text-white/70">{president.addressees}</p>
            </header>

            <p className="mt-8 text-base leading-relaxed text-white/80 md:text-lg">
              {president.paragraphs[0]}
            </p>

            <figure className="my-10 flex gap-4 rounded-[20px] border border-club-yellow/30 bg-club-yellow/[0.06] p-6">
              <Quote size={28} className="shrink-0 text-club-yellow" />
              <blockquote className="text-xl font-extrabold uppercase leading-snug text-white md:text-2xl">
                {president.pullQuote}
              </blockquote>
            </figure>

            {president.paragraphs.slice(1).map((paragraph) => (
              <p
                key={paragraph.slice(0, 40)}
                className="mt-6 text-base leading-relaxed text-white/80 md:text-lg"
              >
                {paragraph}
              </p>
            ))}

            <footer className="mt-10 border-t border-white/10 pt-6">
              <p className="text-base text-white/70">{president.closing}</p>
              <p className="mt-4 text-2xl font-extrabold uppercase leading-none text-white">
                {president.name}
              </p>
              <p className="mt-2 text-sm font-bold uppercase tracking-[0.18em] text-club-yellow">
                {president.role}
              </p>
            </footer>
          </article>
        </div>
      </div>
    </section>

    <section className="band-green py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="section-title">Les cinq axes du mandat</h2>
        <p className="mt-3 max-w-2xl text-sm text-white/70 md:text-base">
          La feuille de route partagée pendant la campagne, qui guide l'action du club au quotidien.
        </p>

        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {presidentAxes.map((axis, index) => (
            <li key={axis.id} className="panel panel-hover p-6">
              <span className="text-3xl font-extrabold leading-none text-club-yellow">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-4 text-lg font-extrabold uppercase leading-tight text-white">
                {axis.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/70">{axis.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>

    <section className="band-charcoal py-14">
      <div className="flex flex-wrap justify-center gap-3 px-4">
        <Link to="/inscription" className="btn-yellow">Devenir membre</Link>
        <Link to="/histoire" className="btn-ghost">Histoire du club</Link>
      </div>
    </section>
  </div>
);

export default President;
