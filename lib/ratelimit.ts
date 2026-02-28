import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create Redis client (fallback to memory if no Redis URL)
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    })
  : null;

// In-memory fallback for development
class MemoryStore {
  private store = new Map<string, { count: number; reset: number }>();

  async limit(identifier: string, limit: number, window: number) {
    const now = Date.now();
    const key = identifier;
    const data = this.store.get(key);

    if (!data || now > data.reset) {
      this.store.set(key, { count: 1, reset: now + window });
      return { success: true, limit, remaining: limit - 1, reset: now + window };
    }

    if (data.count >= limit) {
      return { success: false, limit, remaining: 0, reset: data.reset };
    }

    data.count++;
    return { success: true, limit, remaining: limit - data.count, reset: data.reset };
  }
}

const memoryStore = new MemoryStore();

// Rate limiters
export const loginRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
      analytics: true,
    })
  : {
      limit: (id: string) => memoryStore.limit(id, 5, 15 * 60 * 1000),
    };

export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
      analytics: true,
    })
  : {
      limit: (id: string) => memoryStore.limit(id, 100, 60 * 1000),
    };

export const trackingRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 m'), // 20 tracking requests per minute
      analytics: true,
    })
  : {
      limit: (id: string) => memoryStore.limit(id, 20, 60 * 1000),
    };

// Helper to get client IP
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}
