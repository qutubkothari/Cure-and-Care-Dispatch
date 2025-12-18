import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get audit logs (admin only)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { 
      entity, 
      action, 
      userId, 
      startDate, 
      endDate, 
      limit = '100',
      offset = '0'
    } = req.query;

    const where: any = {};

    if (entity) where.entity = entity as string;
    if (action) where.action = action as string;
    if (userId) where.userId = userId as string;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate as string);
      if (endDate) where.timestamp.lte = new Date(endDate as string);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({ logs, total });
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get audit log by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const log = await prisma.auditLog.findUnique({
      where: { id: req.params.id }
    });

    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    res.json({ log });
  } catch (error) {
    console.error('Failed to fetch audit log:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

// Get audit logs for specific entity
router.get('/entity/:entity/:entityId', async (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { entity, entityId } = req.params;

    const logs = await prisma.auditLog.findMany({
      where: {
        entity: entity.toUpperCase(),
        entityId
      },
      orderBy: { timestamp: 'desc' }
    });

    res.json({ logs });
  } catch (error) {
    console.error('Failed to fetch entity audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch entity audit logs' });
  }
});

// Get audit statistics
router.get('/stats/summary', async (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { startDate, endDate } = req.query;

    const where: any = {};
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate as string);
      if (endDate) where.timestamp.lte = new Date(endDate as string);
    }

    const [totalLogs, actionCounts, entityCounts, userActivity] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true }
      }),
      prisma.auditLog.groupBy({
        by: ['entity'],
        where,
        _count: { entity: true }
      }),
      prisma.auditLog.groupBy({
        by: ['userId', 'userName'],
        where,
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10
      })
    ]);

    res.json({
      totalLogs,
      actionCounts: actionCounts.map(a => ({ action: a.action, count: a._count.action })),
      entityCounts: entityCounts.map(e => ({ entity: e.entity, count: e._count.entity })),
      topUsers: userActivity.map(u => ({ 
        userId: u.userId, 
        userName: u.userName, 
        count: u._count.userId 
      }))
    });
  } catch (error) {
    console.error('Failed to fetch audit statistics:', error);
    res.status(500).json({ error: 'Failed to fetch audit statistics' });
  }
});

export default router;
