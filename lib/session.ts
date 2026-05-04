/**
 * Signed session tokens using HMAC-SHA256 via the Web Crypto API.
 */

declare const process: { env: Record<string, string | undefined> };

const ALGORITHM = { name: 'HMAC', hash: 'SHA-256' };
export const SESSION_COOKIE = 'kapilla_session';
export const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 hours

// Fixed fallback — consistent across all Vercel instances.
// Set SESSION_SECRET env var in Vercel for a proper secret.
const FALLBACK_SECRET = 'kapilla-group-ltd-session-secret-2026-fixed-key';

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  return FALLBACK_SECRET;
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    ALGORITHM,
    false,
    ['sign', 'verify']
  );
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): Uint8Array {
  const binary = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export interface SessionPayload {
  id: string;
  role: string;
  iat: number;
}

export async function createSessionToken(payload: Omit<SessionPayload, 'iat'>): Promise<string> {
  const data: SessionPayload = { ...payload, iat: Math.floor(Date.now() / 1000) };
  const enc = new TextEncoder();
  const payloadB64 = toBase64Url(enc.encode(JSON.stringify(data)));
  const key = await importKey(getSecret());
  const sig = await crypto.subtle.sign(ALGORITHM, key, enc.encode(payloadB64));
  return `${payloadB64}.${toBase64Url(new Uint8Array(sig))}`;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const dot = token.lastIndexOf('.');
    if (dot === -1) return null;
    const payloadB64 = token.slice(0, dot);
    const sigB64 = token.slice(dot + 1);
    if (!payloadB64 || !sigB64) return null;

    const enc = new TextEncoder();
    const key = await importKey(getSecret());
    const valid = await crypto.subtle.verify(
      ALGORITHM,
      key,
      fromBase64Url(sigB64).buffer as ArrayBuffer,
      enc.encode(payloadB64)
    );
    if (!valid) return null;

    const payload: SessionPayload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(payloadB64))
    );
    if (Math.floor(Date.now() / 1000) - payload.iat > SESSION_DURATION_SECONDS) return null;
    return payload;
  } catch {
    return null;
  }
}
