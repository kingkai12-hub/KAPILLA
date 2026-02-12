// Conditional Prisma import to handle build issues
let prisma: any;

try {
  if (typeof window === 'undefined') {
    // Import Prisma in server-side environment (development and production)
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
  // Mock Prisma only for build time
  const noop = () => Promise.resolve(null);
  const noopArr = () => Promise.resolve([]);
  const noopObj = () => Promise.resolve({});
  const mockModel = {
    findMany: noopArr,
    findUnique: noop,
    findFirst: noop,
    create: noopObj,
    update: noopObj,
    delete: noopObj,
  };
  prisma = {
    $connect: () => Promise.resolve(),
    $disconnect: () => Promise.resolve(),
    shipment: { ...mockModel },
    trackingEvent: { findMany: noopArr, create: noopObj },
    trip: { ...mockModel },
    checkIn: { findMany: noopArr, create: noopObj },
    user: { ...mockModel },
    document: { ...mockModel },
    documentFolder: { ...mockModel },
    message: { ...mockModel },
    pickupRequest: { ...mockModel },
    serviceShowcase: { ...mockModel },
    executive: { ...mockModel },
    $queryRaw: noopArr,
    $executeRaw: () => Promise.resolve(0),
  };
}

export { prisma };
export const db = prisma; // Backward compatibility
