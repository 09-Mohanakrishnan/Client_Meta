import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  entityType: {
    type: String,
    required: true,
    enum: ['campaign', 'adset', 'ad', 'column', 'user', 'system'],
  },
  entityId: {
    type: String,
    required: true,
  },
  field: {
    type: String,
    default: '',
  },
  oldValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  ipAddress: {
    type: String,
    default: '',
  },
});

// Index for quick queries
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
