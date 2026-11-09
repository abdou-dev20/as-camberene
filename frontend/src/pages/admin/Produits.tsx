import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, PackageCheck, PackageX, Plus, Search, X } from 'lucide-react';
import useEditableResource from '../../hooks/useEditableResource';
import { products as productsApi, ProductRecord } from '../../services/site/content.service';
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminFeedback';
import GalleryField from '../../components/admin/GalleryField';
import { PRODUCT_CATEGORIES, PRODUCT_TYPES } from '../../types';
import { formatCFA } from '../../lib/currency';
import AdminConfirmDelete from '../../components/admin/AdminConfirmDelete';

const Produits: React.FC = () => {
  const {
    items: products,
    loading,
    error,
    actionError,
    saving,
    reload,
    create,
    update,
    remove,
  } = useEditableResource<ProductRecord>(productsApi);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    name: string; category: string; type: string; price: string; images: string[];
    description: string; sizes: string; inStock: boolean; isVisible: boolean;
  }>({
    name: '', category: 'Maillots', type: 'Autre', price: '', images: [],
    description: '', sizes: '', inStock: true, isVisible: true,
  });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const filtered = useMemo(() => products.filter(p => {
    const q = query.toLowerCase();
    const okQ = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    const okCat = !categoryFilter || p.category === categoryFilter;
    return okQ && okCat;
  }), [products, query, categoryFilter]);

  const emptyForm = {
    name: '', category: 'Maillots', type: 'Autre', price: '', images: [] as string[],
    description: '', sizes: '', inStock: true, isVisible: true,
  };

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setModalOpen(true); };

  const openEdit = (product: ProductRecord) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      type: product.type,
      price: String(product.price),
      images: product.images?.length ? product.images : [product.image].filter(Boolean),
      description: product.description,
      sizes: (product.sizes ?? []).join(', '),
      inStock: product.inStock,
      isVisible: product.isVisible !== false,
    });
    setModalOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: form.name,
      category: form.category as ProductRecord['category'],
      type: form.type as ProductRecord['type'],
      price: Number(form.price) || 0,
      image: form.images[0] ?? '',
      images: form.images,
      description: form.description,
      sizes: form.sizes.split(',').map(size => size.trim()).filter(Boolean),
      inStock: form.inStock,
      isVisible: form.isVisible,
    };

    const saved = editingId ? await update(editingId, payload) : await create(payload);
    if (saved) setModalOpen(false);
  };

  const confirmRemoval = async () => {
    if (!confirmDelete) return;
    if (await remove(confirmDelete)) setConfirmDelete(null);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Produits</h2>
          <p className="text-sm text-white/60">Catalogue ({filtered.length})</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Recherche produit..." className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-9 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-club-yellow" />
          </div>
          <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} className="bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-xs text-white focus:outline-none focus:border-club-yellow">
            <option value="">Toutes catégories</option>
            {PRODUCT_CATEGORIES.map(c=> <option key={c}>{c}</option>)}
          </select>
          <button onClick={openCreate} className="px-5 py-2.5 rounded-full bg-club-yellow text-black text-xs font-semibold shadow hover:shadow-lg flex items-center gap-2 justify-center"><Plus size={14}/> Nouveau</button>
        </div>
      </div>
      <AdminError error={error ?? actionError} onRetry={reload} />

      {loading ? <AdminLoading label="Chargement du catalogue…" /> : (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map(pr => (
          <div key={pr.id} className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden group">
            <div className="aspect-video overflow-hidden">
              <img src={pr.image} alt={pr.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
            </div>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-white mb-1 line-clamp-1">{pr.name}</h3>
              <p className="text-xs text-white/60 mb-3">{pr.category} · {pr.type}</p>

              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={()=>void update(pr.id, { inStock: !pr.inStock })}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors disabled:opacity-50 ${pr.inStock ? 'bg-club-green/30 text-green-200 hover:bg-club-green/50' : 'bg-red-500/20 text-red-200 hover:bg-red-500/30'}`}
                >
                  {pr.inStock ? <PackageCheck size={11}/> : <PackageX size={11}/>}
                  {pr.inStock ? 'En stock' : 'Rupture'}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={()=>void update(pr.id, { isVisible: pr.isVisible === false })}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors disabled:opacity-50 ${pr.isVisible === false ? 'bg-white/10 text-white/70 hover:bg-white/20' : 'bg-club-yellow/20 text-club-yellow hover:bg-club-yellow/30'}`}
                >
                  {pr.isVisible === false ? <EyeOff size={11}/> : <Eye size={11}/>}
                  {pr.isVisible === false ? 'Masqué' : 'En vitrine'}
                </button>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-club-yellow font-semibold">{formatCFA(pr.price)}</span>
                <div className="space-x-2 whitespace-nowrap">
                  <button onClick={()=>openEdit(pr)} className="text-[10px] px-3 py-1 rounded-full bg-white/10 hover:bg-white/20">Éditer</button>
                  <button onClick={()=>setConfirmDelete(pr.id)} className="text-[10px] px-3 py-1 rounded-full bg-red-500/30 text-red-200 hover:bg-red-500/40">Supprimer</button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length===0 && (
          <div className="col-span-full"><AdminEmpty label={products.length === 0 ? 'Aucun produit en base' : 'Aucun produit ne correspond à la recherche'} /></div>
        )}
      </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-graphite/90 backdrop-blur-sm" onClick={()=>setModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white/[0.05] border border-white/10 rounded-2xl p-6">
            <button onClick={()=>setModalOpen(false)} className="absolute top-3 right-3 text-white/60 hover:text-white"><X size={16}/></button>
            <h3 className="text-lg font-semibold text-white mb-4">{editingId ? 'Modifier produit' : 'Nouveau produit'}</h3>
            <form onSubmit={submit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Nom" className="col-span-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-club-yellow outline-none" />
                <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-club-yellow outline-none">
                  {PRODUCT_CATEGORIES.map(c => <option key={c} value={c} className="bg-black">{c}</option>)}
                </select>
                <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-club-yellow outline-none">
                  {PRODUCT_TYPES.map(t => <option key={t} value={t} className="bg-black">{t}</option>)}
                </select>
                <input required type="number" min="0" step="500" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} placeholder="Prix en FCFA" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-club-yellow outline-none" />
                <input value={form.sizes} onChange={e=>setForm(f=>({...f,sizes:e.target.value}))} placeholder="Tailles : S, M, L" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-club-yellow outline-none" />
              </div>
              <GalleryField value={form.images} onChange={images=>setForm(f=>({...f,images}))} />
              <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Description" rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-club-yellow outline-none resize-none" />
              <div className="flex flex-wrap gap-4 items-center">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form.inStock} onChange={e=>setForm(f=>({...f,inStock:e.target.checked}))} />
                  <span>En stock</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form.isVisible} onChange={e=>setForm(f=>({...f,isVisible:e.target.checked}))} />
                  <span>Visible sur la boutique</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={()=>setModalOpen(false)} className="px-4 py-2 rounded-full bg-white/5 text-white/70 hover:bg-white/10">Annuler</button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-full bg-club-yellow text-black font-semibold disabled:opacity-60">{saving ? 'Enregistrement…' : editingId ? 'Mettre à jour' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <AdminConfirmDelete
          title="Supprimer produit"
          onCancel={()=>setConfirmDelete(null)}
          onConfirm={confirmRemoval}
          saving={saving}
        >
          Confirmez-vous la suppression ? Cette action est définitive.
        </AdminConfirmDelete>
      )}
    </div>
  );
};
export default Produits;
