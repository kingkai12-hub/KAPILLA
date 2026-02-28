/**
 * Request Deduplication Utility
 * 
 * Prevents duplicate simultaneous requests for the same resource
 * Uses in-memory locks with automatic cleanup
 */

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class RequestDeduplicator {
  private pending: Map<string, PendingRequest> = new Map();
  private readonly LOCK_TIMEOUT = 30000; // 30 seconds

  /**
   * Execute a function with deduplication
   * If a request for the same key is already in progress, return that promise
   * Otherwise, execute the function and cache the promise
   */
  async deduplicate<T>(
    key: string,
    fn: () => Promise<T>
  ): Promise<T> {
    // Check if request is already in progress
    const existing = this.pending.get(key);
    
    if (existing) {
      const age = Date.now() - existing.timestamp;
      
      // If request is still fresh, return existing promise
      if (age < this.LOCK_TIMEOUT) {
        console.log(`[DEDUP] Reusing in-flight request for: ${key}`);
        return existing.promise as Promise<T>;
      } else {
        // Request timed out, remove it
        console.warn(`[DEDUP] Request timeout for: ${key}, creating new request`);
        this.pending.delete(key);
      }
    }

    // Create new request
    console.log(`[DEDUP] Creating new request for: ${key}`);
    const promise = fn();
    
    // Store promise with timestamp
    this.pending.set(key, {
      promise,
      timestamp: Date.now(),
    });

    // Clean up after completion (success or failure)
    promise
      .then(() => {
        this.pending.delete(key);
        console.log(`[DEDUP] Request completed successfully: ${key}`);
      })
      .catch((error) => {
        this.pending.delete(key);
        console.error(`[DEDUP] Request failed: ${key}`, error);
      });

    return promise;
  }

  /**
   * Check if a request is currently in progress
   */
  isPending(key: string): boolean {
    const existing = this.pending.get(key);
    if (!existing) return false;
    
    const age = Date.now() - existing.timestamp;
    return age < this.LOCK_TIMEOUT;
  }

  /**
   * Get number of pending requests
   */
  getPendingCount(): number {
    return this.pending.size;
  }

  /**
   * Clear all pending requests (for testing/cleanup)
   */
  clear(): void {
    this.pending.clear();
  }

  /**
   * Clean up stale requests (older than timeout)
   */
  cleanup(): void {
    const now = Date.now();
    const stale: string[] = [];

    for (const [key, request] of this.pending.entries()) {
      if (now - request.timestamp > this.LOCK_TIMEOUT) {
        stale.push(key);
      }
    }

    stale.forEach(key => {
      this.pending.delete(key);
      console.warn(`[DEDUP] Cleaned up stale request: ${key}`);
    });

    if (stale.length > 0) {
      console.log(`[DEDUP] Cleaned up ${stale.length} stale requests`);
    }
  }
}

// Singleton instance
const deduplicator = new RequestDeduplicator();

// Periodic cleanup (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    deduplicator.cleanup();
  }, 5 * 60 * 1000);
}

export default deduplicator;

/**
 * Helper function for common use case: deduplicate by waybill number
 */
export async function deduplicateByWaybill<T>(
  waybillNumber: string,
  fn: () => Promise<T>
): Promise<T> {
  return deduplicator.deduplicate(`waybill:${waybillNumber}`, fn);
}

/**
 * Helper function for route generation deduplication
 */
export async function deduplicateRouteGeneration<T>(
  origin: string,
  destination: string,
  fn: () => Promise<T>
): Promise<T> {
  const key = `route:${origin}-${destination}`;
  return deduplicator.deduplicate(key, fn);
}
