import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Wallet name is required'],
      trim: true,
      maxlength: [60, 'Wallet name cannot exceed 60 characters']
    },
    type: {
      type: String,
      enum: ['cash', 'bank', 'savings', 'upi', 'credit_card', 'other'],
      default: 'bank'
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true
    },
    openingBalanceMinor: {
      type: Number,
      default: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: 'Opening balance must be a safe integer (in minor units/paise)'
      }
    },
    currentBalanceMinor: {
      type: Number,
      default: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: 'Current balance must be a safe integer (in minor units/paise)'
      }
    },
    color: {
      type: String,
      default: '#4F46E5'
    },
    icon: {
      type: String,
      default: 'wallet'
    },
    accountNumberLast4: {
      type: String,
      trim: true,
      maxlength: 4,
      default: ''
    },
    upiId: {
      type: String,
      trim: true,
      maxlength: 100,
      default: ''
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    sortOrder: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

walletSchema.index({ userId: 1, isArchived: 1, sortOrder: 1 });

export const Wallet = mongoose.model('Wallet', walletSchema);
