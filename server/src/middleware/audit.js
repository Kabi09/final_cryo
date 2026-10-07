import { AuditLog } from '../models/AuditLog.js';

export const logAudit = async ({
  action,
  entityType,
  entityId,
  entityNumber,
  performedBy = 'System',
  userRole = 'SYSTEM',
  details,
  previousState = null,
  newState = null,
  ipAddress = ''
}) => {
  try {
    await AuditLog.create({
      action,
      entityType,
      entityId: entityId ? String(entityId) : '',
      entityNumber: entityNumber || '',
      performedBy,
      userRole,
      details,
      previousState,
      newState,
      ipAddress
    });
  } catch (error) {
    console.error('Audit logging failed:', error.message);
  }
};
