"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Get audit logs (admin only)
router.get('/', async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const { entity, action, userId, startDate, endDate, limit = '100', offset = '0' } = req.query;
        const where = {};
        if (entity)
            where.entity = entity;
        if (action)
            where.action = action;
        if (userId)
            where.userId = userId;
        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate)
                where.timestamp.gte = new Date(startDate);
            if (endDate)
                where.timestamp.lte = new Date(endDate);
        }
        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                take: parseInt(limit),
                skip: parseInt(offset)
            }),
            prisma.auditLog.count({ where })
        ]);
        res.json({ logs, total });
    }
    catch (error) {
        console.error('Failed to fetch audit logs:', error);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});
// Get audit log by ID
router.get('/:id', async (req, res) => {
    try {
        const user = req.user;
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
    }
    catch (error) {
        console.error('Failed to fetch audit log:', error);
        res.status(500).json({ error: 'Failed to fetch audit log' });
    }
});
// Get audit logs for specific entity
router.get('/entity/:entity/:entityId', async (req, res) => {
    try {
        const user = req.user;
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
    }
    catch (error) {
        console.error('Failed to fetch entity audit logs:', error);
        res.status(500).json({ error: 'Failed to fetch entity audit logs' });
    }
});
// Get audit statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const { startDate, endDate } = req.query;
        const where = {};
        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate)
                where.timestamp.gte = new Date(startDate);
            if (endDate)
                where.timestamp.lte = new Date(endDate);
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
    }
    catch (error) {
        console.error('Failed to fetch audit statistics:', error);
        res.status(500).json({ error: 'Failed to fetch audit statistics' });
    }
});
exports.default = router;
//# sourceMappingURL=audit.js.map