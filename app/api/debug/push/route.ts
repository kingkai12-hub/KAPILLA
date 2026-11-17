import { NextResponse } from 'next/server';
import { importPKCS8, SignJWT } from 'jose';
import { requireAuth, requireRole } from '@/lib/auth';
import { isPushConfigured } from '@/lib/push';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Temporary deployment diagnostic (ADMIN only): reports how this server sees
 * the FCM env vars and whether Google will mint an access token from them.
 * Reveals no secret values — only shapes and error strings.
 */
function normalizeKey(raw?: string): string | undefined {
  if (!raw) return undefined;
  const unquoted = raw.trim().replace(/^["']|["']$/g, '');
  return unquoted.replace(/\\n/g, '\n').trim();
}

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  if (!requireRole(auth.user!, ['ADMIN'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rawProject = process.env.FCM_PROJECT_ID;
  const rawEmail = process.env.FCM_CLIENT_EMAIL;
  const rawKey = process.env.FCM_PRIVATE_KEY;

  const PROJECT_ID = rawProject?.trim().replace(/^["']|["']$/g, '');
  const CLIENT_EMAIL = rawEmail?.trim().replace(/^["']|["']$/g, '');
  const PRIVATE_KEY = normalizeKey(rawKey);

  const result: Record<string, unknown> = {
    configured: isPushConfigured(),
    hasProjectId: Boolean(rawProject),
    hasClientEmail: Boolean(rawEmail),
    hasPrivateKey: Boolean(rawKey),
    projectId: PROJECT_ID ?? null,
    clientEmail: CLIENT_EMAIL ?? null,
    keyLength: rawKey?.length ?? 0,
    keyStartsWithQuote: Boolean(rawKey && /^["']/.test(rawKey.trim())),
    keyHasEscapedNewline: Boolean(rawKey?.includes('\\n')),
    keyHasRealNewline: Boolean(rawKey?.includes('\n')),
    keyLooksPem: Boolean(PRIVATE_KEY?.includes('BEGIN PRIVATE KEY')),
    vercelEnv: process.env.VERCEL_ENV ?? null,
    vercelUrl: process.env.VERCEL_URL ?? null,
    gitCommit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
    vercelProjectId: process.env.VERCEL_PROJECT_ID ?? null,
    repoSlug: process.env.VERCEL_GIT_REPO_SLUG ?? null,
    repoOwner: process.env.VERCEL_GIT_REPO_OWNER ?? null,
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    region: process.env.VERCEL_REGION ?? null,
    envCount: Object.keys(process.env).length,
    fcmLikeNames: Object.keys(process.env).filter((k) =>
      /FCM|FIREBASE|PRIVATE_KEY|CLIENT_EMAIL/i.test(k)
    ),
  };

  if (PROJECT_ID && CLIENT_EMAIL && PRIVATE_KEY) {
    try {
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
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      result.oauthStatus = res.status;
      result.oauthOk = res.ok;
      result.oauthError = json.error ?? null;
      result.oauthErrorDescription = json.error_description ?? null;
    } catch (e) {
      result.oauthStatus = 'threw';
      result.oauthError = e instanceof Error ? e.message : String(e);
    }
  } else {
    result.oauthStatus = 'skipped (vars missing)';
  }

  return NextResponse.json(result);
}
