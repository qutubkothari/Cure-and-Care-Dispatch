import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

function sendJsonBigIntSafe(res: any, data: any) {
  const body = JSON.stringify(data, (_key, value) => (typeof value === 'bigint' ? value.toString() : value));
  return res.type('application/json').send(body);
}

// Generate report data
router.get('/data', async (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { type, dateFrom, dateTo, driverId, status } = req.query;

    if (!type || !dateFrom || !dateTo) {
      return res.status(400).json({ error: 'Report type and date range required' });
    }

    const startDate = new Date(dateFrom as string);
    const endDate = new Date(dateTo as string);
    endDate.setHours(23, 59, 59, 999);

    let reportData: any = {};

    if (type === 'delivery-summary') {
      const where: any = {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      };

      if (driverId) where.driverId = driverId as string;
      if (status) where.status = status as string;

      const deliveries = await prisma.delivery.findMany({
        where,
        include: {
          driver: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const summary = {
        total: deliveries.length,
        delivered: deliveries.filter(d => d.status === 'DELIVERED').length,
        inTransit: deliveries.filter(d => d.status === 'IN_TRANSIT').length,
        pending: deliveries.filter(d => d.status === 'PENDING').length,
        failed: deliveries.filter(d => d.status === 'CANCELLED').length,
        revenue: 0,
        avgValue: 0
      };

      reportData = { summary, deliveries };

    } else if (type === 'driver-performance') {
      const where: any = {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      };

      if (driverId) where.driverId = driverId as string;

      const deliveries = await prisma.delivery.findMany({
        where,
        include: {
          driver: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Group by driver
      const driverStats = new Map();

      deliveries.forEach(delivery => {
        if (!delivery.driver) return;

        const driverId = delivery.driver.id;
        if (!driverStats.has(driverId)) {
          driverStats.set(driverId, {
            id: driverId,
            name: delivery.driver.name,
            totalDeliveries: 0,
            completed: 0,
            failed: 0,
            totalEarnings: 0
          });
        }

        const stats = driverStats.get(driverId);
        stats.totalDeliveries++;
        if (delivery.status === 'DELIVERED') {
          stats.completed++;
        }
        if (delivery.status === 'CANCELLED') {
          stats.failed++;
        }
      });

      const drivers = Array.from(driverStats.values()).map(stats => ({
        ...stats,
        successRate: stats.totalDeliveries > 0 
          ? Math.round((stats.completed / stats.totalDeliveries) * 100) 
          : 0
      }));

      reportData = { drivers };

    } else if (type === 'petty-cash-reconciliation') {
      const where: any = {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      };

      if (driverId) where.driverId = driverId as string;

      const [requests, totals] = await Promise.all([
        prisma.pettyCash.findMany({
          where,
          include: {
            driver: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.pettyCash.aggregate({
          where,
          _sum: { amount: true }
        })
      ]);

      const summary = {
        total: requests.length,
        approved: requests.filter(r => r.status === 'APPROVED').length,
        pending: requests.filter(r => r.status === 'PENDING').length,
        rejected: requests.filter(r => r.status === 'REJECTED').length,
        totalAmount: totals._sum.amount || 0,
        approvedAmount: requests
          .filter(r => r.status === 'APPROVED')
          .reduce((sum, r) => sum + r.amount, 0)
      };

      // Group by category
      const categoryMap = new Map();
      requests.forEach(request => {
        if (!categoryMap.has(request.category)) {
          categoryMap.set(request.category, {
            category: request.category,
            count: 0,
            totalAmount: 0
          });
        }
        const cat = categoryMap.get(request.category);
        cat.count++;
        cat.totalAmount += request.amount;
      });

      const byCategory = Array.from(categoryMap.values()).map(cat => ({
        ...cat,
        avgAmount: Math.round(cat.totalAmount / cat.count)
      }));

      reportData = { summary, byCategory, requests };
    }

    return sendJsonBigIntSafe(res, reportData);
  } catch (error) {
    console.error('Failed to generate report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

export default router;
