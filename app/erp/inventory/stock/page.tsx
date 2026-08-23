"use client";

import React, { useState, useEffect } from 'react';

/** Product record (minimal, for dropdown) */
interface Product {
  id: string;
  name: string;
  productCode: string;
  currentStock?: number;
  minStock?: number;
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
 * ERP Inventory — Stock Control Page
 * Provides a product stock summary table and a modal to record
 * stock transactions (IN, OUT, ADJUSTMENT, DAMAGE, RETURN, TRANSFER).
 */
export default function StockControlPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
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

  const selectedType = TRANSACTION_TYPES.find(t => t.value === form.type);
  const isTransfer = form.type === 'TRANSFER';
  const isAdjustment = form.type === 'ADJUSTMENT';

  /** Returns stock badge styling */
  const stockBadge = (p: Product) => {
    const stock = p.currentStock ?? 0;
    const min = p.minStock ?? 0;
    if (stock <= 0) return { label: 'Out of Stock', color: 'var(--danger)', bg: 'var(--danger-subtle)' };
    if (stock <= min) return { label: 'Low Stock', color: 'var(--warning)', bg: 'var(--warning-subtle)' };
    return { label: 'OK', color: 'var(--success)', bg: 'var(--success-subtle)' };
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Stock Control</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            Record stock movements and view current stock levels.
          </p>
        </div>
        <button className="btn btn-primary hover-lift" onClick={() => openModal('IN')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
          Record Transaction
        </button>
      </div>

      {successMsg && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--success-subtle)', color: 'var(--success)', border: '1px solid var(--success)', fontSize: '14px' }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Transaction Type Legend */}
      <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '14px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px' }}>TRANSACTION TYPES</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {TRANSACTION_TYPES.filter(t => showWarehouses || t.value !== 'TRANSFER').map(t => (
            <button 
              key={t.value}
              onClick={() => openModal(t.value)}
              className="hover-lift"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', cursor: 'pointer', outline: 'none' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: t.color }}>{t.icon}</span>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-main)' }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stock Summary Table */}
      <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-main)', fontWeight: 600, fontSize: '15px', color: 'var(--text-main)' }}>
          Current Stock Levels
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
                {['Code', 'Product Name', 'Current Stock', 'Min Stock', 'Reorder Level', 'Status'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-main)' }}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} style={{ padding: '14px 16px' }}>
                        <div style={{ height: '14px', borderRadius: '6px', background: 'var(--surface-hover)', opacity: 0.7 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4, display: 'block', marginBottom: '8px' }}>move_down</span>
                    No products found. Add products first to track stock.
                  </td>
                </tr>
              ) : products.map(p => {
                const badge = stockBadge(p);
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-main)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>{p.productCode}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 500, color: 'var(--text-main)' }}>{p.name}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: '16px', color: 'var(--text-main)' }}>{p.currentStock ?? 0}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{p.minStock ?? 0}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>—</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: badge.color, background: badge.bg }}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Transaction Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '560px', borderRadius: '20px', padding: '32px', maxHeight: '90vh', overflowY: 'auto', margin: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-main)' }}>Record Stock Transaction</h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Select a type and fill in the details below.</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
              </button>
            </div>

            {error && <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', background: 'var(--danger-subtle)', color: 'var(--danger)', fontSize: '14px' }}>⚠ {error}</div>}

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

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Product *</label>
                <select value={form.productId} onChange={e => handleForm('productId', e.target.value)} required style={inputStyle}>
                  <option value="">— Select Product —</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.productCode})</option>)}
                </select>
              </div>

              {showWarehouses && (
                <div>
                  <label style={labelStyle}>{isTransfer ? 'Source Warehouse *' : 'Warehouse *'}</label>
                  <select value={form.warehouseId} onChange={e => handleForm('warehouseId', e.target.value)} required style={inputStyle}>
                    <option value="">— Select Warehouse —</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
                  </select>
                </div>
              )}

              {showWarehouses && isTransfer && (
                <div>
                  <label style={labelStyle}>Destination Warehouse *</label>
                  <select value={form.toWarehouseId} onChange={e => handleForm('toWarehouseId', e.target.value)} style={inputStyle}>
                    <option value="">— Select Destination —</option>
                    {warehouses.filter(w => w.id !== form.warehouseId).map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>
                    Quantity *
                    {isAdjustment && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> (negative to deduct)</span>}
                  </label>
                  <input type="number" value={form.quantity} onChange={e => handleForm('quantity', e.target.value)}
                    placeholder={isAdjustment ? "e.g. -5 or +10" : "e.g. 50"} required
                    style={inputStyle} step={isAdjustment ? "1" : "1"} />
                </div>
                <div>
                  <label style={labelStyle}>Reference</label>
                  <input type="text" value={form.reference} onChange={e => handleForm('reference', e.target.value)} placeholder="e.g. PO-001, GRN-002" style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Notes</label>
                <textarea value={form.notes} onChange={e => handleForm('notes', e.target.value)} placeholder="Optional notes for this transaction" rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              {/* Summary preview */}
              {form.productId && (!showWarehouses || form.warehouseId) && form.quantity && selectedType && (
                <div style={{ padding: '14px 16px', borderRadius: '12px', background: `${selectedType.color}15`, border: `1px solid ${selectedType.color}40`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: selectedType.color }}>{selectedType.icon}</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                    <strong>{selectedType.label}</strong> of <strong>{Math.abs(Number(form.quantity))}</strong> units
                    {showWarehouses && form.warehouseId && ` in warehouse ${warehouses.find(w => w.id === form.warehouseId)?.name}`}
                    {showWarehouses && isTransfer && form.toWarehouseId && ` → ${warehouses.find(w => w.id === form.toWarehouseId)?.name}`}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ minWidth: '150px' }}>
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
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' };
