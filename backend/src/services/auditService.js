import { AuditLog } from '../models/AuditLog.js';

export async function logAuditEvent({
  userId,
  action,
  entityType,
  entityId,
  previousState = null,
  newState = null,
  metadata = {}
}) {
  try {
    await AuditLog.create({
      userId,
      action,
      entityType,
      entityId: String(entityId),
      previousState,
      newState,
      metadata
    });
  } catch (error) {
    // Non-blocking for audit failures in production, but log warning
    console.warn('[AuditService] Failed to record audit log:', error.message);
  }
}
