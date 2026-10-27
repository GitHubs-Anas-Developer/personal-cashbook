import mongoose from 'mongoose';

const debtSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['lent', 'borrowed'],
      required: [true, 'Debt type (lent/borrowed) is required'],
      index: true
    },
    personName: {
      type: String,
      required: [true, 'Contact person or institution name is required'],
      trim: true,
      maxlength: [100, 'Person name cannot exceed 100 characters']
    },
    personContact: {
      type: String,
      trim: true,
      maxlength: [100, 'Contact info cannot exceed 100 characters'],
      default: ''
    },
    initialAmountMinor: {
      type: Number,
      required: [true, 'Initial amount is required'],
      validate: {
        validator: function (v) {
          return Number.isSafeInteger(v) && v > 0;
        },
        message: 'Initial amount must be a positive safe integer'
      }
    },
    remainingAmountMinor: {
      type: Number,
      required: true,
      validate: {
        validator: function (v) {
          return Number.isSafeInteger(v) && v >= 0;
        },
        message: 'Remaining amount must be a non-negative safe integer'
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
      default: null
    },
    dueDate: {
      type: Date,
      default: null,
      index: true
    },
    interestRatePercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: ['active', 'settled', 'defaulted'],
      default: 'active',
      index: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: ''
    }
  },
  {
    timestamps: true
  }
);

debtSchema.index({ userId: 1, type: 1, status: 1 });

export const Debt = mongoose.model('Debt', debtSchema);
