import prisma from '../config/database';

type AuditAction = 'create' | 'update' | 'delete';

interface AuditLogParams {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValues?: unknown;
  newValues?: unknown;
}

/**
 * Writes an immutable audit log entry.
 * Must be called for every CREATE / UPDATE / DELETE on business entities.
 */
export const auditService = {
  async log({ userId, action, entityType, entityId, oldValues, newValues }: AuditLogParams): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        oldValues: oldValues !== undefined ? JSON.stringify(oldValues) : null,
        newValues: newValues !== undefined ? JSON.stringify(newValues) : null,
      },
    });
  },
};
