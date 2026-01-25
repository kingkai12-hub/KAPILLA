import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prismaClientSingleton = () => {
  let url = process.env.DATABASE_URL;
  
  // Fix for "prepared statement already exists" error with Supabase Transaction Pooler
  // This automatically appends ?pgbouncer=true if it's missing
  if (url && !url.includes('pgbouncer=true')) {
    url += url.includes('?') ? '&pgbouncer=true' : '?pgbouncer=true';
  }

  return new PrismaClient({
    log: ['query'],
    datasources: url ? {
      db: {
        url: url,
      },
    } : undefined,
  });
};

export const db = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
