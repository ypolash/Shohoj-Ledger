"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Sliders, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  AlertTriangle, 
  RefreshCw, 
  ArrowLeftRight, 
  Package, 
  CheckCircle2, 
  Boxes 
} from 'lucide-react';
import styles from '../StockControl.module.css';

const TRANSACTION_TYPES = [
  { value: 'IN', label: 'Stock In', subtitle: 'Receive inventory', icon: ArrowUpCircle, color: '#10b981' },
  { value: 'OUT', label: 'Stock Out', subtitle: 'Issue / Dispatch', icon: ArrowDownCircle, color: '#ef4444' },
  { value: 'ADJUSTMENT', label: 'Adjustment', subtitle: 'Audit correction', icon: Sliders, color: '#3b82f6' },
  { value: 'DAMAGE', label: 'Damage', subtitle: 'Write-off / Scrap', icon: AlertTriangle, color: '#f59e0b' },
  { value: 'RETURN', label: 'Return', subtitle: 'Customer return', icon: RefreshCw, color: '#8b5cf6' },
  { value: 'TRANSFER', label: 'Transfer', subtitle: 'Between locations', icon: ArrowLeftRight, color: '#06b6d4' },
];

export default function StockMovementPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [showWarehouses, setShowWarehouses] = useState(false);

  const [form, setForm] = useState({
    productId: '',
    warehouseId: '',
    type: 'IN',
    quantity: '',
    reference: '',
    notes: '',
    toWarehouseId: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkSettings = () => {
      setShowWarehouses(localStorage.getItem('shohoj_inventory_warehouses_enabled') === 'true');
    };
    checkSettings();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pRes, wRes] = await Promise.all([
        fetch('/api/inventory/products?limit=250'),
        fetch('/api/inventory/warehouses')
      ]);
      if (pRes.ok) {
        const d = await pRes.json();
        setProducts(d.products || []);
      }
      if (wRes.ok) {
        const d = await wRes.json();
        setWarehouses(d.warehouses || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectedProduct = products.find(p => p.id === form.productId);
  const currentStock = selectedProduct ? (selectedProduct.currentStock ?? 0) : 0;
  const qty = Number(form.quantity || 0);

  let newStockPreview = currentStock;
  if (['IN', 'RETURN'].includes(form.type)) {
    newStockPreview = currentStock + qty;
  } else if (['OUT', 'DAMAGE'].includes(form.type)) {
    newStockPreview = currentStock - qty;
  } else if (form.type === 'ADJUSTMENT') {
    newStockPreview = currentStock + qty;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId) {
      setError("Please select a product.");
      return;
    }
    if (!form.quantity || Number(form.quantity) <= 0) {
      setError("Please enter a valid positive quantity.");
      return;
    }
    if (form.type === 'TRANSFER' && !form.toWarehouseId) {
      setError("Please select a destination warehouse.");
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/inventory/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
          toWarehouseId: form.type === 'TRANSFER' ? form.toWarehouseId : undefined
        })
      });

      const d = await res.json();
      if (!res.ok) {
        setError(d.error || 'Failed to record stock movement');
        return;
      }

      router.push('/erp/inventory/stock');
    } catch (e) {
      setError('Network error recording transaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button 
          onClick={() => router.push('/erp/inventory/stock')}
          className={styles.btnSecondary}
        >
          <ArrowLeft size={16} />
          <span>Back to Stock Control</span>
        </button>
      </div>

      <div className={styles.formCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-main)', paddingBottom: '16px' }}>
          <div className={styles.kpiIcon} style={{ width: '48px', height: '48px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
            <Sliders size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Record Stock Movement & Adjustment
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Log stock intakes, issues, audit corrections, write-offs, or warehouse transfers.
            </p>
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Movement Type Selector */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Select Movement Type *</label>
            <div className={styles.typeSelectorGrid}>
              {TRANSACTION_TYPES.filter(t => showWarehouses || t.value !== 'TRANSFER').map(t => {
                const IconComponent = t.icon;
                const isSelected = form.type === t.value;
                return (
                  <div
                    key={t.value}
                    onClick={() => setForm({ ...form, type: t.value })}
                    className={`${styles.typeCard} ${isSelected ? styles.typeCardActive : ''}`}
                    style={isSelected ? { borderColor: t.color, background: `${t.color}15`, color: t.color } : {}}
                  >
                    <IconComponent size={22} color={isSelected ? t.color : 'var(--text-secondary)'} />
                    <span style={{ fontWeight: 700 }}>{t.label}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                      {t.subtitle}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Product Selector */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Target Product *</label>
            <select
              value={form.productId}
              onChange={e => setForm({ ...form, productId: e.target.value })}
              required
              className={styles.formSelect}
            >
              <option value="">— Search & Select Product from Inventory —</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.productCode}) — On-Hand: {p.currentStock ?? 0} {p.unit || 'pcs'}
                </option>
              ))}
            </select>
          </div>

          {/* Warehouse Selection if enabled */}
          {showWarehouses && (
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Origin / Target Warehouse *</label>
                <select
                  value={form.warehouseId}
                  onChange={e => setForm({ ...form, warehouseId: e.target.value })}
                  required={showWarehouses}
                  className={styles.formSelect}
                >
                  <option value="">— Select Warehouse —</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </div>

              {form.type === 'TRANSFER' && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Destination Warehouse *</label>
                  <select
                    value={form.toWarehouseId}
                    onChange={e => setForm({ ...form, toWarehouseId: e.target.value })}
                    required
                    className={styles.formSelect}
                  >
                    <option value="">— Destination Warehouse —</option>
                    {warehouses.filter(w => w.id !== form.warehouseId).map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Quantity & Reference */}
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Quantity to Move ({selectedProduct?.unit || 'pcs'}) *
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="e.g. 50"
                value={form.quantity}
                onChange={e => setForm({ ...form, quantity: e.target.value })}
                required
                className={styles.formInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Reference Number / PO / Invoice</label>
              <input
                type="text"
                placeholder="e.g. ADJ-2026-088"
                value={form.reference}
                onChange={e => setForm({ ...form, reference: e.target.value })}
                className={styles.formInput}
              />
            </div>
          </div>

          {/* Live Balance Impact Widget */}
          {selectedProduct && qty > 0 && (
            <div style={{
              background: 'var(--surface-hover)',
              border: '1px solid var(--border-main)',
              borderRadius: '14px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Current On-Hand Balance
                </span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {currentStock} {selectedProduct.unit || 'pcs'}
                </div>
              </div>

              <div style={{ fontSize: '1.4rem', color: 'var(--text-muted)' }}>→</div>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  New Balance After Adjustment
                </span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: newStockPreview < 0 ? '#ef4444' : 'var(--primary)' }}>
                  {newStockPreview} {selectedProduct.unit || 'pcs'}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Reason / Audit Remarks</label>
            <textarea
              rows={3}
              placeholder="Explain reason for stock movement or adjustment..."
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className={styles.formTextarea}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => router.push('/erp/inventory/stock')}
              className={styles.btnSecondary}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={submitting}
            >
              {submitting ? "Recording Movement..." : "Confirm & Record Movement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
