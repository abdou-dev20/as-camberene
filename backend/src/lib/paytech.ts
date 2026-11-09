/**
 * Client PayTech : ouvrir une session de paiement, authentifier ses
 * notifications.
 *
 * Documentation : https://doc.intech.sn/doc_paytech.php
 */

import crypto from 'crypto';
import config from '../config/env';
import { HttpError } from './http';

const REQUEST_URL = 'https://paytech.sn/api/payment/request-payment';

export const paytechEnabled = (): boolean =>
  Boolean(config.paytech.apiKey && config.paytech.apiSecret);

export interface PaymentRequest {
  reference: string;
  amount: number;
  itemName: string;
  commandName: string;
  successUrl: string;
  cancelUrl: string;
  /** Doit être en HTTPS : PayTech refuse les autres, d'où son absence en local. */
  ipnUrl?: string;
}

/** Ouvre une session et rend l'adresse de la page de paiement. */
export const requestPayment = async (
  payment: PaymentRequest
): Promise<{ token: string; redirectUrl: string }> => {
  const response = await fetch(REQUEST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      API_KEY: config.paytech.apiKey,
      API_SECRET: config.paytech.apiSecret,
    },
    body: JSON.stringify({
      item_name: payment.itemName,
      item_price: payment.amount,
      currency: 'XOF',
      ref_command: payment.reference,
      command_name: payment.commandName,
      env: config.paytech.env,
      success_url: payment.successUrl,
      cancel_url: payment.cancelUrl,
      ...(payment.ipnUrl ? { ipn_url: payment.ipnUrl } : {}),
    }),
    signal: AbortSignal.timeout(15_000),
  }).catch(() => {
    throw new HttpError(502, 'Le service de paiement est injoignable. Réessayez dans un instant.');
  });

  const body = (await response.json().catch(() => ({}))) as {
    success?: number;
    token?: string;
    redirect_url?: string;
    redirectUrl?: string;
    message?: string;
    error?: string[] | string;
  };

  const redirectUrl = body.redirect_url ?? body.redirectUrl;
  if (body.success !== 1 || !body.token || !redirectUrl) {
    // Le détail de PayTech va dans les journaux, pas au donateur : il parle
    // de clés et de configuration, pas de ce que le donateur peut corriger.
    console.error('PayTech a refusé la demande de paiement', response.status, body);
    throw new HttpError(502, "Le paiement n'a pas pu être ouvert. Réessayez dans un instant.");
  }

  return { token: body.token, redirectUrl };
};

const sha256 = (value: string): string => crypto.createHash('sha256').update(value).digest('hex');

const sameHex = (a: string, b: string): boolean => {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

/**
 * La notification vient-elle bien de PayTech ?
 *
 * L'adresse de notification est publique : sans cette vérification, n'importe
 * qui pourrait déclarer un don payé. PayTech signe en HMAC-SHA256 le triplet
 * `montant|référence|clé` avec le secret ; les anciennes intégrations ne
 * reçoivent que les empreintes SHA-256 des deux clés, acceptées à défaut.
 */
export const verifyNotification = (payload: Record<string, unknown>): boolean => {
  const { apiKey, apiSecret } = config.paytech;
  const field = (name: string): string => String(payload[name] ?? '');

  const hmac = field('hmac_compute');
  if (hmac) {
    const amount = field('final_item_price') || field('item_price');
    const expected = crypto
      .createHmac('sha256', apiSecret)
      .update(`${amount}|${field('ref_command')}|${apiKey}`)
      .digest('hex');
    return sameHex(expected, hmac);
  }

  const keyHash = field('api_key_sha256');
  const secretHash = field('api_secret_sha256');
  return Boolean(keyHash && secretHash)
    && sameHex(sha256(apiKey), keyHash)
    && sameHex(sha256(apiSecret), secretHash);
};
