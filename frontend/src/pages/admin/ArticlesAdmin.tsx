import React, { useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import useEditableResource from '../../hooks/useEditableResource';
import { articles as articlesApi, ArticleRecord } from '../../services/site/content.service';
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminFeedback';
import ImageField from '../../components/admin/ImageField';
import { DEFAULT_IMAGE_POSITION } from '../../components/admin/ImagePositionField';
import { ARTICLE_CATEGORIES } from '../../types';
import AdminConfirmDelete from '../../components/admin/AdminConfirmDelete';
import { formatDate } from '../../lib/dates';

const ArticlesAdmin: React.FC = () => {
  const {
    items: articles,
    loading,
    error,
    actionError,
    saving,
    reload,
    create,
    update,
    remove,
  } = useEditableResource<ArticleRecord>(articlesApi);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', category: 'Club', excerpt: '', content: '', image: '', imagePosition: DEFAULT_IMAGE_POSITION, author: '', status: 'draft' });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(() => articles
    .filter(a => {
      const q = query.toLowerCase();
      const okQ = !q || a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q);
      const okCat = !categoryFilter || a.category === categoryFilter;
      return okQ && okCat;
    })
    .sort((a,b)=> new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
  , [articles, query, categoryFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ title: '', category: 'Club', excerpt: '', content: '', image: '', imagePosition: DEFAULT_IMAGE_POSITION, author: '', status: 'draft' });
    setModalOpen(true);
  };

  const openEdit = (article: ArticleRecord) => {
    setEditingId(article.id);
    setForm({
      title: article.title,
      category: article.category,
      excerpt: article.excerpt,
      content: article.content,
      image: article.image || '',
      imagePosition: article.imagePosition || DEFAULT_IMAGE_POSITION,
      author: article.author || '',
      status: article.status || 'published',
    });
    setModalOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      title: form.title,
      category: form.category as ArticleRecord['category'],
      excerpt: form.excerpt,
      content: form.content || form.excerpt,
      image: form.image,
      imagePosition: form.imagePosition,
      author: form.author || 'ASC Cambérène',
      status: form.status as 'draft' | 'published',
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
          <h2 className="text-2xl font-bold text-white mb-1">Actualités</h2>
          <p className="text-sm text-white/60">Contenu ({filtered.length})</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Recherche article..." className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-9 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-club-yellow" />
          </div>
          <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} className="bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-xs text-white focus:outline-none focus:border-club-yellow">
            <option value="">Toutes catégories</option>
            {ARTICLE_CATEGORIES.map(c=> <option key={c}>{c}</option>)}
          </select>
          <button onClick={openCreate} className="px-5 py-2.5 rounded-full bg-club-yellow text-black text-xs font-semibold shadow hover:shadow-lg flex items-center gap-2 justify-center"><Plus size={14}/> Nouvel</button>
        </div>
      </div>
      <AdminError error={error ?? actionError} onRetry={reload} />

      {loading ? (
        <AdminLoading label="Chargement des actualités…" />
      ) : (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="text-white/60 uppercase tracking-wide text-xs">
            <tr>
              <th className="py-3 px-4 text-left">Titre</th>
              <th className="py-3 px-4 text-left">Catégorie</th>
              <th className="py-3 px-4 text-left">Date</th>
              <th className="py-3 px-4 text-left">Statut</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-white/70">
            {filtered.map(a => (
              <tr key={a.id} className="hover:bg-white/5">
                <td className="py-3 px-4">
                  <p className="font-medium text-white line-clamp-1">{a.title}</p>
                  <p className="text-xs text-white/40 line-clamp-1">{a.excerpt}</p>
                </td>
                <td className="py-3 px-4"><span className="px-2 py-1 rounded-full bg-club-yellow/20 text-club-yellow text-[10px] font-semibold">{a.category}</span></td>
                <td className="py-3 px-4 text-xs">{formatDate(a.publishedAt)}</td>
                <td className="py-3 px-4 text-xs">
                  {a.status === 'draft' ? (
                    <span className="px-2 py-1 rounded-full bg-white/10 text-white/70 text-[10px] font-semibold">Brouillon</span>
                  ) : (
                    <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-300 text-[10px] font-semibold">Publié</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button onClick={()=>openEdit(a)} className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20">Éditer</button>
                  <button onClick={()=>setConfirmDelete(a.id)} className="text-xs px-3 py-1.5 rounded-full bg-red-500/30 text-red-200 hover:bg-red-500/40">Supprimer</button>
                </td>
              </tr>
            ))}
            {filtered.length===0 && (
              <tr><td colSpan={5} className="p-0"><AdminEmpty label={articles.length === 0 ? 'Aucune actualité en base' : 'Aucun article ne correspond à la recherche'} /></td></tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-graphite/90 backdrop-blur-sm" onClick={()=>setModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white/[0.05] border border-white/10 rounded-2xl p-6">
            <button onClick={()=>setModalOpen(false)} className="absolute top-3 right-3 text-white/60 hover:text-white"><X size={16}/></button>
            <h3 className="text-lg font-semibold text-white mb-4">{editingId ? "Modifier l'actualité" : 'Nouvelle actualité'}</h3>
            <form onSubmit={submit} className="space-y-4 text-xs">
              <input required value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Titre" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-club-yellow outline-none" />
              <select required value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-club-yellow outline-none">
                {ARTICLE_CATEGORIES.map(c => <option key={c} value={c} className="bg-black">{c}</option>)}
              </select>
              <ImageField value={form.image} onChange={value=>setForm(f=>({...f,image:value}))} label="Visuel de l'article" />
              <input value={form.author} onChange={e=>setForm(f=>({...f,author:e.target.value}))} placeholder="Auteur" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-club-yellow outline-none" />
              <textarea value={form.excerpt} onChange={e=>setForm(f=>({...f,excerpt:e.target.value}))} placeholder="Résumé (affiché dans la liste des actualités)" rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-club-yellow outline-none resize-none" />
              <textarea value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} placeholder="Article complet" rows={6} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-club-yellow outline-none resize-none" />
              <div className="flex flex-wrap gap-4 items-center text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="radio" checked={form.status==='draft'} onChange={()=>setForm(f=>({...f,status:'draft'}))} />
                  <span>Brouillon</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="radio" checked={form.status==='published'} onChange={()=>setForm(f=>({...f,status:'published'}))} />
                  <span>Publié</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={()=>setModalOpen(false)} className="px-4 py-2 rounded-full bg-white/5 text-white/70 hover:bg-white/10">Annuler</button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-full bg-club-yellow text-black font-semibold disabled:opacity-60">{saving ? 'Enregistrement…' : editingId ? 'Mettre à jour' : (form.status==='draft' ? 'Enregistrer' : 'Publier')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <AdminConfirmDelete
          title="Supprimer article"
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
export default ArticlesAdmin;
