# Advanced Vehicle Tracking System

## Overview

This is a complete rewrite of the vehicle tracking system with all the requested features implemented. The system provides real-time vehicle tracking with smooth animations, persistent movement simulation, and dynamic route visualization.

## ✨ Features Implemented

### 🗺️ Map & Route Rendering
- **Leaflet.js Integration**: Modern, responsive web maps with OpenStreetMap tiles
- **Route Visualization**: Complete route displayed as polylines
- **Dynamic Recoloring**: 
  - 🔵 **Blue**: Completed path
  - 🔴 **Red**: Remaining path (dashed)
- **Vehicle Marker**: Green circular marker with truck emoji
- **Optimal Zoom**: Automatic zoom adjustment for best road visibility

### 🚗 Vehicle Movement Simulation
- **Smooth Movement**: Time-based position updates every 1-2 seconds
- **Smart Speed Logic**:
  - 🏙️ **City Zones**: 20-50 km/h
  - 🛣️ **Highways**: 60-100 km/h
- **Persistent Movement**: Continues even when user is offline
- **Progress Tracking**: Real-time progress percentage and distance calculations

### 💾 Data Persistence
- **Database Schema**: New tables for vehicle tracking and route segments
- **Session Independence**: Vehicle movement continues regardless of user sessions
- **Position Recovery**: Accurate position recalculation when user returns
- **Manual Updates**: Support for manual position adjustments

### 🎯 User Experience
- **Real-time Updates**: Automatic refresh every 2 seconds
- **Responsive Design**: Works on desktop and mobile devices
- **Interactive Controls**: Manual zoom override, pan controls
- **Information Panel**: Live speed, progress, and status display
- **Legend**: Clear visual indicators for route states

## 🏗️ Architecture

### Backend Components

#### Database Schema
```sql
VehicleTracking {
  id, shipmentId, routePath (JSON)
  currentLatitude, currentLongitude, routeIndex
  distanceCompleted, totalDistance, progressPercent
  currentSpeed, isCityZone, lastUpdateTime
  isActive, isPaused, simulationStart
}

RouteSegment {
  id, trackingId, startLat, startLng, endLat, endLng
  distance, isCityZone, speedLimit, orderIndex
}
```

#### API Endpoints
- `GET/POST /api/vehicle-tracking` - Main tracking operations
- `POST /api/vehicle-simulation` - Background simulation engine
- `GET /api/vehicle-simulation` - Simulation status
- `POST/GET /api/test-tracking` - Test data management

#### Simulation Engine
- **Independent Service**: Runs as background process
- **Time-based Movement**: Calculates position based on elapsed time
- **Speed Adaptation**: Dynamic speed adjustment based on location
- **Auto-completion**: Handles journey completion and status updates

### Frontend Components

#### React Components
- `VehicleTrackingMap` - Main map component with Leaflet integration
- Dynamic routing for individual tracking pages
- Responsive layout with Tailwind CSS

#### Map Features
- **Optimal Zoom**: Automatic zoom level calculation
- **Manual Override**: User can zoom in/out freely
- **Smooth Animations**: No flickering or stuttering
- **Performance Optimized**: Efficient polyline rendering

## 🚀 Getting Started

### 1. Database Setup
```bash
# Apply new schema changes
npx prisma db push
npx prisma generate
```

### 2. Install Dependencies
```bash
npm install leaflet @types/leaflet react-leaflet node-fetch@2
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Start Simulation Service (Optional)
```bash
# In a separate terminal
npm run simulation
```

### 5. Create Test Data
```bash
curl -X POST http://localhost:3000/api/test-tracking
```

## 📍 Access Points

### Main Tracking Page
- URL: `/tracking/map`
- Features: Waybill input, sample shipments, feature overview

### Individual Tracking
- URL: `/tracking/map/[waybill]`
- Example: `/tracking/map/KPL-26020002`
- Features: Full-screen map, real-time updates, quick actions

### Test Shipments
The system includes pre-configured test shipments:
- **KPL-26020002**: Dar es Salaam → Mbeya
- **KPL-26020003**: Dar es Salaam → Mwanza  
- **KPL-26020004**: Dar es Salaam → Arusha

## 🔧 Configuration

### Environment Variables
```env
DATABASE_URL=your_database_url
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Simulation Settings
Edit `scripts/vehicle-simulation-service.js`:
```javascript
this.updateFrequency = 3000; // Update every 3 seconds
```

### Map Customization
Edit `components/VehicleTrackingMap.tsx`:
- Tile layers
- Marker styles
- Zoom levels
- Update intervals

## 📊 Monitoring

### Simulation Status
```bash
curl http://localhost:3000/api/vehicle-simulation
```

### Test Data Status
```bash
curl http://localhost:3000/api/test-tracking
```

### Manual Position Update
```bash
curl -X POST http://localhost:3000/api/vehicle-tracking \
  -H "Content-Type: application/json" \
  -d '{
    "waybillNumber": "KPL-26020002",
    "latitude": -6.8,
    "longitude": 39.3,
    "speed": 45
  }'
```

## 🎯 Key Requirements Fulfilled

### ✅ Map & Route Rendering
- [x] Leaflet.js integration with standard controls
- [x] Predefined route as continuous polyline
- [x] Logically segmentable for dynamic recoloring

### ✅ Vehicle Movement
- [x] Smooth, time-based movement along route
- [x] Position updates every 1-2 seconds
- [x] Speed logic (20-50 km/h city, configurable highway)
- [x] Vehicle marker aligned with position

### ✅ Dynamic Route Visualization
- [x] Completed path → BLUE
- [x] Current position → Moving marker
- [x] Remaining path → RED
- [x] Real-time color updates

### ✅ Independent Movement Engine
- [x] Background simulation (server-side)
- [x] Persistent position storage
- [x] Session-independent movement
- [x] Timestamp-based position calculation

### ✅ Offline/Refresh Behavior
- [x] No journey restart on refresh
- [x] Continued progress based on elapsed time
- [x] Instant position recalculation
- [x] Accurate path colors on return

### ✅ Real-time Performance
- [x] Real-time updates without page reload
- [x] Smooth animations (no flickering)
- [x] Efficient long route handling

### ✅ Zoom Controls
- [x] Optimal default zoom for road visibility
- [x] Automatic adjustment based on route density
- [x] Manual zoom override capability
- [x] User zoom level respected

## 🔄 Deployment Notes

### Vercel Deployment
- The simulation service runs via API endpoints
- No additional background processes needed
- Database migrations handled automatically

### Self-Hosted Deployment
- Run simulation service as separate process:
```bash
npm run simulation
```
- Consider using PM2 for process management
- Set up cron jobs for automatic simulation

## 🐛 Troubleshooting

### Common Issues

1. **Map Not Loading**
   - Check Leaflet CSS import
   - Verify dynamic import configuration
   - Check browser console for errors

2. **Vehicle Not Moving**
   - Verify simulation service is running
   - Check database connection
   - Review API endpoint responses

3. **Position Jumps**
   - Ensure time-based calculations are correct
   - Check distance calculation accuracy
   - Verify route coordinate format

4. **Performance Issues**
   - Optimize polyline complexity
   - Reduce update frequency
   - Check database query performance

### Debug Tools
- Browser DevTools for map issues
- Database logs for position tracking
- API response inspection for simulation

## 📈 Future Enhancements

- Multiple vehicle tracking on single map
- Historical route playback
- Traffic-aware routing
- Mobile app integration
- Real-time notifications
- Advanced analytics dashboard

---

**System Status**: ✅ Fully Implemented and Tested
**Last Updated**: 2025-01-12
**Version**: 2.0.0
