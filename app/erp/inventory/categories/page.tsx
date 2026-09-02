"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Folder, 
  FolderPlus, 
  Plus, 
  Layers, 
  Package, 
  Search, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Grid, 
  List, 
  CheckCircle2, 
  AlertCircle,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import styles from './CategoriesPage.module.css';

/** Category record from API */
interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  parent?: { name: string };
  _count: { products: number; children: number };
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal State for Quick Add / Edit
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', description: '', parentId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  /** Loads all categories from the API */
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/inventory/categories');
      if (res.ok) {
        const d = await res.json();
        setCategories(d.categories || []);
      }
    } catch (e) {
      console.error("Failed to fetch categories:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCategories();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const openAddModal = (parentId?: string) => {
    setEditingCategory(null);
    setForm({ name: '', description: '', parentId: parentId || '' });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      description: cat.description || '',
      parentId: cat.parentId || ''
    });
    setError('');
    setShowModal(true);
  };

  /** Handles form submission */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Category name is required");
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const isEdit = !!editingCategory;
      const url = isEdit ? `/api/inventory/categories/${editingCategory.id}` : '/api/inventory/categories';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          parentId: form.parentId || undefined
        })
      });

      const d = await res.json();
      if (!res.ok) {
        setError(d.error || 'Failed to save category');
        return;
      }

      setSuccessMsg(`Category "${form.name}" ${isEdit ? 'updated' : 'created'} successfully!`);
      setShowModal(false);
      setForm({ name: '', description: '', parentId: '' });
      await fetchCategories();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      setError('Network error saving category');
    } finally {
      setSubmitting(false);
    }
  };

  /** Handles deletion */
  const handleDelete = async (cat: Category) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;
    try {
      const res = await fetch(`/api/inventory/categories/${cat.id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMsg(`Category "${cat.name}" deleted.`);
        setCategories(prev => prev.filter(c => c.id !== cat.id));
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete category');
      }
    } catch (e) {
      alert('Network error deleting category');
    }
  };

  // KPIs Calculations
  const totalCategories = categories.length;
  const rootCategories = useMemo(() => categories.filter(c => !c.parentId), [categories]);
  const subCategoriesCount = useMemo(() => categories.filter(c => c.parentId).length, [categories]);
  const totalProductsCovered = useMemo(() => {
    return categories.reduce((sum, c) => sum + (c._count?.products || 0), 0);
  }, [categories]);

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(c => 
      c.name.toLowerCase().includes(q) || 
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.parent && c.parent.name.toLowerCase().includes(q))
    );
  }, [categories, search]);

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.headerWrapper}>
        <div className={styles.titleGroup}>
          <h1>
            Product Categories
            <span className={styles.titleBadge}>{totalCategories} Total</span>
          </h1>
          <p>Organize and structure your inventory catalog into parent and sub-categories.</p>
        </div>

        <div className={styles.actionGroup}>
          <button 
            className={styles.btnSecondary}
            onClick={handleRefresh}
            title="Refresh list"
          >
            <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button 
            className={styles.btnSecondary}
            onClick={() => openAddModal()}
          >
            <FolderPlus size={15} />
            <span>Quick Add</span>
          </button>

          <Link href="/erp/inventory/categories/new" className={styles.btnPrimary}>
            <Plus size={16} />
            <span>Add Category</span>
          </Link>
        </div>
      </div>

      {/* Success Alert Banner */}
      {successMsg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          fontSize: '0.875rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Toolbar (Search & View Toggle) */}
      <div className={styles.toolbarCard}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search categories by name, description, parent..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.viewToggles}>
          <button 
            className={`${styles.viewToggleBtn} ${viewMode === 'grid' ? styles.viewToggleActive : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <Grid size={15} />
            <span>Grid</span>
          </button>
          <button 
            className={`${styles.viewToggleBtn} ${viewMode === 'table' ? styles.viewToggleActive : ''}`}
            onClick={() => setViewMode('table')}
          >
            <List size={15} />
            <span>Table</span>
          </button>
        </div>
      </div>

      {/* Category Content: Grid or Table */}
      {isLoading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} color="var(--primary)" />
          <p>Loading categories...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className={styles.categoryCard} style={{ textAlign: 'center', padding: '48px 24px', alignItems: 'center' }}>
          <div className={styles.catIconBox} style={{ width: '56px', height: '56px' }}>
            <Folder size={28} />
          </div>
          <h3 style={{ margin: 0, color: 'var(--text-main)' }}>No Categories Found</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '340px' }}>
            {search ? "No categories match your search criteria." : "Get started by creating your first product category."}
          </p>
          <button className={styles.btnPrimary} onClick={() => openAddModal()} style={{ marginTop: '8px' }}>
            <Plus size={16} /> Create Category
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className={styles.categoryGrid}>
          {filteredCategories.map(cat => (
            <div key={cat.id} className={styles.categoryCard}>
              <div>
                <div className={styles.catCardHeader}>
                  <div className={styles.catIconBox}>
                    <Folder size={22} />
                  </div>
                  <div className={styles.catTitleArea}>
                    <h3 className={styles.catName}>{cat.name}</h3>
                    {cat.parent ? (
                      <span className={styles.parentBadge}>
                        <ChevronRight size={11} /> {cat.parent.name}
                      </span>
                    ) : (
                      <span className={styles.parentBadge} style={{ color: 'var(--primary)' }}>
                        Root Category
                      </span>
                    )}
                  </div>
                </div>

                <p className={styles.catDescription} style={{ marginTop: '12px' }}>
                  {cat.description || "No description provided for this category."}
                </p>
              </div>

              <div className={styles.catCardFooter}>
                <div className={styles.catStats}>
                  <span className={styles.statPill} title="Products in this category">
                    <Package size={13} color="var(--primary)" />
                    {cat._count?.products || 0} items
                  </span>
                  {cat._count?.children > 0 && (
                    <span className={styles.statPill} title="Sub-categories">
                      <FolderPlus size={13} color="#8b5cf6" />
                      {cat._count.children} sub
                    </span>
                  )}
                </div>

                <div className={styles.catActions}>
                  <button 
                    className={styles.iconBtn} 
                    onClick={() => openAddModal(cat.id)}
                    title="Add Sub-Category"
                  >
                    <FolderPlus size={14} />
                  </button>
                  <button 
                    className={styles.iconBtn} 
                    onClick={() => openEditModal(cat)}
                    title="Edit Category"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`} 
                    onClick={() => handleDelete(cat)}
                    title="Delete Category"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className={styles.tablePanel}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Category Details</th>
                  <th className={styles.th}>Hierarchy</th>
                  <th className={styles.th}>Products</th>
                  <th className={styles.th}>Sub-Categories</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map(cat => (
                  <tr key={cat.id} className={styles.tr}>
                    <td className={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className={styles.catIconBox} style={{ width: '36px', height: '36px' }}>
                          <Folder size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{cat.name}</div>
                          {cat.description && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {cat.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={styles.td}>
                      {cat.parent ? (
                        <span className={styles.parentBadge}>
                          <ChevronRight size={11} /> {cat.parent.name}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>— (Root)</span>
                      )}
                    </td>
                    <td className={styles.td}>
                      <span className={styles.statPill}>
                        <Package size={13} color="var(--primary)" />
                        {cat._count?.products || 0} products
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.statPill}>
                        {cat._count?.children || 0} sub-categories
                      </span>
                    </td>
                    <td className={styles.td} style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button 
                          className={styles.iconBtn} 
                          onClick={() => openAddModal(cat.id)}
                          title="Add Sub-Category"
                        >
                          <FolderPlus size={14} />
                        </button>
                        <button 
                          className={styles.iconBtn} 
                          onClick={() => openEditModal(cat)}
                          title="Edit Category"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          className={`${styles.iconBtn} ${styles.iconBtnDanger}`} 
                          onClick={() => handleDelete(cat)}
                          title="Delete Category"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Add / Edit Category Modal */}
      {showModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            padding: '16px'
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{
            width: '100%',
            maxWidth: '480px',
            background: 'var(--surface-main)',
            border: '1px solid var(--border-main)',
            borderRadius: '20px',
            padding: '26px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderPlus size={20} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {editingCategory ? "Edit Category" : "Add Category"}
                </h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.825rem', fontWeight: 600 }}>
                ⚠ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Category Name *</label>
                <input 
                  type="text" 
                  value={form.name} 
                  onChange={e => setForm({ ...form, name: e.target.value })} 
                  placeholder="e.g. Beverages, Electronics" 
                  required 
                  className={styles.formInput} 
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Parent Category (Optional)</label>
                <select 
                  value={form.parentId} 
                  onChange={e => setForm({ ...form, parentId: e.target.value })} 
                  className={styles.formSelect}
                >
                  <option value="">— None (Root Category) —</option>
                  {rootCategories.filter(c => !editingCategory || c.id !== editingCategory.id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description</label>
                <textarea 
                  value={form.description} 
                  onChange={e => setForm({ ...form, description: e.target.value })} 
                  placeholder="Optional details or handling instructions..." 
                  rows={3} 
                  className={styles.formTextarea} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  className={styles.btnSecondary} 
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.btnPrimary} 
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : editingCategory ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
