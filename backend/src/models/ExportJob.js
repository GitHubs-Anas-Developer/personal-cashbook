import mongoose from 'mongoose';

const exportJobSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    format: {
      type: String,
      enum: ['csv', 'pdf', 'json'],
      required: true
    },
    exportType: {
      type: String,
      enum: ['transactions', 'full_backup', 'monthly_report', 'category_breakdown'],
      default: 'transactions'
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    fileUrl: {
      type: String,
      default: null
    },
    parameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    error: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const ExportJob = mongoose.model('ExportJob', exportJobSchema);
