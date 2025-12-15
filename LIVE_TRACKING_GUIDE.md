# 🗺️ Live Tracking Implementation Guide

## Overview
Real-time GPS tracking system for delivery drivers with admin monitoring dashboard.

---

## 🏗️ Architecture

### Components:
1. **Driver Mobile App** - Sends GPS location every 30s
2. **Backend API** - Stores & broadcasts locations via Socket.IO
3. **Admin Dashboard** - Shows live map with driver markers

---

## 📱 1. Driver Side - GPS Tracking

### Current Implementation (DriverDashboard.tsx)

```typescript
// When driver starts delivery
const startDelivery = (deliveryId: string) => {
  // Request location permission
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Send to backend
        fetch('/api/tracking/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deliveryId,
            latitude,
            longitude,
            accuracy,
            status: 'IN_TRANSIT',
            timestamp: new Date().toISOString()
          })
        });
        
        // Start continuous tracking
        startLocationTracking(deliveryId);
      },
      (error) => {
        console.error('Location error:', error);
        alert('Please enable location access for tracking');
      }
    );
  }
};

// Continuous tracking
const startLocationTracking = (deliveryId: string) => {
  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy, speed, heading } = position.coords;
      
      // Update location every 30 seconds
      fetch('/api/tracking/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryId,
          latitude,
          longitude,
          accuracy,
          speed,
          heading,
          timestamp: new Date().toISOString()
        })
      });
    },
    (error) => console.error('Tracking error:', error),
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000 // Update every 30 seconds
    }
  );
  
  // Store watchId to stop later
  localStorage.setItem('tracking_watch_id', watchId.toString());
};
```

---

## 🖥️ 2. Backend API - Location Storage

### Endpoint: POST /api/tracking/update

**File:** `server/src/routes/tracking.ts`

```typescript
import { Router } from 'express';
import { prisma } from '../services/prisma';
import { io } from '../index'; // Socket.IO instance

const router = Router();

// Update driver location
router.post('/update', async (req, res) => {
  try {
    const { 
      deliveryId, 
      latitude, 
      longitude, 
      accuracy, 
      speed, 
      heading,
      status,
      timestamp 
    } = req.body;

    // Get driver ID from auth token (assuming middleware adds it)
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Save location to database
    const location = await prisma.driverLocation.create({
      data: {
        driverId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: accuracy ? parseFloat(accuracy) : null,
        speed: speed ? parseFloat(speed) : null,
        heading: heading ? parseFloat(heading) : null,
        timestamp: new Date(timestamp)
      }
    });

    // If delivery ID provided, update delivery tracking
    if (deliveryId) {
      await prisma.deliveryTracking.create({
        data: {
          deliveryId,
          status: status || 'IN_TRANSIT',
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          timestamp: new Date(timestamp)
        }
      });

      // Update delivery status
      await prisma.delivery.update({
        where: { id: deliveryId },
        data: { 
          status: status || 'IN_TRANSIT',
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        }
      });
    }

    // Broadcast to all connected admin dashboards via Socket.IO
    io.emit('location_update', {
      driverId,
      deliveryId,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy,
      speed,
      heading,
      timestamp,
      status
    });

    res.json({ success: true, location });
  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Get all active drivers' latest locations
router.get('/active-drivers', async (req, res) => {
  try {
    // Get latest location for each driver
    const locations = await prisma.$queryRaw`
      SELECT DISTINCT ON (driver_id) 
        driver_id, latitude, longitude, accuracy, speed, heading, timestamp
      FROM driver_locations
      WHERE timestamp > NOW() - INTERVAL '10 minutes'
      ORDER BY driver_id, timestamp DESC
    `;

    res.json(locations);
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// Get delivery route history
router.get('/delivery/:deliveryId/route', async (req, res) => {
  try {
    const { deliveryId } = req.params;

    const route = await prisma.deliveryTracking.findMany({
      where: { deliveryId },
      orderBy: { timestamp: 'asc' }
    });

    res.json(route);
  } catch (error) {
    console.error('Get route error:', error);
    res.status(500).json({ error: 'Failed to fetch route' });
  }
});

export default router;
```

---

## 🎛️ 3. Admin Dashboard - Live Map

### Google Maps Integration

**Install:**
```bash
npm install @react-google-maps/api
```

**File:** `client/src/pages/AdminDashboard.tsx` (Live Tracking Tab)

```typescript
import { GoogleMap, LoadScript, Marker, Polyline } from '@react-google-maps/api';
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const LiveTrackingTab = () => {
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [deliveryRoute, setDeliveryRoute] = useState<Coordinates[]>([]);

  // Connect to Socket.IO for real-time updates
  useEffect(() => {
    const socket = io('https://your-backend-url.com');

    // Listen for location updates
    socket.on('location_update', (data) => {
      setDrivers((prev) => {
        const index = prev.findIndex(d => d.driverId === data.driverId);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = data;
          return updated;
        }
        return [...prev, data];
      });
    });

    // Fetch initial driver locations
    fetch('/api/tracking/active-drivers')
      .then(res => res.json())
      .then(data => setDrivers(data));

    return () => socket.disconnect();
  }, []);

  // Load delivery route when driver is selected
  const loadDeliveryRoute = async (driverId: string, deliveryId: string) => {
    const res = await fetch(`/api/tracking/delivery/${deliveryId}/route`);
    const route = await res.json();
    setDeliveryRoute(route.map(r => ({ lat: r.latitude, lng: r.longitude })));
    setSelectedDriver(driverId);
  };

  return (
    <div className="h-screen flex">
      {/* Map */}
      <div className="flex-1">
        <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY">
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={{ lat: 19.0760, lng: 72.8777 }} // Mumbai
            zoom={12}
          >
            {/* Driver Markers */}
            {drivers.map((driver) => (
              <Marker
                key={driver.driverId}
                position={{ lat: driver.latitude, lng: driver.longitude }}
                icon={{
                  url: '/driver-marker.png', // Custom marker icon
                  scaledSize: new google.maps.Size(40, 40)
                }}
                onClick={() => loadDeliveryRoute(driver.driverId, driver.deliveryId)}
              />
            ))}

            {/* Delivery Route Polyline */}
            {deliveryRoute.length > 0 && (
              <Polyline
                path={deliveryRoute}
                options={{
                  strokeColor: '#00a896',
                  strokeOpacity: 0.8,
                  strokeWeight: 4
                }}
              />
            )}
          </GoogleMap>
        </LoadScript>
      </div>

      {/* Drivers List Sidebar */}
      <div className="w-80 bg-white border-l p-4 overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">Active Drivers ({drivers.length})</h3>
        {drivers.map((driver) => (
          <div
            key={driver.driverId}
            className={`p-4 mb-3 rounded-lg border cursor-pointer transition ${
              selectedDriver === driver.driverId
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => loadDeliveryRoute(driver.driverId, driver.deliveryId)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">{driver.driverName}</span>
              <span className={`px-2 py-1 rounded text-xs ${
                driver.status === 'IN_TRANSIT'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {driver.status}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              <p>📦 Delivery: {driver.invoiceNumber}</p>
              <p>📍 {driver.currentLocation}</p>
              <p>⏱️ Updated: {formatTime(driver.timestamp)}</p>
              {driver.speed && <p>🚗 Speed: {Math.round(driver.speed)} km/h</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 🚀 Quick Setup Steps

### 1. Get Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Maps JavaScript API**
3. Create API key
4. Add to environment: `VITE_GOOGLE_MAPS_API_KEY=your_key_here`

### 2. Update Backend
```bash
# Already done - tracking routes exist in server/src/routes/tracking.ts
```

### 3. Update Frontend
```bash
cd client
npm install @react-google-maps/api socket.io-client
```

### 4. Replace Mock Data
Replace the placeholder in **AdminDashboard.tsx** Live Tracking tab with the real `LiveTrackingTab` component above.

---

## 📊 Database Tables Used

### `driver_locations` 
Stores every GPS ping from drivers
```sql
id, driver_id, latitude, longitude, accuracy, speed, heading, timestamp
```

### `delivery_tracking`
Stores delivery status changes with location
```sql
id, delivery_id, status, latitude, longitude, notes, timestamp
```

---

## 🔐 Security Considerations

1. **Authentication**: Require JWT token for all tracking endpoints
2. **Rate Limiting**: Max 1 update per 10 seconds per driver
3. **Data Retention**: Delete locations older than 30 days
4. **Privacy**: Only admins can view tracking data

---

## 📈 Performance Tips

1. **Batch Updates**: Send location every 30s, not real-time
2. **Indexed Queries**: Database indexes on `driverId` and `timestamp`
3. **Socket Rooms**: Create room per admin to avoid broadcasting to all
4. **Map Clustering**: Use MarkerClusterer for 50+ drivers

---

## 🎯 Current Status

✅ **Done:**
- Database schema with `DriverLocation` table
- Backend API routes (`/api/tracking/*`)
- Socket.IO real-time broadcasting
- Driver GPS tracking hooks in UI

⏳ **To Complete:**
1. Add Google Maps API key to environment
2. Install `@react-google-maps/api` package
3. Replace mock Live Tracking tab with real map
4. Test with real driver GPS data

---

## 🔄 Testing Locally

```bash
# 1. Start backend
cd server
npm run dev

# 2. Start frontend  
cd client
npm run dev

# 3. Login as driver → Start delivery
# 4. Login as admin → View Live Tracking tab
# 5. See driver location update in real-time
```

---

## 💡 Future Enhancements

- [ ] ETA calculations using Google Directions API
- [ ] Geofencing alerts (driver near customer)
- [ ] Route optimization for multiple deliveries
- [ ] Offline tracking with queued updates
- [ ] Driver heatmap for popular routes
- [ ] Historical route playback

---

**Need Help?** The infrastructure is ready - just add Google Maps API key and replace the mock tracking tab!
