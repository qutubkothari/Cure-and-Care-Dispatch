"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditMiddleware = void 0;
exports.logAudit = logAudit;
exports.logChange = logChange;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Middleware to automatically log API requests for auditing
 */
const auditMiddleware = (action, entity) => {
    return async (req, res, next) => {
        const user = req.user;
        if (!user) {
            return next();
        }
        // Store original json method
        const originalJson = res.json.bind(res);
        // Override json method to capture response
        res.json = function (data) {
            // Log audit after successful response
            if (res.statusCode >= 200 && res.statusCode < 300) {
                logAudit({
                    action,
                    entity,
                    entityId: req.params.id || data?.id || undefined,
                    userId: user.id,
                    userName: user.email,
                    userRole: user.role,
                    ipAddress: req.ip || req.socket.remoteAddress,
                    userAgent: req.get('user-agent'),
                    metadata: {
                        method: req.method,
                        path: req.path,
                        query: req.query,
                        body: sanitizeBody(req.body)
                    }
                }).catch(err => console.error('Audit log failed:', err));
            }
            return originalJson(data);
        };
        next();
    };
};
exports.auditMiddleware = auditMiddleware;
/**
 * Manually log an audit entry
 */
async function logAudit(data) {
    try {
        await prisma.auditLog.create({
            data: {
                action: data.action,
                entity: data.entity,
                entityId: data.entityId,
                userId: data.userId,
                userName: data.userName,
                userRole: data.userRole,
                changes: data.changes ? JSON.stringify(data.changes) : null,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                metadata: data.metadata ? JSON.stringify(data.metadata) : null
            }
        });
    }
    catch (error) {
        console.error('Failed to create audit log:', error);
    }
}
/**
 * Create audit log with before/after state comparison
 */
async function logChange(action, entity, entityId, beforeState, afterState, user, req) {
    const changes = compareObjects(beforeState, afterState);
    await logAudit({
        action,
        entity,
        entityId,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        changes: { before: beforeState, after: afterState, diff: changes },
        ipAddress: req?.ip || req?.socket.remoteAddress,
        userAgent: req?.get('user-agent')
    });
}
/**
 * Compare two objects and return differences
 */
function compareObjects(before, after) {
    const changes = {};
    if (!before || !after)
        return changes;
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const key of allKeys) {
        if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
            changes[key] = {
                before: before[key],
                after: after[key]
            };
        }
    }
    return changes;
}
/**
 * Remove sensitive data from request body for logging
 */
function sanitizeBody(body) {
    if (!body)
        return body;
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    }
    return sanitized;
}
//# sourceMappingURL=audit.js.map