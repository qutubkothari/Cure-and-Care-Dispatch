"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const whatsapp_1 = require("../services/whatsapp");
const audit_1 = require("../middleware/audit");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
function coerceBigInt(value) {
    if (value == null)
        return undefined;
    if (typeof value === 'bigint')
        return value;
    if (typeof value === 'number') {
        if (!Number.isFinite(value))
            return undefined;
        return BigInt(Math.trunc(value));
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed)
            return undefined;
        try {
            return BigInt(trimmed);
        }
        catch {
            const asNumber = Number(trimmed);
            if (!Number.isFinite(asNumber))
                return undefined;
            return BigInt(Math.trunc(asNumber));
        }
    }
    return undefined;
}
function safeJsonArray(value) {
    if (value == null)
        return undefined;
    if (Array.isArray(value))
        return value.map(String).filter(Boolean);
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed)
            return undefined;
        if (trimmed.startsWith('[')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed))
                    return parsed.map(String).filter(Boolean);
            }
            catch {
                // fall through
            }
        }
        // best-effort CSV fallback
        const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);
        return parts.length ? parts : undefined;
    }
    return undefined;
}
function normalizeDeliveryForClient(delivery) {
    const proofUrls = safeJsonArray(delivery.proofUrls) ?? (delivery.proofImage ? [delivery.proofImage] : []);
    const failurePhotoUrls = safeJsonArray(delivery.failurePhotoUrls) ?? [];
    const gpsTimestamp = typeof delivery.gpsTimestamp === 'bigint' ? delivery.gpsTimestamp.toString() : delivery.gpsTimestamp;
    return {
        ...delivery,
        gpsTimestamp,
        proofUrl: delivery.proofImage ?? null,
        proofUrls,
        failurePhotoUrls
    };
}
// Get all deliveries (with filters)
router.get('/', async (req, res) => {
    try {
        const { status, driverId, date, dateFrom, dateTo, priority } = req.query;
        const user = req.user;
        const where = {};
        if (user.role === 'DRIVER') {
            where.driverId = user.id;
        }
        else if (driverId) {
            if (driverId === 'unassigned') {
                where.driverId = null;
            }
            else {
                where.driverId = driverId;
            }
        }
        if (status) {
            where.status = status;
        }
        if (priority) {
            where.priority = priority;
        }
        // Handle date filtering
        if (dateFrom || dateTo || date) {
            where.createdAt = {};
            if (date) {
                // Single date filter (legacy support)
                const startDate = new Date(date);
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 1);
                where.createdAt.gte = startDate;
                where.createdAt.lt = endDate;
            }
            else {
                // Date range filter
                if (dateFrom) {
                    where.createdAt.gte = new Date(dateFrom);
                }
                if (dateTo) {
                    const endDate = new Date(dateTo);
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
        res.json({ deliveries: deliveries.map(normalizeDeliveryForClient) });
    }
    catch (error) {
        console.error('Failed to fetch deliveries:', error);
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
        res.json({ delivery: normalizeDeliveryForClient(delivery) });
    }
    catch (error) {
        console.error('Failed to fetch delivery:', error);
        res.status(500).json({ error: 'Failed to fetch delivery' });
    }
});
// Create delivery
router.post('/', async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only admins can create deliveries' });
        }
        const { invoiceNumber, customerName, customerPhone, address, items, amount, priority, latitude, longitude, customerNotes, driverId } = req.body;
        if (!invoiceNumber || !customerName || !address) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const delivery = await prisma.delivery.create({
            data: {
                invoiceNumber,
                customerName,
                customerPhone,
                address,
                items: typeof items === 'string' ? items : '',
                amount: Number.isFinite(Number(amount)) ? Number(amount) : 0,
                priority: typeof priority === 'string' && priority ? priority : 'NORMAL',
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
            await (0, whatsapp_1.sendWhatsAppNotification)({
                to: delivery.driver.phone,
                message: `New delivery assigned!\n\nInvoice: ${invoiceNumber}\nCustomer: ${customerName}\nAddress: ${address}`,
                deliveryId: delivery.id,
                type: 'DELIVERY_ASSIGNED'
            });
        }
        // Emit real-time event
        const io = req.app.get('io');
        io.to(`driver-${driverId}`).emit('new-delivery', delivery);
        io.to('admin').emit('delivery-created', delivery);
        res.status(201).json({ delivery: normalizeDeliveryForClient(delivery) });
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Invoice number already exists' });
        }
        res.status(500).json({ error: 'Failed to create delivery' });
    }
});
// Update delivery details (admin only)
router.put('/:id', async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only admins can update deliveries' });
        }
        const existing = await prisma.delivery.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            return res.status(404).json({ error: 'Delivery not found' });
        }
        const { customerName, customerPhone, address, items, amount, priority, customerNotes } = req.body;
        const updated = await prisma.delivery.update({
            where: { id: req.params.id },
            data: {
                ...(typeof customerName === 'string' ? { customerName } : {}),
                ...(typeof customerPhone === 'string' || customerPhone === null ? { customerPhone } : {}),
                ...(typeof address === 'string' ? { address } : {}),
                ...(typeof items === 'string' ? { items } : {}),
                ...(amount !== undefined ? { amount: Number.isFinite(Number(amount)) ? Number(amount) : existing.amount } : {}),
                ...(typeof priority === 'string' && priority ? { priority } : {}),
                ...(typeof customerNotes === 'string' || customerNotes === null ? { customerNotes } : {})
            },
            include: {
                driver: {
                    select: {
                        id: true,
                        name: true,
                        phone: true
                    }
                }
            }
        });
        await (0, audit_1.logChange)('UPDATE', 'DELIVERY', req.params.id, existing, updated, {
            id: user.id,
            name: user.email,
            role: user.role
        }, req);
        const io = req.app.get('io');
        io.to('admin').emit('delivery-updated', updated);
        if (updated.driverId) {
            io.to(`driver-${updated.driverId}`).emit('delivery-updated', updated);
        }
        res.json({ delivery: normalizeDeliveryForClient(updated) });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update delivery' });
    }
});
// Bulk create deliveries
router.post('/bulk', async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only admins can create deliveries' });
        }
        const deliveries = req.body.deliveries;
        if (!Array.isArray(deliveries) || deliveries.length === 0) {
            return res.status(400).json({ error: 'Deliveries array is required' });
        }
        const results = { success: 0, failed: 0, errors: [] };
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
                        await (0, whatsapp_1.sendWhatsAppNotification)({
                            to: driver.phone,
                            message: `New delivery assigned!\n\nInvoice: ${invoiceNumber}\nCustomer: ${delivery.customerName}\nAddress: ${delivery.address}`,
                            deliveryId: '',
                            type: 'DELIVERY_ASSIGNED'
                        });
                    }
                }
            }
            catch (error) {
                results.failed++;
                results.errors.push(`Row ${i + 1}: ${error.message || 'Unknown error'}`);
            }
        }
        res.status(201).json({
            message: `Bulk import complete: ${results.success} succeeded, ${results.failed} failed`,
            results
        });
    }
    catch (error) {
        console.error('Bulk create error:', error);
        res.status(500).json({ error: 'Failed to create deliveries' });
    }
});
// Update delivery status
router.put('/:id/status', async (req, res) => {
    try {
        const { status, latitude, longitude, accuracy, altitude, altitudeAccuracy, heading, speed, gpsTimestamp, isMockLocation, qualityScore, gpsWarnings, proofImage, proofUrl, proofUrls, signature, notes, reason, failureReason, failureNotes, failurePhotoUrls, photoUrls, startLocation, endLocation, failureLocation } = req.body;
        const user = req.user;
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
        const updateData = { status };
        // Support nested location objects from the client
        const location = (status === 'IN_TRANSIT' ? startLocation : undefined) ||
            (status === 'DELIVERED' ? endLocation : undefined) ||
            (status === 'FAILED' ? failureLocation : undefined) ||
            undefined;
        const lat = location?.lat ?? latitude;
        const lng = location?.lng ?? longitude;
        const locAccuracy = location?.accuracy ?? accuracy;
        const locAltitude = location?.altitude ?? altitude;
        const locAltitudeAccuracy = location?.altitudeAccuracy ?? altitudeAccuracy;
        const locHeading = location?.heading ?? heading;
        const locSpeed = location?.speed ?? speed;
        const locGpsTimestamp = location?.gpsTimestamp ?? gpsTimestamp;
        const locIsMock = location?.isMockLocation ?? isMockLocation;
        const locQuality = location?.qualityScore ?? qualityScore;
        const locWarnings = location?.gpsWarnings ?? gpsWarnings;
        const coercedGpsTimestamp = coerceBigInt(locGpsTimestamp);
        if (status === 'DELIVERED') {
            updateData.deliveredAt = new Date();
            updateData.latitude = lat;
            updateData.longitude = lng;
            updateData.accuracy = locAccuracy;
            updateData.altitude = locAltitude;
            updateData.altitudeAccuracy = locAltitudeAccuracy;
            updateData.heading = locHeading;
            updateData.speed = locSpeed;
            if (coercedGpsTimestamp !== undefined)
                updateData.gpsTimestamp = coercedGpsTimestamp;
            updateData.isMockLocation = Boolean(locIsMock);
            updateData.qualityScore = locQuality;
            updateData.gpsWarnings = locWarnings;
            updateData.proofImage = proofImage || proofUrl;
            const proofUrlsArr = safeJsonArray(proofUrls);
            if (proofUrlsArr?.length) {
                updateData.proofUrls = JSON.stringify(proofUrlsArr);
            }
            updateData.signature = signature;
        }
        else if (status === 'IN_TRANSIT') {
            updateData.latitude = lat;
            updateData.longitude = lng;
            updateData.accuracy = locAccuracy;
            updateData.altitude = locAltitude;
            updateData.altitudeAccuracy = locAltitudeAccuracy;
            updateData.heading = locHeading;
            updateData.speed = locSpeed;
            if (coercedGpsTimestamp !== undefined)
                updateData.gpsTimestamp = coercedGpsTimestamp;
            updateData.isMockLocation = Boolean(locIsMock);
            updateData.qualityScore = locQuality;
            updateData.gpsWarnings = locWarnings;
        }
        else if (status === 'FAILED') {
            updateData.failedAt = new Date();
            updateData.latitude = lat;
            updateData.longitude = lng;
            updateData.accuracy = locAccuracy;
            updateData.altitude = locAltitude;
            updateData.altitudeAccuracy = locAltitudeAccuracy;
            updateData.heading = locHeading;
            updateData.speed = locSpeed;
            if (coercedGpsTimestamp !== undefined)
                updateData.gpsTimestamp = coercedGpsTimestamp;
            updateData.isMockLocation = Boolean(locIsMock);
            updateData.qualityScore = locQuality;
            updateData.gpsWarnings = locWarnings;
            const failReason = typeof failureReason === 'string' ? failureReason : (typeof reason === 'string' ? reason : undefined);
            const failNotes = typeof failureNotes === 'string' ? failureNotes : (typeof notes === 'string' ? notes : undefined);
            const failPhotos = safeJsonArray(failurePhotoUrls) ?? safeJsonArray(photoUrls);
            if (failReason)
                updateData.failureReason = failReason;
            if (failNotes)
                updateData.failureNotes = failNotes;
            if (failPhotos?.length)
                updateData.failurePhotoUrls = JSON.stringify(failPhotos);
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
        const normalizedUpdated = normalizeDeliveryForClient(updated);
        // Log tracking
        await prisma.deliveryTracking.create({
            data: {
                deliveryId: updated.id,
                status,
                latitude: lat,
                longitude: lng,
                notes
            }
        });
        // Send WhatsApp notification for delivery completion
        if (status === 'DELIVERED' && updated.customerPhone) {
            await (0, whatsapp_1.sendWhatsAppNotification)({
                to: updated.customerPhone,
                message: `Your delivery has been completed!\n\nInvoice: ${updated.invoiceNumber}\nDelivered by: ${updated.driver?.name}\n\nThank you for choosing Cure & Care!`,
                deliveryId: updated.id,
                type: 'DELIVERY_COMPLETED'
            });
        }
        // Emit real-time update
        const io = req.app.get('io');
        io.to('admin').emit('delivery-updated', normalizedUpdated);
        if (updated.driverId) {
            io.to(`driver-${updated.driverId}`).emit('delivery-updated', normalizedUpdated);
        }
        // Log audit
        await (0, audit_1.logChange)('UPDATE_STATUS', 'DELIVERY', req.params.id, delivery, updated, {
            id: user.id,
            name: user.email,
            role: user.role
        }, req);
        res.json({ delivery: normalizedUpdated });
    }
    catch (error) {
        console.error('Failed to update delivery status:', error);
        res.status(500).json({ error: 'Failed to update delivery' });
    }
});
// Assign delivery to driver
router.put('/:id/assign', async (req, res) => {
    try {
        const { driverId } = req.body;
        const user = req.user;
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
            await (0, whatsapp_1.sendWhatsAppNotification)({
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to assign delivery' });
    }
});
// Delete delivery
router.delete('/:id', async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only admins can delete deliveries' });
        }
        await prisma.delivery.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'Delivery deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete delivery' });
    }
});
exports.default = router;
//# sourceMappingURL=deliveries.js.map