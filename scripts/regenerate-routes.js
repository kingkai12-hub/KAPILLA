/**
 * Script to regenerate all vehicle tracking routes with maximum OSRM detail
 * This ensures all routes follow actual roads accurately with no shortcuts
 * 
 * Usage: node scripts/regenerate-routes.js
 */

const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

// Location coordinates mapping
const LOCATIONS = {
  'Dar es Salaam': { lat: -6.7924, lng: 39.2083 },
  'Dodoma': { lat: -6.1630, lng: 35.7516 },
  'Arusha': { lat: -3.3869, lng: 36.6830 },
  'Mwanza': { lat: -2.5164, lng: 32.9033 },
  'Mbeya': { lat: -8.9094, lng: 33.4606 },
  'Morogoro': { lat: -6.8211, lng: 37.6636 },
  'Tanga': { lat: -5.0689, lng: 39.0982 },
  'Zanzibar': { lat: -6.1659, lng: 39.2026 },
  'Moshi': { lat: -3.3397, lng: 37.3407 },
  'Iringa': { lat: -7.7697, lng: 35.6989 },
  'Tabora': { lat: -5.0167, lng: 32.8000 },
  'Kigoma': { lat: -4.8772, lng: 29.6289 },
  'Singida': { lat: -4.8164, lng: 34.7442 },
  'Shinyanga': { lat: -3.6636, lng: 33.4211 },
  'Bukoba': { lat: -1.3314, lng: 31.8122 },
  'Musoma': { lat: -1.5000, lng: 33.8000 },
  'Lindi': { lat: -9.9971, lng: 39.7178 },
  'Mtwara': { lat: -10.2692, lng: 40.1836 },
  'Sumbawanga': { lat: -7.9667, lng: 31.6167 },
  'Mpanda': { lat: -6.3500, lng: 31.0667 },
};

function getLocationCoords(locationName) {
  return LOCATIONS[locationName] || null;
}

/**
 * Get detailed road route from OSRM with MAXIMUM geometry detail
 */
async function getRoadRoute(startLat, startLng, endLat, endLng) {
  const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&continue_straight=false&steps=true&annotations=true`;
  
  try {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const coords = data?.routes?.[0]?.geometry?.coordinates?.map(c => [c[1], c[0]]) || null;
      if (coords && coords.length > 1) {
        console.log(`  ✓ Fetched route with ${coords.length} points`);
        return coords;
      }
    }
  } catch (err) {
    console.error('  ✗ OSRM Error:', err.message);
  }
  
  // Fallback to straight line
  console.warn('  ⚠ Falling back to straight line');
  return [[startLat, startLng], [endLat, endLng]];
}

async function regenerateRoutes() {
  console.log('🚀 Starting route regeneration...\n');
  
  try {
    // Get all shipments with tracking
    const shipments = await db.shipment.findMany({
      where: {
        tracking: {
          isNot: null
        }
      },
      include: {
        tracking: true
      }
    });
    
    console.log(`Found ${shipments.length} shipments with tracking\n`);
    
    let regenerated = 0;
    let skipped = 0;
    let failed = 0;
    
    for (const shipment of shipments) {
      console.log(`Processing: ${shipment.waybillNumber}`);
      console.log(`  Route: ${shipment.origin} → ${shipment.destination}`);
      
      const startCoords = getLocationCoords(shipment.origin);
      const endCoords = getLocationCoords(shipment.destination);
      
      if (!startCoords || !endCoords) {
        console.log(`  ⚠ Unknown location, skipping`);
        skipped++;
        continue;
      }
      
      // Get new detailed route from OSRM
      const routePoints = await getRoadRoute(
        startCoords.lat,
        startCoords.lng,
        endCoords.lat,
        endCoords.lng
      );
      
      if (!routePoints || routePoints.length < 2) {
        console.log(`  ✗ Failed to get route`);
        failed++;
        continue;
      }
      
      try {
        // Delete old segments
        await db.routeSegment.deleteMany({
          where: { trackingId: shipment.tracking.id }
        });
        
        // Create new segments
        const segmentsData = [];
        for (let i = 0; i < routePoints.length - 1; i++) {
          const a = routePoints[i];
          const b = routePoints[i + 1];
          segmentsData.push({
            startLat: a[0],
            startLng: a[1],
            endLat: b[0],
            endLng: b[1],
            isCompleted: false,
            order: i
          });
        }
        
        // Update tracking with new route
        await db.vehicleTracking.update({
          where: { id: shipment.tracking.id },
          data: {
            routePoints: routePoints,
            segments: {
              create: segmentsData
            }
          }
        });
        
        console.log(`  ✓ Regenerated with ${routePoints.length} points and ${segmentsData.length} segments`);
        regenerated++;
        
      } catch (err) {
        console.log(`  ✗ Database error: ${err.message}`);
        failed++;
      }
      
      console.log('');
      
      // Rate limit to avoid overwhelming OSRM
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n📊 Summary:');
    console.log(`  ✓ Regenerated: ${regenerated}`);
    console.log(`  ⚠ Skipped: ${skipped}`);
    console.log(`  ✗ Failed: ${failed}`);
    console.log(`  Total: ${shipments.length}`);
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  } finally {
    await db.$disconnect();
  }
}

// Run the script
regenerateRoutes();
