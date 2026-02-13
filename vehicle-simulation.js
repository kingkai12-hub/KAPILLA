import { db } from './lib/db';
import axios from 'axios';

async function simulate() {
  console.log('Starting Vehicle Simulation...');

  while (true) {
    try {
      const activeTracking = await db.vehicleTracking.findMany({
        include: { segments: { orderBy: { order: 'asc' } } }
      });

      for (const track of activeTracking) {
        const nextSegment = track.segments.find(s => !s.isCompleted);
        
        if (nextSegment) {
          // Calculate movement
          // Urban detection: simple logic - if within 5km of start or end, it's urban
          const isUrban = nextSegment.order < 5 || nextSegment.order > (track.segments.length - 5);
          const speed = isUrban ? Math.random() * 30 + 20 : Math.random() * 40 + 60; // 20-50 km/h urban, 60-100 rural
          
          // Move current position to end of this segment
          await db.vehicleTracking.update({
            where: { id: track.id },
            data: {
              currentLat: nextSegment.endLat,
              currentLng: nextSegment.endLng,
              speed: speed,
              lastUpdated: new Date()
            }
          });

          // Mark segment as completed
          await db.routeSegment.update({
            where: { id: nextSegment.id },
            data: { isCompleted: true }
          });

          console.log(`Shipment ${track.shipmentId}: Moved to next segment at ${speed.toFixed(1)} km/h`);
        } else {
          // Reset for demo purposes if all completed
          await db.routeSegment.updateMany({
            where: { trackingId: track.id },
            data: { isCompleted: false }
          });
          const firstSegment = track.segments[0];
          await db.vehicleTracking.update({
            where: { id: track.id },
            data: {
              currentLat: firstSegment.startLat,
              currentLng: firstSegment.startLng,
              speed: 0
            }
          });
          console.log(`Shipment ${track.shipmentId}: Route completed, resetting for demo.`);
        }
      }
    } catch (error) {
      console.error('Simulation error:', error);
    }

    await new Promise(resolve => setTimeout(resolve, 2000)); // Update every 2 seconds
  }
}

simulate();
