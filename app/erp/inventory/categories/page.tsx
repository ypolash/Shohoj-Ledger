"use client";

import React, { useState, useEffect } from 'react';
import { InventoryDataTable, InventoryColumn } from '../components/InventoryDataTable';

/** Category record from API */
interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  parent?: { name: string };
  _count: { products: number; children: number };
}

/**
 * ERP Inventory — Product Categories Page (Universal Table Redesign 2.0)
 * Displays all categories with product counts, supports nested parent categories,
 * and allows creating new categories via a modal.
 */
export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', parentId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { fetchCategories(); }, []);

  /** Loads all categories from the API */
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/inventory/categories');
      if (res.ok) { const d = await res.json(); setCategories(d.categories || []); }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  /** Handles form field changes */
  const handleForm = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  /** Submits the new category to the API */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/inventory/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, parentId: form.parentId || undefined })
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Failed to create category'); return; }
      setSuccessMsg('Category created successfully!');
      setShowModal(false);
      setForm({ name: '', description: '', parentId: '' });
      fetchCategories();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) { setError('Network error'); }
    finally { setSubmitting(false); }
  };

  // Filter categories by search
  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.description && c.description.toLowerCase().includes(search.toLowerCase())) ||
    (c.parent && c.parent.name.toLowerCase().includes(search.toLowerCase()))
  );

  // Root-level categories (for parent dropdown — avoid infinite nesting)
  const rootCategories = categories.filter(c => !c.parentId);

  const columns: InventoryColumn<Category>[] = [
    {
      key: 'name',
      header: 'Category Details',
      render: (cat) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary, #38bdf8)' }}>folder</span>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>{cat.name}</div>
            {cat.description && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{cat.description}</div>}
          </div>
        </div>
      )
    },
    {
      key: 'parent',
      header: 'Parent Category',
      render: (cat) => cat.parent ? (
        <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--primary, #38bdf8)', fontSize: '12px', fontWeight: 600 }}>
          {cat.parent.name}
        </span>
      ) : <span style={{ color: 'var(--text-muted)' }}>— (Root)</span>
    },
    {
      key: 'products',
      header: 'Products Count',
      render: (cat) => (
        <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'var(--surface-hover)', color: 'var(--text-main)', fontSize: '12px', fontWeight: 600, border: '1px solid var(--border-main)' }}>
          {cat._count.products} items
        </span>
      )
    },
    {
      key: 'subcategories',
      header: 'Sub-Categories',
      render: (cat) => (
        <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'var(--surface-hover)', color: 'var(--text-main)', fontSize: '12px', fontWeight: 600, border: '1px solid var(--border-main)' }}>
          {cat._count.children} sub
        </span>
      )
    }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Product Categories</h1>
        </div>
        <button className="btn btn-primary hover-lift" onClick={() => { setShowModal(true); setError(''); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
          Add Category
        </button>
      </div>

      {successMsg && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success, #10b981)', border: '1px solid var(--success)', fontSize: '14px' }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Universal Inventory Table */}
      <InventoryDataTable
        columns={columns}
        data={filteredCategories}
        isLoading={isLoading}
        emptyIcon="category"
        emptyTitle="No categories yet"
        emptySubtitle="Create your first product category to organize your inventory."
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search categories by name or description..."
      />

      {/* Add Category Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', borderRadius: '20px', padding: '32px', margin: '16px', border: '1px solid var(--border-main)', background: 'var(--surface-bg, #1e293b)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-main)' }}>Add Category</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
              </button>
            </div>

            {error && <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger, #ef4444)', fontSize: '14px' }}>⚠ {error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Category Name *</label>
                <input type="text" value={form.name} onChange={e => handleForm('name', e.target.value)} placeholder="e.g. Electronics" required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea value={form.description} onChange={e => handleForm('description', e.target.value)} placeholder="Optional description" rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div>
                <label style={labelStyle}>Parent Category (optional)</label>
                <select value={form.parentId} onChange={e => handleForm('parentId', e.target.value)} style={inputStyle}>
                  <option value="">— Root Category —</option>
                  {rootCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input, rgba(15, 23, 42, 0.6))', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' };
