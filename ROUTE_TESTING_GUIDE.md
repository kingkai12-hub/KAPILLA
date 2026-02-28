# Route Geometry Testing Guide

## Quick Visual Test

### Step 1: Access a Shipment
1. Go to staff portal
2. Navigate to any shipment with tracking (status: IN_TRANSIT or DELIVERED)
3. View the tracking map

### Step 2: Check Console Logs
Open browser console (F12) and look for:

```
[TRACKING] Regenerated route with XXXX points from Origin to Destination
[MAP] Rendering route with XXXX points for accurate road geometry
```

**Expected**: 
- Routes should have 1,000+ points (5,000+ for long routes)
- Old routes (< 100 points) will show "Regenerated" message

### Step 3: Visual Inspection at Different Zoom Levels

#### Zoom Level 10-12 (City View)
✓ Route should be visible as continuous line
✓ Blue (completed) and red (remaining) sections clear
✓ Route follows general highway paths

#### Zoom Level 13-15 (Street View)
✓ Route follows major roads accurately
✓ No straight lines cutting across blocks
✓ Curves and bends visible

#### Zoom Level 16-19 (Maximum Detail)
✓ Route follows roads EXACTLY
✓ Every corner and curve followed
✓ No gaps between route and road
✓ No straight lines - all curves preserved

### Step 4: Test Specific Scenarios

#### Test 1: Urban Areas (e.g., Dar es Salaam)
- Zoom to maximum level in city center
- Route should follow street grid exactly
- Should see route following roundabouts and curves

#### Test 2: Highway Sections
- Zoom to highway between cities
- Route should follow highway curves
- No straight lines cutting across terrain

#### Test 3: Rural Roads
- Zoom to rural sections
- Route should follow winding roads
- Should see all bends and turns

## Common Issues and Solutions

### Issue: Route has straight lines
**Cause**: Old route with < 100 points
**Solution**: Refresh page - route will auto-regenerate

### Issue: Route goes off-road
**Cause**: OSRM API failure, fell back to straight line
**Solution**: Check console for OSRM errors, may need to regenerate

### Issue: Route looks simplified
**Cause**: Browser zoom too low
**Solution**: Zoom in to level 16+ to see full detail

## Test Checklist

- [ ] Console shows route has 1,000+ points
- [ ] Route follows roads at zoom level 10-12
- [ ] Route follows roads at zoom level 13-15
- [ ] Route follows roads at zoom level 16-19
- [ ] No straight lines cutting corners
- [ ] Blue/red sections transition smoothly
- [ ] Vehicle marker stays on route
- [ ] Route follows roundabouts and curves
- [ ] No gaps between route and road

## Expected Results

### Good Route (After Fix)
```
[TRACKING] Regenerated route with 9327 points from Dar es Salaam to Mbeya
[MAP] Rendering route with 9327 points for accurate road geometry
```
- Visual: Route follows every curve and corner
- Zoom: Accurate at all zoom levels
- Performance: Smooth rendering

### Bad Route (Before Fix)
```
[TRACKING] Created route with 87 points from Dar es Salaam to Mbeya
[MAP] Rendering route with 87 points for accurate road geometry
```
- Visual: Straight lines between waypoints
- Zoom: Inaccurate at high zoom
- Performance: Fast but unrealistic

## Performance Notes

- Routes with 10,000+ points render smoothly
- Leaflet uses canvas rendering for performance
- No lag or stuttering expected
- Memory usage: ~200KB per route (acceptable)

## Troubleshooting

### Route not regenerating
1. Check database connection
2. Check OSRM API availability
3. Check console for errors
4. Try manual regeneration: `node scripts/regenerate-routes.js`

### OSRM API errors
1. Check internet connection
2. OSRM may be rate-limiting (wait 1 minute)
3. Falls back to straight line (temporary)
4. Will retry on next page load

### Performance issues
1. Check browser console for errors
2. Try different browser
3. Check system resources
4. Routes > 15,000 points may need optimization

## Success Criteria

✅ Routes follow actual roads at all zoom levels
✅ No straight lines or shortcuts
✅ Professional appearance
✅ Client credibility maintained
✅ Automatic regeneration working
✅ No performance issues

## Next Steps

After verifying the fix:
1. Test with multiple shipments
2. Test different origin-destination pairs
3. Monitor console logs for errors
4. Collect user feedback
5. Document any edge cases

## Contact

If you encounter issues:
1. Check console logs
2. Take screenshots at different zoom levels
3. Note the waybill number
4. Report with details
