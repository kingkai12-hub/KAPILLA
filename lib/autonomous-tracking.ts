/**
 * AUTONOMOUS TRACKING SYSTEM
 *
 * Gari linasafiri automatically bila kutegemea mtu kuwa online!
 *
 * FEATURES:
 * - Background updates kila dakika
 * - Realistic speed na movement
 * - Gari linafika kwa muda halisi
 * - Hakuna dependency kwa user kuwa online
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '@/lib/db';
import {
  calculateMovement,
  haversineDistance,
  DEFAULT_SPEED_CONFIG,
  type VehicleState,
  type RouteContext,
} from '@/lib/speed-manager';
import { calculateHeading } from '@/lib/tracking-utils';

/**
 * Update single vehicle position autonomously
 * Called by background job every minute
 */
export async function updateVehiclePosition(trackingId: string): Promise<boolean> {
  try {
    const vehicleTrackingModel = (db as any).VehicleTracking || (db as any).vehicleTracking;
    const shipmentModel = (db as any).Shipment || (db as any).shipment;
    const trackingEventModel = (db as any).TrackingEvent || (db as any).trackingEvent;

    if (!vehicleTrackingModel || !shipmentModel) {
      console.error('[AUTONOMOUS] Models not available');
      return false;
    }

    // Get tracking data
    const tracking = await vehicleTrackingModel.findUnique({
      where: { id: trackingId },
      include: { shipment: true },
    });

    if (!tracking || !tracking.shipment) {
      console.error(`[AUTONOMOUS] Tracking ${trackingId} not found`);
      return false;
    }

    const shipment = tracking.shipment;

    // Skip if already delivered
    if (shipment.currentStatus === 'DELIVERED') {
      console.log(`[AUTONOMOUS] Shipment ${shipment.waybillNumber} already delivered`);
      return true;
    }

    // Get route points
    const routePoints: [number, number][] = tracking.routePoints || [];

    if (routePoints.length < 2) {
      console.error(`[AUTONOMOUS] No route points for ${shipment.waybillNumber}`);
      return false;
    }

    // Find current position on route
    let iClosest = 0;
    let minD = Infinity;
    for (let i = 0; i < routePoints.length; i++) {
      const dLat = routePoints[i][0] - tracking.currentLat;
      const dLng = routePoints[i][1] - tracking.currentLng;
      const d = dLat * dLat + dLng * dLng;
      if (d < minD) {
        minD = d;
        iClosest = i;
      }
    }

    const targetIdx = Math.min(iClosest + 1, routePoints.length - 1);

    // Calculate route context
    const dest = routePoints[routePoints.length - 1];
    const remainingDistance = haversineDistance(
      tracking.currentLat,
      tracking.currentLng,
      dest[0],
      dest[1]
    );

    let totalDistance = 0;
    for (let i = 0; i < routePoints.length - 1; i++) {
      totalDistance += haversineDistance(
        routePoints[i][0],
        routePoints[i][1],
        routePoints[i + 1][0],
        routePoints[i + 1][1]
      );
    }

    const routeContext: RouteContext = {
      routePoints,
      currentIndex: iClosest,
      totalDistance,
      remainingDistance,
      progressRatio: targetIdx / (routePoints.length - 1),
    };

    // Create vehicle state
    const vehicleState: VehicleState = {
      currentLat: tracking.currentLat,
      currentLng: tracking.currentLng,
      speed: typeof tracking.speed === 'number' ? tracking.speed : 0,
      heading: tracking.heading || 0,
      lastUpdated: tracking.lastUpdated ? new Date(tracking.lastUpdated) : new Date(),
      isStopped: tracking.isStopped || false,
      stopUntil: tracking.stopUntil || undefined,
      stopReason: tracking.stopReason || undefined,
      speedVariationOffset: tracking.speedVariationOffset || 0,
      lastVariationUpdate: tracking.lastVariationUpdate || 0,
    };

    // Calculate movement (60 seconds since this runs every minute)
    const movement = calculateMovement(vehicleState, routeContext, DEFAULT_SPEED_CONFIG);

    // Move vehicle along route
    let distToTravel = movement.distanceToTravel;
    let curLat = tracking.currentLat;
    let curLng = tracking.currentLng;
    let currentTargetIdx = targetIdx;

    while (distToTravel > 0 && currentTargetIdx < routePoints.length) {
      const aLat = curLat;
      const aLng = curLng;
      const bLat = routePoints[currentTargetIdx][0];
      const bLng = routePoints[currentTargetIdx][1];
      const dy = bLat - aLat;
      const dx = bLng - aLng;
      const segLen = haversineDistance(aLat, aLng, bLat, bLng);

      if (segLen <= distToTravel && segLen > 0) {
        curLat = bLat;
        curLng = bLng;
        distToTravel -= segLen;
        currentTargetIdx += 1;
      } else if (segLen > 0) {
        const ratio = distToTravel / segLen;
        curLat = aLat + dy * ratio;
        curLng = aLng + dx * ratio;
        distToTravel = 0;
      } else {
        currentTargetIdx += 1;
      }
    }

    // Calculate heading
    const targetPoint = routePoints[Math.min(currentTargetIdx, routePoints.length - 1)];
    const heading = calculateHeading(
      curLat,
      curLng,
      targetPoint[0],
      targetPoint[1],
      tracking.heading || 0
    );

    // Update tracking
    const updateData = {
      currentLat: curLat,
      currentLng: curLng,
      speed: movement.newSpeed,
      heading,
      lastUpdated: new Date(),
      isStopped: vehicleState.isStopped,
      stopUntil: vehicleState.stopUntil,
      stopReason: vehicleState.stopReason,
      speedVariationOffset: vehicleState.speedVariationOffset,
      lastVariationUpdate: vehicleState.lastVariationUpdate,
    };

    await vehicleTrackingModel.update({
      where: { id: tracking.id },
      data: updateData,
    });

    console.log(
      `[AUTONOMOUS] ${shipment.waybillNumber}: ${curLat.toFixed(5)},${curLng.toFixed(5)} | ${movement.newSpeed.toFixed(1)} km/h | ${(remainingDistance / 1000).toFixed(1)} km remaining`
    );

    // Check if reached destination
    const distToDest = haversineDistance(curLat, curLng, dest[0], dest[1]);
    if (distToDest < 50) {
      // Vehicle has arrived at destination - keep status as IN_TRANSIT
      // Staff will manually mark as DELIVERED after customer pickup
      console.log(
        `[AUTONOMOUS] ${shipment.waybillNumber} has arrived at destination! Waiting for pickup confirmation.`
      );

      // Stop the vehicle at destination
      await vehicleTrackingModel.update({
        where: { id: tracking.id },
        data: {
          currentLat: dest[0],
          currentLng: dest[1],
          speed: 0,
          isStopped: true,
          stopReason: 'Arrived at destination',
        },
      });

      // Create tracking event if not already created
      if (trackingEventModel) {
        const existingArrivalEvent = await trackingEventModel.findFirst({
          where: {
            shipmentId: shipment.id,
            status: 'ARRIVED',
          },
        });

        if (!existingArrivalEvent) {
          await trackingEventModel.create({
            data: {
              shipmentId: shipment.id,
              status: 'ARRIVED',
              location: `${dest[0].toFixed(5)},${dest[1].toFixed(5)}`,
              remarks: 'Cargo has arrived at destination. Waiting for pickup.',
            },
          });
        }
      }
    }

    return true;
  } catch (error) {
    console.error(`[AUTONOMOUS] Error updating ${trackingId}:`, error);
    return false;
  }
}

/**
 * Update all active vehicles
 * Called by cron job every minute
 */
export async function updateAllActiveVehicles(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  try {
    const vehicleTrackingModel = (db as any).VehicleTracking || (db as any).vehicleTracking;
    const shipmentModel = (db as any).Shipment || (db as any).shipment;

    if (!vehicleTrackingModel || !shipmentModel) {
      console.error('[AUTONOMOUS] Models not available');
      return { success: 0, failed: 0, total: 0 };
    }

    // Get all active shipments (not delivered)
    const activeShipments = await shipmentModel.findMany({
      where: {
        currentStatus: {
          not: 'DELIVERED',
        },
      },
      include: {
        tracking: true,
      },
    });

    console.log(`[AUTONOMOUS] Found ${activeShipments.length} active shipments`);

    let success = 0;
    let failed = 0;

    // Update each vehicle
    for (const shipment of activeShipments) {
      if (shipment.tracking) {
        const result = await updateVehiclePosition(shipment.tracking.id);
        if (result) {
          success++;
        } else {
          failed++;
        }
      }
    }

    console.log(
      `[AUTONOMOUS] Batch complete: ${success} success, ${failed} failed, ${activeShipments.length} total`
    );

    return {
      success,
      failed,
      total: activeShipments.length,
    };
  } catch (error) {
    console.error('[AUTONOMOUS] Error in batch update:', error);
    return { success: 0, failed: 0, total: 0 };
  }
}

/**
 * Calculate realistic ETA based on current position and speed
 */
export async function calculateRealisticETA(waybillNumber: string): Promise<{
  eta: Date | null;
  remainingDistance: number;
  estimatedMinutes: number;
}> {
  try {
    const shipmentModel = (db as any).Shipment || (db as any).shipment;

    const shipment = await shipmentModel.findFirst({
      where: { waybillNumber: { equals: waybillNumber, mode: 'insensitive' } },
      include: { tracking: true },
    });

    if (!shipment || !shipment.tracking) {
      return { eta: null, remainingDistance: 0, estimatedMinutes: 0 };
    }

    const tracking = shipment.tracking;
    const routePoints: [number, number][] = tracking.routePoints || [];

    if (routePoints.length < 2) {
      return { eta: null, remainingDistance: 0, estimatedMinutes: 0 };
    }

    // Calculate remaining distance
    const dest = routePoints[routePoints.length - 1];
    const remainingDistance = haversineDistance(
      tracking.currentLat,
      tracking.currentLng,
      dest[0],
      dest[1]
    );

    // Average speed (considering city/highway mix)
    const avgSpeed = 55; // km/h (realistic average)
    const estimatedHours = remainingDistance / 1000 / avgSpeed;
    const estimatedMinutes = Math.ceil(estimatedHours * 60);

    const eta = new Date(Date.now() + estimatedMinutes * 60 * 1000);

    return {
      eta,
      remainingDistance,
      estimatedMinutes,
    };
  } catch (error) {
    console.error('[AUTONOMOUS] Error calculating ETA:', error);
    return { eta: null, remainingDistance: 0, estimatedMinutes: 0 };
  }
}
