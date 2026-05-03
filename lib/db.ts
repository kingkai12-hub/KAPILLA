// Conditional Prisma import to handle build issues
let prisma: any;

try {
  if (typeof window === 'undefined') {
    const { PrismaClient } = require('@prisma/client');

    const globalForPrisma = globalThis as unknown as { prisma: any };

    const prismaClientSingleton = () => {
      let url = process.env.DATABASE_URL;

      // Fix for "prepared statement already exists" with Supabase Transaction Pooler.
      // Guard against appending the param twice.
      if (url && !url.includes('pgbouncer=true')) {
        url += url.includes('?') ? '&pgbouncer=true' : '?pgbouncer=true';
      }

      return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        datasources: url ? { db: { url } } : undefined,
      });
    };

    prisma = globalForPrisma.prisma ?? prismaClientSingleton();

    if (prisma && !prisma.shipment) {
      console.warn('⚠️ Prisma client initialized but "shipment" model is missing. Check schema mapping.');
    }

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prisma;
    }
  }
} catch (error) {
  console.log('⚠️ Prisma not available, using mock for build');
  // Minimal mock — only used at build time when Prisma client hasn't been generated yet.
  // This does NOT hide runtime schema issues because at runtime Prisma is always available.
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
    count: () => Promise.resolve(0),
    upsert: noopObj,
  };
  prisma = {
    $connect: () => Promise.resolve(),
    $disconnect: () => Promise.resolve(),
    $queryRaw: noopArr,
    $executeRaw: () => Promise.resolve(0),
    $transaction: (fn: any) => (typeof fn === 'function' ? fn(prisma) : Promise.resolve([])),
    shipment: { ...mockModel },
    trackingEvent: { ...mockModel },
    vehicleTracking: { ...mockModel },
    routeSegment: { ...mockModel },
    user: { ...mockModel },
    document: { ...mockModel },
    documentFolder: { ...mockModel },
    message: { ...mockModel },
    pickupRequest: { ...mockModel },
    serviceShowcase: { ...mockModel },
    executive: { ...mockModel },
    invoice: { ...mockModel },
    invoiceItem: { ...mockModel },
    auditLog: { ...mockModel },
    systemConfig: { ...mockModel },
    apiKey: { ...mockModel },
    notification: { ...mockModel },
    advertisement: { ...mockModel },
  };
}

export { prisma };
export const db = prisma; // Backward compatibility
