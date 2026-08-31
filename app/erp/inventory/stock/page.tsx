"use client";

import React, { useState, useEffect } from 'react';
import { InventoryDataTable, InventoryColumn } from '../components/InventoryDataTable';

/** Product record (minimal, for dropdown) */
interface Product {
  id: string;
  name: string;
  productCode: string;
  currentStock?: number;
  minStock?: number;
  unit?: string;
}

/** Warehouse record (minimal, for dropdown) */
interface Warehouse {
  id: string;
  name: string;
  code: string;
}

/** Stock transaction types */
const TRANSACTION_TYPES = [
  { value: 'OPENING', label: 'Opening Stock', icon: 'open_in_new', color: 'var(--primary)' },
  { value: 'IN', label: 'Stock In', icon: 'add_circle', color: 'var(--success)' },
  { value: 'OUT', label: 'Stock Out', icon: 'remove_circle', color: 'var(--danger)' },
  { value: 'ADJUSTMENT', label: 'Adjustment', icon: 'tune', color: 'var(--warning)' },
  { value: 'DAMAGE', label: 'Damage / Write-off', icon: 'broken_image', color: 'var(--danger)' },
  { value: 'RETURN', label: 'Return', icon: 'assignment_return', color: 'var(--success)' },
  { value: 'TRANSFER', label: 'Transfer Between Warehouses', icon: 'swap_horiz', color: 'var(--accent)' },
];

/**
 * ERP Inventory — Stock Control Page (Universal Table Redesign 2.0)
 * Provides a product stock summary table and a modal to record
 * stock transactions (IN, OUT, ADJUSTMENT, DAMAGE, RETURN, TRANSFER).
 */
export default function StockControlPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [form, setForm] = useState({
    productId: '', warehouseId: '', type: 'IN',
    quantity: '', reference: '', notes: '', toWarehouseId: ''
  });

  const [showWarehouses, setShowWarehouses] = useState(false);

  useEffect(() => {
    const checkSettings = () => {
      setShowWarehouses(localStorage.getItem('shohoj_inventory_warehouses_enabled') === 'true');
    };
    checkSettings();
    window.addEventListener('storage', checkSettings);
    window.addEventListener('inventorySettingsChanged', checkSettings);
    loadData();
    return () => {
      window.removeEventListener('storage', checkSettings);
      window.removeEventListener('inventorySettingsChanged', checkSettings);
    };
  }, []);

  /** Loads products and warehouses concurrently */
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pRes, wRes] = await Promise.all([
        fetch('/api/inventory/products?limit=200'),
        fetch('/api/inventory/warehouses'),
      ]);
      if (pRes.ok) { const d = await pRes.json(); setProducts(d.products || []); }
      if (wRes.ok) { const d = await wRes.json(); setWarehouses(d.warehouses || []); }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  /** Handles form field changes */
  const handleForm = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  /** Opens a fresh modal */
  const openModal = (type = 'IN') => {
    setForm({ productId: '', warehouseId: '', type, quantity: '', reference: '', notes: '', toWarehouseId: '' });
    setError('');
    setShowModal(true);
  };

  /** Submits the stock transaction to the API */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId || (showWarehouses && !form.warehouseId) || !form.type || !form.quantity) {
      setError('Product, Type, and Quantity are required. Warehouse is required if enabled.'); return;
    }
    if (form.type === 'TRANSFER' && !form.toWarehouseId) {
      setError('Please select a destination warehouse for transfer.'); return;
    }
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/inventory/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
          toWarehouseId: form.type === 'TRANSFER' ? form.toWarehouseId : undefined,
        })
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Failed to record transaction'); return; }
      setSuccessMsg('Stock transaction recorded successfully!');
      setShowModal(false);
      loadData(); // Refresh stock data
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) { setError('Network error'); }
    finally { setSubmitting(false); }
  };

  /** Returns stock badge styling */
  const stockBadge = (p: Product) => {
    const stock = p.currentStock ?? 0;
    const min = p.minStock ?? 0;
    if (stock <= 0) return { label: 'Out of Stock', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', dot: '#ef4444' };
    if (stock <= min) return { label: 'Low Stock', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', dot: '#f59e0b' };
    return { label: 'In Stock (OK)', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', dot: '#10b981' };
  };

  // Filter products by search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.productCode.toLowerCase().includes(search.toLowerCase())
  );

  const columns: InventoryColumn<Product>[] = [
    {
      key: 'productCode',
      header: 'Code',
      width: '120px',
      render: (p) => (
        <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--primary, #38bdf8)', fontWeight: 600 }}>
          {p.productCode}
        </span>
      )
    },
    {
      key: 'name',
      header: 'Product Details',
      render: (p) => (
        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>
          {p.name}
        </div>
      )
    },
    {
      key: 'currentStock',
      header: 'Current Stock',
      render: (p) => (
        <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)', fontFamily: 'monospace' }}>
          {p.currentStock ?? 0} {p.unit || 'pcs'}
        </span>
      )
    },
    {
      key: 'minStock',
      header: 'Min Threshold',
      render: (p) => (
        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          {p.minStock ?? 0} {p.unit || 'pcs'}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Inventory Status',
      render: (p) => {
        const badge = stockBadge(p);
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              color: badge.color,
              background: badge.bg,
              border: `1px solid ${badge.color}30`
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: badge.dot }} />
            {badge.label}
          </span>
        );
      }
    }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Stock Control</h1>
        </div>
        <button className="btn btn-primary hover-lift" onClick={() => openModal('IN')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
          Record Transaction
        </button>
      </div>

      {successMsg && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success, #10b981)', border: '1px solid var(--success)', fontSize: '14px' }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Transaction Type Quick Legend */}
      <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '14px', border: '1px solid var(--border-main)' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Quick Action Transaction Types
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {TRANSACTION_TYPES.filter(t => showWarehouses || t.value !== 'TRANSFER').map(t => (
            <button 
              key={t.value}
              onClick={() => openModal(t.value)}
              className="hover-lift"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '20px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', cursor: 'pointer', outline: 'none' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: t.color }}>{t.icon}</span>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-main)' }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Universal Inventory Table */}
      <InventoryDataTable
        columns={columns}
        data={filteredProducts}
        isLoading={isLoading}
        emptyIcon="move_down"
        emptyTitle="No product stock records found"
        emptySubtitle="Add products to your catalog to track real-time stock balances and adjustments."
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search products by code or title..."
      />

      {/* Record Transaction Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '560px', borderRadius: '20px', padding: '32px', maxHeight: '90vh', overflowY: 'auto', margin: '16px', border: '1px solid var(--border-main)', background: 'var(--surface-bg, #1e293b)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-main)' }}>Record Stock Transaction</h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Select a transaction type and complete the entry details.</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
              </button>
            </div>

            {error && <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger, #ef4444)', fontSize: '14px' }}>⚠ {error}</div>}

            {/* Type Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px', marginBottom: '20px' }}>
              {TRANSACTION_TYPES.filter(t => showWarehouses || t.value !== 'TRANSFER').map(t => (
                <button key={t.value} type="button" onClick={() => handleForm('type', t.value)}
                  style={{ padding: '10px 12px', borderRadius: '12px', border: `2px solid ${form.type === t.value ? t.color : 'var(--border-main)'}`, background: form.type === t.value ? `${t.color}20` : 'var(--surface-hover)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: form.type === t.value ? t.color : 'var(--text-secondary)', transition: 'all 0.15s' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Product *</label>
                <select value={form.productId} onChange={e => handleForm('productId', e.target.value)} required style={inputStyle}>
                  <option value="">— Select Product —</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.productCode}) — Current: {p.currentStock ?? 0}</option>)}
                </select>
              </div>

              {showWarehouses && (
                <div>
                  <label style={labelStyle}>Warehouse *</label>
                  <select value={form.warehouseId} onChange={e => handleForm('warehouseId', e.target.value)} required={showWarehouses} style={inputStyle}>
                    <option value="">— Select Warehouse —</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
                  </select>
                </div>
              )}

              {form.type === 'TRANSFER' && showWarehouses && (
                <div>
                  <label style={labelStyle}>Destination Warehouse *</label>
                  <select value={form.toWarehouseId} onChange={e => handleForm('toWarehouseId', e.target.value)} required style={inputStyle}>
                    <option value="">— Select Destination Warehouse —</option>
                    {warehouses.filter(w => w.id !== form.warehouseId).map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Quantity *</label>
                  <input type="number" min="0.01" step="any" value={form.quantity} onChange={e => handleForm('quantity', e.target.value)} placeholder="e.g. 50" required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Reference # (optional)</label>
                  <input type="text" value={form.reference} onChange={e => handleForm('reference', e.target.value)} placeholder="PO-001 / INV-123" style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Notes / Reason (optional)</label>
                <textarea value={form.notes} onChange={e => handleForm('notes', e.target.value)} placeholder="Reason for adjustment, damage description, etc." rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Recording…' : 'Record Transaction'}
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
