import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from './auth';

const prisma = new PrismaClient();

function jsonStringifySafe(value: any): string {
  try {
    return JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? v.toString() : v));
  } catch {
    try {
      return String(value);
    } catch {
      return '[Unserializable]';
    }
  }
}

export interface AuditLogData {
  action: string;
  entity: string;
  entityId?: string;
  changes?: any;
  metadata?: any;
}

/**
 * Middleware to automatically log API requests for auditing
 */
export const auditMiddleware = (action: string, entity: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return next();
    }

    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to capture response
    res.json = function (data: any) {
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

/**
 * Manually log an audit entry
 */
export async function logAudit(data: {
  action: string;
  entity: string;
  entityId?: string;
  userId: string;
  userName: string;
  userRole: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        userId: data.userId,
        userName: data.userName,
        userRole: data.userRole,
        changes: data.changes ? jsonStringifySafe(data.changes) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata ? jsonStringifySafe(data.metadata) : null
      }
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Create audit log with before/after state comparison
 */
export async function logChange(
  action: string,
  entity: string,
  entityId: string,
  beforeState: any,
  afterState: any,
  user: { id: string; name: string; role: string },
  req?: Request
) {
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
function compareObjects(before: any, after: any): Record<string, { before: any; after: any }> {
  const changes: Record<string, { before: any; after: any }> = {};
  
  if (!before || !after) return changes;

  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  
  for (const key of allKeys) {
    if (jsonStringifySafe(before[key]) !== jsonStringifySafe(after[key])) {
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
function sanitizeBody(body: any): any {
  if (!body) return body;
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}
