import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: String },
  entityNumber: { type: String },
  performedBy: { type: String, required: true, default: 'System' },
  userRole: { type: String },
  details: { type: String, required: true },
  previousState: { type: mongoose.Schema.Types.Mixed },
  newState: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['INFO', 'WARNING', 'SUCCESS', 'ALERT'], default: 'INFO' },
  targetRole: { type: String },
  link: { type: String },
  read: { type: Boolean, default: false }
}, { timestamps: true });

export const Notification = mongoose.model('Notification', notificationSchema);
