"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * ERP Inventory Dashboard Page
 * Fetches KPI data from /api/inventory/dashboard and displays key metrics,
 * stock alerts, and recent activity feed.
 */
export default function InventoryDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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
  const recentTransactions: any[] = data?.recentTransactions || [];

  const kpiCards = [
    { label: 'Total Products', value: kpis.totalProducts ?? '—', icon: 'inventory_2', color: 'var(--primary)', glow: 'primary' },
    { label: 'Warehouses', value: kpis.totalWarehouses ?? '—', icon: 'warehouse', color: 'var(--accent)', glow: 'accent' },
    { label: 'Active Assets', value: kpis.totalAssets ?? '—', icon: 'precision_manufacturing', color: 'var(--text-main)', glow: 'accent' },
    { label: 'Low Stock Items', value: kpis.lowStockCount ?? '—', icon: 'warning', color: 'var(--warning)', glow: 'warning' },
    { label: 'Out of Stock', value: kpis.outOfStockCount ?? '—', icon: 'block', color: 'var(--danger)', glow: 'danger' },
    { label: 'Inventory Value', value: isLoading ? '—' : formatCurrency(kpis.inventoryValue), icon: 'payments', color: 'var(--success)', glow: 'success' },
  ];

  const quickLinks = [
    { href: '/erp/inventory/products', icon: 'inventory_2', label: 'Manage Products' },
    { href: '/erp/inventory/categories', icon: 'category', label: 'Product Categories' },
    { href: '/erp/inventory/warehouses', icon: 'warehouse', label: 'Warehouses' },
    { href: '/erp/inventory/stock', icon: 'move_down', label: 'Record Stock Movement' },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Inventory Dashboard</h1>
          <p style={{ margin: '4px 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>
            Track stock levels, monitor warehouses, and manage your inventory assets.
          </p>
        </div>
        <button onClick={fetchDashboard} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-4)' }}>
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className={`glass-panel hover-lift glow-border-${kpi.glow}`} style={{ padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px', color: kpi.color }}>{kpi.icon}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>{kpi.label}</span>
            </div>
            <div style={{ fontSize: '30px', fontWeight: 700, color: kpi.color, letterSpacing: '-0.5px' }}>
              {isLoading ? <span style={{ opacity: 0.4 }}>···</span> : kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links + Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--spacing-6)' }}>

        {/* Quick Links */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 16px' }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {quickLinks.map((ql) => (
              <Link
                key={ql.href}
                href={ql.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border-main)',
                  color: 'var(--text-main)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  fontSize: '14px',
                  transition: 'all 0.15s ease',
                }}
                className="hover-lift"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }}>{ql.icon}</span>
                {ql.label}
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-muted)', marginLeft: 'auto' }}>chevron_right</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 16px' }}>Recent Activity</h2>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{ height: '48px', borderRadius: '10px', background: 'var(--surface-hover)', opacity: 0.5 }} />
              ))}
            </div>
          ) : recentTransactions.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4, display: 'block', marginBottom: '8px' }}>history</span>
              No activity yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentTransactions.map((tx: any, idx: number) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border-main)',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)', flexShrink: 0 }}>history</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {tx.description}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {tx.performedBy?.name} · {new Date(tx.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
