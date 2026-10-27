import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [50, 'Category name cannot exceed 50 characters']
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
      index: true
    },
    color: {
      type: String,
      default: '#4F46E5'
    },
    icon: {
      type: String,
      default: 'tag'
    },
    isSystem: {
      type: Boolean,
      default: false
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    }
  },
  {
    timestamps: true
  }
);

categorySchema.index({ userId: 1, type: 1, isArchived: 1 });

export const Category = mongoose.model('Category', categorySchema);
