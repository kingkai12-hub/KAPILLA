import { importPKCS8, SignJWT } from 'jose';
import { db } from '@/lib/db';

/**
 * Server-side FCM (HTTP v1) push for the Kapilla app.
 *
 * The Firebase service account is resolved from environment variables first,
 * then from the `SystemConfig` table. The database fallback exists because some
 * hosting dashboards refuse to hand the key to a deployment; storing it in the
 * app's own config keeps push working without touching the dashboard.
 *
 * Deliberately fail-open: with no credentials every call is a no-op, so the
 * in-app notification centre keeps working on its own.
 */
export interface PushConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

export const FCM_CONFIG_KEYS = {
  projectId: 'fcm_project_id',
  clientEmail: 'fcm_client_email',
  privateKey: 'fcm_private_key',
} as const;

/**
 * Hosting dashboards happily store a PEM wrapped in quotes or with the
 * newlines escaped, which makes `importPKCS8` throw. Normalise both so a
 * copy-pasted key still works.
 */
export function normalizeKey(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const unquoted = raw.trim().replace(/^["']|["']$/g, '');
  return unquoted.replace(/\\n/g, '\n').trim();
}

let cachedConfig: PushConfig | null = null;

/** Resolve the FCM service account from the environment or the database. */
export async function getPushConfig(): Promise<PushConfig | null> {
  if (cachedConfig) return cachedConfig;

  let projectId = process.env.FCM_PROJECT_ID?.trim();
  let clientEmail = process.env.FCM_CLIENT_EMAIL?.trim();
  let privateKey = normalizeKey(process.env.FCM_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    try {
      const rows: { key: string; value: string }[] = await db.systemConfig.findMany({
        where: { key: { in: Object.values(FCM_CONFIG_KEYS) } },
        select: { key: true, value: true },
      });
      const stored = new Map(rows.map((row) => [row.key, row.value]));
      projectId ||= stored.get(FCM_CONFIG_KEYS.projectId)?.trim();
      clientEmail ||= stored.get(FCM_CONFIG_KEYS.clientEmail)?.trim();
      privateKey ||= normalizeKey(stored.get(FCM_CONFIG_KEYS.privateKey));
    } catch (error) {
      console.error('[PUSH] could not read the FCM config from the database', error);
    }
  }

  if (!projectId || !clientEmail || !privateKey) return null;

  cachedConfig = { projectId, clientEmail, privateKey };
  return cachedConfig;
}

export async function isPushConfigured(): Promise<boolean> {
  return Boolean(await getPushConfig());
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(config: PushConfig): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const now = Math.floor(Date.now() / 1000);
  const key = await importPKCS8(config.privateKey, 'RS256');
  const assertion = await new SignJWT({
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(config.clientEmail)
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

  const config = await getPushConfig();
  if (!config) {
    console.warn('[PUSH] FCM credentials are missing - push skipped (in-app alert still saved)');
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

    const accessToken = await getAccessToken(config);
    if (!accessToken) return;

    const rejected: string[] = [];

    await Promise.all(
      tokens.map(async (token: string) => {
        try {
          const res = await fetch(
            `https://fcm.googleapis.com/v1/projects/${config.projectId}/messages:send`,
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
