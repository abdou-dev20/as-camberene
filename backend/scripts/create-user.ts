import { connectDatabase, disconnectDatabase } from '../src/config/database';
import SiteUser from '../src/models/SiteUser.model';
import { ASSIGNABLE_ROLES, ROLE_LABELS, UserRole } from '../src/lib/roles';
import { MIN_PASSWORD_LENGTH, generatePassword } from './lib/accounts';

function readOption(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  return value && !value.startsWith('--') ? value : undefined;
}

const hasFlag = (name: string): boolean => process.argv.includes(`--${name}`);

async function main(): Promise<number> {
  const email = process.argv
    .slice(2)
    .find((arg) => !arg.startsWith('--') && arg.includes('@'))
    ?.toLowerCase();

  if (!email) {
    console.error(
      "Usage : npm run create:user -- <email> --role <profil> [--name '…'] [--password '…'] [--promote]"
    );
    console.error(`Profils : ${ASSIGNABLE_ROLES.join(', ')}`);
    return 1;
  }

  const role = (readOption('role') ?? 'admin') as UserRole;
  if (!ASSIGNABLE_ROLES.includes(role)) {
    console.error(`Profil inconnu : ${role}. Profils : ${ASSIGNABLE_ROLES.join(', ')}`);
    return 1;
  }

  const providedPassword = readOption('password');
  const password = providedPassword ?? generatePassword();
  const name = readOption('name') ?? ROLE_LABELS[role];

  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`);
    return 1;
  }

  await connectDatabase();

  try {
    const existing = await SiteUser.findOne({ email });

    if (existing) {
      if (existing.role === role && existing.is_active) {
        console.log(`${email} est déjà ${ROLE_LABELS[role]}. Rien à faire.`);
        return 0;
      }

      if (!hasFlag('promote')) {
        console.log(
          `${email} existe déjà comme ${ROLE_LABELS[existing.role]}`
          + `${existing.is_active ? '' : ' (désactivé)'}.`
        );
        console.log('Relancer avec --promote pour changer son profil et le réactiver.');
        return 1;
      }

      const before = existing.role;
      existing.role = role;
      existing.is_active = true;

      if (providedPassword) existing.password_hash = providedPassword;
      await existing.save();

      console.log(`${email} : ${ROLE_LABELS[before]} → ${ROLE_LABELS[role]}, compte actif.`);
      console.log(
        providedPassword ? `Nouveau mot de passe : ${providedPassword}` : 'Mot de passe inchangé.'
      );
      return 0;
    }

    const user = await SiteUser.create({
      name,
      email,
      password_hash: password, // haché par le hook du modèle
      role,
    });

    console.log(`Compte créé — ${ROLE_LABELS[role]}.\n`);
    console.log(`  email        : ${user.email}`);
    console.log(`  mot de passe : ${password}`);
    console.log(`  nom          : ${user.name}`);
    if (!providedPassword) {
      console.log("\nMot de passe tiré au sort : le noter, il n'est pas rejouable.");
    }
    console.log('\nConnexion sur /login, puis administration sur /admin.');
    if (role === 'superadmin') {
      console.log('Les autres comptes se créent depuis /admin/utilisateurs.');
    }
    return 0;
  } finally {
    await disconnectDatabase();
  }
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error('Échec :', error instanceof Error ? error.message : error);
    process.exit(1);
  });
