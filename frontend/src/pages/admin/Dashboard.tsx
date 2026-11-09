import React, { useMemo, useState } from 'react';
import { Plus, Users, ShoppingBag, Newspaper, BarChart3, Package, Sparkles, Clapperboard, CalendarDays, Images, Ticket, Shield } from 'lucide-react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Notification from '../../components/Notification';
import useApiResource from '../../hooks/useApiResource';
import { articles as articlesApi, products as productsApi } from '../../services/site/content.service';
import { listOrders, STATUS_LABELS } from '../../services/site/orders.service';
import { getClubRoster } from '../../services/fconnect/members.service';
import { isFconnectConfigured } from '../../config/env';
import { AdminError } from '../../components/admin/AdminFeedback';
import { formatCFA } from '../../lib/currency';
import { formatDate } from '../../lib/dates';
import { ROLE_LABELS } from '../../lib/roles';

const Card: React.FC<{ title: string; value: string | number; sub: string }>=({title,value,sub})=> (
  <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:border-club-yellow/40 transition group">
    <p className="text-sm text-white/60 mb-2">{title}</p>
    <p className="text-3xl font-extrabold text-white tracking-tight group-hover:text-club-yellow transition">{value}</p>
    <p className="text-xs text-white/40 mt-3">{sub}</p>
  </div>
);

const Dashboard: React.FC = () => {
  const { logout, user, can } = useAuth();

  const canArticles = can('articles:write');
  const canProducts = can('products:write');
  const canOrders = can('orders:manage');

  const articlesResource = useApiResource((signal) => articlesApi.list({}, signal), [], {
    enabled: canArticles,
  });
  const productsResource = useApiResource((signal) => productsApi.list({}, signal), [], {
    enabled: canProducts,
  });
  const ordersResource = useApiResource((signal) => listOrders({}, signal), [], {
    enabled: canOrders,
  });
  const playersResource = useApiResource((signal) => getClubRoster({}, signal), [], {
    enabled: isFconnectConfigured(),
  });

  const articles = articlesResource.data;
  const products = productsResource.data;
  const orders = ordersResource.data;
  const players = playersResource.data;
  const [confirm, setConfirm] = useState(false);
  const [toast, setToast] = useState<{visible:boolean;msg:string}>({visible:false,msg:''});

  const stats = useMemo(() => {
    const positions: Record<string, number> = {};
    players.forEach(p => {
      const position = p.position?.trim() || 'Non précisé';
      positions[position] = (positions[position] || 0) + 1;
    });
    const categories: Record<string, number> = {};
    products.forEach(pr => { categories[pr.category] = (categories[pr.category] || 0) + 1; });
    return { positions, categories };
  }, [players, products]);

  const drafts = useMemo(() => articles.filter(a => a.status === 'draft').length, [articles]);

  const lastArticles = useMemo(() => [...articles].sort((a,b)=> new Date(b.publishedAt).getTime()-new Date(a.publishedAt).getTime()).slice(0,5), [articles]);
  const lastProducts = useMemo(() => [...products].slice(-4).reverse(), [products]);

  const shop = useMemo(() => {
    const active = orders.filter((order) => order.status !== 'annulee');
    return {
      toPrepare: orders.filter((order) => order.status === 'recue').length,
      revenue: active.reduce((sum, order) => sum + order.total, 0),
      catalogueValue: products.reduce((sum, product) => sum + product.price, 0),
      lastOrders: [...orders].slice(0, 5),
    };
  }, [orders, products]);

  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2"><BarChart3 size={22} className="text-club-yellow" /> Tableau de bord</h2>
          <p className="text-sm text-white/60">
            {user ? `Connecté comme ${ROLE_LABELS[user.role]}` : "Vue centralisée de tous les services"}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {can('hero:write') && (
            <a href="/admin/carrousel" className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/85"><Clapperboard size={14}/>Carrousel</a>
          )}
          {can('players:write') && (
            <a href="/admin/equipes" className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/85"><Shield size={14}/>Équipes</a>
          )}
          <a href="/admin/joueurs" className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/85"><Users size={14}/>Effectif</a>
          {can('matches:write') && (
            <a href="/admin/calendrier" className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/85"><CalendarDays size={14}/>Calendrier</a>
          )}
          {can('gallery:write') && (
            <a href="/admin/galerie" className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/85"><Images size={14}/>Galerie</a>
          )}
          {can('orders:manage') && (
            <a href="/admin/billetterie" className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/85"><Ticket size={14}/>Billetterie</a>
          )}
          {can('products:write') && (
            <a href="/admin/produits" className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/85"><ShoppingBag size={14}/>Produits</a>
          )}
          {can('articles:write') && (
            <a href="/admin/articles" className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/85"><Newspaper size={14}/>Actualités</a>
          )}
          {can('users:manage') && (
            <a href="/admin/utilisateurs" className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/85"><Users size={14}/>Comptes</a>
          )}
          {user && (
            <button onClick={()=>setConfirm(true)} className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-200 transition">
              <LogOut size={14}/> Quitter
            </button>
          )}
        </div>
      </div>

      <AdminError
        error={articlesResource.error ?? productsResource.error ?? ordersResource.error}
        onRetry={() => { articlesResource.reload(); productsResource.reload(); ordersResource.reload(); }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card title="Joueurs" value={players.length} sub={isFconnectConfigured() ? 'Effectif fconnect' : 'fconnect non relié'} />
        {canArticles && (
          <Card title="Actualités" value={articles.length} sub={`${drafts} brouillon${drafts > 1 ? 's' : ''}`} />
        )}
        {canProducts && (
          <>
            <Card title="Produits" value={products.length} sub={`${products.filter(p => p.isVisible !== false).length} en vitrine`} />
            <Card title="En rupture" value={products.filter(p => !p.inStock).length} sub="À réapprovisionner" />
          </>
        )}
        {canOrders && (
          <>
            <Card title="À préparer" value={shop.toPrepare} sub="Commandes reçues" />
            <Card title="Encaissé" value={formatCFA(shop.revenue)} sub="Hors annulations" />
          </>
        )}
      </div>

      <div className="grid xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 grid md:grid-cols-2 gap-8">
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wide"><Users size={14}/>Répartition postes</h3>
            <ul className="space-y-2 text-xs">
              {Object.entries(stats.positions).map(([pos,count]) => (
                <li key={pos} className="flex justify-between text-white/70"><span>{pos}</span><span className="text-club-yellow font-semibold">{count}</span></li>
              ))}
              {Object.keys(stats.positions).length===0 && <li className="text-white/40">Aucune donnée</li>}
            </ul>
          </div>
          {canProducts && (
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wide"><ShoppingBag size={14}/>Catégories produits</h3>
            <ul className="space-y-2 text-xs">
              {Object.entries(stats.categories).map(([cat,count]) => (
                <li key={cat} className="flex justify-between text-white/70"><span>{cat}</span><span className="text-club-yellow font-semibold">{count}</span></li>
              ))}
              {Object.keys(stats.categories).length===0 && <li className="text-white/40">Aucune donnée</li>}
            </ul>
          </div>
          )}
        </div>
        <div className="bg-gradient-to-br from-club-yellow/10 to-transparent border border-club-yellow/20 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wide"><Sparkles size={14}/>Actions rapides</h3>
          <div className="space-y-3 text-sm">
            {canArticles && (
              <a href="/admin/articles" className="flex items-center gap-2 group text-white/70 hover:text-white"><Plus size={14} className="text-club-yellow"/>Nouvelle actualité</a>
            )}
            {can('legends:write') && (
              <a href="/admin/legendes" className="flex items-center gap-2 group text-white/70 hover:text-white"><Plus size={14} className="text-club-yellow"/>Nouvelle légende</a>
            )}
            {can('history:write') && (
              <a href="/admin/histoire" className="flex items-center gap-2 group text-white/70 hover:text-white"><Plus size={14} className="text-club-yellow"/>Nouvelle étape d’histoire</a>
            )}
            {canProducts && (
              <a href="/admin/produits" className="flex items-center gap-2 group text-white/70 hover:text-white"><Plus size={14} className="text-club-yellow"/>Nouveau produit</a>
            )}
            {canOrders && (
              <a href="/admin/commandes" className="flex items-center gap-2 group text-white/70 hover:text-white"><Package size={14} className="text-club-yellow"/>Suivre les commandes</a>
            )}
            {can('users:manage') && (
              <a href="/admin/utilisateurs" className="flex items-center gap-2 group text-white/70 hover:text-white"><Plus size={14} className="text-club-yellow"/>Nouveau compte</a>
            )}
            <a href="/admin/joueurs" className="flex items-center gap-2 group text-white/70 hover:text-white"><Users size={14} className="text-club-yellow"/>Consulter l’effectif</a>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {canArticles && (
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide flex items-center gap-2"><Newspaper size={14}/>Derniers articles</h3>
          <ul className="space-y-3 text-xs">
            {lastArticles.map(a => (
              <li key={a.id} className="flex justify-between items-start">
                <div className="pr-3">
                  <p className="text-white/85 font-medium line-clamp-1">{a.title}</p>
                  <p className="text-[10px] text-white/40 line-clamp-1">{a.category}</p>
                </div>
                <span className="text-[10px] text-white/40">{formatDate(a.publishedAt)}</span>
              </li>
            ))}
            {lastArticles.length===0 && <li className="text-white/40">Aucun article</li>}
          </ul>
        </div>
        )}

        {canOrders && (
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide flex items-center gap-2"><Package size={14}/>Dernières commandes</h3>
          <ul className="space-y-3 text-xs">
            {shop.lastOrders.map(o => (
              <li key={o.id} className="flex justify-between items-start">
                <div className="pr-3">
                  <p className="text-white/85 font-medium line-clamp-1">{o.customer.name}</p>
                  <p className="text-[10px] text-white/40 font-mono">{o.reference} · {STATUS_LABELS[o.status]}</p>
                </div>
                <span className="text-[10px] text-club-yellow font-semibold">{formatCFA(o.total)}</span>
              </li>
            ))}
            {shop.lastOrders.length===0 && <li className="text-white/40">Aucune commande</li>}
          </ul>
        </div>
        )}

        {canProducts && (
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide flex items-center gap-2"><ShoppingBag size={14}/>Derniers produits</h3>
          <ul className="space-y-3 text-xs">
            {lastProducts.map(p => (
              <li key={p.id} className="flex justify-between items-start">
                <div className="pr-3">
                  <p className="text-white/85 font-medium line-clamp-1">{p.name}</p>
                  <p className="text-[10px] text-white/40 line-clamp-1">{p.category}</p>
                </div>
                <span className="text-[10px] text-club-yellow font-semibold">{formatCFA(p.price)}</span>
              </li>
            ))}
            {lastProducts.length===0 && <li className="text-white/40">Aucun produit</li>}
          </ul>
        </div>
        )}
      </div>
      {confirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-graphite/90 backdrop-blur-sm" onClick={()=>setConfirm(false)} />
          <div className="relative w-full max-w-sm bg-white/[0.05] border border-white/10 rounded-2xl p-6 z-50">
            <h4 className="text-sm font-semibold text-white mb-2">Confirmer la déconnexion</h4>
            <p className="text-xs text-white/60 mb-5">Vous allez quitter l'espace d'administration.</p>
            <div className="flex justify-end gap-3 text-xs">
              <button onClick={()=>setConfirm(false)} className="px-4 py-2 rounded-full bg-white/5 text-white/70 hover:bg-white/10">Annuler</button>
              <button onClick={()=>{ logout(); setConfirm(false); setToast({visible:true,msg:'Déconnexion réussie'}); setTimeout(()=>setToast({visible:false,msg:''}),2500); }} className="px-4 py-2 rounded-full bg-club-yellow text-black font-semibold">Déconnexion</button>
            </div>
          </div>
        </div>
      )}
      <Notification type="success" message={toast.msg} isVisible={toast.visible} onClose={()=>setToast({visible:false,msg:''})} duration={2500} />
    </div>
  );
};

export default Dashboard;
