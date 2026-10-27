import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Budget name is required'],
      trim: true,
      maxlength: [100, 'Budget name cannot exceed 100 characters']
    },
    period: {
      type: String,
      enum: ['weekly', 'monthly', 'yearly'],
      default: 'monthly'
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null // null indicates overall budget
    },
    amountMinor: {
      type: Number,
      required: [true, 'Budget amount is required'],
      validate: {
        validator: function (v) {
          return Number.isSafeInteger(v) && v > 0;
        },
        message: 'Budget amount must be a positive safe integer in minor units'
      }
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: null
    },
    alertThresholdPercent: {
      type: Number,
      default: 80,
      min: 1,
      max: 100
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

budgetSchema.index({ userId: 1, period: 1, isActive: 1 });

export const Budget = mongoose.model('Budget', budgetSchema);
