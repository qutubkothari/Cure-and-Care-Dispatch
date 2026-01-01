import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

function bigIntToString(value: any) {
  return typeof value === 'bigint' ? value.toString() : value;
}

function normalizeLocation(location: any) {
  if (!location) return location;
  return {
    ...location,
    gpsTimestamp: bigIntToString(location.gpsTimestamp)
  };
}

// Update driver location (GPS)
router.post('/location', async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { 
      latitude, 
      longitude, 
      accuracy, 
      altitude,
      altitudeAccuracy,
      speed, 
      heading,
      gpsTimestamp,
      isMockLocation,
      qualityScore
    } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const location = await prisma.driverLocation.create({
      data: {
        driverId: user.id,
        latitude,
        longitude,
        accuracy,
        altitude,
        altitudeAccuracy,
        speed,
        heading,
        gpsTimestamp,
        isMockLocation: isMockLocation || false,
        qualityScore
      }
    });

    // Broadcast location to admin
    const io = req.app.get('io');
    io.to('admin').emit('driver-location', {
      driverId: user.id,
      latitude,
      longitude,
      accuracy,
      altitude,
      speed,
      heading,
      gpsTimestamp: bigIntToString(gpsTimestamp),
      isMockLocation,
      qualityScore,
      timestamp: location.timestamp
    });

    res.json({ message: 'Location updated', location: normalizeLocation(location) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Get driver's location history
router.get('/location/:driverId', async (req: AuthRequest, res) => {
  try {
    const { driverId } = req.params;
    const { startDate, endDate, limit = '100' } = req.query;

    const where: any = { driverId };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate as string);
      if (endDate) where.timestamp.lte = new Date(endDate as string);
    }

    const locations = await prisma.driverLocation.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string)
    });

    res.json({ locations: locations.map(normalizeLocation) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch location history' });
  }
});

// Get latest location for all active drivers
router.get('/locations/live', async (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get active drivers
    const drivers = await prisma.user.findMany({
      where: {
        role: 'DRIVER',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        phone: true
      }
    });

    // Get latest location for each driver
    const locationsPromises = drivers.map(async (driver: any) => {
      const latest = await prisma.driverLocation.findFirst({
        where: { driverId: driver.id },
        orderBy: { timestamp: 'desc' }
      });

      return {
        driver,
        location: latest
      };
    });

    const driverLocations = await Promise.all(locationsPromises);

    res.json({
      drivers: driverLocations.map((row: any) => ({
        driver: row.driver,
        location: row.location ? normalizeLocation(row.location) : null
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch live locations' });
  }
});

// Get delivery tracking history
router.get('/delivery/:deliveryId', async (req, res) => {
  try {
    const { deliveryId } = req.params;

    const tracking = await prisma.deliveryTracking.findMany({
      where: { deliveryId },
      orderBy: { timestamp: 'asc' }
    });

    res.json({ tracking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tracking history' });
  }
});

export default router;
