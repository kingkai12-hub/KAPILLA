# Road Geometry Fix - Following Actual Roads

## Problem

The route line was showing straight lines between points instead of following the actual road curves and bends.

## Root Cause

1. **smoothFactor too high**: Leaflet's `smoothFactor` was set to 1, which simplifies the polyline and removes detail
2. **Route sampling**: The route was being sampled (every 300th point) which removed road geometry details
3. **OSRM data not fully utilized**: OSRM provides detailed road geometry, but it was being over-simplified

## Solution

### 1. Reduce smoothFactor

Changed from `smoothFactor={1}` to `smoothFactor={0}` or very low value (0.1-0.3)

**What smoothFactor does:**

- `0` = No simplification, follows every point exactly (best for road geometry)
- `0.5` = Minimal simplification, keeps most detail
- `1` = Default simplification, removes some detail
- `2+` = Heavy simplification, straight lines

### 2. Use Full OSRM Route Data

OSRM already provides detailed road geometry with `overview=full&geometries=geojson`

The route points from OSRM include:

- Every curve and bend in the road
- Intersection geometry
- Roundabout curves
- Highway ramps
- All road details

### 3. Optimize Route Sampling

Instead of sampling every 300th point (which loses road detail), we:

- Use all points for short routes (< 500 points)
- Use adaptive sampling that preserves curves
- Keep points at significant turns
- Only sample straight sections

## Implementation

### Option 1: No Smoothing (Best for Road Geometry)

```typescript
<Polyline
  positions={routePoints}
  pathOptions={{
    color: '#2563eb',
    weight: 8,
    opacity: 0.9,
    lineCap: 'round',
    lineJoin: 'round',
  }}
  smoothFactor={0}  // No simplification - follows roads exactly
/>
```

### Option 2: Minimal Smoothing (Good Balance)

```typescript
<Polyline
  positions={routePoints}
  pathOptions={{
    color: '#2563eb',
    weight: 8,
    opacity: 0.9,
    lineCap: 'round',
    lineJoin: 'round',
  }}
  smoothFactor={0.3}  // Minimal simplification - keeps road curves
/>
```

### Option 3: Adaptive Sampling (Best Performance)

```typescript
// Smart sampling that preserves curves
function adaptiveSample(points: LatLng[], maxPoints: number = 1000): LatLng[] {
  if (points.length <= maxPoints) return points;

  const sampled: LatLng[] = [points[0]]; // Always keep first point
  const step = points.length / maxPoints;

  for (let i = 1; i < points.length - 1; i++) {
    // Calculate angle change at this point
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    const angle1 = Math.atan2(curr[1] - prev[1], curr[0] - prev[0]);
    const angle2 = Math.atan2(next[1] - curr[1], next[0] - curr[0]);
    const angleDiff = Math.abs(angle2 - angle1);

    // Keep point if it's a significant turn or at regular interval
    if (angleDiff > 0.1 || i % Math.floor(step) === 0) {
      sampled.push(curr);
    }
  }

  sampled.push(points[points.length - 1]); // Always keep last point
  return sampled;
}
```

## OSRM Configuration

### Current Setup (Good)

```typescript
const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=false`;
```

**Parameters:**

- `overview=full` ✅ - Returns complete route geometry
- `geometries=geojson` ✅ - Returns coordinates in GeoJSON format
- `steps=false` ✅ - No turn-by-turn instructions (faster)

### Enhanced Options (Optional)

```typescript
const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=false&continue_straight=false`;
```

**Additional parameters:**

- `continue_straight=false` - Allows turns at intersections (more accurate)
- `annotations=true` - Adds speed, duration, distance per segment
- `alternatives=false` - Only return best route (faster)

## Visual Comparison

### Before (smoothFactor=1, sampled every 300 points)

```
Start -------- Turn -------- Turn -------- End
      (straight)    (straight)    (straight)
```

❌ Looks like straight lines, ignores road curves

### After (smoothFactor=0, all points)

```
Start ~~~curve~~~ Turn ~~~curve~~~ Turn ~~~curve~~~ End
      (follows road)  (follows road)  (follows road)
```

✅ Follows actual road geometry with all curves and bends

## Performance Considerations

### Route Point Counts

- Short route (< 100km): ~500-1000 points
- Medium route (100-300km): ~1000-3000 points
- Long route (> 300km): ~3000-5000 points

### Rendering Performance

- **< 1000 points**: Instant rendering, no optimization needed
- **1000-3000 points**: Fast rendering, consider adaptive sampling
- **> 3000 points**: May need optimization, use adaptive sampling

### Memory Usage

- Each point: ~16 bytes (2 floats)
- 1000 points: ~16 KB
- 5000 points: ~80 KB
- **Conclusion**: Memory is not a concern, use all points

## Implementation Steps

### Step 1: Update DynamicRoutePolyline

```typescript
// Change smoothFactor from 1 to 0
smoothFactor={0}  // No simplification
```

### Step 2: Remove Aggressive Sampling

```typescript
// Before: Sample every 300th point
const step = Math.max(1, Math.floor(pts.length / 300));

// After: Use all points or adaptive sampling
const step = 1; // Use all points
// OR
const sampled = adaptiveSample(pts, 1000); // Smart sampling
```

### Step 3: Test with Real Routes

1. Load a route from Dar es Salaam to Mwanza
2. Zoom in to see road curves
3. Verify line follows roads exactly
4. Check performance (should be smooth)

## Configuration Options

### For Maximum Accuracy (Recommended)

```typescript
<DynamicRoutePolyline
  routePoints={fullRoutePoints}  // All points from OSRM
  currentPosition={vehiclePosition}
  completedColor="#2563eb"
  remainingColor="#ef4444"
  completedWeight={8}
  remainingWeight={6}
  smoothFactor={0}  // No simplification
/>
```

### For Balanced Performance

```typescript
<DynamicRoutePolyline
  routePoints={adaptiveSample(fullRoutePoints, 1000)}
  currentPosition={vehiclePosition}
  completedColor="#2563eb"
  remainingColor="#ef4444"
  completedWeight={8}
  remainingWeight={6}
  smoothFactor={0.2}  // Minimal simplification
/>
```

### For Maximum Performance (Long Routes)

```typescript
<DynamicRoutePolyline
  routePoints={adaptiveSample(fullRoutePoints, 500)}
  currentPosition={vehiclePosition}
  completedColor="#2563eb"
  remainingColor="#ef4444"
  completedWeight={8}
  remainingWeight={6}
  smoothFactor={0.5}  // Some simplification
/>
```

## Testing Checklist

- [ ] Route follows roads at zoom level 15+
- [ ] Curves and bends are visible
- [ ] No straight lines through curves
- [ ] Roundabouts show as circles
- [ ] Highway ramps follow actual geometry
- [ ] Performance is acceptable (< 100ms render)
- [ ] No visual glitches or gaps

## Expected Results

### Urban Areas

- Route follows street grid
- Shows turns at intersections
- Follows curved streets
- Shows roundabouts as circles

### Highways

- Follows highway curves
- Shows on/off ramps
- Displays highway bends
- Accurate interchange geometry

### Rural Areas

- Follows winding roads
- Shows mountain curves
- Displays valley routes
- Accurate terrain following

## Conclusion

By setting `smoothFactor={0}` and using all OSRM route points, the route line will follow the actual road geometry perfectly, showing all curves, bends, and road details as they appear on the map.
