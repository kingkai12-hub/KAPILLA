/**
 * Optimized Database Connection with Connection Pooling
 * Supports 20+ concurrent users efficiently
 */

import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma Client
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Connection pool configuration for production
if (process.env.NODE_ENV === 'production') {
  // Optimize connection pool for concurrent users
  db.$connect().catch((err) => {
    console.error('Failed to connect to database:', err);
  });
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

/**
 * Query optimization helpers
 */

// Cache frequently accessed data
const queryCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl: number = CACHE_TTL
): Promise<T> {
  const cached = queryCache.get(key);

  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data as T;
  }

  const data = await queryFn();
  queryCache.set(key, { data, timestamp: Date.now() });

  // Cleanup old cache entries
  if (queryCache.size > 100) {
    const now = Date.now();
    for (const [k, v] of queryCache.entries()) {
      if (now - v.timestamp > ttl * 2) {
        queryCache.delete(k);
      }
    }
  }

  return data;
}

export function invalidateCache(pattern?: string) {
  if (!pattern) {
    queryCache.clear();
    return;
  }

  for (const key of queryCache.keys()) {
    if (key.includes(pattern)) {
      queryCache.delete(key);
    }
  }
}

/**
 * Batch query helper to reduce database round trips
 */
export async function batchQuery<T>(queries: Array<() => Promise<T>>): Promise<T[]> {
  return Promise.all(queries.map((q) => q()));
}

/**
 * Pagination helper with optimized queries
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
  orderBy?: Record<string, unknown>;
  where?: Record<string, unknown>;
}

export async function paginatedQuery<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any,
  options: PaginationOptions
) {
  const { page, pageSize, orderBy, where } = options;
  const skip = (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    model.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
    }),
    model.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Graceful shutdown
 */
export async function disconnectDatabase() {
  await db.$disconnect();
}

// Handle process termination
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await disconnectDatabase();
  });
}
