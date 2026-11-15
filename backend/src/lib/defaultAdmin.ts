import config from '../config/env';
import SiteUser from '../models/SiteUser.model';
import { ensureAccount } from './accounts';

const TAG = '[admin par défaut]';

/**
 * Crée le compte décrit par DEFAULT_ADMIN_EMAIL et DEFAULT_ADMIN_PASSWORD,
 * avec le profil super administrateur, s'il n'existe pas encore.
 *
 * Appelé à chaque démarrage de l'API, donc à chaque déploiement. Un compte
 * déjà en base n'est jamais modifié : un mot de passe changé depuis le site
 * survit aux redéploiements, et ces variables ne servent qu'à amorcer une base
 * vide.
 *
 * Une configuration incomplète ou invalide est signalée dans les journaux sans
 * empêcher le démarrage : le site ne doit pas tomber pour un compte à créer.
 */
export async function seedDefaultAdmin(): Promise<void> {
  const { email, password, name } = config.defaultAdmin;

  if (!email && !password) return;

  if (!email || !password) {
    console.error(
      `${TAG} DEFAULT_ADMIN_EMAIL et DEFAULT_ADMIN_PASSWORD vont ensemble : compte non créé.`
    );
    return;
  }

  try {
    if (await SiteUser.exists({ email: email.toLowerCase() })) {
      console.log(`${TAG} ${email} existe déjà : laissé tel quel.`);
      return;
    }

    const account = await ensureAccount({
      email,
      password,
      name: name || undefined,
      role: 'superadmin',
    });
    console.log(`${TAG} ${account.email} créé (super administrateur).`);
  } catch (error) {
    console.error(
      `${TAG} création impossible :`,
      error instanceof Error ? error.message : error
    );
  }
}
