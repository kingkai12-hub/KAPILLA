import { NextResponse } from 'next/server';
import { importPKCS8, SignJWT } from 'jose';
import { requireAuth, requireRole } from '@/lib/auth';
import { getPushConfig } from '@/lib/push';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Temporary deployment diagnostic (ADMIN only): reports which source supplies
 * the FCM service account and whether Google will mint an access token from it.
 * Reveals no secret values — only shapes and error strings.
 */
export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  if (!requireRole(auth.user!, ['ADMIN'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const envProject = process.env.FCM_PROJECT_ID;
  const envEmail = process.env.FCM_CLIENT_EMAIL;
  const envKey = process.env.FCM_PRIVATE_KEY;
  const envComplete = Boolean(envProject && envEmail && envKey);

  const config = await getPushConfig();

  const result: Record<string, unknown> = {
    configured: Boolean(config),
    source: config ? (envComplete ? 'environment' : 'database') : null,
    projectId: config?.projectId ?? null,
    clientEmail: config?.clientEmail ?? null,
    keyLooksPem: Boolean(config?.privateKey.includes('BEGIN PRIVATE KEY')),
    keyLength: config?.privateKey.length ?? 0,
    gitCommit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
  };

  if (config) {
    try {
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
    result.oauthStatus = 'skipped (credentials missing)';
  }

  return NextResponse.json(result);
}
