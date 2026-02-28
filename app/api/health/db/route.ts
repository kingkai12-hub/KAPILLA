import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check environment
    const hasDbUrl = !!process.env.DATABASE_URL;
    
    // Try to import db
    let dbStatus = 'not loaded';
    let invoiceModelExists = false;
    let canConnect = false;
    let error = null;
    
    try {
      const { db } = await import('@/lib/db');
      dbStatus = 'loaded';
      
      if (db && db.invoice) {
        invoiceModelExists = true;
        
        // Try to connect
        try {
          await db.$connect();
          canConnect = true;
          await db.$disconnect();
        } catch (e) {
          error = e instanceof Error ? e.message : 'Connection failed';
        }
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Import failed';
    }
    
    return NextResponse.json({
      status: 'ok',
      environment: process.env.NODE_ENV,
      database: {
        hasDbUrl,
        dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...',
        dbStatus,
        invoiceModelExists,
        canConnect,
        error
      },
      prisma: {
        clientVersion: process.env.npm_package_dependencies__prisma_client || 'unknown'
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
