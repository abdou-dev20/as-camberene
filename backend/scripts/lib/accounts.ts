import crypto from 'crypto';

import SiteUser from '../../src/models/SiteUser.model';
import { ROLE_LABELS, UserRole } from '../../src/lib/roles';

export const MIN_PASSWORD_LENGTH = 10;

export function generatePassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const pick = (n: number) =>
    Array.from(crypto.randomBytes(n))
      .map((byte) => alphabet[byte % alphabet.length])
      .join('');
  return `${pick(4)}-${pick(4)}-${pick(4)}!`;
}

export const looksLikeEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

export type AccountOutcome = 'created' | 'updated' | 'unchanged';

export interface EnsureAccountInput {
  email: string;
  role: UserRole;
  name?: string;
  password?: string;
  resetPassword?: boolean;
}

export interface EnsureAccountResult {
  outcome: AccountOutcome;
  email: string;
  name: string;
  role: UserRole;
  previousRole?: UserRole;
  password?: string;
  changes: string[];
}

export async function ensureAccount(input: EnsureAccountInput): Promise<EnsureAccountResult> {
  const email = input.email.trim().toLowerCase();
  const name = input.name?.trim() || ROLE_LABELS[input.role];

  if (!looksLikeEmail(email)) {
    throw new Error(`Email invalide : ${input.email}`);
  }
  if (input.password && input.password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Le mot de passe de ${email} doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`
    );
  }

  const existing = await SiteUser.findOne({ email });

  if (!existing) {
    const password = input.password ?? generatePassword();
    const user = await SiteUser.create({
      name,
      email,
      password_hash: password, // haché par le hook du modèle
      role: input.role,
    });
    return {
      outcome: 'created',
      email: user.email,
      name: user.name,
      role: user.role,
      password,
      changes: [],
    };
  }

  const changes: string[] = [];
  const previousRole = existing.role;

  if (existing.role !== input.role) {
    existing.role = input.role;
    changes.push(`profil ${ROLE_LABELS[previousRole]} → ${ROLE_LABELS[input.role]}`);
  }
  if (!existing.is_active) {
    existing.is_active = true;
    changes.push('compte réactivé');
  }

  let password: string | undefined;
  if (input.resetPassword) {
    password = input.password ?? generatePassword();
    existing.password_hash = password;
    changes.push('mot de passe réattribué');
  }

  if (changes.length === 0) {
    return {
      outcome: 'unchanged',
      email: existing.email,
      name: existing.name,
      role: existing.role,
      changes,
    };
  }

  await existing.save();
  return {
    outcome: 'updated',
    email: existing.email,
    name: existing.name,
    role: existing.role,
    previousRole,
    password,
    changes,
  };
}
