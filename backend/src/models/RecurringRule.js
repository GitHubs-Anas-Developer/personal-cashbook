import mongoose from 'mongoose';

const recurringRuleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    type: {
      type: String,
      enum: ['income', 'expense', 'transfer'],
      required: true
    },
    amountMinor: {
      type: Number,
      required: true,
      validate: {
        validator: function (v) {
          return Number.isSafeInteger(v) && v > 0;
        },
        message: 'Amount must be a positive safe integer'
      }
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true
    },
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true
    },
    destinationWalletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      default: null
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'],
      required: true
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: null
    },
    nextRunDate: {
      type: Date,
      required: true,
      index: true
    },
    lastRunDate: {
      type: Date,
      default: null
    },
    autoProcess: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed'],
      default: 'active',
      index: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
      default: ''
    }
  },
  {
    timestamps: true
  }
);

recurringRuleSchema.index({ userId: 1, status: 1, nextRunDate: 1 });

export const RecurringRule = mongoose.model('RecurringRule', recurringRuleSchema);
