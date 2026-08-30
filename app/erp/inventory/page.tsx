"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductModal from './components/ProductModal';

/**
 * ERP Inventory Dashboard Page
 * Fetches KPI data from /api/inventory/dashboard and displays key metrics,
 * stock alerts, and recent activity feed.
 */
export default function InventoryDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  /** Fetches the inventory dashboard data from the API */
  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/inventory/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Inventory dashboard error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  /** Formats a number as a currency string in BDT */
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(val || 0);

  const kpis = data?.kpis || {};
  const recentProducts: any[] = data?.recentProducts || [];

  const kpiCards = [
    { label: 'Total Products', value: kpis.totalProducts ?? '—', icon: 'inventory_2', color: 'var(--primary)', glow: 'primary', href: '/erp/inventory/products' },
    { label: 'Warehouses', value: kpis.totalWarehouses ?? '—', icon: 'warehouse', color: 'var(--accent)', glow: 'accent', href: '/erp/inventory/warehouses' },
    { label: 'Active Assets', value: kpis.totalAssets ?? '—', icon: 'precision_manufacturing', color: 'var(--text-main)', glow: 'accent', href: '/erp/inventory/assets' },
    { label: 'Low Stock Items', value: kpis.lowStockCount ?? '—', icon: 'warning', color: 'var(--warning)', glow: 'warning', href: '/erp/inventory/stock' },
    { label: 'Out of Stock', value: kpis.outOfStockCount ?? '—', icon: 'block', color: 'var(--danger)', glow: 'danger', href: '/erp/inventory/stock' },
    { label: 'Inventory Value', value: isLoading ? '—' : formatCurrency(kpis.inventoryValue), icon: 'payments', color: 'var(--success)', glow: 'success', href: '/erp/inventory/reports' },
  ];


  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Inventory Dashboard</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={fetchDashboard} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
            Refresh
          </button>
          <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            Create Product
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--success-subtle)', color: 'var(--success)', border: '1px solid var(--success)', fontSize: '14px' }}>
          ✓ {successMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-4)' }}>
        {kpiCards.filter(kpi => kpi.label !== 'Active Assets').map((kpi) => (
          <Link key={kpi.label} href={kpi.href || '#'} className={`glass-panel hover-lift glow-border-${kpi.glow}`} style={{ padding: '24px', borderRadius: '16px', textDecoration: 'none', display: 'block', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px', color: kpi.color }}>{kpi.icon}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>{kpi.label}</span>
            </div>
            <div style={{ fontSize: '30px', fontWeight: 700, color: kpi.color, letterSpacing: '-0.5px' }}>
              {isLoading ? <span style={{ opacity: 0.4 }}>···</span> : kpi.value}
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
        <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-main)' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>Recent Products</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
                  {['Product Name', 'SKU', 'Created At'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-main)' }}>
                      {Array.from({ length: 3 }).map((_, j) => (
                        <td key={j} style={{ padding: '14px 16px' }}>
                          <div style={{ height: '14px', borderRadius: '6px', background: 'var(--surface-hover)', opacity: 0.7 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : recentProducts.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4, display: 'block', marginBottom: '8px' }}>inventory_2</span>
                      No products created yet.
                    </td>
                  </tr>
                ) : (
                  recentProducts.map((product: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-main)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ padding: '14px 16px', fontWeight: 500, color: 'var(--text-main)' }}>{product.name}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{product.sku || 'N/A'}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{new Date(product.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      <ProductModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setSuccessMsg('Product created successfully!');
          setTimeout(() => setSuccessMsg(''), 4000);
          fetchDashboard();
        }}
      />
    </div>
  );
}
