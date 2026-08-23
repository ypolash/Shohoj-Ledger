"use client";

import React, { useState, useEffect } from 'react';

export const EMPTY_PRODUCT_FORM = {
  productCode: '', name: '', sku: '', barcode: '', brand: '', unit: '',
  purchasePrice: '', sellingPrice: '', minStock: '', maxStock: '',
  reorderLevel: '', status: 'ACTIVE', categoryId: '', description: '', notes: '',
};

interface Category {
  id: string;
  name: string;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingId?: string | null;
  initialData?: any;
}

export default function ProductModal({ isOpen, onClose, onSuccess, editingId, initialData }: ProductModalProps) {
  const [form, setForm] = useState(initialData || EMPTY_PRODUCT_FORM);
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (initialData) {
        setForm(initialData);
      } else {
        setForm(EMPTY_PRODUCT_FORM);
      }
      setError('');
    }
  }, [isOpen, initialData]);

  const fetchCategories = async () => {
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

  const handleForm = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); 
    setError('');
    
    try {
      const url = editingId ? `/api/inventory/products/${editingId}` : '/api/inventory/products';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
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
      if (!res.ok) { 
        setError(d.error || `Failed to ${editingId ? 'update' : 'create'} product`); 
        return; 
      }
      
      onSuccess();
      onClose();
    } catch (e) { 
      setError('Network error'); 
    } finally { 
      setSubmitting(false); 
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', borderRadius: '20px', padding: '32px', maxHeight: '90vh', overflowY: 'auto', margin: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-main)' }}>{editingId ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
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
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : editingId ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
