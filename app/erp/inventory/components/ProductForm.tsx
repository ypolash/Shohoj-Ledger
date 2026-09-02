"use client";

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Tag, 
  DollarSign, 
  Layers, 
  Upload, 
  X, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Building, 
  Barcode, 
  TrendingUp, 
  FileText, 
  Info, 
  Camera
} from 'lucide-react';

export const EMPTY_PRODUCT_FORM = {
  productCode: '',
  name: '',
  sku: '',
  barcode: '',
  brand: '',
  unit: 'pcs',
  purchasePrice: '',
  sellingPrice: '',
  minStock: '',
  openingStock: '',
  reorderLevel: '',
  status: 'ACTIVE',
  categoryId: '',
  description: '',
  notes: '',
  imageUrl: '',
  customFields: {} as Record<string, string>,
};

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  initialData?: any;
  editingId?: string | null;
  onSuccess: (savedProduct?: any) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

const getInitialFormState = (data?: any) => {
  if (!data) {
    return {
      ...EMPTY_PRODUCT_FORM,
      productCode: `PRD-${Date.now().toString().slice(-6)}`
    };
  }
  let parsedCustomFields = data.customFields || {};
  if (typeof parsedCustomFields === 'string') {
    try { parsedCustomFields = JSON.parse(parsedCustomFields); } catch(e){}
  }
  return {
    ...EMPTY_PRODUCT_FORM,
    ...data,
    name: data.name ?? '',
    productCode: data.productCode ?? '',
    sku: data.sku ?? '',
    barcode: data.barcode ?? '',
    brand: data.brand ?? '',
    unit: data.unit ?? 'pcs',
    purchasePrice: data.purchasePrice !== undefined && data.purchasePrice !== null ? String(data.purchasePrice) : '',
    sellingPrice: data.sellingPrice !== undefined && data.sellingPrice !== null ? String(data.sellingPrice) : '',
    minStock: data.minStock !== undefined && data.minStock !== null ? String(data.minStock) : '',
    maxStock: data.maxStock !== undefined && data.maxStock !== null ? String(data.maxStock) : '',
    reorderLevel: data.reorderLevel !== undefined && data.reorderLevel !== null ? String(data.reorderLevel) : '',
    openingStock: data.openingStock !== undefined && data.openingStock !== null ? String(data.openingStock) : (data.currentStock !== undefined && data.currentStock !== null ? String(data.currentStock) : ''),
    status: data.status ?? 'ACTIVE',
    categoryId: data.categoryId ?? '',
    description: data.description ?? '',
    notes: data.notes ?? '',
    imageUrl: data.imageUrl ?? '',
    customFields: parsedCustomFields
  };
};

export function ProductForm({
  initialData,
  editingId,
  onSuccess,
  onCancel,
  isModal = false
}: ProductFormProps) {
  const [form, setForm] = useState(() => getInitialFormState(initialData));
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [globalCustomFields, setGlobalCustomFields] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
    fetchCategories();
    const savedFields = localStorage.getItem('shohoj_inventory_custom_fields');
    if (savedFields) {
      try { 
        setGlobalCustomFields(JSON.parse(savedFields)); 
      } catch(e){}
    }
    
    setForm(getInitialFormState(initialData));
  }, [initialData]);

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
      setIsCompressing(true);
      setError('');
      try {
        const compressedBase64 = await compressImage(file);
        handleForm('imageUrl', compressedBase64);
      } catch (err) {
        setError('Failed to process image. Please choose another file.');
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleForm = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const handleCustomField = (k: string, v: string) => 
    setForm((f: any) => ({ ...f, customFields: { ...f.customFields, [k]: v } }));

  const generateAutoSku = () => {
    const prefix = form.brand ? form.brand.slice(0, 3).toUpperCase() : 'SKU';
    const namePart = form.name ? form.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() : 'PRD';
    const rand = Math.floor(1000 + Math.random() * 9000);
    const newSku = `${prefix}-${namePart}-${rand}`;
    handleForm('sku', newSku);
  };

  // Financial margin calculations
  const purchase = Number(form.purchasePrice) || 0;
  const selling = Number(form.sellingPrice) || 0;
  const marginAmount = selling - purchase;
  const marginPercent = selling > 0 ? ((marginAmount / selling) * 100).toFixed(1) : '0.0';

  const selectedCategory = categories.find(c => c.id === form.categoryId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Product Name is required.');
      return;
    }
    if (!form.productCode.trim()) {
      setError('Product Code is required.');
      return;
    }

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
          sku: form.sku || '',
          barcode: form.barcode || '',
          brand: form.brand || '',
          description: form.description || '',
          customFields: form.customFields || {},
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
      
      onSuccess(d.product || d);
    } catch (e) { 
      setError('Network error encountered while saving product.'); 
    } finally { 
      setSubmitting(false); 
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Error Alert */}
      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: 'var(--danger, #ef4444)',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Form Inputs (Left) & Live Voucher/Product Preview (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isModal ? '1fr' : '1.75fr 1fr',
        gap: '24px',
        alignItems: 'start'
      }}>
        
        {/* Left Column: Form Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Section 1: Top Identity with Passport-Size Image Picker */}
          <div style={{
            background: 'var(--surface-main)',
            border: '1px solid var(--border-main)',
            borderRadius: '14px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.875rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '16px',
              borderBottom: '1px solid var(--border-main)',
              paddingBottom: '10px'
            }}>
              <Package size={17} color="var(--primary)" />
              Product Identification & Media
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Top Row: Passport Image Picker (Left) + Name & Code (Right) */}
              <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                
                {/* Passport Size Photo Box (110px x 135px) */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div 
                    onClick={() => document.getElementById('productImageUpload')?.click()}
                    style={{ 
                      width: '110px', 
                      height: '135px', 
                      borderRadius: '10px', 
                      border: form.imageUrl ? '1px solid var(--border-main)' : '2px dashed var(--border-main)', 
                      background: form.imageUrl ? 'var(--surface-hover)' : 'var(--surface-main)', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      cursor: 'pointer', 
                      position: 'relative', 
                      overflow: 'hidden', 
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                      flexShrink: 0
                    }}
                    title="Click to upload Passport-size Product Photo"
                  >
                    {form.imageUrl ? (
                      <>
                        <img 
                          src={form.imageUrl} 
                          alt="Product Preview" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          insetInline: 0,
                          background: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          textAlign: 'center',
                          padding: '3px 0'
                        }}>
                          Change Photo
                        </div>
                      </>
                    ) : (
                      <div style={{ padding: '8px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'var(--surface-hover)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--primary)'
                        }}>
                          <Camera size={16} />
                        </div>
                        <span style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.2 }}>
                          {isCompressing ? 'Uploading...' : 'Product Photo'}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          Passport Size
                        </span>
                      </div>
                    )}
                    <input 
                      id="productImageUpload" 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      style={{ display: 'none' }} 
                    />
                  </div>

                  {form.imageUrl && (
                    <button
                      type="button"
                      onClick={() => handleForm('imageUrl', '')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--danger, #ef4444)',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      <X size={12} /> Remove
                    </button>
                  )}
                </div>

                {/* Right Side of Top Row: Name & Code */}
                <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name ?? ''}
                      onChange={(e) => handleForm('name', e.target.value)}
                      placeholder="e.g. Wireless Ergonomic Mouse"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-main)',
                        background: 'var(--surface-hover)',
                        color: 'var(--text-main)',
                        fontSize: '0.9rem',
                        outline: 'none',
                        fontWeight: 600
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Product Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.productCode ?? ''}
                      onChange={(e) => handleForm('productCode', e.target.value)}
                      placeholder="e.g. PRD-001"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-main)',
                        background: 'var(--surface-hover)',
                        color: 'var(--text-main)',
                        fontSize: '0.9rem',
                        fontFamily: 'monospace',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

              </div>

              {/* Categorization & Units */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={form.categoryId || ""}
                    onChange={(e) => handleForm('categoryId', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-main)',
                      background: 'var(--surface-hover)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">— Select Category —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Unit of Measurement
                  </label>
                  <select
                    value={form.unit || "pcs"}
                    onChange={(e) => handleForm('unit', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-main)',
                      background: 'var(--surface-hover)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="box">Box (box)</option>
                    <option value="carton">Carton (ctn)</option>
                    <option value="kgs">Kilograms (kg)</option>
                    <option value="gram">Grams (g)</option>
                    <option value="liter">Liters (L)</option>
                    <option value="meter">Meters (m)</option>
                    <option value="set">Set (set)</option>
                  </select>
                </div>
              </div>

              {/* SKU & Brand */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      SKU (Stock Keeping Unit)
                    </label>
                    <button
                      type="button"
                      onClick={generateAutoSku}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '0.725rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      <Sparkles size={12} /> Auto-Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    value={form.sku ?? ''}
                    onChange={(e) => handleForm('sku', e.target.value)}
                    placeholder="e.g. LOGI-MOU-901"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-main)',
                      background: 'var(--surface-hover)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem',
                      fontFamily: 'monospace',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Brand / Manufacturer
                  </label>
                  <input
                    type="text"
                    value={form.brand ?? ''}
                    onChange={(e) => handleForm('brand', e.target.value)}
                    placeholder="e.g. Logitech, Samsung"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-main)',
                      background: 'var(--surface-hover)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Pricing, Costing & Stock Levels */}
          <div style={{
            background: 'var(--surface-main)',
            border: '1px solid var(--border-main)',
            borderRadius: '14px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.875rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '16px',
              borderBottom: '1px solid var(--border-main)',
              paddingBottom: '10px'
            }}>
              <DollarSign size={17} color="#10b981" />
              Pricing, Margins & Stock Levels
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Purchase Cost (৳ BDT)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.purchasePrice ?? ''}
                    onChange={(e) => handleForm('purchasePrice', e.target.value)}
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-main)',
                      background: 'var(--surface-hover)',
                      color: '#ef4444',
                      fontSize: '1rem',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Selling Price (৳ BDT) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.sellingPrice ?? ''}
                    onChange={(e) => handleForm('sellingPrice', e.target.value)}
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-main)',
                      background: 'var(--surface-hover)',
                      color: '#10b981',
                      fontSize: '1rem',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Real-time Profit Margin Pill */}
              {(purchase > 0 || selling > 0) && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: marginAmount >= 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: `1px solid ${marginAmount >= 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.825rem'
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>Estimated Profit Margin:</span>
                  <span style={{ fontWeight: 700, color: marginAmount >= 0 ? '#10b981' : '#ef4444' }}>
                    ৳ {marginAmount.toFixed(2)} ({marginPercent}%)
                  </span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    {editingId ? 'Opening / Initial Stock' : 'Opening Stock'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.openingStock ?? ''}
                    onChange={(e) => handleForm('openingStock', e.target.value)}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-main)',
                      background: 'var(--surface-hover)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Min Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.minStock ?? ''}
                    onChange={(e) => handleForm('minStock', e.target.value)}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-main)',
                      background: 'var(--surface-hover)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Catalog Status
                  </label>
                  <select
                    value={form.status || "ACTIVE"}
                    onChange={(e) => handleForm('status', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-main)',
                      background: 'var(--surface-hover)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="ACTIVE">Active (In Catalog)</option>
                    <option value="INACTIVE">Inactive (Hidden)</option>
                    <option value="DISCONTINUED">Discontinued</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Description & Custom Fields */}
          <div style={{
            background: 'var(--surface-main)',
            border: '1px solid var(--border-main)',
            borderRadius: '14px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.875rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '16px',
              borderBottom: '1px solid var(--border-main)',
              paddingBottom: '10px'
            }}>
              <FileText size={17} color="var(--primary)" />
              Description & Specifications
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Product Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={form.description ?? ''}
                  onChange={(e) => handleForm('description', e.target.value)}
                  placeholder="Technical specifications, features, warranty details..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-main)',
                    background: 'var(--surface-hover)',
                    color: 'var(--text-main)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Dynamic Custom Fields */}
              {globalCustomFields.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {globalCustomFields.map((key) => (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                        {key}
                      </label>
                      <input
                        type="text"
                        value={form.customFields?.[key] || ''}
                        onChange={(e) => handleCustomField(key, e.target.value)}
                        placeholder={`Enter ${key}`}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-main)',
                          background: 'var(--surface-hover)',
                          color: 'var(--text-main)',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Product Card Preview (When Full Page) */}
        {!isModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '24px' }}>
            
            {/* Live Catalog Card Preview */}
            <div style={{
              background: 'var(--surface-main)',
              border: '1px solid var(--border-main)',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Info size={14} color="var(--primary)" />
                Live Catalog Preview
              </div>

              {/* Simulated Product Card */}
              <div style={{
                background: 'var(--surface-hover)',
                borderRadius: '12px',
                border: '1px solid var(--border-main)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {form.imageUrl && (
                  <div style={{
                    width: '100%',
                    height: '140px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: 'var(--surface-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border-main)'
                  }}>
                    <img
                      src={form.imageUrl}
                      alt="Product Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.25 }}>
                      {form.name || 'Untitled Product'}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', marginTop: '3px' }}>
                      {form.sku || form.productCode || 'SKU-PENDING'}
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    background: form.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'var(--surface-main)',
                    color: form.status === 'ACTIVE' ? '#10b981' : 'var(--text-muted)',
                    border: '1px solid var(--border-main)'
                  }}>
                    {form.status || 'ACTIVE'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.725rem',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'var(--surface-main)',
                    border: '1px solid var(--border-main)',
                    color: 'var(--text-muted)'
                  }}>
                    {selectedCategory?.name || 'No Category'}
                  </span>

                  <span style={{
                    fontSize: '0.725rem',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'var(--surface-main)',
                    border: '1px solid var(--border-main)',
                    color: 'var(--text-muted)'
                  }}>
                    Unit: {form.unit || 'pcs'}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-main)'
                }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Selling Price:</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>
                    {new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT' }).format(selling)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Action Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '12px',
        paddingTop: '16px',
        borderTop: '1px solid var(--border-main)'
      }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid var(--border-main)',
              background: 'var(--surface-hover)',
              color: 'var(--text-main)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '10px 24px',
            borderRadius: '8px',
            border: 'none',
            background: 'var(--primary)',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 10px var(--primary-glow)'
          }}
        >
          <Check size={18} />
          <span>{submitting ? 'Saving...' : editingId ? 'Update Product' : 'Create & Register Product'}</span>
        </button>
      </div>

    </form>
  );
}
