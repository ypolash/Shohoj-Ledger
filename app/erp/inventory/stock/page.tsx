"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sliders, 
  Plus, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Search, 
  Package, 
  DollarSign, 
  Layers, 
  Boxes, 
  ArrowLeftRight, 
  FileText, 
  TrendingUp, 
  X 
} from 'lucide-react';
import styles from './StockControl.module.css';

/** Product record */
interface Product {
  id: string;
  name: string;
  productCode: string;
  currentStock?: number;
  minStock?: number;
  maxStock?: number;
  unit?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  category?: { name: string };
}

/** Warehouse record */
interface Warehouse {
  id: string;
  name: string;
  code: string;
}

const TRANSACTION_TYPES = [
  { value: 'IN', label: 'Stock In', icon: ArrowUpCircle, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  { value: 'OUT', label: 'Stock Out', icon: ArrowDownCircle, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
  { value: 'ADJUSTMENT', label: 'Adjustment', icon: Sliders, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
  { value: 'DAMAGE', label: 'Damage / Loss', icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  { value: 'RETURN', label: 'Return', icon: RefreshCw, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
  { value: 'TRANSFER', label: 'Transfer', icon: ArrowLeftRight, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)' },
];

export default function StockControlPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [form, setForm] = useState({
    productId: '',
    warehouseId: '',
    type: 'IN',
    quantity: '',
    reference: '',
    notes: '',
    toWarehouseId: ''
  });

  const [showWarehouses, setShowWarehouses] = useState(false);

  useEffect(() => {
    const checkSettings = () => {
      setShowWarehouses(localStorage.getItem('shohoj_inventory_warehouses_enabled') === 'true');
    };
    checkSettings();
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const openModal = (type = 'IN', productId = '') => {
    setForm({
      productId: productId || (products[0]?.id || ''),
      warehouseId: warehouses[0]?.id || '',
      type,
      quantity: '',
      reference: '',
      notes: '',
      toWarehouseId: ''
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId || !form.type || !form.quantity || Number(form.quantity) <= 0) {
      setError("Please fill out product, type, and a valid quantity.");
      return;
    }
    if (form.type === 'TRANSFER' && !form.toWarehouseId) {
      setError("Please select destination warehouse for transfer.");
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
        setError(d.error || 'Failed to record stock transaction');
        return;
      }

      setSuccessMsg("Stock transaction recorded successfully!");
      setShowModal(false);
      await loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      setError("Network error recording stock transaction");
    } finally {
      setSubmitting(false);
    }
  };

  // KPI Computations
  const totalItems = products.length;
  const outOfStockCount = useMemo(() => {
    return products.filter(p => (p.currentStock ?? 0) <= 0).length;
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter(p => {
      const stock = p.currentStock ?? 0;
      const min = p.minStock ?? 0;
      return stock > 0 && min > 0 && stock <= min;
    }).length;
  }, [products]);

  const optimalCount = useMemo(() => {
    return products.filter(p => {
      const stock = p.currentStock ?? 0;
      const min = p.minStock ?? 0;
      return stock > min && stock > 0;
    }).length;
  }, [products]);

  const totalValuation = useMemo(() => {
    return products.reduce((sum, p) => sum + ((p.currentStock ?? 0) * (p.purchasePrice ?? 0)), 0);
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const q = search.toLowerCase();
      const matchesSearch = !search.trim() || p.name.toLowerCase().includes(q) || p.productCode.toLowerCase().includes(q);
      
      const stock = p.currentStock ?? 0;
      const min = p.minStock ?? 0;
      
      let matchesStatus = true;
      if (statusFilter === 'OUT_OF_STOCK') matchesStatus = stock <= 0;
      else if (statusFilter === 'LOW_STOCK') matchesStatus = stock > 0 && min > 0 && stock <= min;
      else if (statusFilter === 'IN_STOCK') matchesStatus = stock > min && stock > 0;

      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.headerWrapper}>
        <div className={styles.titleGroup}>
          <h1>
            Stock Control
            <span className={styles.titleBadge}>{totalItems} Products</span>
          </h1>
          <p>Monitor real-time inventory balances, stock-outs, adjustments, and valuations.</p>
        </div>

        <div className={styles.actionGroup}>
          <button 
            className={styles.btnSecondary}
            onClick={handleRefresh}
            title="Refresh stock levels"
          >
            <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button 
            className={styles.btnSecondary}
            onClick={() => openModal('IN')}
          >
            <Sliders size={15} />
            <span>Quick Adjust</span>
          </button>

          <Link href="/erp/inventory/stock/adjust" className={styles.btnPrimary}>
            <Plus size={16} />
            <span>Record Movement</span>
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

      {/* Quick Action Legend Card */}
      <div className={styles.legendCard}>
        <span className={styles.legendTitle}>Quick Movement Shortcuts</span>
        <div className={styles.legendButtonsRow}>
          {TRANSACTION_TYPES.filter(t => showWarehouses || t.value !== 'TRANSFER').map(t => {
            const IconComponent = t.icon;
            return (
              <button 
                key={t.value}
                onClick={() => openModal(t.value)}
                className={styles.typeActionBtn}
              >
                <IconComponent size={16} color={t.color} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className={styles.toolbarCard}>
        {/* Status Tabs */}
        <div className={styles.statusTabsRow}>
          {(['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'] as const).map(tab => (
            <button
              key={tab}
              className={`${styles.statusTab} ${statusFilter === tab ? styles.statusTabActive : ''}`}
              onClick={() => setStatusFilter(tab)}
            >
              {tab === 'ALL' && 'All Products'}
              {tab === 'IN_STOCK' && `In Stock (${optimalCount})`}
              {tab === 'LOW_STOCK' && `Low Stock (${lowStockCount})`}
              {tab === 'OUT_OF_STOCK' && `Out of Stock (${outOfStockCount})`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className={styles.filterControlsRow}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search by product code or name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Total Asset Valuation: <strong style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>৳{totalValuation.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* Stock Table */}
      {isLoading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} color="var(--primary)" />
          <p>Loading stock levels...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className={styles.tablePanel} style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--surface-hover)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <Package size={28} />
          </div>
          <h3 style={{ margin: '0 0 6px 0', color: 'var(--text-main)' }}>No Stock Records Found</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {search ? "No products match your search criteria." : "Add products to your catalog to track inventory."}
          </p>
        </div>
      ) : (
        <div className={styles.tablePanel}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Product Code</th>
                  <th className={styles.th}>Product Details</th>
                  <th className={styles.th}>Category</th>
                  <th className={styles.th}>On-Hand Stock</th>
                  <th className={styles.th}>Min Threshold</th>
                  <th className={styles.th}>Inventory Condition</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => {
                  const stock = p.currentStock ?? 0;
                  const min = p.minStock ?? 0;
                  const isOut = stock <= 0;
                  const isLow = stock > 0 && min > 0 && stock <= min;

                  return (
                    <tr 
                      key={p.id} 
                      className={styles.tr}
                      onClick={() => router.push(`/erp/inventory/products/${encodeURIComponent(p.name.trim().replace(/ /g, '_'))}`)}
                    >
                      <td className={styles.td}>
                        <span className={styles.productCode}>{p.productCode}</span>
                      </td>

                      <td className={styles.td}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{p.name}</div>
                      </td>

                      <td className={styles.td}>
                        <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                          {p.category?.name || 'Uncategorized'}
                        </span>
                      </td>

                      <td className={styles.td}>
                        <span style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '1rem', color: isOut ? '#ef4444' : isLow ? '#f59e0b' : 'var(--text-main)' }}>
                          {stock} {p.unit || 'pcs'}
                        </span>
                      </td>

                      <td className={styles.td} style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {min > 0 ? `${min} ${p.unit || 'pcs'}` : '—'}
                      </td>

                      <td className={styles.td}>
                        <span 
                          className={styles.stockPill}
                          style={{
                            color: isOut ? '#ef4444' : isLow ? '#f59e0b' : '#10b981',
                            background: isOut ? 'rgba(239, 68, 68, 0.12)' : isLow ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            border: `1px solid ${isOut ? 'rgba(239, 68, 68, 0.25)' : isLow ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock Warning' : 'Optimal Stock'}
                        </span>
                      </td>

                      <td className={styles.td} style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => openModal('ADJUSTMENT', p.id)}
                            className={styles.btnSecondary}
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          >
                            <Sliders size={13} />
                            <span>Adjust</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Transaction Modal */}
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
            maxWidth: '520px',
            background: 'var(--surface-main)',
            border: '1px solid var(--border-main)',
            borderRadius: '20px',
            padding: '26px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={20} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Record Stock Transaction
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
                <label className={styles.formLabel}>Transaction Type *</label>
                <select 
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className={styles.formSelect}
                >
                  <option value="IN">Stock In (Receive / Intake)</option>
                  <option value="OUT">Stock Out (Dispatch / Issue)</option>
                  <option value="ADJUSTMENT">Stock Adjustment (Audit Correction)</option>
                  <option value="DAMAGE">Damage / Scrap Write-Off</option>
                  <option value="RETURN">Customer Return</option>
                  {showWarehouses && <option value="TRANSFER">Transfer Between Warehouses</option>}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Select Product *</label>
                <select 
                  value={form.productId}
                  onChange={e => setForm({ ...form, productId: e.target.value })}
                  required
                  className={styles.formSelect}
                >
                  <option value="">— Select Product —</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.productCode}) — Current: {p.currentStock ?? 0} {p.unit || 'pcs'}
                    </option>
                  ))}
                </select>
              </div>

              {showWarehouses && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Warehouse *</label>
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
              )}

              {form.type === 'TRANSFER' && showWarehouses && (
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

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Quantity *</label>
                  <input 
                    type="number"
                    step="any"
                    min="0.01"
                    placeholder="e.g. 25"
                    value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: e.target.value })}
                    required
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Reference #</label>
                  <input 
                    type="text"
                    placeholder="e.g. ADJ-001 / PO-99"
                    value={form.reference}
                    onChange={e => setForm({ ...form, reference: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Reason / Remarks</label>
                <textarea 
                  rows={2}
                  placeholder="Audit reason or notes..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
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
                  {submitting ? "Recording..." : "Record Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
