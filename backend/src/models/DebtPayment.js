import mongoose from 'mongoose';

const debtPaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    debtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Debt',
      required: true,
      index: true
    },
    amountMinor: {
      type: Number,
      required: [true, 'Payment amount is required'],
      validate: {
        validator: function (v) {
          return Number.isSafeInteger(v) && v > 0;
        },
        message: 'Payment amount must be a positive safe integer'
      }
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true
    },
    date: {
      type: Date,
      default: Date.now,
      index: true
    },
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: ''
    }
  },
  {
    timestamps: true
  }
);

debtPaymentSchema.index({ userId: 1, debtId: 1, date: -1 });

export const DebtPayment = mongoose.model('DebtPayment', debtPaymentSchema);
