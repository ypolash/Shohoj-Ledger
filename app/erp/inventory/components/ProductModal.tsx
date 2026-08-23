"use client";

import React, { useState, useEffect } from 'react';

export const EMPTY_PRODUCT_FORM = {
  productCode: '', name: '', sku: '', barcode: '', brand: '', unit: '',
  purchasePrice: '', sellingPrice: '', minStock: '', openingStock: '',
  reorderLevel: '', status: 'ACTIVE', categoryId: '', description: '', notes: '',
  imageUrl: '',
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
  const [showSku, setShowSku] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (initialData) {
        setForm(initialData);
        if (initialData.sku) setShowSku(true);
        else setShowSku(false);
      } else {
        setForm(EMPTY_PRODUCT_FORM);
        setShowSku(false);
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

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          let quality = 0.9;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);

          // 30kb is approx 40000 characters in base64 string
          while (dataUrl.length > 40000 && quality > 0.1) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(dataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const compressedBase64 = await compressImage(file);
        handleForm('imageUrl', compressedBase64);
      } catch (err) {
        setError('Failed to compress image.');
      }
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
          sku: showSku ? form.sku : '',
          purchasePrice: Number(form.purchasePrice) || 0,
          sellingPrice: Number(form.sellingPrice) || 0,
          minStock: Number(form.minStock) || 0,
          openingStock: Number(form.openingStock) || 0,
          reorderLevel: Number(form.reorderLevel) || 0,
          categoryId: form.categoryId || undefined,
        })
      });
      
      const d = await res.json();
      if (!res.ok) { 
        setError((d.error || `Failed to ${editingId ? 'update' : 'create'} product`) + (d.details ? ' - ' + d.details : '')); 
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
          {/* Image Picker Card */}
          <div 
            onClick={() => document.getElementById('productImageUpload')?.click()}
            style={{ 
              width: '100%', height: '180px', borderRadius: '16px', border: '2px dashed var(--border-main)', 
              background: form.imageUrl ? 'var(--surface-main)' : 'var(--surface-hover)', 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'all 0.2s ease',
              marginBottom: '8px'
            }}
          >
            {form.imageUrl ? (
              <img src={form.imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--text-muted)', marginBottom: '8px' }}>add_photo_alternate</span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Click to upload product image</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>(Max 30KB, auto-compressed)</span>
              </>
            )}
            <input id="productImageUpload" type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Product Code *" value={form.productCode} onChange={v => handleForm('productCode', v)} placeholder="e.g. PROD-001" required />
            <Field label="Product Name *" value={form.name} onChange={v => handleForm('name', v)} placeholder="e.g. Wireless Mouse" required />

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Unit</label>
              <select value={form.unit} onChange={e => handleForm('unit', e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px' }}>
                <option value="">— Select Unit —</option>
                <option value="pcs">pcs</option>
                <option value="kgs">kgs</option>
                <option value="liter">liter</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Category</label>
            <select value={form.categoryId} onChange={e => handleForm('categoryId', e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px' }}>
              <option value="">— No Category —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {showSku && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              <Field label="SKU (Stock Keeping Unit)" value={form.sku} onChange={v => handleForm('sku', v)} placeholder="e.g. SKU-12345" />
            </div>
          )}

          {!showSku && (
            <div style={{ display: 'flex' }}>
              <button type="button" onClick={() => setShowSku(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add_circle</span>
                Add SKU
              </button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Purchase Price (৳)" value={form.purchasePrice} onChange={v => handleForm('purchasePrice', v)} placeholder="0.00" type="number" />
            <Field label="Selling Price (৳)" value={form.sellingPrice} onChange={v => handleForm('sellingPrice', v)} placeholder="0.00" type="number" />
            <Field label="Min Stock" value={form.minStock} onChange={v => handleForm('minStock', v)} placeholder="0" type="number" />
            
            {/* Opening Stock (Only show when creating a new product) */}
            {!editingId && (
              <Field label="Opening Stock" value={form.openingStock} onChange={v => handleForm('openingStock', v)} placeholder="0" type="number" />
            )}
            

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
