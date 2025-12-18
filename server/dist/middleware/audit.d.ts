import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
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
export declare const auditMiddleware: (action: string, entity: string) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Manually log an audit entry
 */
export declare function logAudit(data: {
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
}): Promise<void>;
/**
 * Create audit log with before/after state comparison
 */
export declare function logChange(action: string, entity: string, entityId: string, beforeState: any, afterState: any, user: {
    id: string;
    name: string;
    role: string;
}, req?: Request): Promise<void>;
//# sourceMappingURL=audit.d.ts.map