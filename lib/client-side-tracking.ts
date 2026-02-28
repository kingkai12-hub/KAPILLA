/**
 * CLIENT-SIDE AUTONOMOUS TRACKING
 * 
 * Since Vercel Hobby plan only allows daily cron jobs,
 * we use client-side updates when users are viewing the map.
 * 
 * This ensures vehicles move in real-time when someone is watching,
 * and the daily cron job keeps them updated when no one is online.
 */

import { updateVehiclePosition } from './autonomous-tracking';

export class ClientSideTracker {
  private intervalId: NodeJS.Timeout | null = null;
  private waybillNumber: string;
  private updateInterval: number;

  constructor(waybillNumber: string, updateIntervalSeconds: number = 60) {
    this.waybillNumber = waybillNumber;
    this.updateInterval = updateIntervalSeconds * 1000; // Convert to milliseconds
  }

  /**
   * Start tracking - updates vehicle position every minute
   */
  async start() {
    // Initial update
    await this.updatePosition();

    // Set up interval for continuous updates
    this.intervalId = setInterval(async () => {
      await this.updatePosition();
    }, this.updateInterval);

    console.log(`[ClientTracker] Started tracking ${this.waybillNumber}`);
  }

  /**
   * Stop tracking
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log(`[ClientTracker] Stopped tracking ${this.waybillNumber}`);
    }
  }

  /**
   * Update vehicle position via API
   */
  private async updatePosition() {
    try {
      const response = await fetch('/api/tracking/update-position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waybillNumber: this.waybillNumber }),
      });

      if (!response.ok) {
        console.warn(`[ClientTracker] Update failed: ${response.status}`);
        return;
      }

      const data = await response.json();
      console.log(`[ClientTracker] Updated ${this.waybillNumber}:`, data);
    } catch (error) {
      console.error('[ClientTracker] Error updating position:', error);
    }
  }
}

/**
 * Hook for React components
 */
export function useVehicleTracking(waybillNumber: string | null) {
  const trackerRef = React.useRef<ClientSideTracker | null>(null);

  React.useEffect(() => {
    if (!waybillNumber) return;

    // Create and start tracker
    trackerRef.current = new ClientSideTracker(waybillNumber);
    trackerRef.current.start();

    // Cleanup on unmount
    return () => {
      trackerRef.current?.stop();
    };
  }, [waybillNumber]);

  return trackerRef.current;
}
