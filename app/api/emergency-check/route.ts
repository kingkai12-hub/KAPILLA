import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasDbUrl: !!process.env.DATABASE_URL,
    dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + '...',
    hasPgBouncer: process.env.DATABASE_URL?.includes('pgbouncer=true'),
  };

  let dbStatus = 'unknown';
  let dbError = null;
  let canQuery = false;

  try {
    const { db } = await import('@/lib/db');

    if (!db) {
      dbStatus = 'db_not_loaded';
    } else if (!db.user) {
      dbStatus = 'user_model_missing';
    } else {
      dbStatus = 'db_loaded';

      try {
        await db.$connect();
        dbStatus = 'connected';

        // Try a simple query
        const count = await db.user.count();
        canQuery = true;
        dbStatus = `connected_and_working (${count} users)`;

        await db.$disconnect();
      } catch (e) {
        dbError = e instanceof Error ? e.message : 'Connection test failed';
        dbStatus = 'connection_failed';
      }
    }
  } catch (e) {
    dbError = e instanceof Error ? e.message : 'Import failed';
    dbStatus = 'import_failed';
  }

  return NextResponse.json({
    status: canQuery ? 'healthy' : 'unhealthy',
    checks,
    database: {
      status: dbStatus,
      error: dbError,
      canQuery,
    },
    recommendation: !checks.hasDbUrl
      ? 'DATABASE_URL environment variable is missing. Add it in Vercel settings.'
      : !checks.hasPgBouncer
        ? 'DATABASE_URL should include ?pgbouncer=true parameter'
        : dbStatus === 'connection_failed'
          ? 'Database exists but cannot connect. Check if database is running and accessible.'
          : dbStatus === 'connected_and_working'
            ? 'Everything looks good! Login should work.'
            : 'Unknown issue. Check Vercel function logs for details.',
  });
}
