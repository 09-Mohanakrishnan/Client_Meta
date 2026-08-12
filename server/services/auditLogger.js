import AuditLog from '../models/AuditLog.js';

export const logActivity = async ({
  userId,
  userEmail,
  action,
  entityType,
  entityId,
  field = '',
  oldValue = null,
  newValue = null,
  req = null,
}) => {
  try {
    let ipAddress = '';
    if (req) {
      ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      // Clean up IP if it has ipv6 prefix
      if (ipAddress.startsWith('::ffff:')) {
        ipAddress = ipAddress.substring(7);
      }
    }

    await AuditLog.create({
      userId,
      userEmail,
      action,
      entityType,
      entityId,
      field,
      oldValue,
      newValue,
      ipAddress,
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};
