/**
 * FEATURE FLAGS
 * 
 * Control features to manage bandwidth and resources
 */

export const FEATURE_FLAGS = {
  // BANDWIDTH MANAGEMENT
  ENABLE_SSE_STREAMING: false, // Disable SSE to save bandwidth (70% reduction)
  ENABLE_CLIENT_TRACKING: false, // Disable client-side tracking (50% reduction)
  
  // POLLING CONFIGURATION
  POLLING_INTERVAL_MS: 10000, // 10 seconds (was 5000) - another 50% reduction
  
  // TRACKING PAGE
  ENABLE_REAL_TIME_TRACKING: true, // Set to false to disable tracking page completely
  
  // DAILY CRON (Always enabled - minimal bandwidth)
  ENABLE_DAILY_CRON: true,
} as const;

/**
 * Get current bandwidth mode
 */
export function getBandwidthMode(): 'minimal' | 'optimized' | 'full' {
  if (!FEATURE_FLAGS.ENABLE_SSE_STREAMING && !FEATURE_FLAGS.ENABLE_CLIENT_TRACKING) {
    return 'minimal'; // 95% bandwidth reduction
  }
  if (!FEATURE_FLAGS.ENABLE_SSE_STREAMING || FEATURE_FLAGS.POLLING_INTERVAL_MS >= 5000) {
    return 'optimized'; // 79% bandwidth reduction
  }
  return 'full'; // Normal mode
}

/**
 * Get bandwidth usage estimate per user per hour
 */
export function estimateBandwidthPerHour(): number {
  const mode = getBandwidthMode();
  
  switch (mode) {
    case 'minimal':
      return 0.36; // MB per user per hour (10s polling only)
    case 'optimized':
      return 1.44; // MB per user per hour (5s updates)
    case 'full':
      return 7.2; // MB per user per hour (1s updates)
  }
}

/**
 * Log current bandwidth configuration
 */
export function logBandwidthConfig() {
  const mode = getBandwidthMode();
  const estimate = estimateBandwidthPerHour();
  
  console.log('=== BANDWIDTH CONFIGURATION ===');
  console.log(`Mode: ${mode.toUpperCase()}`);
  console.log(`SSE Streaming: ${FEATURE_FLAGS.ENABLE_SSE_STREAMING ? 'ENABLED' : 'DISABLED'}`);
  console.log(`Client Tracking: ${FEATURE_FLAGS.ENABLE_CLIENT_TRACKING ? 'ENABLED' : 'DISABLED'}`);
  console.log(`Polling Interval: ${FEATURE_FLAGS.POLLING_INTERVAL_MS}ms`);
  console.log(`Estimated Usage: ${estimate}MB per user per hour`);
  console.log('==============================');
}
