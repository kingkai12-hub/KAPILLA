/**
 * Signed session tokens using HMAC-SHA256 via the Web Crypto API.
 * Replaces the insecure kapilla_auth=1 + kapilla_uid cookie pair with a
 * single signed token so the session cannot be forged by setting cookies.
 *
 * Format: base64url(payload) + "." + base64url(signature)
 * Payload: { id, role, iat }
 *
 * Backward-compatible: getSession() in auth.ts still accepts the old cookies
 * during the transition window; new logins always get the signed token.
 */

const ALGORITHM = { name: 'HMAC', hash: 'SHA-256' };
const SESSION_COOKIE = 'kapilla_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 hours

// Access process.env safely — Next.js inlines these at build time
declare const process: { env: Record<string, string | undefined> };

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET env var must be set (min 32 chars) in production');
    }
    // Development fallback — never used in production
    return 'dev-only-secret-do-not-use-in-prod-32c';
  }
  return secret;
}

async function importKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey('raw', enc.encode(secret), ALGORITHM, false, ['sign', 'verify']);
}

function toBase64Url(bytes: Uint8Array): string {
  // Convert Uint8Array to base64 using btoa with char codes
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export interface SessionPayload {
  id: string;
  role: string;
  iat: number;
}

/** Create a signed session token for the given user */
export async function createSessionToken(payload: Omit<SessionPayload, 'iat'>): Promise<string> {
  const data: SessionPayload = { ...payload, iat: Math.floor(Date.now() / 1000) };
  const enc = new TextEncoder();
  const payloadBytes = enc.encode(JSON.stringify(data));
  const payloadB64 = toBase64Url(payloadBytes);
  const key = await importKey(getSecret());
  const sigBuffer = await crypto.subtle.sign(ALGORITHM, key, enc.encode(payloadB64));
  const sigB64 = toBase64Url(new Uint8Array(sigBuffer));
  return `${payloadB64}.${sigB64}`;
}

/** Verify and decode a session token. Returns null if invalid or expired. */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const dotIndex = token.lastIndexOf('.');
    if (dotIndex === -1) return null;

    const payloadB64 = token.slice(0, dotIndex);
    const sigB64 = token.slice(dotIndex + 1);

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

    const payloadBytes = fromBase64Url(payloadB64);
    const payloadStr = new TextDecoder().decode(payloadBytes);
    const payload: SessionPayload = JSON.parse(payloadStr);

    // Check expiry
    const age = Math.floor(Date.now() / 1000) - payload.iat;
    if (age > SESSION_DURATION_SECONDS) return null;

    return payload;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE, SESSION_DURATION_SECONDS };
