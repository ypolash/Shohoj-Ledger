"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ProductModal from './components/ProductModal';
import styles from './inventory.module.css';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  'linear-gradient(135deg, #10b981, #047857)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  'linear-gradient(135deg, #ec4899, #be185d)',
  'linear-gradient(135deg, #06b6d4, #0e7490)'
];

export default function InventoryDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/inventory/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Inventory dashboard fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    fetchDashboard();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(val || 0);

  const kpis = data?.kpis || {};
  const recentProducts: any[] = data?.recentProducts || [];

  const kpiCards = [
    {
      label: 'Total Products',
      value: kpis.totalProducts ?? 0,
      badge: 'Active Catalog',
      icon: 'inventory_2',
      color: 'var(--primary)',
      iconBg: 'rgba(37, 99, 235, 0.12)',
      iconColor: '#3b82f6',
      href: '/erp/inventory/products'
    },
    {
      label: 'Warehouses',
      value: kpis.totalWarehouses ?? 0,
      badge: 'Storage Sites',
      icon: 'warehouse',
      color: '#8b5cf6',
      iconBg: 'rgba(139, 92, 246, 0.12)',
      iconColor: '#8b5cf6',
      href: '/erp/inventory/warehouses'
    },
    {
      label: 'Low Stock Alert',
      value: kpis.lowStockCount ?? 0,
      badge: (kpis.lowStockCount || 0) > 0 ? 'Requires Reorder' : 'Optimal',
      icon: 'warning',
      color: '#f59e0b',
      iconBg: 'rgba(245, 158, 11, 0.12)',
      iconColor: '#f59e0b',
      href: '/erp/inventory/stock'
    },
    {
      label: 'Out of Stock',
      value: kpis.outOfStockCount ?? 0,
      badge: (kpis.outOfStockCount || 0) > 0 ? 'Action Needed' : 'Zero Stockouts',
      icon: 'cancel',
      color: '#ef4444',
      iconBg: 'rgba(239, 68, 68, 0.12)',
      iconColor: '#ef4444',
      href: '/erp/inventory/stock'
    },
    {
      label: 'Inventory Asset Value',
      value: isLoading ? '—' : formatCurrency(kpis.inventoryValue),
      badge: 'Capital Assets',
      icon: 'attach_money',
      color: '#10b981',
      iconBg: 'rgba(16, 185, 129, 0.12)',
      iconColor: '#10b981',
      href: '/erp/inventory/reports'
    }
  ];

  const getAvatarInitials = (name: string, id: string) => {
    const initials = (name || 'PR')
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    const gradient = AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
    return { initials, gradient };
  };

  return (
    <div className={styles.container}>
      {/* 1. Executive Minimalist Header */}
      <header className={styles.headerCard}>
        <div className={styles.headerTitleGroup}>
          <h1 className={styles.pageTitle}>
            Inventory Hub &amp; Asset Overview
            <span className={styles.titleBadge}>
              {kpis.totalProducts !== undefined ? `${kpis.totalProducts} Products` : 'Catalog'}
            </span>
          </h1>
        </div>

        <div className={styles.headerActions}>
          <button 
            onClick={handleRefreshClick}
            className={styles.headerIconBtn}
            title="Refresh Inventory Dashboard"
            aria-label="Refresh Inventory Dashboard"
            disabled={isLoading}
          >
            <span 
              className={`material-symbols-outlined ${isRefreshing || isLoading ? styles.spinning : ''}`}
              style={{ fontSize: '20px' }}
            >
              refresh
            </span>
          </button>

          <button 
            onClick={() => setShowModal(true)}
            className={`${styles.headerIconBtn} ${styles.headerIconBtnPrimary}`}
            title="Register New Product"
            aria-label="Register New Product"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              add
            </span>
          </button>
        </div>
      </header>

      {/* Success Notification */}
      {successMsg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className={styles.kpiGrid}>
        {kpiCards.map((kpi) => (
          <Link 
            key={kpi.label}
            href={kpi.href}
            className={styles.kpiCard}
          >
            <div className={styles.kpiTopRow}>
              <div 
                className={styles.kpiIconBox} 
                style={{ background: kpi.iconBg, color: kpi.iconColor }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  {kpi.icon}
                </span>
              </div>
              <span 
                style={{ 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.04em',
                  padding: '3px 8px',
                  borderRadius: '9999px',
                  color: kpi.color, 
                  borderColor: `${kpi.color}30`, 
                  background: `${kpi.color}15`,
                  border: `1px solid ${kpi.color}30`
                }}
              >
                {kpi.badge}
              </span>
            </div>

            <div>
              <div className={styles.kpiLabel}>{kpi.label}</div>
              <div className={styles.kpiValue} style={{ color: kpi.color }}>
                {isLoading ? <span style={{ opacity: 0.4 }}>···</span> : kpi.value}
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              fontSize: '12px', 
              color: 'var(--text-muted)',
              paddingTop: '8px',
              borderTop: '1px solid var(--border-main)'
            }}>
              <span>View details</span>
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '2px', 
                color: 'var(--primary)', 
                fontWeight: 600 
              }}>
                Explore
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>arrow_forward</span>
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Table: Recent Products */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }}>
              inventory_2
            </span>
            Recent Catalog Additions
          </h2>
          <Link href="/erp/inventory/products" className={styles.panelViewAll}>
            <span>View All Products</span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_outward</span>
          </Link>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Product &amp; SKU</th>
                <th className={styles.th}>Category</th>
                <th className={styles.th}>Selling Price</th>
                <th className={styles.th}>Added On</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className={styles.tr}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className={styles.td}>
                        <div style={{ height: '14px', borderRadius: '6px', background: 'var(--surface-hover)', opacity: 0.7 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : recentProducts.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIconWrapper}>
                        <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                          inventory_2
                        </span>
                      </div>
                      <h3 className={styles.emptyTitle}>No Products Registered Yet</h3>
                      <p className={styles.emptyDesc}>
                        Build your inventory catalog to start tracking multi-warehouse stock, purchase orders, and sales delivery.
                      </p>
                      <button
                        onClick={() => setShowModal(true)}
                        className={styles.headerIconBtnPrimary}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textDecoration: 'none'
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                        <span>Register First Product</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                recentProducts.map((product) => {
                  const { initials, gradient } = getAvatarInitials(product.name, product.id);
                  const sellingPrice = Number(product.sellingPrice || 0);
                  const categoryName = product.category?.name || 'General';

                  return (
                    <tr key={product.id} className={styles.tr}>
                      {/* Product & SKU */}
                      <td className={styles.td}>
                        <div className={styles.productIdentity}>
                          <div className={styles.productAvatar} style={{ background: gradient }}>
                            {initials}
                          </div>
                          <div className={styles.productDetails}>
                            <span className={styles.productName}>{product.name}</span>
                            <span className={styles.productSku}>
                              {product.sku ? `SKU: ${product.sku}` : `Code: ${product.productCode || 'N/A'}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className={styles.td}>
                        <span className={styles.categoryBadge}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>label</span>
                          {categoryName}
                        </span>
                      </td>

                      {/* Selling Price */}
                      <td className={styles.td}>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '13px' }}>
                          {formatCurrency(sellingPrice)}
                        </span>
                      </td>

                      {/* Created At */}
                      <td className={styles.td}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {new Date(product.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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
