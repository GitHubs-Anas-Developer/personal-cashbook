import mongoose from 'mongoose';

const receiptSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true }
  },
  { _id: false }
);

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['income', 'expense', 'transfer', 'refund', 'reversal'],
      required: true,
      index: true
    },
    amountMinor: {
      type: Number,
      required: [true, 'Amount is required'],
      validate: {
        validator: function (v) {
          return Number.isSafeInteger(v) && v > 0;
        },
        message: 'Amount must be a positive safe integer in minor units (paise)'
      }
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true
    },
    date: {
      type: Date,
      required: [true, 'Transaction date is required'],
      default: Date.now,
      index: true
    },
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: [true, 'Source wallet is required'],
      index: true
    },
    destinationWalletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      default: null,
      validate: {
        validator: function (v) {
          if (this.type === 'transfer') {
            return mongoose.Types.ObjectId.isValid(v) && String(v) !== String(this.walletId);
          }
          return true;
        },
        message: 'Transfer requires a distinct destination wallet'
      }
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      validate: {
        validator: function (v) {
          if (['income', 'expense'].includes(this.type)) {
            if (this.linkedDebtId || this.linkedSavingsGoalId) {
              return true;
            }
            return mongoose.Types.ObjectId.isValid(v);
          }
          return true;
        },
        message: 'Category is required for income and expense transactions'
      }
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters']
    },
    tags: {
      type: [String],
      default: [],
      index: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: ''
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'cancelled', 'reconciled'],
      default: 'completed',
      index: true
    },
    reversalDirection: {
      type: String,
      enum: ['credit', 'debit', null],
      default: null
    },
    idempotencyKey: {
      type: String,
      default: undefined
    },
    receipt: {
      type: receiptSchema,
      default: null
    },
    linkedTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null
    },
    linkedDebtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Debt',
      default: null
    },
    linkedSavingsGoalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SavingsGoal',
      default: null
    },
    isRecurringInstance: {
      type: Boolean,
      default: false
    },
    recurringRuleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecurringRule',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for high performance querying
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });
transactionSchema.index({ userId: 1, walletId: 1, date: -1 });
transactionSchema.index({ userId: 1, categoryId: 1, date: -1 });
transactionSchema.index(
  { userId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);

export const Transaction = mongoose.model('Transaction', transactionSchema);
