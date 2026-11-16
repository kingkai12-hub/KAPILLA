import { importPKCS8, SignJWT } from 'jose';
import { db } from '@/lib/db';

/**
 * Server-side FCM (HTTP v1) push for the Kapilla app.
 *
 * Deliberately fail-open: until the Firebase service-account env vars are set
 * (FCM_PROJECT_ID / FCM_CLIENT_EMAIL / FCM_PRIVATE_KEY) every call is a no-op,
 * so the in-app notification centre keeps working on its own while the Firebase
 * project is still being prepared.
 */
const PROJECT_ID = process.env.FCM_PROJECT_ID?.trim();
const CLIENT_EMAIL = process.env.FCM_CLIENT_EMAIL?.trim();

/**
 * Hosting dashboards happily store a PEM wrapped in quotes or with the
 * newlines escaped, which makes `importPKCS8` throw. Normalise both so a
 * copy-pasted key still works.
 */
function normalizeKey(raw?: string): string | undefined {
  if (!raw) return undefined;
  const unquoted = raw.trim().replace(/^["']|["']$/g, '');
  return unquoted.replace(/\\n/g, '\n').trim();
}

const PRIVATE_KEY = normalizeKey(process.env.FCM_PRIVATE_KEY);

export function isPushConfigured(): boolean {
  return Boolean(PROJECT_ID && CLIENT_EMAIL && PRIVATE_KEY);
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  if (!PROJECT_ID || !CLIENT_EMAIL || !PRIVATE_KEY) return null;
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const now = Math.floor(Date.now() / 1000);
  const key = await importPKCS8(PRIVATE_KEY, 'RS256');
  const assertion = await new SignJWT({
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(CLIENT_EMAIL)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!res.ok) throw new Error(`FCM token endpoint returned ${res.status}`);

  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error('FCM token endpoint returned no access_token');

  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
  return cachedToken.value;
}

export interface PushPayload {
  title: string;
  body: string;
  link?: string | null;
}

/** Send one payload to every device registered by the given users. */
export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
  if (userIds.length === 0) return;
  if (!isPushConfigured()) {
    console.warn('[PUSH] FCM env vars are missing - push skipped (in-app alert still saved)');
    return;
  }

  try {
    const tokens: string[] = await db.pushSubscription
      .findMany({
        where: { userId: { in: userIds } },
        select: { token: true },
      })
      .then((rows: { token: string }[]) => rows.map((row) => row.token));

    if (tokens.length === 0) return;

    const accessToken = await getAccessToken();
    if (!accessToken) return;

    const rejected: string[] = [];

    await Promise.all(
      tokens.map(async (token: string) => {
        try {
          const res = await fetch(
            `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: {
                  token,
                  notification: { title: payload.title, body: payload.body },
                  ...(payload.link ? { data: { link: payload.link } } : {}),
                },
              }),
            }
          );

          if (res.ok) return;

          const body = await res.text();
          console.error('[PUSH] FCM rejected a token', res.status, body.slice(0, 300));
          // A token FCM no longer knows would keep failing on every alert.
          if (res.status === 404 || body.includes('UNREGISTERED')) rejected.push(token);
        } catch (error) {
          console.error('[PUSH] FCM request failed', error);
        }
      })
    );

    if (rejected.length > 0) {
      await db.pushSubscription.deleteMany({ where: { token: { in: rejected } } });
    }
  } catch (error) {
    console.error('[PUSH] send failed', error);
  }
}
