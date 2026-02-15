# Map Enhancement Plan - Advanced Geographic Features

## Objective

Enhance the tracking map with detailed geographic information including:

- Road geometry (lanes, curves, junctions)
- Visible place names (towns, streets, landmarks)
- Major points of interest
- Better visual context for tracking

## Current State

- Basic OpenStreetMap tiles
- Simple route polylines
- Vehicle marker
- No labels or landmarks

## Proposed Enhancements

### 1. Enhanced Map Tiles

**Options:**

- **Mapbox Streets** - Detailed streets, labels, POIs (requires API key)
- **Google Maps** - Best labels and POIs (requires API key, licensing)
- **OpenStreetMap with Labels** - Free, good labels
- **Thunderforest Transport** - Shows road types, lanes (requires API key)

**Recommendation:** Start with enhanced OSM, add Mapbox as premium option

### 2. Road Geometry Features

- **Road Classification**: Highway, arterial, local roads
- **Lane Information**: Number of lanes where available
- **Road Curves**: Highlight sharp turns and curves
- **Junctions**: Mark intersections and roundabouts
- **Road Surface**: Paved vs unpaved

### 3. Place Names & Labels

- **Cities/Towns**: Major population centers
- **Neighborhoods**: District names
- **Street Names**: Visible at appropriate zoom levels
- **Landmarks**: Airports, stations, hospitals, universities
- **Natural Features**: Rivers, lakes, mountains

### 4. Points of Interest (POI)

- **Transport Hubs**: Airports, bus stations, train stations
- **Fuel Stations**: Gas stations along route
- **Rest Areas**: Service areas on highways
- **Checkpoints**: Border crossings, toll gates
- **Emergency Services**: Hospitals, police stations

### 5. Visual Enhancements

- **Route Highlighting**: Different colors for road types
- **Elevation Profile**: Show terrain elevation
- **Traffic Layers**: Real-time traffic (if available)
- **Weather Overlay**: Current weather conditions
- **Night Mode**: Dark theme for night driving

## Implementation Approach

### Phase 1: Enhanced Tiles (30 min)

1. Add multiple tile layer options
2. Implement tile layer switcher
3. Add labels overlay
4. Test performance

### Phase 2: Custom Markers (30 min)

1. Add city markers along route
2. Add POI markers (fuel, rest areas)
3. Add landmark icons
4. Implement marker clustering

### Phase 3: Route Enhancement (45 min)

1. Color-code route by road type
2. Add junction markers
3. Highlight sharp curves
4. Show distance markers

### Phase 4: Information Panels (45 min)

1. Route summary panel
2. Upcoming landmarks panel
3. POI details on click
4. Distance to next city

## Technical Implementation

### Map Tile Providers

```typescript
const tileProviders = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
  },
  osmLabels: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    labels: true,
  },
  mapbox: {
    url: 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token={accessToken}',
    attribution: '© Mapbox © OpenStreetMap',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri',
  },
};
```

### POI Data Structure

```typescript
interface POI {
  id: string;
  type: 'fuel' | 'rest' | 'hospital' | 'landmark' | 'checkpoint';
  name: string;
  lat: number;
  lng: number;
  icon: string;
  description?: string;
  distanceFromRoute: number;
}
```

### Road Segment Classification

```typescript
interface RoadSegment {
  start: LatLng;
  end: LatLng;
  type: 'highway' | 'arterial' | 'local' | 'unpaved';
  lanes?: number;
  curvature: 'straight' | 'gentle' | 'sharp';
  speedLimit?: number;
}
```

## Data Sources

### Free Sources

1. **OpenStreetMap Overpass API** - POIs, road data
2. **Nominatim** - Geocoding, place names
3. **OSRM** - Already using for routing
4. **Natural Earth Data** - Geographic features

### Premium Sources (Optional)

1. **Mapbox** - Best tiles and geocoding
2. **Google Maps** - Comprehensive POI data
3. **HERE Maps** - Traffic and road details
4. **TomTom** - Real-time traffic

## Cost Considerations

### Free Tier Limits

- OpenStreetMap: Unlimited (fair use)
- Nominatim: 1 request/second
- OSRM: Unlimited (public server)

### Premium Pricing (if needed)

- Mapbox: 50,000 free requests/month
- Google Maps: $200 free credit/month
- HERE: 250,000 free transactions/month

## Performance Optimization

1. **Marker Clustering**: Group nearby POIs
2. **Lazy Loading**: Load POIs only in viewport
3. **Caching**: Cache POI data locally
4. **Level of Detail**: Show more detail at higher zoom
5. **Debouncing**: Limit API calls on pan/zoom

## User Experience

### Map Controls

- Layer switcher (Street/Satellite/Hybrid)
- POI filter (show/hide categories)
- Labels toggle
- Zoom to route
- Fullscreen mode

### Information Display

- Hover tooltips on POIs
- Click for detailed info
- Distance to next landmark
- Estimated time to POI
- Route progress indicator

## Implementation Priority

### High Priority (Implement Now)

1. ✅ Enhanced tile layers with labels
2. ✅ City markers along route
3. ✅ Major landmarks (airports, stations)
4. ✅ Layer switcher control

### Medium Priority (Next Sprint)

5. POI markers (fuel, rest areas)
6. Road type color coding
7. Junction markers
8. Information panels

### Low Priority (Future)

9. Traffic overlay
10. Weather overlay
11. Elevation profile
12. Night mode

## Next Steps

1. Implement enhanced tile layers
2. Add city/landmark markers
3. Create layer switcher UI
4. Test performance with multiple layers
5. Gather user feedback
6. Iterate based on usage

## Success Metrics

- Map loads in < 2 seconds
- POI markers visible at appropriate zoom
- Labels readable without clutter
- No performance degradation
- User engagement increases
- Fewer "where is the vehicle" questions
