import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { sendWhatsAppNotification } from '../services/whatsapp';

const router = Router();
const prisma = new PrismaClient();

// Get petty cash entries
router.get('/', async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { status, driverId, startDate, endDate } = req.query;

    const where: any = {};

    if (user.role === 'DRIVER') {
      where.driverId = user.id;
    } else if (driverId) {
      where.driverId = driverId as string;
    }

    if (status) {
      where.status = status as string;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const entries = await prisma.pettyCash.findMany({
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

    res.json({ entries });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch petty cash entries' });
  }
});

// Create petty cash entry
router.post('/', async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const {
      amount,
      category,
      description,
      latitude,
      longitude,
      receiptUrl
    } = req.body;

    if (!amount || !category || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const entry = await prisma.pettyCash.create({
      data: {
        driverId: user.id,
        amount: parseFloat(amount),
        category,
        description,
        latitude,
        longitude,
        receiptUrl,
        timestamp: new Date()
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

    // Notify admin
    const io = req.app.get('io');
    io.to('admin').emit('petty-cash-submitted', entry);

    res.status(201).json({ entry });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create petty cash entry' });
  }
});

// Approve/Reject petty cash
router.put('/:id/status', async (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can approve petty cash' });
    }

    const { status, notes } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData: any = {
      status,
      notes
    };

    if (status === 'APPROVED') {
      updateData.approvedAt = new Date();
    } else {
      updateData.rejectedAt = new Date();
    }

    const entry = await prisma.pettyCash.update({
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

    // Send WhatsApp notification to driver
    if (entry.driver.phone) {
      const message = status === 'APPROVED'
        ? `Your petty cash request has been APPROVED!\n\nAmount: ₹${entry.amount}\nCategory: ${entry.category}\nDescription: ${entry.description}`
        : `Your petty cash request has been REJECTED.\n\nAmount: ₹${entry.amount}\nReason: ${notes || 'Not specified'}`;

      await sendWhatsAppNotification({
        to: entry.driver.phone,
        message,
        type: status === 'APPROVED' ? 'PETTY_CASH_APPROVED' : 'PETTY_CASH_REJECTED'
      });
    }

    // Notify driver via WebSocket
    const io = req.app.get('io');
    io.to(`driver-${entry.driverId}`).emit('petty-cash-updated', entry);

    res.json({ entry });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update petty cash status' });
  }
});

// Get petty cash stats
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    const where: any = user.role === 'DRIVER' ? { driverId: user.id } : {};

    const [total, approved, pending, rejected] = await Promise.all([
      prisma.pettyCash.aggregate({
        where,
        _sum: { amount: true }
      }),
      prisma.pettyCash.aggregate({
        where: { ...where, status: 'APPROVED' },
        _sum: { amount: true },
        _count: true
      }),
      prisma.pettyCash.aggregate({
        where: { ...where, status: 'PENDING' },
        _sum: { amount: true },
        _count: true
      }),
      prisma.pettyCash.aggregate({
        where: { ...where, status: 'REJECTED' },
        _count: true
      })
    ]);

    res.json({
      stats: {
        total: total._sum.amount || 0,
        approved: {
          amount: approved._sum.amount || 0,
          count: approved._count
        },
        pending: {
          amount: pending._sum.amount || 0,
          count: pending._count
        },
        rejected: {
          count: rejected._count
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
