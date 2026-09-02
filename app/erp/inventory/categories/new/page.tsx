"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  FolderPlus, 
  Folder, 
  Layers, 
  Package, 
  ChevronRight, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import styles from '../CategoriesPage.module.css';

export default function NewCategoryPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', description: '', parentId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRootCategories();
  }, []);

  const fetchRootCategories = async () => {
    try {
      const res = await fetch('/api/inventory/categories');
      if (res.ok) {
        const d = await res.json();
        setCategories(d.categories || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Category name is required.");
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/inventory/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          parentId: form.parentId || undefined
        })
      });

      const d = await res.json();
      if (!res.ok) {
        setError(d.error || 'Failed to create category');
        return;
      }

      router.push('/erp/inventory/categories');
    } catch (e) {
      setError('Network error while saving category');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedParent = categories.find(c => c.id === form.parentId);

  return (
    <div className={styles.formContainer}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button 
          onClick={() => router.push('/erp/inventory/categories')}
          className={styles.btnSecondary}
        >
          <ArrowLeft size={16} />
          <span>Back to Categories</span>
        </button>
      </div>

      <div className={styles.formCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-main)', paddingBottom: '16px' }}>
          <div className={styles.catIconBox} style={{ width: '48px', height: '48px' }}>
            <FolderPlus size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Add New Product Category
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Create a category taxonomy to group, filter, and organize your inventory products.
            </p>
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>
            ⚠ {error}
          </div>
        )}

        <div className={styles.formGrid}>
          {/* Form Column */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Category Name *</label>
              <input 
                type="text"
                placeholder="e.g. Dairy Products, Beverages, Power Tools"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                className={styles.formInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Parent Category (Hierarchy)</label>
              <select 
                value={form.parentId}
                onChange={e => setForm({ ...form, parentId: e.target.value })}
                className={styles.formSelect}
              >
                <option value="">— Top-Level (Root Category) —</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.parent ? `↳ ${c.name} (${c.parent.name})` : c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Description / Notes</label>
              <textarea 
                rows={4}
                placeholder="Provide details about products belonging to this category..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className={styles.formTextarea}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <button 
                type="button" 
                onClick={() => router.push('/erp/inventory/categories')}
                className={styles.btnSecondary}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className={styles.btnPrimary}
                disabled={submitting}
              >
                {submitting ? "Creating Category..." : "Create Category"}
              </button>
            </div>
          </form>

          {/* Live Preview Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              <Sparkles size={15} color="var(--primary)" />
              <span>Live Card Preview</span>
            </div>

            <div className={styles.categoryCard} style={{ background: 'var(--surface-hover)' }}>
              <div>
                <div className={styles.catCardHeader}>
                  <div className={styles.catIconBox}>
                    <Folder size={22} />
                  </div>
                  <div className={styles.catTitleArea}>
                    <h3 className={styles.catName}>
                      {form.name.trim() || "Category Name"}
                    </h3>
                    {selectedParent ? (
                      <span className={styles.parentBadge}>
                        <ChevronRight size={11} /> {selectedParent.name}
                      </span>
                    ) : (
                      <span className={styles.parentBadge} style={{ color: 'var(--primary)' }}>
                        Root Category
                      </span>
                    )}
                  </div>
                </div>

                <p className={styles.catDescription} style={{ marginTop: '12px' }}>
                  {form.description.trim() || "Category description will appear here."}
                </p>
              </div>

              <div className={styles.catCardFooter}>
                <div className={styles.catStats}>
                  <span className={styles.statPill}>
                    <Package size={13} color="var(--primary)" />
                    0 items
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Preview</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
