'use client';
import React, { useState } from 'react';
import {
  useGetCategoriesQuery,
  useArchiveCategoryMutation
} from '../../../store/services/api.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../../store/slices/uiSlice.js';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { CategoryForm } from '../../../components/forms/CategoryForm.jsx';
import { Tag, Plus, Edit2, Archive, Check } from 'lucide-react';

export default function CategoriesPage() {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('expense');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const { data, isLoading, refetch } = useGetCategoriesQuery(activeTab);
  const [archiveCategory] = useArchiveCategoryMutation();

  const categories = data?.data || [];

  const handleArchive = async (id) => {
    try {
      await archiveCategory(id).unwrap();
      dispatch(showToast({ type: 'success', message: 'Category archived.' }));
      refetch();
    } catch (err) {
      dispatch(showToast({ type: 'error', message: err?.data?.message || 'Failed to archive.' }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Category Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Organize income and expenses with customizable tags and colors
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab selector */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 text-xs">
            <button
              onClick={() => setActiveTab('expense')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Expense Categories
            </button>
            <button
              onClick={() => setActiveTab('income')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Income Categories
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => {
              setEditingCategory(null);
              setIsAddOpen(true);
            }}
          >
            New Category
          </Button>
        </div>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading categories...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {categories.map((cat) => (
            <Card
              key={cat._id}
              className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 text-xs font-bold"
                    style={{ backgroundColor: cat.color || '#4F46E5' }}
                  >
                    <Tag className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {cat.name}
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      {cat.isSystem ? 'Default System' : 'Custom Category'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setEditingCategory(cat);
                      setIsAddOpen(true);
                    }}
                    title="Edit Category"
                    className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {!cat.isSystem && (
                    <button
                      onClick={() => handleArchive(cat._id)}
                      title="Archive Category"
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setEditingCategory(null);
        }}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        description="Set category name and presentation badge color"
      >
        <CategoryForm
          category={editingCategory}
          defaultType={activeTab}
          onSuccess={() => {
            setIsAddOpen(false);
            setEditingCategory(null);
            refetch();
          }}
          onCancel={() => {
            setIsAddOpen(false);
            setEditingCategory(null);
          }}
        />
      </Modal>
    </div>
  );
}
