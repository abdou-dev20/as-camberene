import config from '../config/env';
import SiteUser from '../models/SiteUser.model';
import { ensureAccount } from './accounts';

const TAG = '[admin par défaut]';

/**
 * Crée le compte décrit par DEFAULT_ADMIN_EMAIL et DEFAULT_ADMIN_PASSWORD,
 * ou le remet en conformité avec ces variables s'il existe déjà.
 *
 * Appelé à chaque démarrage de l'API, donc à chaque déploiement. Tant que ces
 * variables sont renseignées, le mot de passe configuré est la source de
 * vérité : une modification est appliquée au démarrage suivant.
 *
 * Une configuration incomplète ou invalide est signalée dans les journaux sans
 * empêcher le démarrage : le site ne doit pas tomber pour un compte à créer.
 */
export async function seedDefaultAdmin(): Promise<void> {
  const { email, password, name } = config.defaultAdmin;

  if (!email && !password) return;

  if (!email || !password) {
    console.error(
      `${TAG} DEFAULT_ADMIN_EMAIL et DEFAULT_ADMIN_PASSWORD vont ensemble : aucune synchronisation.`
    );
    return;
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await SiteUser.findOne({ email: normalizedEmail }).select('+password_hash');
    const passwordMatches = existing ? await existing.validatePassword(password) : false;

    const account = await ensureAccount({
      email,
      password,
      name: name || undefined,
      role: 'superadmin',
      resetPassword: Boolean(existing && !passwordMatches),
    });

    if (account.outcome === 'created') {
      console.log(`${TAG} ${account.email} créé (super administrateur).`);
    } else if (account.outcome === 'updated') {
      console.log(`${TAG} ${account.email} mis à jour (${account.changes.join(', ')}).`);
    } else {
      console.log(`${TAG} ${account.email} existe déjà : configuration déjà à jour.`);
    }
  } catch (error) {
    console.error(
      `${TAG} synchronisation impossible :`,
      error instanceof Error ? error.message : error
    );
  }
}
