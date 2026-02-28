import { db } from './db';
import { log } from './logger';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'VIEW'
  | 'EXPORT'
  | 'IMPORT';

export type AuditEntity =
  | 'User'
  | 'Shipment'
  | 'Document'
  | 'PickupRequest'
  | 'TrackingEvent'
  | 'Message'
  | 'ServiceShowcase'
  | 'Executive'
  | 'System';

interface AuditLogParams {
  userId?: string;
  userEmail?: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId,
        userEmail: params.userEmail,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        changes: params.changes || {},
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });

    log.info(
      `Audit: ${params.action} ${params.entity}${params.entityId ? ` (${params.entityId})` : ''} by ${params.userEmail || params.userId || 'system'}`
    );
  } catch (error) {
    log.error('Failed to create audit log', { error, params });
  }
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(filters: {
  userId?: string;
  entity?: AuditEntity;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.entity) where.entity = filters.entity;
  if (filters.action) where.action = filters.action;
  if (filters.startDate || filters.endDate) {
    where.timestamp = {};
    if (filters.startDate) where.timestamp.gte = filters.startDate;
    if (filters.endDate) where.timestamp.lte = filters.endDate;
  }

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    db.auditLog.count({ where }),
  ]);

  return { logs, total };
}

/**
 * Helper to extract request metadata
 */
export function getRequestMetadata(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const userAgent = request.headers.get('user-agent');

  const ipAddress = forwarded?.split(',')[0].trim() || realIp || 'unknown';

  return {
    ipAddress,
    userAgent: userAgent || 'unknown',
  };
}
