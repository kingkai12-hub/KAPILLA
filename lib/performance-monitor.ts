/**
 * Performance Monitoring Utilities
 * Track and optimize system performance for concurrent users
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;

  /**
   * Start timing an operation
   */
  startTimer(name: string): () => void {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;
      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
      });
    };
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log slow operations
    if (metric.duration > 1000) {
      console.warn(`Slow operation detected: ${metric.name} took ${metric.duration.toFixed(2)}ms`);
    }
  }

  /**
   * Get average duration for an operation
   */
  getAverageDuration(name: string): number {
    const filtered = this.metrics.filter((m) => m.name === name);
    if (filtered.length === 0) return 0;

    const sum = filtered.reduce((acc, m) => acc + m.duration, 0);
    return sum / filtered.length;
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const summary: Record<string, { count: number; avg: number; max: number; min: number }> = {};

    for (const metric of this.metrics) {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          count: 0,
          avg: 0,
          max: 0,
          min: Infinity,
        };
      }

      const s = summary[metric.name];
      s.count++;
      s.max = Math.max(s.max, metric.duration);
      s.min = Math.min(s.min, metric.duration);
    }

    // Calculate averages
    for (const name in summary) {
      summary[name].avg = this.getAverageDuration(name);
    }

    return summary;
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Measure async function performance
 */
export async function measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const endTimer = performanceMonitor.startTimer(name);
  try {
    return await fn();
  } finally {
    endTimer();
  }
}

/**
 * Measure sync function performance
 */
export function measureSync<T>(name: string, fn: () => T): T {
  const endTimer = performanceMonitor.startTimer(name);
  try {
    return fn();
  } finally {
    endTimer();
  }
}

/**
 * Request deduplication to prevent duplicate API calls
 */
class RequestDeduplicator {
  private pending = new Map<string, Promise<unknown>>();

  async deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // If request is already pending, return the existing promise
    if (this.pending.has(key)) {
      return this.pending.get(key) as Promise<T>;
    }

    // Start new request
    const promise = fn().finally(() => {
      // Clean up after request completes
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise;
  }

  clear() {
    this.pending.clear();
  }
}

export const requestDeduplicator = new RequestDeduplicator();

/**
 * Debounce function for reducing API calls
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for rate limiting
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Lazy load component helper
 */
import React from 'react';

export function lazyLoadComponent<T extends React.ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>
) {
  return React.lazy(importFn);
}
