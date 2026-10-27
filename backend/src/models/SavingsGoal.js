import mongoose from 'mongoose';

const savingsGoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Goal name is required'],
      trim: true,
      maxlength: [100, 'Goal name cannot exceed 100 characters']
    },
    targetAmountMinor: {
      type: Number,
      required: [true, 'Target amount is required'],
      validate: {
        validator: function (v) {
          return Number.isSafeInteger(v) && v > 0;
        },
        message: 'Target amount must be a positive safe integer in minor units'
      }
    },
    currentAmountMinor: {
      type: Number,
      default: 0,
      validate: {
        validator: function (v) {
          return Number.isSafeInteger(v) && v >= 0;
        },
        message: 'Current amount must be a non-negative safe integer'
      }
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true
    },
    targetDate: {
      type: Date,
      default: null
    },
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      default: null
    },
    color: {
      type: String,
      default: '#10B981'
    },
    icon: {
      type: String,
      default: 'piggy-bank'
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'paused', 'cancelled'],
      default: 'in_progress'
    }
  },
  {
    timestamps: true
  }
);

savingsGoalSchema.index({ userId: 1, status: 1 });

export const SavingsGoal = mongoose.model('SavingsGoal', savingsGoalSchema);
