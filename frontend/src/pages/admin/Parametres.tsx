import React from 'react';
import { ExternalLink, Info } from 'lucide-react';
import { getClub } from '../../services/fconnect/club.service';
import useApiResource from '../../hooks/useApiResource';
import { isFconnectConfigured } from '../../config/env';
import { FcClub } from '../../types/fconnect';
import { AdminError, AdminLoading } from '../../components/admin/AdminFeedback';
import { useAuth } from '../../hooks/useAuth';

const Field: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
  <div>
    <p className="mb-2 text-xs uppercase tracking-wide text-white/60">{label}</p>
    <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
      {value || <span className="text-white/40">Non renseigné</span>}
    </p>
  </div>
);

const Parametres: React.FC = () => {
  const { user } = useAuth();
  const { data: club, loading, error, reload } = useApiResource<FcClub | null>(
    (signal) => getClub(signal),
    null,
    { enabled: isFconnectConfigured() }
  );

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="mb-1 text-2xl font-bold text-white">Paramètres</h2>
        <p className="text-sm text-white/60">Où se modifie quoi</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">
          Votre compte
        </h3>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Nom" value={user?.name} />
          <Field label="Email" value={user?.email} />
        </div>
        <p className="mt-4 text-xs text-white/40">
          Les comptes d’administration se créent depuis le serveur du site :{' '}
          <code className="text-white/60">cd server &amp;&amp; npm run create:admin -- &lt;email&gt;</code>
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
            Identité du club
          </h3>
          <a
            href="https://fconnect.sn"
            target="_blank"
            rel="noreferrer"
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] text-white hover:bg-white/20"
          >
            Modifier dans fconnect <ExternalLink size={12} />
          </a>
        </div>

        <AdminError error={error} onRetry={reload} />

        {!isFconnectConfigured() ? (
          <div className="flex items-start gap-3 rounded-xl border border-club-yellow/20 bg-club-yellow/5 px-4 py-3 text-xs text-white/70">
            <Info size={16} className="mt-0.5 shrink-0 text-club-yellow" />
            <p>
              Aucun club n’est relié. Créer le compte club dans fconnect, puis reporter son
              identifiant dans <code className="text-white/60">VITE_CLUB_ID</code>.
            </p>
          </div>
        ) : loading ? (
          <AdminLoading label="Lecture du profil du club…" />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Nom du club" value={club?.name} />
            <Field label="Année de fondation" value={club?.founded_year} />
            <Field label="Email de contact" value={club?.contact_email} />
            <Field label="Téléphone" value={club?.contact_phone} />
            <Field label="Ville" value={club?.city} />
            <Field label="Pays" value={club?.country} />
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-xs text-white/60">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">
          Répartition des responsabilités
        </h3>
        <ul className="space-y-2">
          <li>
            <span className="text-white">Sur ce site</span> — actualités, boutique, légendes,
            histoire, comptes des supporters.
          </li>
          <li>
            <span className="text-white">Dans fconnect</span> — identité du club, équipes,
            effectif, matchs, et toute la gestion sportive.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Parametres;
