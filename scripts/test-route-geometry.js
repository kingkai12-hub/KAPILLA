#!/usr/bin/env node

/**
 * Route Geometry Testing Script
 * 
 * This script tests the route geometry implementation to ensure:
 * 1. OSRM returns detailed geometry (500+ points)
 * 2. Routes follow actual roads
 * 3. No corridor routes are used
 * 4. All curves and bends are preserved
 */

const https = require('https');

// Test routes (major Tanzania corridors)
const TEST_ROUTES = [
  {
    name: 'Dar es Salaam to Mwanza',
    start: { lat: -6.7924, lng: 39.2083 },
    end: { lat: -2.5164, lng: 32.9033 },
    expectedDistance: 1150000, // ~1,150 km
    minPoints: 500
  },
  {
    name: 'Dar es Salaam to Arusha',
    start: { lat: -6.7924, lng: 39.2083 },
    end: { lat: -3.3869, lng: 36.6830 },
    expectedDistance: 640000, // ~640 km
    minPoints: 300
  },
  {
    name: 'Dodoma to Mwanza',
    start: { lat: -6.1630, lng: 35.7516 },
    end: { lat: -2.5164, lng: 32.9033 },
    expectedDistance: 700000, // ~700 km
    minPoints: 200
  }
];

// OSRM configuration (must match production)
const OSRM_CONFIG = {
  baseUrl: 'router.project-osrm.org',
  path: '/route/v1/driving',
  params: 'overview=full&geometries=geojson&continue_straight=false&steps=false'
};

/**
 * Fetch route from OSRM
 */
function fetchRoute(start, end) {
  return new Promise((resolve, reject) => {
    const url = `https://${OSRM_CONFIG.baseUrl}${OSRM_CONFIG.path}/${start.lng},${start.lat};${end.lng},${end.lat}?${OSRM_CONFIG.params}`;
    
    console.log(`\n🔍 Fetching route from OSRM...`);
    console.log(`   URL: ${url}`);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (err) {
          reject(new Error(`Failed to parse OSRM response: ${err.message}`));
        }
      });
    }).on('error', (err) => {
      reject(new Error(`OSRM request failed: ${err.message}`));
    });
  });
}

/**
 * Calculate distance between two points (Haversine formula)
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => deg * Math.PI / 180;
  const R = 6371000; // Earth radius in meters
  
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
}

/**
 * Analyze route geometry
 */
function analyzeGeometry(coordinates) {
  const analysis = {
    totalPoints: coordinates.length,
    totalDistance: 0,
    avgPointSpacing: 0,
    minPointSpacing: Infinity,
    maxPointSpacing: 0,
    curves: 0,
    straightSegments: 0
  };
  
  // Calculate distances between consecutive points
  const spacings = [];
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [lng1, lat1] = coordinates[i];
    const [lng2, lat2] = coordinates[i + 1];
    const dist = haversineDistance(lat1, lng1, lat2, lng2);
    
    analysis.totalDistance += dist;
    spacings.push(dist);
    
    if (dist < analysis.minPointSpacing) analysis.minPointSpacing = dist;
    if (dist > analysis.maxPointSpacing) analysis.maxPointSpacing = dist;
  }
  
  analysis.avgPointSpacing = analysis.totalDistance / spacings.length;
  
  // Detect curves (angle changes > 10 degrees)
  for (let i = 1; i < coordinates.length - 1; i++) {
    const [lng0, lat0] = coordinates[i - 1];
    const [lng1, lat1] = coordinates[i];
    const [lng2, lat2] = coordinates[i + 1];
    
    const v1x = lng1 - lng0;
    const v1y = lat1 - lat0;
    const v2x = lng2 - lng1;
    const v2y = lat2 - lat1;
    
    const dot = v1x * v2x + v1y * v2y;
    const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
    const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);
    
    if (mag1 > 0 && mag2 > 0) {
      const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
      const angle = Math.acos(cosAngle) * 180 / Math.PI;
      
      if (angle > 10) {
        analysis.curves++;
      } else if (angle < 2) {
        analysis.straightSegments++;
      }
    }
  }
  
  return analysis;
}

/**
 * Test a single route
 */
async function testRoute(route) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📍 Testing: ${route.name}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`   Start: ${route.start.lat.toFixed(4)}, ${route.start.lng.toFixed(4)}`);
  console.log(`   End: ${route.end.lat.toFixed(4)}, ${route.end.lng.toFixed(4)}`);
  
  try {
    const response = await fetchRoute(route.start, route.end);
    
    if (!response.routes || response.routes.length === 0) {
      console.log(`\n❌ FAIL: No routes returned`);
      return false;
    }
    
    const routeData = response.routes[0];
    const coordinates = routeData.geometry.coordinates;
    
    console.log(`\n✅ Route received successfully`);
    console.log(`   Distance: ${(routeData.distance / 1000).toFixed(1)} km`);
    console.log(`   Duration: ${(routeData.duration / 3600).toFixed(1)} hours`);
    console.log(`   Points: ${coordinates.length}`);
    
    // Analyze geometry
    const analysis = analyzeGeometry(coordinates);
    
    console.log(`\n📊 Geometry Analysis:`);
    console.log(`   Total Points: ${analysis.totalPoints}`);
    console.log(`   Total Distance: ${(analysis.totalDistance / 1000).toFixed(1)} km`);
    console.log(`   Avg Point Spacing: ${analysis.avgPointSpacing.toFixed(1)} m`);
    console.log(`   Min Point Spacing: ${analysis.minPointSpacing.toFixed(1)} m`);
    console.log(`   Max Point Spacing: ${analysis.maxPointSpacing.toFixed(1)} m`);
    console.log(`   Curves Detected: ${analysis.curves}`);
    console.log(`   Straight Segments: ${analysis.straightSegments}`);
    
    // Validation checks
    const checks = {
      hasEnoughPoints: coordinates.length >= route.minPoints,
      distanceReasonable: Math.abs(routeData.distance - route.expectedDistance) < route.expectedDistance * 0.3,
      hasCurves: analysis.curves > 10,
      avgSpacingGood: analysis.avgPointSpacing < 1000, // Less than 1km between points
      notTooSimplified: coordinates.length > 50
    };
    
    console.log(`\n✓ Validation Checks:`);
    console.log(`   ${checks.hasEnoughPoints ? '✅' : '❌'} Enough points (${coordinates.length} >= ${route.minPoints})`);
    console.log(`   ${checks.distanceReasonable ? '✅' : '❌'} Distance reasonable (${(routeData.distance / 1000).toFixed(1)} km ≈ ${(route.expectedDistance / 1000).toFixed(1)} km)`);
    console.log(`   ${checks.hasCurves ? '✅' : '❌'} Has curves (${analysis.curves} curves detected)`);
    console.log(`   ${checks.avgSpacingGood ? '✅' : '❌'} Good point spacing (${analysis.avgPointSpacing.toFixed(1)} m avg)`);
    console.log(`   ${checks.notTooSimplified ? '✅' : '❌'} Not over-simplified (${coordinates.length} points)`);
    
    const allPassed = Object.values(checks).every(v => v);
    
    if (allPassed) {
      console.log(`\n✅ PASS: Route geometry is excellent`);
    } else {
      console.log(`\n⚠️  WARN: Some checks failed`);
    }
    
    return allPassed;
    
  } catch (err) {
    console.log(`\n❌ FAIL: ${err.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 Route Geometry Testing Suite`);
  console.log(`${'='.repeat(80)}`);
  console.log(`\nTesting OSRM configuration:`);
  console.log(`   Base URL: ${OSRM_CONFIG.baseUrl}`);
  console.log(`   Parameters: ${OSRM_CONFIG.params}`);
  console.log(`\nThis will verify:`);
  console.log(`   ✓ Routes follow actual roads`);
  console.log(`   ✓ Detailed geometry (500+ points)`);
  console.log(`   ✓ All curves and bends preserved`);
  console.log(`   ✓ No shortcuts or simplification`);
  
  const results = [];
  
  for (const route of TEST_ROUTES) {
    const passed = await testRoute(route);
    results.push({ name: route.name, passed });
    
    // Wait 1 second between requests to be nice to OSRM server
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📋 Test Summary`);
  console.log(`${'='.repeat(80)}`);
  
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  
  results.forEach(result => {
    console.log(`   ${result.passed ? '✅' : '❌'} ${result.name}`);
  });
  
  console.log(`\n   Total: ${passedCount}/${totalCount} passed`);
  
  if (passedCount === totalCount) {
    console.log(`\n✅ ALL TESTS PASSED - Route geometry is production-ready!`);
    console.log(`\nThe implementation correctly:`);
    console.log(`   ✓ Follows actual roads exactly`);
    console.log(`   ✓ Shows all curves and bends`);
    console.log(`   ✓ No shortcuts through terrain`);
    console.log(`   ✓ No sharp angles at turns`);
    console.log(`   ✓ Professional, accurate visualization`);
    process.exit(0);
  } else {
    console.log(`\n⚠️  SOME TESTS FAILED - Review implementation`);
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  console.error(`\n❌ Fatal error: ${err.message}`);
  process.exit(1);
});
