import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { socialLinks } from '../lib/socials';
import ShareButtons from './ui/ShareButtons';

const FOOTER_MENU = [
  {
    title: 'Billetterie',
    links: [
      { name: 'Abonnements', path: '/subscriptions' },
      { name: 'Devenir membre', path: '/inscription' },
      { name: 'Panier', path: '/cart' },
    ],
  },
  {
    title: 'Équipes',
    links: [
      { name: 'Équipe A', path: '/equipe-a' },
      { name: 'Effectif', path: '/players' },
      { name: 'U19', path: '/equipe-u19' },
      { name: 'U17', path: '/equipe-u17' },
      { name: 'Toutes les équipes', path: '/teams' },
    ],
  },
  {
    title: 'Supporters',
    links: [
      { name: 'Actualités', path: '/news' },
      { name: 'Légendes', path: '/legends' },
      { name: 'Histoire du club', path: '/histoire' },
      { name: 'Mot du président', path: '/mot-du-president' },
    ],
  },
  {
    title: 'Le club',
    links: [
      { name: 'Boutique officielle', path: '/shop' },
      { name: 'Mon compte', path: '/login' },
    ],
  },
];

const POLICY_LINKS = [
  { name: 'Politique de confidentialité', path: '/privacy' },
  { name: "Conditions d'utilisation", path: '/terms' },
  { name: 'Cookies', path: '/cookies' },
  { name: 'Contact', path: '/contact' },
];

const Footer: React.FC = () => {
  const settings = useSiteSettings();
  const SOCIALS = socialLinks(settings);
  const { contact, newsletter } = settings;
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer>
      <section className="band-graphite border-t border-white/5">
        <div className="site-container flex flex-col items-center gap-6 py-14 text-center lg:flex-row lg:justify-between lg:text-left">
          <div>
            <h2 className="text-2xl font-extrabold uppercase text-white md:text-3xl">{newsletter.title}</h2>
            <p className="mt-2 max-w-md text-sm text-white/60">
              {newsletter.text}
            </p>
          </div>

          {subscribed ? (
            <p className="font-bold uppercase text-club-yellow">Merci, votre inscription est enregistrée.</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
              <label htmlFor="newsletter-email" className="sr-only">Adresse e-mail</label>
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Votre adresse e-mail"
                className="field"
              />
              <button type="submit" className="btn-yellow shrink-0">S'inscrire</button>
            </form>
          )}
        </div>
      </section>

      <section className="band-green">
        <div className="site-container py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {FOOTER_MENU.map((column) => (
              <div key={column.title}>
                <p className="mb-4 text-lg font-normal uppercase text-white/60">{column.title}</p>
                <ul className="flex flex-col gap-1.5">
                  {column.links.map((link) => (
                    <li key={link.path}>
                      <Link to={link.path} className="text-sm text-white transition-opacity hover:opacity-60">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 grid gap-6 border-t border-white/15 pt-8 text-sm text-white/80 sm:grid-cols-3">
            {contact.address && (
              <p className="flex items-start gap-3 whitespace-pre-line">
                <MapPin size={18} className="mt-0.5 shrink-0 text-club-yellow" />
                {contact.address}
              </p>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone.replace(/\s+/g, '')}`} className="flex items-center gap-3 hover:text-white">
                <Phone size={18} className="shrink-0 text-club-yellow" />
                {contact.phone}
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex items-center gap-3 hover:text-white">
                <Mail size={18} className="shrink-0 text-club-yellow" />
                {contact.email}
              </a>
            )}
          </div>

          <div className="mt-8 flex justify-center border-t border-white/10 pt-6">
            <ShareButtons
              title="ASC Cambérène — Club officiel"
              url={typeof window !== 'undefined' ? window.location.origin : undefined}
              label="Faire connaître le club"
            />
          </div>

          <div className="mt-8 flex flex-col items-center gap-5 md:flex-row md:justify-between">
            <Link to="/" className="transition-opacity hover:opacity-70">
              <img
                src="/assets/img/asc-camberene-logo-officiel.png"
                alt="ASC Cambérène"
                className="h-[50px] w-auto object-contain"
              />
            </Link>
            <div className="flex gap-5">
              {SOCIALS.map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-white transition-opacity hover:opacity-70"
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-graphite">
        <div className="site-container flex flex-col gap-4 py-5 md:flex-row md:items-center">
          <p className="text-xs leading-none text-[#808084] md:w-1/2 md:pr-5">
            © 1965-{new Date().getFullYear()} {settings.footerNote}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-y-1 md:mx-auto">
            {POLICY_LINKS.map((link, index) => (
              <React.Fragment key={link.path}>
                {index > 0 && <span className="mx-2.5 text-xs text-[#bdbbba]">|</span>}
                <Link
                  to={link.path}
                  className="text-xs text-[#bdbbba] transition-opacity hover:opacity-70 hover:underline"
                >
                  {link.name}
                </Link>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>
    </footer>
  );
};

export default Footer;
