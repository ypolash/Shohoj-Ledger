"use client";

import React, { useState, useEffect, useCallback } from 'react';

/** Product record from API */
interface Product {
  id: string;
  productCode: string;
  name: string;
  sku?: string;
  barcode?: string;
  brand?: string;
  unit?: string;
  purchasePrice: number;
  sellingPrice: number;
  minStock: number;
  maxStock: number;
  reorderLevel: number;
  status: string;
  currentStock: number;
  category?: { name: string };
}

/** Category record from API */
interface Category {
  id: string;
  name: string;
}

/** Initial state for the Add Product form */
const EMPTY_FORM = {
  productCode: '', name: '', sku: '', barcode: '', brand: '', unit: '',
  purchasePrice: '', sellingPrice: '', minStock: '', maxStock: '',
  reorderLevel: '', status: 'ACTIVE', categoryId: '', description: '', notes: '',
};

/**
 * ERP Inventory — Products Page
 * Displays a searchable, filterable product list and supports adding new products.
 */
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const LIMIT = 20;

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchProducts(); }, [page, search, categoryFilter]);
  useEffect(() => {
    const handleClick = () => setMenuOpen(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  /** Loads categories for the filter dropdown and create form */
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/inventory/categories');
      if (res.ok) { const d = await res.json(); setCategories(d.categories || []); }
    } catch (e) { console.error(e); }
  };

  /** Loads paginated, filtered products from the API */
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (search) params.set('search', search);
      if (categoryFilter) params.set('categoryId', categoryFilter);
      const res = await fetch(`/api/inventory/products?${params}`);
      if (res.ok) {
        const d = await res.json();
        setProducts(d.products || []);
        setTotal(d.pagination?.total || 0);
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, [page, search, categoryFilter]);

  /** Handles search input with page reset */
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  /** Handles form field changes */
  const handleForm = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  /** Submits the new product to the API */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/inventory/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          purchasePrice: Number(form.purchasePrice) || 0,
          sellingPrice: Number(form.sellingPrice) || 0,
          minStock: Number(form.minStock) || 0,
          maxStock: Number(form.maxStock) || 0,
          reorderLevel: Number(form.reorderLevel) || 0,
          categoryId: form.categoryId || undefined,
        })
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Failed to create product'); return; }
      setSuccessMsg('Product created successfully!');
      setShowModal(false);
      setForm(EMPTY_FORM);
      fetchProducts();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) { setError('Network error'); }
    finally { setSubmitting(false); }
  };

  /** Returns a badge style based on current stock vs. min stock threshold */
  const stockBadge = (product: Product) => {
    if (product.currentStock <= 0) return { label: 'Out of Stock', color: 'var(--danger)', bg: 'var(--danger-subtle)' };
    if (product.currentStock <= product.minStock) return { label: 'Low Stock', color: 'var(--warning)', bg: 'var(--warning-subtle)' };
    return { label: 'In Stock', color: 'var(--success)', bg: 'var(--success-subtle)' };
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Products</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            {total} product{total !== 1 ? 's' : ''} total
          </p>
        </div>
        <button className="btn btn-primary hover-lift" onClick={() => { setShowModal(true); setError(''); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
          Add Product
        </button>
      </div>

      {successMsg && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--success-subtle)', color: 'var(--success)', border: '1px solid var(--success)', fontSize: '14px' }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Filters */}
      <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '14px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: 'var(--text-muted)' }}>search</span>
          <input
            type="text"
            placeholder="Search by name, code, SKU, barcode..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '38px', padding: '10px 12px 10px 38px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
          style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', minWidth: '180px' }}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ borderRadius: '16px' }}>
        <div style={{ overflowX: 'auto', minHeight: '300px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
                {['Code', 'Name', 'Category', 'Unit', 'Stock', 'Sell Price', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-main)' }}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} style={{ padding: '14px 16px' }}>
                        <div style={{ height: '14px', borderRadius: '6px', background: 'var(--surface-hover)', opacity: 0.7 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4, display: 'block', marginBottom: '8px' }}>inventory_2</span>
                    No products found. Add one to get started.
                  </td>
                </tr>
              ) : products.map((p) => {
                const badge = stockBadge(p);
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-main)', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>{p.productCode}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 500, color: 'var(--text-main)' }}>
                      <div>{p.name}</div>
                      {p.sku && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>SKU: {p.sku}</div>}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{p.category?.name || '—'}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{p.unit || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: badge.color, background: badge.bg }}>
                        {p.currentStock} · {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-main)', fontWeight: 500 }}>৳{Number(p.sellingPrice).toLocaleString()}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: p.status === 'ACTIVE' ? 'var(--success)' : 'var(--text-muted)', background: p.status === 'ACTIVE' ? 'var(--success-subtle)' : 'var(--surface-hover)' }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', position: 'relative' }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === p.id ? null : p.id); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>more_vert</span>
                      </button>
                      
                      {menuOpen === p.id && (
                        <div style={{
                          position: 'absolute',
                          right: '16px',
                          top: '40px',
                          background: 'var(--surface-bg)',
                          border: '1px solid var(--border-main)',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          padding: '4px',
                          zIndex: 10,
                          minWidth: '140px',
                          display: 'flex',
                          flexDirection: 'column'
                        }}>
                          <button style={{ padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-main)', borderRadius: '4px' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            onClick={() => alert('View Details coming soon')}
                          >
                            View Details
                          </button>
                          <button style={{ padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-main)', borderRadius: '4px' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            onClick={() => alert('Edit Product coming soon')}
                          >
                            Edit Product
                          </button>
                          <button style={{ padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--danger)', borderRadius: '4px' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-subtle)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            onClick={() => alert('Delete Product coming soon')}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid var(--border-main)' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total}</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 14px', fontSize: '13px' }}>← Prev</button>
              <span style={{ padding: '6px 14px', fontSize: '13px', color: 'var(--text-main)', fontWeight: 600 }}>{page} / {totalPages}</span>
              <button className="btn btn-secondary" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '6px 14px', fontSize: '13px' }}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', borderRadius: '20px', padding: '32px', maxHeight: '90vh', overflowY: 'auto', margin: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-main)' }}>Add New Product</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
              </button>
            </div>

            {error && <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', background: 'var(--danger-subtle)', color: 'var(--danger)', fontSize: '14px' }}>⚠ {error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="Product Code *" value={form.productCode} onChange={v => handleForm('productCode', v)} placeholder="e.g. PROD-001" required />
                <Field label="Product Name *" value={form.name} onChange={v => handleForm('name', v)} placeholder="e.g. Wireless Mouse" required />
                <Field label="SKU" value={form.sku} onChange={v => handleForm('sku', v)} placeholder="Optional unique SKU" />
                <Field label="Barcode" value={form.barcode} onChange={v => handleForm('barcode', v)} placeholder="EAN / UPC" />
                <Field label="Brand" value={form.brand} onChange={v => handleForm('brand', v)} placeholder="Brand name" />
                <Field label="Unit" value={form.unit} onChange={v => handleForm('unit', v)} placeholder="pcs, kg, litre…" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Category</label>
                <select value={form.categoryId} onChange={e => handleForm('categoryId', e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px' }}>
                  <option value="">— No Category —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="Purchase Price (৳)" value={form.purchasePrice} onChange={v => handleForm('purchasePrice', v)} placeholder="0.00" type="number" />
                <Field label="Selling Price (৳)" value={form.sellingPrice} onChange={v => handleForm('sellingPrice', v)} placeholder="0.00" type="number" />
                <Field label="Min Stock" value={form.minStock} onChange={v => handleForm('minStock', v)} placeholder="0" type="number" />
                <Field label="Max Stock" value={form.maxStock} onChange={v => handleForm('maxStock', v)} placeholder="0" type="number" />
                <Field label="Reorder Level" value={form.reorderLevel} onChange={v => handleForm('reorderLevel', v)} placeholder="0" type="number" />
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Status</label>
                  <select value={form.status} onChange={e => handleForm('status', e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px' }}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="DISCONTINUED">Discontinued</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Notes</label>
                <textarea value={form.notes} onChange={e => handleForm('notes', e.target.value)} placeholder="Optional notes about this product" rows={2}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/** Reusable form field component for the modal */
function Field({ label, value, onChange, placeholder, required, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; type?: string;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' }}
      />
    </div>
  );
}
