/**
 * Exchange Rate Management
 * Fetches live USD/TZS rates and provides fallback
 */

const FALLBACK_RATE = 2500; // Fallback if API fails
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

interface ExchangeRateCache {
  rate: number;
  timestamp: number;
  source: 'api' | 'manual' | 'fallback';
}

let rateCache: ExchangeRateCache | null = null;

/**
 * Fetch current USD to TZS exchange rate
 * Uses free exchangerate-api.com service
 */
export async function fetchExchangeRate(): Promise<{
  rate: number;
  source: 'api' | 'manual' | 'fallback';
  timestamp: number;
}> {
  try {
    // Check cache first
    if (rateCache && Date.now() - rateCache.timestamp < CACHE_DURATION) {
      return {
        rate: rateCache.rate,
        source: rateCache.source,
        timestamp: rateCache.timestamp,
      };
    }

    // Fetch from API
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate');
    }

    const data = await response.json();
    const rate = data.rates?.TZS || FALLBACK_RATE;

    // Update cache
    rateCache = {
      rate,
      timestamp: Date.now(),
      source: 'api',
    };

    return {
      rate,
      source: 'api',
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Exchange rate fetch failed:', error);

    // Use cached rate if available, otherwise fallback
    if (rateCache) {
      return {
        rate: rateCache.rate,
        source: rateCache.source,
        timestamp: rateCache.timestamp,
      };
    }

    // Use fallback rate
    rateCache = {
      rate: FALLBACK_RATE,
      timestamp: Date.now(),
      source: 'fallback',
    };

    return {
      rate: FALLBACK_RATE,
      source: 'fallback',
      timestamp: Date.now(),
    };
  }
}

/**
 * Set manual exchange rate (overrides API)
 */
export function setManualRate(rate: number): void {
  rateCache = {
    rate,
    timestamp: Date.now(),
    source: 'manual',
  };
}

/**
 * Get cached rate without fetching
 */
export function getCachedRate(): ExchangeRateCache | null {
  return rateCache;
}

/**
 * Clear rate cache (force refresh on next fetch)
 */
export function clearRateCache(): void {
  rateCache = null;
}

/**
 * Convert amount between currencies
 */
export function convertCurrency(
  amount: number,
  fromCurrency: 'USD' | 'TZS',
  toCurrency: 'USD' | 'TZS',
  rate: number
): number {
  if (fromCurrency === toCurrency) return amount;

  if (fromCurrency === 'USD' && toCurrency === 'TZS') {
    return amount * rate;
  } else {
    return amount / rate;
  }
}

/**
 * Format timestamp for display
 */
export function formatRateTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
