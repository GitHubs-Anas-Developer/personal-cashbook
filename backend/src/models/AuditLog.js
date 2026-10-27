import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'reverse', 'reconcile', 'export', 'login', 'logout', 'password_change'],
      required: true,
      index: true
    },
    entityType: {
      type: String,
      required: true,
      enum: ['transaction', 'wallet', 'budget', 'debt', 'savings_goal', 'category', 'recurring_rule', 'user', 'session']
    },
    entityId: {
      type: String,
      required: true
    },
    previousState: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    newState: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    metadata: {
      ipAddress: { type: String, default: '' },
      userAgent: { type: String, default: '' },
      reason: { type: String, default: '' }
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

auditLogSchema.index({ userId: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
