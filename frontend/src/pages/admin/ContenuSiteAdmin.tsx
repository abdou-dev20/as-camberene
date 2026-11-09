import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Eye, EyeOff, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import useApiResource from '../../hooks/useApiResource';
import { publishSiteSettings } from '../../hooks/useSiteSettings';
import { getSiteSettings, saveSiteSettings } from '../../services/site/settings.service';
import { DEFAULT_SITE_SETTINGS, HOME_SECTIONS, SiteSettings } from '../../data/siteSettings';
import { AdminError, AdminLoading } from '../../components/admin/AdminFeedback';
import ImageField from '../../components/admin/ImageField';
import { ApiError } from '../../lib/api';

const OTHER_CONTENT = [
  { to: '/admin/carrousel', label: 'Carrousel de l’accueil' },
  { to: '/admin/articles', label: 'Actualités' },
  { to: '/admin/produits', label: 'Boutique — produits' },
  { to: '/admin/legendes', label: 'Légendes' },
  { to: '/admin/histoire', label: 'Histoire du club' },
  { to: '/admin/equipes', label: 'Équipes' },
  { to: '/admin/joueurs', label: 'Effectif' },
  { to: '/admin/statistiques', label: 'Statistiques des joueurs' },
  { to: '/admin/calendrier', label: 'Calendrier et résultats' },
  { to: '/admin/galerie', label: 'Galerie photos' },
  { to: '/admin/billetterie', label: 'Billetterie' },
];

const input =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-club-yellow';

const Card: React.FC<{ id?: string; title: string; hint?: string; children: React.ReactNode }> = ({ id, title, hint, children }) => (
  <section id={id} className="scroll-mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
    <h3 className="text-base font-semibold text-white">{title}</h3>
    {hint && <p className="mb-4 mt-1 text-xs text-white/50">{hint}</p>}
    <div className={hint ? '' : 'mt-4'}>{children}</div>
  </section>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs uppercase tracking-wide text-white/50">{label}</span>
    {children}
  </label>
);

const ContenuSiteAdmin: React.FC = () => {
  const { data: loaded, loading, error, reload } = useApiResource<SiteSettings | null>(
    (signal) => getSiteSettings(signal),
    null
  );

  const [form, setForm] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<ApiError | null>(null);
  const [saved, setSaved] = useState(false);

  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;
  useEffect(() => {
    if (loaded && !dirtyRef.current) setForm(loaded);
  }, [loaded]);

  useEffect(() => {
    if (!dirty) return undefined;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    const onLinkClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement | null)?.closest('a[href]');
      if (!link || link.getAttribute('href')?.startsWith('#')) return;
      if (!window.confirm('Vos modifications ne sont pas enregistrées. Quitter la page quand même ?')) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', onLinkClick, true);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('click', onLinkClick, true);
    };
  }, [dirty]);

  const update = (patch: Partial<SiteSettings>) => {
    setForm((current) => ({ ...current, ...patch }));
    setDirty(true);
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const result = await saveSiteSettings(form);
      setForm(result);
      publishSiteSettings(result);
      setDirty(false);
      setSaved(true);
    } catch (cause) {
      setSaveError(cause instanceof ApiError ? cause : new ApiError(0, 'Enregistrement impossible.'));
    } finally {
      setSaving(false);
    }
  };

  const restoreDefaults = () => {
    if (!window.confirm('Remettre tous les textes et réglages de cette page à leur valeur d’origine ? Il faudra encore enregistrer.')) return;
    update(DEFAULT_SITE_SETTINGS);
  };

  if (loading && !loaded) return <AdminLoading label="Chargement du contenu du site…" />;

  const { facts, partners, socials, banner, newsletter, contact, homeSections } = form;

  const saveButton = (
    <button
      type="button"
      onClick={() => void save()}
      disabled={saving || !dirty}
      className="flex shrink-0 items-center gap-2 rounded-full bg-club-yellow px-5 py-2 text-xs font-semibold text-black disabled:opacity-50"
    >
      <Save size={14} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
    </button>
  );

  const status = saveError
    ? <span className="text-red-300">Échec : {saveError.fullMessage}</span>
    : saved
      ? <span className="text-green-300">Enregistré : le site est à jour.</span>
      : dirty
        ? <span className="text-club-yellow">Modifications non enregistrées.</span>
        : <span>Aucune modification.</span>;

  return (
    <div className="max-w-4xl space-y-6 pb-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="mb-1 text-2xl font-bold text-white">Contenu du site</h2>
          <p className="text-sm text-white/60">
            Modifiez ou masquez tout ce qui s’affiche sur l’accueil et sur l’ensemble du site.
          </p>
          <p className="mt-2 text-xs">{status}</p>
        </div>
        {saveButton}
      </div>

      <AdminError error={error} onRetry={reload} />

      <Card
        title="Sections de l’accueil"
        hint="Masquer une section la retire de l’accueil sans rien effacer : elle revient dès qu’on la réaffiche."
      >
        <ul className="divide-y divide-white/5">
          {HOME_SECTIONS.map((section) => {
            const visible = homeSections[section.key];
            const external = section.manage.startsWith('/');
            return (
              <li key={section.key} className="flex items-center justify-between gap-3 py-2.5">
                <span className={`text-sm ${visible ? 'text-white' : 'text-white/40 line-through'}`}>{section.label}</span>
                <div className="flex items-center gap-2">
                  {external ? (
                    <Link to={section.manage} className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10">
                      Modifier le contenu <ArrowUpRight size={12} />
                    </Link>
                  ) : (
                    <a href={section.manage} className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10">
                      Modifier ci-dessous
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => update({ homeSections: { ...homeSections, [section.key]: !visible } })}
                    className={`flex w-28 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                      visible ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-white/50'
                    }`}
                  >
                    {visible ? <Eye size={13} /> : <EyeOff size={13} />}
                    {visible ? 'Affichée' : 'Masquée'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title="Bandeau du haut" hint="La ligne jaune tout en haut de chaque page (remplacée par les partenaires s’il y en a).">
        <input value={form.topBar} onChange={(e) => update({ topBar: e.target.value })} className={input} maxLength={200} />
      </Card>

      <Card id="facts" title="Chiffres du club" hint="Les grands chiffres de l’accueil. Jusqu’à 8.">
        <div className="space-y-2">
          {facts.map((fact, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={fact.value}
                placeholder="Valeur (ex. 1965)"
                maxLength={20}
                onChange={(e) => update({ facts: facts.map((f, i) => (i === index ? { ...f, value: e.target.value } : f)) })}
                className={`${input} w-32 shrink-0 font-bold text-club-yellow`}
              />
              <input
                value={fact.label}
                placeholder="Libellé (ex. Fondation)"
                maxLength={60}
                onChange={(e) => update({ facts: facts.map((f, i) => (i === index ? { ...f, label: e.target.value } : f)) })}
                className={input}
              />
              <button type="button" onClick={() => update({ facts: facts.filter((_, i) => i !== index) })} className="rounded-lg bg-red-500/20 px-3 text-red-200 hover:bg-red-500/30" aria-label="Supprimer ce chiffre">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {facts.length < 8 && (
            <button type="button" onClick={() => update({ facts: [...facts, { value: '', label: '' }] })} className="flex items-center gap-1.5 rounded-full bg-white/5 px-4 py-2 text-xs text-white/70 hover:bg-white/10">
              <Plus size={13} /> Ajouter un chiffre
            </button>
          )}
        </div>
      </Card>

      <Card id="banner" title="Bannière « Effectif »" hint="La grande photo de l’accueil, avec son surtitre et son titre.">
        <div className="space-y-3">
          <ImageField value={banner.image} onChange={(image) => update({ banner: { ...banner, image } })} label="Photo de la bannière" />
          <Field label="Surtitre (jaune)">
            <input value={banner.kicker} maxLength={80} onChange={(e) => update({ banner: { ...banner, kicker: e.target.value } })} className={input} />
          </Field>
          <Field label="Titre">
            <input value={banner.title} maxLength={200} onChange={(e) => update({ banner: { ...banner, title: e.target.value } })} className={input} />
          </Field>
        </div>
      </Card>

      <Card title="Partenaires" hint="Logos affichés en haut de chaque page et sous le carrousel. Sans partenaire, le bandeau du haut affiche son texte.">
        <div className="space-y-3">
          {partners.map((partner, index) => {
            const set = (patch: Partial<typeof partner>) =>
              update({ partners: partners.map((p, i) => (i === index ? { ...p, ...patch } : p)) });
            return (
              <div key={index} className="space-y-2 rounded-xl border border-white/10 p-3">
                <div className="flex gap-2">
                  <input value={partner.name} placeholder="Nom" maxLength={80} onChange={(e) => set({ name: e.target.value })} className={input} />
                  <button type="button" onClick={() => update({ partners: partners.filter((_, i) => i !== index) })} className="rounded-lg bg-red-500/20 px-3 text-red-200 hover:bg-red-500/30" aria-label="Supprimer ce partenaire">
                    <Trash2 size={14} />
                  </button>
                </div>
                <ImageField value={partner.logo} onChange={(logo) => set({ logo })} label="Logo" />
                <input value={partner.href} placeholder="Lien du site (facultatif)" maxLength={500} onChange={(e) => set({ href: e.target.value })} className={input} />
              </div>
            );
          })}
          {partners.length < 12 && (
            <button type="button" onClick={() => update({ partners: [...partners, { name: '', logo: '', href: '' }] })} className="flex items-center gap-1.5 rounded-full bg-white/5 px-4 py-2 text-xs text-white/70 hover:bg-white/10">
              <Plus size={13} /> Ajouter un partenaire
            </button>
          )}
        </div>
      </Card>

      <Card title="Réseaux sociaux" hint="Liens de l’en-tête, de l’accueil et du pied de page. Laissez vide pour masquer une icône.">
        <div className="grid gap-3 sm:grid-cols-2">
          {(['facebook', 'instagram', 'x', 'youtube'] as const).map((network) => (
            <Field key={network} label={network === 'x' ? 'X (Twitter)' : network[0].toUpperCase() + network.slice(1)}>
              <input value={socials[network]} maxLength={500} placeholder="https://…" onChange={(e) => update({ socials: { ...socials, [network]: e.target.value } })} className={input} />
            </Field>
          ))}
        </div>
      </Card>

      <Card title="Bloc « Restez informé »" hint="L’appel à l’inscription en bas de chaque page.">
        <div className="space-y-3">
          <Field label="Titre">
            <input value={newsletter.title} maxLength={80} onChange={(e) => update({ newsletter: { ...newsletter, title: e.target.value } })} className={input} />
          </Field>
          <Field label="Texte">
            <textarea value={newsletter.text} maxLength={300} rows={2} onChange={(e) => update({ newsletter: { ...newsletter, text: e.target.value } })} className={`${input} resize-none`} />
          </Field>
        </div>
      </Card>

      <Card title="Coordonnées" hint="Affichées dans le pied de page. Un champ vide est masqué.">
        <div className="space-y-3">
          <Field label="Adresse">
            <textarea value={contact.address} maxLength={300} rows={2} onChange={(e) => update({ contact: { ...contact, address: e.target.value } })} className={`${input} resize-none`} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Téléphone">
              <input value={contact.phone} maxLength={40} onChange={(e) => update({ contact: { ...contact, phone: e.target.value } })} className={input} />
            </Field>
            <Field label="Email">
              <input value={contact.email} maxLength={120} type="email" onChange={(e) => update({ contact: { ...contact, email: e.target.value } })} className={input} />
            </Field>
          </div>
        </div>
      </Card>

      <Card title="Mention du pied de page" hint="Le texte après « © 1965-année », tout en bas de chaque page.">
        <textarea value={form.footerNote} maxLength={500} rows={2} onChange={(e) => update({ footerNote: e.target.value })} className={`${input} resize-none`} />
      </Card>

      <Card title="Autres contenus du site" hint="Ces rubriques ont leur propre onglet, où l’on ajoute, modifie et supprime chaque élément.">
        <div className="grid gap-2 sm:grid-cols-2">
          {OTHER_CONTENT.map((item) => (
            <Link key={item.to} to={item.to} className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10">
              {item.label}
              <ArrowUpRight size={14} className="text-club-yellow" />
            </Link>
          ))}
        </div>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-graphite/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-end gap-3 px-6 py-3">
          <span className="mr-auto text-xs text-white/50">{status}</span>
          <button type="button" onClick={restoreDefaults} className="flex items-center gap-1.5 rounded-full bg-white/5 px-4 py-2 text-xs text-white/70 hover:bg-white/10">
            <RotateCcw size={13} /> Valeurs d’origine
          </button>
          {saveButton}
        </div>
      </div>
    </div>
  );
};

export default ContenuSiteAdmin;
