import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, Users, ShoppingBag, Newspaper, Settings, Menu, Shield, LogOut, User as UserIcon, UserCog, Crown, Landmark, Package, Clapperboard, CalendarDays, Images, Ticket, Trophy, Award, LayoutTemplate, ChevronLeft, HandHeart } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Permission, ROLE_LABELS } from '../../lib/roles';

const navItems: { to: string; label: string; icon: React.ReactNode; permission?: Permission }[] = [
  { to: '/admin/dashboard', label: 'Tableau de bord', icon: <BarChart3 size={18} /> },
  { to: '/admin/contenu', label: 'Contenu du site', icon: <LayoutTemplate size={18} />, permission: 'settings:write' },
  { to: '/admin/carrousel', label: 'Carrousel', icon: <Clapperboard size={18} />, permission: 'hero:write' },
  { to: '/admin/articles', label: 'Actualités', icon: <Newspaper size={18} />, permission: 'articles:write' },
  { to: '/admin/legendes', label: 'Légendes', icon: <Crown size={18} />, permission: 'legends:write' },
  { to: '/admin/histoire', label: 'Histoire', icon: <Landmark size={18} />, permission: 'history:write' },
  { to: '/admin/produits', label: 'Produits', icon: <ShoppingBag size={18} />, permission: 'products:write' },
  { to: '/admin/commandes', label: 'Commandes', icon: <Package size={18} />, permission: 'orders:manage' },
  { to: '/admin/equipes', label: 'Équipes', icon: <Shield size={18} />, permission: 'players:write' },
  { to: '/admin/joueurs', label: 'Effectif', icon: <Users size={18} />, permission: 'players:write' },
  { to: '/admin/statistiques', label: 'Statistiques', icon: <Trophy size={18} />, permission: 'players:write' },
  { to: '/admin/joueur-du-mois', label: 'Joueur du mois', icon: <Award size={18} />, permission: 'players:write' },
  { to: '/admin/calendrier', label: 'Calendrier', icon: <CalendarDays size={18} />, permission: 'matches:write' },
  { to: '/admin/galerie', label: 'Galerie', icon: <Images size={18} />, permission: 'gallery:write' },
  { to: '/admin/billetterie', label: 'Billetterie', icon: <Ticket size={18} />, permission: 'orders:manage' },
  { to: '/admin/dons', label: 'Dons', icon: <HandHeart size={18} />, permission: 'orders:manage' },
  { to: '/admin/utilisateurs', label: 'Comptes', icon: <UserCog size={18} />, permission: 'users:manage' },
  { to: '/admin/parametres', label: 'Paramètres', icon: <Settings size={18} /> },
];

interface Props {
  children: React.ReactNode;
}

const AdminLayout: React.FC<Props> = ({ children }) => {
  const [open, setOpen] = useState(true);
  const { user, logout, can } = useAuth();

  const visibleItems = navItems.filter((item) => !item.permission || can(item.permission));

  return (
    <div className="min-h-screen flex bg-graphite text-white/85">
      <div className={`${open ? 'w-60' : 'w-20'} transition-all duration-300 bg-graphite/90 backdrop-blur-xl border-r border-white/10 flex flex-col relative`}>
        <div className="p-5 flex items-center gap-3 border-b border-white/5">
          <div className="w-11 h-11 rounded-xl bg-club-yellow flex items-center justify-center"><Shield size={22} className="text-black" /></div>
          {open && <div className="leading-tight">
            <p className="font-bold text-white">Administration</p>
            <p className="text-[10px] uppercase tracking-wide text-club-yellow font-semibold">ASC Cambérène</p>
          </div>}
          <button onClick={() => setOpen(!open)} className="ml-auto w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70">
            {open ? <ChevronLeft size={16} /> : <Menu size={16} />}
          </button>
        </div>
        <nav className="py-4 flex-1 space-y-1">
          {visibleItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin/dashboard'}
              className={({ isActive }) => `group relative flex items-center mx-3 gap-3 px-4 py-2.5 rounded-lg text-[13px] font-medium transition ${isActive ? 'bg-club-yellow text-black shadow-lg' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
            >
              <span className="shrink-0">{item.icon}</span>
              {open && <span className="truncate">{item.label}</span>}
              {!open && (
                <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded bg-graphite/95 text-white text-[10px] opacity-0 pointer-events-none group-hover:opacity-100 transition whitespace-nowrap border border-white/10">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-white/5 text-[10px] text-white/40">© {new Date().getFullYear()} ASC Cambérène</div>
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-graphite/70 backdrop-blur-xl">
          <h1 className="text-lg font-semibold text-white">Espace administration</h1>
          {user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <UserIcon size={20} className="text-club-yellow" />
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-white">{user.name}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${user.role === 'superadmin' ? 'bg-club-yellow text-black' : 'bg-white/10 text-white/70'}`}>{ROLE_LABELS[user.role]}</span>
                </div>
              </div>
              <button onClick={logout} className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition text-white/85">
                <LogOut size={14} /> Déconnexion
              </button>
            </div>
          )}
        </header>
        <main className="flex-1 p-8 min-w-0">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
