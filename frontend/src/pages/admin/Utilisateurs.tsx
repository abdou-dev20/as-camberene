import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, KeyRound, Plus, Search, Trash2, UserCog, X } from 'lucide-react';
import { ASSIGNABLE_ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS, UserRole } from '../../lib/roles';
import { ApiError } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { SiteUser } from '../../services/site/auth.service';
import {
  createUser,
  deleteUser,
  listUsers,
  resetUserPassword,
  updateUser,
} from '../../services/site/users.service';
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminFeedback';
import AdminConfirmDelete from '../../components/admin/AdminConfirmDelete';
import { formatShortDate } from '../../lib/dates';

const ROLE_BADGE: Record<UserRole, string> = {
  superadmin: 'bg-club-yellow text-black',
  admin: 'bg-club-green text-white',
  journalist: 'bg-white/15 text-white',
  'shop-admin': 'bg-white/15 text-white',
  subscriber: 'bg-white/5 text-white/60',
};

const EMPTY_FORM = { name: '', email: '', role: 'journalist' as UserRole, password: '' };

const Utilisateurs: React.FC = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<SiteUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [revealed, setRevealed] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<SiteUser | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        setUsers(await listUsers({ search, role: roleFilter }, signal));
      } catch (cause) {
        if (cause instanceof ApiError) setError(cause);
      } finally {
        setLoading(false);
      }
    },
    [search, roleFilter]
  );

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => void load(controller.signal), 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [load]);

  const counts = useMemo(() => {
    const byRole = {} as Record<UserRole, number>;
    users.forEach((entry) => {
      byRole[entry.role] = (byRole[entry.role] ?? 0) + 1;
    });
    return byRole;
  }, [users]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const { user, generatedPassword } = await createUser({
        name: form.name,
        email: form.email,
        role: form.role,
        password: form.password || undefined,
      });
      if (generatedPassword) setRevealed({ email: user.email, password: generatedPassword });
      setForm(EMPTY_FORM);
      setFormOpen(false);
      await load();
    } catch (cause) {
      setFormError(cause instanceof ApiError ? cause.fullMessage : 'Création impossible.');
    } finally {
      setSaving(false);
    }
  };

  const patch = async (entry: SiteUser, payload: { role?: UserRole; is_active?: boolean }) => {
    setError(null);
    try {
      const updated = await updateUser(entry.id, payload);
      setUsers((current) => current.map((row) => (row.id === updated.id ? updated : row)));
    } catch (cause) {
      if (cause instanceof ApiError) setError(cause);
    }
  };

  const handleReset = async (entry: SiteUser) => {
    setError(null);
    try {
      const { generatedPassword } = await resetUserPassword(entry.id);
      if (generatedPassword) setRevealed({ email: entry.email, password: generatedPassword });
    } catch (cause) {
      if (cause instanceof ApiError) setError(cause);
    }
  };

  const handleDelete = async (entry: SiteUser) => {
    setError(null);
    try {
      await deleteUser(entry.id);
      setUsers((current) => current.filter((row) => row.id !== entry.id));
      setConfirmDelete(null);
    } catch (cause) {
      if (cause instanceof ApiError) setError(cause);
      setConfirmDelete(null);
    }
  };

  const copyPassword = async () => {
    if (!revealed) return;
    try {
      await navigator.clipboard.writeText(revealed.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-white">
            <UserCog size={22} className="text-club-yellow" />
            Comptes
          </h2>
          <p className="text-sm text-white/60">
            Ouvrez les accès et attribuez les profils. Vous êtes le seul à pouvoir le faire.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormOpen(!formOpen);
            setFormError('');
          }}
          className="flex items-center gap-2 rounded-full bg-club-yellow px-5 py-2.5 text-xs font-bold uppercase text-black transition-opacity hover:opacity-80"
        >
          {formOpen ? <X size={15} /> : <Plus size={15} />}
          {formOpen ? 'Annuler' : 'Nouveau compte'}
        </button>
      </div>

      <AdminError error={error} onRetry={() => void load()} />

      {revealed && (
        <div className="rounded-2xl border border-club-yellow/40 bg-club-yellow/10 p-5">
          <p className="text-sm font-bold uppercase text-club-yellow">
            Mot de passe de {revealed.email}
          </p>
          <p className="mt-1 text-xs text-white/60">
            Il n'est pas conservé en clair : transmettez-le maintenant, il ne sera plus affiché.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <code className="rounded-xl bg-black/40 px-4 py-2.5 font-mono text-base text-white">
              {revealed.password}
            </code>
            <button
              type="button"
              onClick={copyPassword}
              className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copié' : 'Copier'}
            </button>
            <button
              type="button"
              onClick={() => setRevealed(null)}
              className="rounded-full px-4 py-2 text-xs font-semibold text-white/60 hover:text-white"
            >
              J'ai noté
            </button>
          </div>
        </div>
      )}

      {formOpen && (
        <form
          onSubmit={handleCreate}
          className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:grid-cols-2"
        >
          <div>
            <label htmlFor="new-name" className="mb-2 block text-xs uppercase tracking-wide text-white/60">
              Nom
            </label>
            <input
              id="new-name"
              type="text"
              required
              minLength={2}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-club-yellow"
            />
          </div>

          <div>
            <label htmlFor="new-email" className="mb-2 block text-xs uppercase tracking-wide text-white/60">
              Email
            </label>
            <input
              id="new-email"
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-club-yellow"
            />
          </div>

          <div>
            <label htmlFor="new-role" className="mb-2 block text-xs uppercase tracking-wide text-white/60">
              Profil
            </label>
            <select
              id="new-role"
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-club-yellow"
            >
              {ASSIGNABLE_ROLES.map((role) => (
                <option key={role} value={role} className="bg-graphite">
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-white/40">{ROLE_DESCRIPTIONS[form.role]}</p>
          </div>

          <div>
            <label htmlFor="new-password" className="mb-2 block text-xs uppercase tracking-wide text-white/60">
              Mot de passe <span className="text-white/30">— facultatif</span>
            </label>
            <input
              id="new-password"
              type="text"
              minLength={10}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Laisser vide : le serveur en génère un"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-club-yellow"
            />
          </div>

          {formError && <p className="text-sm text-red-400 sm:col-span-2">{formError}</p>}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-club-yellow px-6 py-2.5 text-xs font-bold uppercase text-black disabled:opacity-50"
            >
              {saving ? 'Création…' : 'Créer le compte'}
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <label htmlFor="user-search" className="sr-only">Rechercher un compte</label>
          <input
            id="user-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher par nom ou email"
            className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-11 pr-4 text-sm text-white placeholder-white/40 outline-none focus:border-club-yellow"
          />
        </div>
        <div>
          <label htmlFor="user-role-filter" className="sr-only">Filtrer par profil</label>
          <select
            id="user-role-filter"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as UserRole | '')}
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white outline-none focus:border-club-yellow"
          >
            <option value="" className="bg-graphite">Tous les profils</option>
            {ASSIGNABLE_ROLES.map((role) => (
              <option key={role} value={role} className="bg-graphite">
                {ROLE_LABELS[role]}
                {counts[role] ? ` (${counts[role]})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <AdminLoading label="Chargement des comptes…" />
      ) : users.length === 0 ? (
        <AdminEmpty label="Aucun compte ne correspond." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/50">
              <tr>
                <th className="px-5 py-3 font-semibold">Compte</th>
                <th className="px-5 py-3 font-semibold">Profil</th>
                <th className="px-5 py-3 font-semibold">État</th>
                <th className="px-5 py-3 font-semibold">Dernière connexion</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((entry) => {
                const isSelf = String(currentUser?.id) === entry.id;
                return (
                  <tr key={entry.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">
                        {entry.name}
                        {isSelf && <span className="ml-2 text-xs text-club-yellow">(vous)</span>}
                      </p>
                      <p className="text-xs text-white/50">{entry.email}</p>
                    </td>

                    <td className="px-5 py-4">
                      {isSelf ? (

                        <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase ${ROLE_BADGE[entry.role]}`}>
                          {ROLE_LABELS[entry.role]}
                        </span>
                      ) : (
                        <select
                          aria-label={`Profil de ${entry.name}`}
                          value={entry.role}
                          onChange={(event) => void patch(entry, { role: event.target.value as UserRole })}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:border-club-yellow"
                        >
                          {ASSIGNABLE_ROLES.map((role) => (
                            <option key={role} value={role} className="bg-graphite">
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        disabled={isSelf}
                        onClick={() => void patch(entry, { is_active: !entry.is_active })}
                        className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 ${
                          entry.is_active ? 'bg-club-green text-white' : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {entry.is_active ? 'Actif' : 'Désactivé'}
                      </button>
                    </td>

                    <td className="px-5 py-4 text-xs text-white/50">
                      {formatShortDate(entry.last_login_at, 'Jamais')}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void handleReset(entry)}
                          title="Réinitialiser le mot de passe"
                          className="rounded-full bg-white/5 p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <KeyRound size={15} />
                        </button>
                        <button
                          type="button"
                          disabled={isSelf}
                          onClick={() => setConfirmDelete(entry)}
                          title="Supprimer le compte"
                          className="rounded-full bg-white/5 p-2 text-white/60 transition-colors hover:bg-red-500/20 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {confirmDelete && (
        <AdminConfirmDelete
          title="Supprimer ce compte ?"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => void handleDelete(confirmDelete)}
          backdropClassName="absolute inset-0 bg-black/70"
          cardClassName="relative w-full max-w-sm rounded-2xl border border-white/10 bg-graphite p-6"
          cancelClassName="rounded-full bg-white/5 px-4 py-2 text-white/70 hover:bg-white/10"
          confirmClassName="rounded-full bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600"
        >
          <p className="mb-5 text-xs text-white/60">
            {confirmDelete.name} ({confirmDelete.email}) perdra son accès immédiatement. Pour un
            retrait temporaire, préférez la désactivation.
          </p>
        </AdminConfirmDelete>
      )}
    </div>
  );
};

export default Utilisateurs;
