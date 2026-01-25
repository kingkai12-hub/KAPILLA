import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Try to query the database
    const userCount = await db.user.count();

    // Get list of tables to verify schema
    const tables: any[] = await db.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    return NextResponse.json({ 
      status: 'ok', 
      message: 'Database connection successful',
      userCount,
      tables: tables.map(t => t.table_name),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[HEALTH_CHECK]', error);
    return NextResponse.json({ 
      status: 'error', 
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
