# Visual Testing Guide - Route Geometry Verification

## Overview

This guide provides step-by-step instructions for visually verifying that routes follow actual roads with all curves and bends, no shortcuts, and professional accuracy.

---

## Prerequisites

1. Development server running: `npm run dev`
2. Browser with DevTools (Chrome, Firefox, Edge)
3. Test shipment with tracking enabled
4. Good internet connection (for map tiles and OSRM)

---

## Test 1: Basic Route Accuracy

### Steps:
1. Navigate to tracking page: `http://localhost:3000/track?waybill=TEST001`
2. Wait for map to load completely
3. Zoom to level 14-16 (highway view)
4. Visually compare route line with map roads

### Expected Results:
- ✅ Route line overlays exactly on map roads
- ✅ No shortcuts cutting across terrain
- ✅ Route follows road network precisely
- ✅ Line stays on roads at all zoom levels

### Pass Criteria:
Route line must be directly on top of map roads with no visible gaps or shortcuts.

---

## Test 2: Curve and Bend Accuracy

### Steps:
1. Find a section of route with visible curves
2. Zoom to level 16-18 (detailed view)
3. Observe how route line follows curves
4. Check multiple curved sections

### Expected Results:
- ✅ All curves are smooth and natural
- ✅ Route follows every bend in the road
- ✅ No straight-line simplification
- ✅ Curves match road geometry exactly

### Pass Criteria:
Every curve in the road must be visible in the route line with no straight-line shortcuts.

---

## Test 3: Urban Area Accuracy

### Steps:
1. Zoom to urban area (Dar es Salaam, Mwanza, etc.)
2. Set zoom level to 17-18 (street level)
3. Observe route through city streets
4. Check intersections and turns

### Expected Results:
- ✅ Route follows street grid exactly
- ✅ Turns at intersections are smooth
- ✅ No shortcuts through buildings
- ✅ Street-level accuracy maintained

### Pass Criteria:
Route must follow city streets precisely with proper turns at intersections.

---

## Test 4: Roundabout Verification

### Steps:
1. Find a roundabout on the route
2. Zoom to level 18 (maximum detail)
3. Observe roundabout geometry
4. Check entry and exit curves

### Expected Results:
- ✅ Roundabout appears as a circle
- ✅ Entry curve is smooth
- ✅ Exit curve is smooth
- ✅ No angular corners

### Pass Criteria:
Roundabouts must appear as smooth circles, not polygons or angular shapes.

---

## Test 5: Highway Interchange Accuracy

### Steps:
1. Find a highway interchange on the route
2. Zoom to level 16-17
3. Observe ramp geometry
4. Check multiple ramps if available

### Expected Results:
- ✅ Ramps curve naturally
- ✅ No straight-line ramps
- ✅ Interchange geometry accurate
- ✅ All ramps follow road geometry

### Pass Criteria:
Highway ramps must curve smoothly following actual road geometry.

---

## Test 6: Long-Distance Route Quality

### Steps:
1. Load a long route (500+ km)
2. Pan along entire route
3. Check multiple sections
4. Verify consistency

### Expected Results:
- ✅ Consistent quality throughout
- ✅ No sudden simplification
- ✅ All sections follow roads
- ✅ No performance issues

### Pass Criteria:
Route quality must be consistent from start to end with no degradation.

---

## Test 7: Performance Verification

### Steps:
1. Open browser DevTools (F12)
2. Go to Performance tab
3. Start recording
4. Interact with map (pan, zoom) for 10 seconds
5. Stop recording and analyze

### Expected Results:
- ✅ Frame rate: 55-60 fps
- ✅ No dropped frames
- ✅ Smooth animations
- ✅ No lag or stuttering

### Pass Criteria:
Map must maintain 55+ fps during all interactions.

---

## Test 8: Route Point Count Verification

### Steps:
1. Open browser console (F12 → Console)
2. Load tracking page
3. Run this command:
```javascript
fetch('/api/tracking?waybillNumber=TEST001')
  .then(r => r.json())
  .then(data => {
    console.log('Route Points:', data.routePoints?.length || 0);
    console.log('Expected: 500-3000 for long routes');
    console.log('Expected: 100-500 for short routes');
  });
```

### Expected Results:
- ✅ Long routes (500+ km): 500-3000 points
- ✅ Medium routes (200-500 km): 200-800 points
- ✅ Short routes (< 200 km): 100-400 points

### Pass Criteria:
Point count must be appropriate for route distance (not simplified to < 100 points).

---

## Test 9: OSRM Configuration Verification

### Steps:
1. Open browser Network tab (F12 → Network)
2. Filter by "osrm"
3. Load tracking page
4. Check OSRM request URL

### Expected URL Parameters:
```
overview=full
geometries=geojson
continue_straight=false
steps=false
```

### Expected Results:
- ✅ All parameters present
- ✅ overview=full (not simplified)
- ✅ geometries=geojson (detailed format)
- ✅ continue_straight=false (allows turns)

### Pass Criteria:
OSRM request must include all required parameters for maximum detail.

---

## Test 10: No Corridor Routes Verification

### Steps:
1. Open browser console
2. Load tracking page
3. Check for corridor route warnings:
```javascript
// Should NOT see any of these in console:
// "Using corridor route"
// "buildCorridorRoute"
// "corridorDefinitions"
```

### Expected Results:
- ✅ No corridor route messages
- ✅ Only OSRM route messages
- ✅ Log shows: "Fetched route with XXX points"

### Pass Criteria:
No corridor route code should be executed (all removed).

---

## Test 11: Smooth Factor Verification

### Steps:
1. Open browser DevTools → Elements
2. Inspect route polyline element
3. Check Leaflet polyline options
4. Verify smoothFactor setting

### Expected Results:
- ✅ smoothFactor: 0 (no simplification)
- ✅ lineCap: 'round'
- ✅ lineJoin: 'round'

### Pass Criteria:
smoothFactor must be 0 to preserve all geometry detail.

---

## Test 12: Mobile Device Testing

### Steps:
1. Open DevTools → Device Toolbar (Ctrl+Shift+M)
2. Select mobile device (iPhone, Android)
3. Test map interactions
4. Verify route quality

### Expected Results:
- ✅ Route quality same as desktop
- ✅ Smooth performance
- ✅ Touch interactions work
- ✅ No visual glitches

### Pass Criteria:
Mobile experience must match desktop quality.

---

## Automated Testing Script

Run the automated test script:

```bash
cd kapilla-logistics
node scripts/test-route-geometry.js
```

This will:
- Test multiple routes
- Verify point counts
- Check geometry quality
- Validate OSRM responses
- Report pass/fail status

---

## Common Issues and Solutions

### Issue: Route shows straight lines
**Cause:** OSRM not returning detailed geometry
**Solution:** Check OSRM URL parameters, verify `overview=full`

### Issue: Route has sharp angles
**Cause:** smoothFactor > 0 or corridor routes
**Solution:** Set smoothFactor=0, remove corridor routes

### Issue: Route shortcuts through terrain
**Cause:** Corridor routes being used
**Solution:** Ensure buildCorridorRoute is completely removed

### Issue: Not enough detail
**Cause:** Route sampling too aggressive
**Solution:** Reduce sampling threshold or use all points

### Issue: Performance problems
**Cause:** Too many points or inefficient rendering
**Solution:** Optimize with useMemo, check point count

---

## Success Criteria Summary

The route visualization PASSES if ALL of these are true:

1. ✅ Route overlays exactly on map roads at zoom 16+
2. ✅ All curves and bends are visible (no simplification)
3. ✅ No shortcuts through terrain or buildings
4. ✅ Turns are smooth with no sharp angles
5. ✅ Roundabouts appear as circles
6. ✅ Highway ramps curve naturally
7. ✅ Performance is smooth (55+ fps)
8. ✅ Point count is appropriate (500+ for long routes)
9. ✅ OSRM parameters are correct
10. ✅ No corridor routes in use
11. ✅ smoothFactor is 0
12. ✅ Mobile experience matches desktop

---

## Reporting Issues

If any test fails, document:
1. Which test failed
2. Screenshot of the issue
3. Browser console logs
4. Network tab OSRM request/response
5. Route details (origin, destination, waybill)

---

## Final Verification Checklist

Before marking as complete:

- [ ] All 12 tests pass
- [ ] Automated script passes
- [ ] No console errors
- [ ] Performance is acceptable
- [ ] Mobile testing complete
- [ ] Multiple routes tested
- [ ] Different route lengths tested
- [ ] Urban and highway sections tested
- [ ] Roundabouts verified
- [ ] Interchanges verified
- [ ] Documentation reviewed
- [ ] Code review complete

---

## Conclusion

If all tests pass, the route geometry implementation is:
- ✅ Production-ready
- ✅ Professionally accurate
- ✅ Following actual roads exactly
- ✅ Showing all curves and bends
- ✅ No shortcuts or simplification
- ✅ Meeting all requirements

The system is ready for deployment.
