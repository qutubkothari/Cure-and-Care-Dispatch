import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { sendWhatsAppNotification } from '../services/whatsapp';
import { logAudit, logChange } from '../middleware/audit';

const router = Router();
const prisma = new PrismaClient();

// Get all deliveries (with filters)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { status, driverId, date, dateFrom, dateTo, priority } = req.query;
    const user = req.user!;

    const where: any = {};

    if (user.role === 'DRIVER') {
      where.driverId = user.id;
    } else if (driverId) {
      if (driverId === 'unassigned') {
        where.driverId = null;
      } else {
        where.driverId = driverId as string;
      }
    }

    if (status) {
      where.status = status as string;
    }

    if (priority) {
      where.priority = priority as string;
    }

    // Handle date filtering
    if (dateFrom || dateTo || date) {
      where.createdAt = {};
      
      if (date) {
        // Single date filter (legacy support)
        const startDate = new Date(date as string);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        where.createdAt.gte = startDate;
        where.createdAt.lt = endDate;
      } else {
        // Date range filter
        if (dateFrom) {
          where.createdAt.gte = new Date(dateFrom as string);
        }
        if (dateTo) {
          const endDate = new Date(dateTo as string);
          endDate.setHours(23, 59, 59, 999); // End of day
          where.createdAt.lte = endDate;
        }
      }
    }

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ deliveries });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
});

// Get single delivery
router.get('/:id', async (req, res) => {
  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id: req.params.id },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        }
      }
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    res.json({ delivery });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch delivery' });
  }
});

// Create delivery
router.post('/', async (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can create deliveries' });
    }

    const {
      invoiceNumber,
      customerName,
      customerPhone,
      address,
      latitude,
      longitude,
      customerNotes,
      driverId
    } = req.body;

    if (!invoiceNumber || !customerName || !address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const delivery = await prisma.delivery.create({
      data: {
        invoiceNumber,
        customerName,
        customerPhone,
        address,
        latitude,
        longitude,
        customerNotes,
        driverId,
        status: driverId ? 'IN_TRANSIT' : 'PENDING'
      },
      include: {
        driver: {
          select: {
            name: true,
            phone: true
          }
        }
      }
    });

    // Send WhatsApp notification to driver
    if (driverId && delivery.driver) {
      await sendWhatsAppNotification({
        to: delivery.driver.phone!,
        message: `New delivery assigned!\n\nInvoice: ${invoiceNumber}\nCustomer: ${customerName}\nAddress: ${address}`,
        deliveryId: delivery.id,
        type: 'DELIVERY_ASSIGNED'
      });
    }

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`driver-${driverId}`).emit('new-delivery', delivery);
    io.to('admin').emit('delivery-created', delivery);

    res.status(201).json({ delivery });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Invoice number already exists' });
    }
    res.status(500).json({ error: 'Failed to create delivery' });
  }
});

// Bulk create deliveries
router.post('/bulk', async (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can create deliveries' });
    }

    const deliveries = req.body.deliveries;

    if (!Array.isArray(deliveries) || deliveries.length === 0) {
      return res.status(400).json({ error: 'Deliveries array is required' });
    }

    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (let i = 0; i < deliveries.length; i++) {
      const delivery = deliveries[i];
      
      try {
        // Generate invoice number
        const lastDelivery = await prisma.delivery.findFirst({
          orderBy: { createdAt: 'desc' }
        });
        
        const lastNumber = lastDelivery?.invoiceNumber 
          ? parseInt(lastDelivery.invoiceNumber.replace('INV-', '')) 
          : 0;
        const invoiceNumber = `INV-${String(lastNumber + 1 + i).padStart(6, '0')}`;

        await prisma.delivery.create({
          data: {
            invoiceNumber,
            customerName: delivery.customerName,
            customerPhone: delivery.customerPhone,
            address: delivery.address,
            latitude: delivery.latitude,
            longitude: delivery.longitude,
            proofImage: delivery.proofImage,
            signature: delivery.signature,
            customerNotes: delivery.customerNotes,
            driverId: delivery.driverId,
            status: 'PENDING'
          }
        });

        results.success++;

        // Send WhatsApp notification to driver
        if (delivery.driverId) {
          const driver = await prisma.user.findUnique({
            where: { id: delivery.driverId }
          });

          if (driver?.phone) {
            await sendWhatsAppNotification({
              to: driver.phone,
              message: `New delivery assigned!\n\nInvoice: ${invoiceNumber}\nCustomer: ${delivery.customerName}\nAddress: ${delivery.address}`,
              deliveryId: '',
              type: 'DELIVERY_ASSIGNED'
            });
          }
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${error.message || 'Unknown error'}`);
      }
    }

    res.status(201).json({ 
      message: `Bulk import complete: ${results.success} succeeded, ${results.failed} failed`,
      results 
    });
  } catch (error) {
    console.error('Bulk create error:', error);
    res.status(500).json({ error: 'Failed to create deliveries' });
  }
});

// Update delivery status
router.put('/:id/status', async (req: AuthRequest, res) => {
  try {
    const { 
      status, 
      latitude, 
      longitude, 
      accuracy,
      altitude,
      altitudeAccuracy,
      heading,
      speed,
      gpsTimestamp,
      isMockLocation,
      qualityScore,
      gpsWarnings,
      proofImage, 
      signature, 
      notes 
    } = req.body;
    const user = req.user!;

    const delivery = await prisma.delivery.findUnique({
      where: { id: req.params.id },
      include: {
        driver: {
          select: {
            name: true,
            phone: true
          }
        }
      }
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    // Drivers can only update their own deliveries
    if (user.role === 'DRIVER' && delivery.driverId !== user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updateData: any = { status };

    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
      updateData.latitude = latitude;
      updateData.longitude = longitude;
      updateData.accuracy = accuracy;
      updateData.altitude = altitude;
      updateData.altitudeAccuracy = altitudeAccuracy;
      updateData.heading = heading;
      updateData.speed = speed;
      updateData.gpsTimestamp = gpsTimestamp;
      updateData.isMockLocation = isMockLocation || false;
      updateData.qualityScore = qualityScore;
      updateData.gpsWarnings = gpsWarnings;
      updateData.proofImage = proofImage;
      updateData.signature = signature;
    } else if (status === 'IN_TRANSIT') {
      updateData.latitude = latitude;
      updateData.longitude = longitude;
      updateData.accuracy = accuracy;
      updateData.altitude = altitude;
      updateData.altitudeAccuracy = altitudeAccuracy;
      updateData.heading = heading;
      updateData.speed = speed;
      updateData.gpsTimestamp = gpsTimestamp;
      updateData.isMockLocation = isMockLocation || false;
      updateData.qualityScore = qualityScore;
      updateData.gpsWarnings = gpsWarnings;
    } else if (status === 'FAILED') {
      updateData.failedAt = new Date();
      updateData.latitude = latitude;
      updateData.longitude = longitude;
      updateData.accuracy = accuracy;
      updateData.altitude = altitude;
      updateData.altitudeAccuracy = altitudeAccuracy;
      updateData.heading = heading;
      updateData.speed = speed;
      updateData.gpsTimestamp = gpsTimestamp;
      updateData.isMockLocation = isMockLocation || false;
      updateData.qualityScore = qualityScore;
      updateData.gpsWarnings = gpsWarnings;
    }

    const updated = await prisma.delivery.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        driver: {
          select: {
            name: true,
            phone: true
          }
        }
      }
    });

    // Log tracking
    await prisma.deliveryTracking.create({
      data: {
        deliveryId: updated.id,
        status,
        latitude,
        longitude,
        notes
      }
    });

    // Send WhatsApp notification for delivery completion
    if (status === 'DELIVERED' && updated.customerPhone) {
      await sendWhatsAppNotification({
        to: updated.customerPhone,
        message: `Your delivery has been completed!\n\nInvoice: ${updated.invoiceNumber}\nDelivered by: ${updated.driver?.name}\n\nThank you for choosing Cure & Care!`,
        deliveryId: updated.id,
        type: 'DELIVERY_COMPLETED'
      });
    }

    // Emit real-time update
    const io = req.app.get('io');
    io.to('admin').emit('delivery-updated', updated);
    if (updated.driverId) {
      io.to(`driver-${updated.driverId}`).emit('delivery-updated', updated);
    }

    // Log audit
    await logChange('UPDATE_STATUS', 'DELIVERY', req.params.id, delivery, updated, {
      id: user.id,
      name: user.email,
      role: user.role
    }, req);

    res.json({ delivery: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update delivery' });
  }
});

// Assign delivery to driver
router.put('/:id/assign', async (req: AuthRequest, res) => {
  try {
    const { driverId } = req.body;
    const user = req.user!;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can assign deliveries' });
    }

    const delivery = await prisma.delivery.update({
      where: { id: req.params.id },
      data: {
        driverId,
        status: 'IN_TRANSIT'
      },
      include: {
        driver: {
          select: {
            name: true,
            phone: true
          }
        }
      }
    });

    // Send WhatsApp notification
    if (delivery.driver?.phone) {
      await sendWhatsAppNotification({
        to: delivery.driver.phone,
        message: `New delivery assigned!\n\nInvoice: ${delivery.invoiceNumber}\nCustomer: ${delivery.customerName}\nAddress: ${delivery.address}`,
        deliveryId: delivery.id,
        type: 'DELIVERY_ASSIGNED'
      });
    }

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`driver-${driverId}`).emit('new-delivery', delivery);

    res.json({ delivery });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign delivery' });
  }
});

// Delete delivery
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can delete deliveries' });
    }

    await prisma.delivery.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Delivery deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete delivery' });
  }
});

export default router;
