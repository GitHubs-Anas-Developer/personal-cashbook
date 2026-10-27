'use client';
import React, { useState } from 'react';
import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';
import { Select } from '../ui/Select.jsx';
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation
} from '../../store/services/api.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/slices/uiSlice.js';

const PRESET_COLORS = [
  '#10B981', // Emerald
  '#EF4444', // Rose
  '#4F46E5', // Indigo
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#64748B'  // Slate
];

export function CategoryForm({ category = null, defaultType = 'expense', onSuccess, onCancel }) {
  const dispatch = useDispatch();
  const isEditing = !!category;

  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();

  const [name, setName] = useState(category?.name || '');
  const [type, setType] = useState(category?.type || defaultType);
  const [color, setColor] = useState(category?.color || '#4F46E5');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      dispatch(showToast({ type: 'error', message: 'Category name is required.' }));
      return;
    }

    const payload = {
      name: name.trim(),
      type,
      color
    };

    try {
      if (isEditing) {
        await updateCategory({ id: category._id, ...payload }).unwrap();
        dispatch(showToast({ type: 'success', message: 'Category updated.' }));
      } else {
        await createCategory(payload).unwrap();
        dispatch(showToast({ type: 'success', message: 'Category created.' }));
      }
      onSuccess?.();
    } catch (err) {
      dispatch(showToast({ type: 'error', message: err?.data?.message || 'Failed to save category.' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Category Name"
        required
        placeholder="e.g. Groceries, Gym, Dividends"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <Select
        label="Category Type"
        required
        disabled={isEditing}
        value={type}
        onChange={(e) => setType(e.target.value)}
      >
        <option value="expense">Expense Category</option>
        <option value="income">Income Category</option>
      </Select>

      {/* Color Swatches */}
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Badge Color
        </label>
        <div className="flex items-center gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full transition-transform ${
                color === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        {onCancel && (
          <Button variant="outline" size="md" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isCreating || isUpdating}
        >
          {isEditing ? 'Save Changes' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
}
