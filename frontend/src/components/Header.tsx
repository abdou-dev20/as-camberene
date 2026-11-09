import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  HandHeart,
  LayoutDashboard,
  LogOut,
  Search,
  ShoppingCart,
  Ticket,
  X,
} from 'lucide-react';
import Notification from './Notification';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { safeHref, socialLinks } from '../lib/socials';
import { settingsImage } from '../services/site/settings.service';

interface NavColumn {
  title: string;
  links: { name: string; path: string }[];
}

interface NavItem {
  name: string;
  path: string;
  columns?: NavColumn[];
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Équipes',
    path: '/teams',
    columns: [
      {
        title: 'Équipe première',
        links: [
          { name: 'Équipe A', path: '/equipe-a' },
          { name: 'Effectif', path: '/players' },
          { name: 'Calendrier', path: '/calendrier' },
          { name: 'Toutes les équipes', path: '/teams' },
        ],
      },
      {
        title: 'Formation',
        links: [
          { name: 'U19', path: '/equipe-u19' },
          { name: 'U17', path: '/equipe-u17' },
          { name: 'U15', path: '/equipe-u15' },
          { name: 'U12', path: '/equipe-u12' },
        ],
      },
    ],
  },
  { name: 'Actualités', path: '/news' },
  {
    name: 'Le club',
    path: '/histoire',
    columns: [
      {
        title: 'Histoire',
        links: [
          { name: 'Mot du président', path: '/mot-du-president' },
          { name: 'Histoire du club', path: '/histoire' },
          { name: 'Légendes', path: '/legends' },
        ],
      },
      {
        title: 'Supporters',
        links: [
          { name: 'Galerie', path: '/galerie' },
          { name: 'Billetterie', path: '/billetterie' },
          { name: 'Abonnements', path: '/subscriptions' },
          { name: 'Devenir membre', path: '/inscription' },
        ],
      },
    ],
  },
  {
    name: 'Boutique',
    path: '/shop',
    columns: [
      {
        title: 'Collection',
        links: [
          { name: 'Toute la boutique', path: '/shop' },
          { name: 'Maillots', path: '/shop?categorie=Maillots' },
          { name: 'Accessoires', path: '/shop?categorie=Accessoires' },
        ],
      },
      {
        title: 'Mon compte',
        links: [
          { name: 'Panier', path: '/cart' },
          { name: 'Abonnements', path: '/subscriptions' },
        ],
      },
    ],
  },
];

const Header: React.FC = () => {
  const settings = useSiteSettings();
  const SOCIALS = socialLinks(settings);
  const partners = settings.partners.filter((partner) => partner.logo);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [hideStrip, setHideStrip] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [toast, setToast] = useState({ visible: false, msg: '' });

  const { user, logout, isStaff } = useAuth();
  const { getCartItemsCount } = useCart();
  const location = useLocation();
  const headerRef = useRef<HTMLElement>(null);
  const lastScroll = useRef(0);

  useEffect(() => {
    setOpenMenu(null);
    setFullscreenOpen(false);
    setLangOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = fullscreenOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [fullscreenOpen]);

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      setHideStrip(current > 80 && current > lastScroll.current);
      lastScroll.current = current;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
        setLangOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpenMenu(null);
      setLangOpen(false);
      setFullscreenOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const cartCount = getCartItemsCount();
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);
  const expanded = Boolean(openMenu);

  const confirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    setToast({ visible: true, msg: 'Déconnecté avec succès' });
    setTimeout(() => setToast({ visible: false, msg: '' }), 3000);
  };

  return (
    <header ref={headerRef} className="sticky top-0 z-50 w-full">
      <div
        className={`overflow-hidden bg-club-yellow transition-all duration-200 ${
          hideStrip ? 'h-0 opacity-0' : 'h-5 opacity-100'
        }`}
      >
        <div className="mx-auto flex h-5 max-w-site items-center justify-end gap-3 overflow-hidden px-4 sm:gap-5 lg:px-10">
          {partners.length > 0 ? (
            <>
              <span className="hidden text-[10px] font-bold uppercase tracking-wide text-black sm:block">
                Partenaires officiels
              </span>
              {partners.map((partner) => (
                <a
                  key={partner.name}
                  href={safeHref(partner.href) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-4 items-center"
                >
                  <img src={settingsImage(partner.logo)} alt={partner.name} className="h-full w-auto brightness-0" />
                </a>
              ))}
            </>
          ) : (
            <span className="hidden truncate text-[10px] font-bold uppercase tracking-[0.18em] text-black sm:block">
              {settings.topBar}
            </span>
          )}

          <span className="hidden h-3 w-px bg-black/25 sm:block" />
          <div className="flex items-center gap-3">
            {SOCIALS.map(({ label, icon: Icon, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-black transition-opacity hover:opacity-60"
              >
                <Icon size={13} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`relative w-full transition-colors duration-150 ${
          expanded ? 'bg-graphite' : 'bg-club-green'
        }`}
      >
        <Link
          to="/"
          aria-label="Accueil ASC Cambérène"
          className="absolute left-3 top-0 z-20 hidden h-[110px] w-[110px] lg:block"
        >
          <img
            src="/assets/img/asc-camberene-logo-officiel.png"
            alt="ASC Cambérène"
            className="h-full w-full object-contain drop-shadow-lg"
          />
        </Link>

        <div className="mx-auto flex h-[61px] max-w-site items-center px-4 lg:px-10">
          <div className="flex items-center lg:ml-[125px]">
            <button
              type="button"
              onClick={() => setFullscreenOpen(true)}
              aria-label="Ouvrir le menu"
              aria-expanded={fullscreenOpen}
              className="group flex h-[22px] w-[35px] shrink-0 flex-col justify-between transition-opacity hover:opacity-70"
            >
              <span className="block h-[3px] w-[33px] rounded-[3px] bg-white" />
              <span className="block h-[3px] w-[33px] rounded-[3px] bg-white" />
              <span className="block h-[3px] w-[33px] rounded-[3px] bg-white" />
            </button>

            <Link to="/" className="ml-3 lg:hidden" aria-label="Accueil">
              <img
                src="/assets/img/asc-camberene-logo-officiel.png"
                alt="ASC Cambérène"
                className="h-10 w-10 object-contain"
              />
            </Link>

            <nav className="ml-6 hidden h-[50px] items-center lg:flex">
              {NAV_ITEMS.map((item) =>
                item.columns ? (
                  <button
                    key={item.name}
                    type="button"
                    onMouseEnter={() => setOpenMenu(item.name)}
                    onClick={() => setOpenMenu(openMenu === item.name ? null : item.name)}
                    aria-expanded={openMenu === item.name}
                    className={`mx-[10px] my-[10px] flex items-center text-sm font-semibold uppercase tracking-[0.02em] text-white transition-opacity ${
                      openMenu === item.name || isActive(item.path) ? 'opacity-100' : 'hover:opacity-70'
                    }`}
                  >
                    {item.name}
                  </button>
                ) : (
                  <Link
                    key={item.name}
                    to={item.path}
                    onMouseEnter={() => setOpenMenu(null)}
                    className="mx-[10px] my-[10px] flex items-center text-sm font-semibold uppercase tracking-[0.02em] text-white transition-opacity hover:opacity-70"
                  >
                    {item.name}
                  </Link>
                )
              )}
            </nav>
          </div>

          <div className="ml-auto flex items-center gap-3 lg:gap-5">
            <div className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 rounded px-2 py-1 text-sm font-semibold uppercase text-white transition-colors hover:bg-black/20"
              >
                FR
                <ChevronDown size={14} className={langOpen ? 'rotate-180' : ''} />
              </button>
              {langOpen && (
                <ul className="absolute right-0 top-full mt-1 w-20 overflow-hidden rounded-b bg-club-green-dark text-sm">
                  <li>
                    <button type="button" className="block w-full px-3 py-2 text-left text-white/70 hover:text-white">
                      EN
                    </button>
                  </li>
                </ul>
              )}
            </div>

            <button
              type="button"
              aria-label="Rechercher"
              className="hidden text-white transition-opacity hover:opacity-70 sm:block"
            >
              <Search size={16} />
            </button>

            <Link
              to="/dons"
              className="hidden h-10 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold uppercase text-club-green-dark transition-opacity hover:opacity-70 lg:flex"
            >
              <HandHeart size={20} />
              Faire un don
            </Link>
            <Link
              to="/billetterie"
              className="hidden h-10 items-center justify-center gap-3 rounded-full bg-club-yellow px-7 text-sm font-semibold uppercase text-club-green-dark transition-opacity hover:opacity-70 lg:flex"
            >
              <Ticket size={20} />
              Billetterie
            </Link>
            <Link
              to="/cart"
              className="relative hidden h-10 items-center justify-center gap-3 rounded-full border-2 border-white px-7 text-sm font-semibold uppercase text-white transition-opacity hover:opacity-70 lg:flex"
            >
              <ShoppingCart size={20} />
              Boutique
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-club-yellow text-[11px] font-bold text-black">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link
              to="/dons"
              aria-label="Faire un don"
              className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white text-club-green-dark lg:hidden"
            >
              <HandHeart size={15} />
            </Link>
            <Link
              to="/billetterie"
              aria-label="Billetterie"
              className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-club-yellow text-black lg:hidden"
            >
              <Ticket size={15} />
            </Link>
            <Link
              to="/cart"
              aria-label="Panier"
              className="relative flex h-[30px] w-[30px] items-center justify-center rounded-full border border-white text-white lg:hidden"
            >
              <ShoppingCart size={15} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-club-yellow text-[10px] font-bold text-black">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <>
                {isStaff && (
                  <Link
                    to="/admin"
                    className="hidden items-center gap-1.5 text-sm font-semibold uppercase text-white transition-opacity hover:opacity-70 lg:flex"
                  >
                    <LayoutDashboard size={16} />
                    Administration
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="flex items-center gap-1.5 text-sm font-semibold uppercase text-white transition-opacity hover:opacity-70"
                >
                  <span className="hidden lg:inline">{user.name.split(' ')[0]}</span>
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-sm font-semibold uppercase text-white transition-opacity hover:opacity-70"
              >
                <span className="hidden sm:inline">Connexion</span>
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>

        {openMenu && (
          <div
            onMouseLeave={() => setOpenMenu(null)}
            className="absolute left-0 top-full z-30 hidden w-full bg-graphite-light pb-12 pl-[150px] pr-10 pt-5 shadow-[0_10px_20px_-2px_#000] lg:block"
          >
            <div className="flex gap-20">
              {NAV_ITEMS.find((item) => item.name === openMenu)?.columns?.map((column) => (
                <div key={column.title}>
                  <p className="py-2.5 font-bold text-[#999]">{column.title}</p>
                  <ul className="mt-2.5 flex flex-col gap-2.5">
                    {column.links.map((link) => (
                      <li key={link.path}>
                        <Link
                          to={link.path}
                          className="text-base font-bold text-white transition-colors hover:text-club-yellow"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {fullscreenOpen && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-graphite">
          <div className="mx-auto flex h-[61px] max-w-site items-center px-4 lg:px-10">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/assets/img/asc-camberene-logo-officiel.png"
                alt="ASC Cambérène"
                className="h-11 w-11 object-contain"
              />
            </Link>
            <button
              type="button"
              onClick={() => setFullscreenOpen(false)}
              aria-label="Fermer le menu"
              className="ml-auto text-white transition-opacity hover:opacity-70"
            >
              <X size={26} />
            </button>
          </div>

          <nav className="mx-auto max-w-site divide-y divide-white/10 px-4 lg:px-10">
            {NAV_ITEMS.map((item) =>
              item.columns ? (
                <div key={item.name}>
                  <button
                    type="button"
                    onClick={() => setOpenSection(openSection === item.name ? null : item.name)}
                    aria-expanded={openSection === item.name}
                    className="flex w-full items-center justify-between py-5 text-xl font-bold uppercase text-white"
                  >
                    {item.name}
                    <ChevronDown
                      size={20}
                      className={`text-club-yellow transition-transform ${
                        openSection === item.name ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openSection === item.name && (
                    <div className="grid gap-6 pb-6 sm:grid-cols-2">
                      {item.columns.map((column) => (
                        <div key={column.title}>
                          <p className="mb-2 font-bold text-[#999]">{column.title}</p>
                          <ul className="flex flex-col gap-2">
                            {column.links.map((link) => (
                              <li key={link.path}>
                                <Link
                                  to={link.path}
                                  className="text-base font-bold text-white transition-colors hover:text-club-yellow"
                                >
                                  {link.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.name}
                  to={item.path}
                  className="block py-5 text-xl font-bold uppercase text-white"
                >
                  {item.name}
                </Link>
              )
            )}
          </nav>

          <div className="mx-auto flex max-w-site flex-col gap-3 px-4 py-8 sm:flex-row lg:px-10">
            <Link
              to="/dons"
              className="flex h-10 items-center justify-center gap-3 rounded-full bg-white px-7 text-sm font-semibold uppercase text-club-green-dark"
            >
              <HandHeart size={18} />
              Faire un don
            </Link>
            <Link
              to="/billetterie"
              className="flex h-10 items-center justify-center gap-3 rounded-full bg-club-yellow px-7 text-sm font-semibold uppercase text-club-green-dark"
            >
              <Ticket size={18} />
              Billetterie
            </Link>
            <Link
              to="/shop"
              className="flex h-10 items-center justify-center gap-3 rounded-full border-2 border-white px-7 text-sm font-semibold uppercase text-white"
            >
              <ShoppingCart size={18} />
              Boutique
            </Link>
            {!user && (
              <Link
                to="/login"
                className="flex h-10 items-center justify-center gap-2 px-4 text-sm font-semibold uppercase text-white"
              >
                Connexion
                <ArrowRight size={16} />
              </Link>
            )}
          </div>

          <div className="mx-auto flex max-w-site gap-6 border-t border-white/10 px-4 py-8 lg:px-10">
            {SOCIALS.map(({ label, icon: Icon, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-white/60 transition-colors hover:text-white"
              >
                <Icon size={20} />
              </a>
            ))}
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-[20px] border border-white/10 bg-graphite p-6">
            <h4 className="mb-2 text-base font-extrabold uppercase text-white">Confirmer la déconnexion</h4>
            <p className="mb-6 text-sm text-white/60">Voulez-vous vraiment vous déconnecter ?</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowLogoutConfirm(false)} className="btn-ghost px-5 py-2">
                Annuler
              </button>
              <button type="button" onClick={confirmLogout} className="btn-yellow px-5 py-2">
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}

      <Notification
        type="success"
        message={toast.msg}
        isVisible={toast.visible}
        onClose={() => setToast({ visible: false, msg: '' })}
        duration={2500}
      />
    </header>
  );
};

export default Header;
