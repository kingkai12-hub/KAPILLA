import Redis from 'ioredis';

// Create Redis client with fallback to in-memory cache
let redis: Redis | null = null;

if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 200, 1000);
      },
    });

    redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
  } catch (error) {
    console.warn('Redis initialization failed, using in-memory cache');
  }
}

// In-memory cache fallback
class MemoryCache {
  private cache = new Map<string, { value: any; expiry: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  async set(key: string, value: string, ttl: number): Promise<void> {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Array.from(this.cache.keys()).filter((key) => regex.test(key));
  }
}

const memoryCache = new MemoryCache();

/**
 * Get cached data or fetch and cache it
 * @param key Cache key
 * @param fetcher Function to fetch data if not cached
 * @param ttl Time to live in seconds (default: 1 hour)
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 3600
): Promise<T> {
  try {
    // Try to get from cache
    const cached = redis ? await redis.get(key) : await memoryCache.get(key);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch fresh data
    const data = await fetcher();

    // Cache the result
    const serialized = JSON.stringify(data);
    if (redis) {
      await redis.setex(key, ttl, serialized);
    } else {
      await memoryCache.set(key, serialized, ttl);
    }

    return data;
  } catch (error) {
    console.error('Cache error:', error);
    // Fallback to fetcher on cache error
    return fetcher();
  }
}

/**
 * Invalidate cache by key or pattern
 * @param keyOrPattern Cache key or pattern (e.g., "shipments:*")
 */
export async function invalidateCache(keyOrPattern: string): Promise<void> {
  try {
    if (keyOrPattern.includes('*')) {
      // Pattern-based invalidation
      const keys = redis
        ? await redis.keys(keyOrPattern)
        : await memoryCache.keys(keyOrPattern);
      
      if (keys.length > 0) {
        if (redis) {
          await redis.del(...keys);
        } else {
          await Promise.all(keys.map((key) => memoryCache.del(key)));
        }
      }
    } else {
      // Single key invalidation
      if (redis) {
        await redis.del(keyOrPattern);
      } else {
        await memoryCache.del(keyOrPattern);
      }
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

/**
 * Set cache value directly
 * @param key Cache key
 * @param value Value to cache
 * @param ttl Time to live in seconds
 */
export async function setCache(key: string, value: any, ttl = 3600): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    if (redis) {
      await redis.setex(key, ttl, serialized);
    } else {
      await memoryCache.set(key, serialized, ttl);
    }
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

/**
 * Get cache value directly
 * @param key Cache key
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const cached = redis ? await redis.get(key) : await memoryCache.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

export { redis };
