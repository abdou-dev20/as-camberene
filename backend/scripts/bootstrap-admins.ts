import readline from 'readline';

import { connectDatabase, disconnectDatabase, safeMongoUri } from '../src/config/database';
import { ROLE_LABELS, UserRole } from '../src/lib/roles';
import {
  EnsureAccountResult,
  MIN_PASSWORD_LENGTH,
  ensureAccount,
  looksLikeEmail,
} from './lib/accounts';

const DEFAULT_DOMAIN = 'ascamberene.sn';

function readOption(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  return value && !value.startsWith('--') ? value : undefined;
}

const hasFlag = (name: string): boolean => process.argv.includes(`--${name}`);

async function ask(question: string, fallback: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await new Promise<string>((resolve) =>
      rl.question(`${question} [${fallback}] `, resolve)
    );
    return answer.trim() || fallback;
  } finally {
    rl.close();
  }
}

interface Target {
  role: UserRole;
  email: string;
  password?: string;
}

async function collectTargets(): Promise<Target[] | null> {
  const interactive = Boolean(process.stdin.isTTY) && !hasFlag('yes');

  let superadmin = readOption('superadmin');
  let admin = readOption('admin');

  if (!superadmin && interactive) {
    superadmin = await ask('Email du super administrateur ?', `direction@${DEFAULT_DOMAIN}`);
  }
  if (!admin && interactive) {
    admin = await ask("Email de l'administrateur ?", `admin@${DEFAULT_DOMAIN}`);
  }

  if (!superadmin) {
    console.error(
      'Aucune adresse fournie et aucun terminal pour la demander.\n'
      + 'Usage : npm run bootstrap:admins -- --superadmin <email> [--admin <email>]'
    );
    return null;
  }

  const targets: Target[] = [
    { role: 'superadmin', email: superadmin, password: readOption('superadmin-password') },
  ];

  if (admin) {
    targets.push({ role: 'admin', email: admin, password: readOption('admin-password') });
  }

  const invalid = targets.filter((target) => !looksLikeEmail(target.email.trim().toLowerCase()));
  if (invalid.length > 0) {
    console.error(`Email invalide : ${invalid.map((target) => target.email).join(', ')}`);
    return null;
  }

  const emails = targets.map((target) => target.email.trim().toLowerCase());
  if (new Set(emails).size !== emails.length) {
    console.error(
      'Le super administrateur et l\'administrateur doivent avoir deux adresses distinctes.'
    );
    return null;
  }

  const tooShort = targets.find(
    (target) => target.password && target.password.length < MIN_PASSWORD_LENGTH
  );
  if (tooShort) {
    console.error(
      `Le mot de passe de ${tooShort.email} doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`
    );
    return null;
  }

  return targets;
}

function report(result: EnsureAccountResult): void {
  const label = ROLE_LABELS[result.role];

  if (result.outcome === 'unchanged') {
    console.log(`[=] ${result.email} — ${label}, déjà en place. Mot de passe inchangé.`);
    return;
  }

  const verb = result.outcome === 'created' ? 'Compte créé' : 'Compte mis à jour';
  console.log(`[+] ${result.email} — ${label}. ${verb}.`);
  console.log(`    nom          : ${result.name}`);
  if (result.changes.length > 0) {
    console.log(`    changements  : ${result.changes.join(', ')}`);
  }
  if (result.password) {
    console.log(`    mot de passe : ${result.password}`);
  }
}

async function main(): Promise<number> {
  const targets = await collectTargets();
  if (!targets) return 1;

  const resetPassword = hasFlag('reset-passwords');

  console.log(`Base : ${safeMongoUri()}\n`);
  await connectDatabase();

  try {
    const results: EnsureAccountResult[] = [];
    for (const target of targets) {
      results.push(
        await ensureAccount({
          email: target.email,
          role: target.role,
          password: target.password,
          resetPassword: resetPassword || Boolean(target.password),
        })
      );
    }

    results.forEach(report);

    const withPassword = results.filter((result) => result.password);
    if (withPassword.length > 0) {
      console.log(
        "\nCes mots de passe ne seront plus affichés : ils ne sont stockés que hachés."
      );
      console.log('Les noter, puis les faire changer à la première connexion.');
    }

    const skipped = results.filter((result) => result.outcome === 'unchanged');
    if (skipped.length > 0 && !resetPassword) {
      console.log(
        '\nUn compte déjà en place garde son mot de passe. Relancer avec'
        + ' --reset-passwords pour en tirer de nouveaux.'
      );
    }

    console.log('\nConnexion sur /login, puis administration sur /admin.');
    console.log('Les autres comptes se créent ensuite depuis /admin/utilisateurs.');
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
