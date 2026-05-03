import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Warn in production if Upstash Redis is not configured.
// The in-memory fallback is single-instance only and will NOT work correctly
// across multiple Vercel serverless instances.
const hasUpstash = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

if (!hasUpstash && process.env.NODE_ENV === 'production') {
  console.warn(
    '[ratelimit] WARNING: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set. ' +
      'Rate limiting is falling back to in-memory store which is NOT distributed. ' +
      'Set Upstash credentials to enable proper rate limiting across all instances.'
  );
}

const redis = hasUpstash
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// In-memory fallback — development / single-instance only
class MemoryStore {
  private store = new Map<string, { count: number; reset: number }>();

  async limit(identifier: string, limit: number, windowMs: number) {
    const now = Date.now();
    const data = this.store.get(identifier);

    if (!data || now > data.reset) {
      this.store.set(identifier, { count: 1, reset: now + windowMs });
      return { success: true, limit, remaining: limit - 1, reset: now + windowMs };
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
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      analytics: true,
    })
  : { limit: (id: string) => memoryStore.limit(id, 5, 15 * 60 * 1000) };

export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
    })
  : { limit: (id: string) => memoryStore.limit(id, 100, 60 * 1000) };

export const trackingRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 m'),
      analytics: true,
    })
  : { limit: (id: string) => memoryStore.limit(id, 20, 60 * 1000) };

/** Extract the real client IP from common proxy headers */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}
