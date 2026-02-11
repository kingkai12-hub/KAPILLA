// Conditional Prisma import to handle build issues
let prisma: any;

try {
  if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
    // Only import Prisma in server-side development
    const { PrismaClient } = require('@prisma/client');
    
    const globalForPrisma = globalThis as unknown as { prisma: any };
    
    const prismaClientSingleton = () => {
      let url = process.env.DATABASE_URL;
      
      // Fix for "prepared statement already exists" error with Supabase Transaction Pooler
      if (url && !url.includes('pgbouncer=true')) {
        url += url.includes('?') ? '&pgbouncer=true' : '?pgbouncer=true';
      }

      return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        datasources: url ? {
          db: {
            url: url,
          },
        } : undefined,
      });
    };

    prisma = globalForPrisma.prisma ?? prismaClientSingleton();
    
    if (process.env.NODE_ENV === 'development') {
      globalForPrisma.prisma = prisma;
    }
  }
} catch (error) {
  console.log('⚠️ Prisma not available, using mock for build');
  // Mock Prisma for build time
  prisma = {
    $connect: () => Promise.resolve(),
    $disconnect: () => Promise.resolve(),
    shipment: {
      findMany: () => Promise.resolve([]),
      findUnique: () => Promise.resolve(null),
      findFirst: () => Promise.resolve(null),
      create: () => Promise.resolve({}),
      update: () => Promise.resolve({}),
      delete: () => Promise.resolve({}),
    },
    trackingEvent: {
      findMany: () => Promise.resolve([]),
      create: () => Promise.resolve({}),
    },
    trip: {
      findMany: () => Promise.resolve([]),
      create: () => Promise.resolve({}),
      update: () => Promise.resolve({}),
    },
    checkIn: {
      findMany: () => Promise.resolve([]),
      create: () => Promise.resolve({}),
    },
    user: {
      findMany: () => Promise.resolve([]),
      findUnique: () => Promise.resolve(null),
      create: () => Promise.resolve({}),
      update: () => Promise.resolve({}),
    },
    $queryRaw: () => Promise.resolve([]),
    $executeRaw: () => Promise.resolve({}),
  };
}

export { prisma };
export const db = prisma; // Backward compatibility
