"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ProductModal from './components/ProductModal';
import styles from './components/InventoryDashboard.module.css';
import { 
  Boxes, 
  Warehouse, 
  AlertTriangle, 
  AlertOctagon, 
  BadgeDollarSign, 
  Plus, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowRight, 
  Package, 
  CheckCircle2, 
  Tag
} from 'lucide-react';

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
      icon: <Boxes size={22} />,
      color: 'var(--primary)',
      gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      href: '/erp/inventory/products'
    },
    {
      label: 'Warehouses',
      value: kpis.totalWarehouses ?? 0,
      badge: 'Storage Sites',
      icon: <Warehouse size={22} />,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
      href: '/erp/inventory/warehouses'
    },
    {
      label: 'Low Stock Alert',
      value: kpis.lowStockCount ?? 0,
      badge: (kpis.lowStockCount || 0) > 0 ? 'Requires Reorder' : 'Optimal',
      icon: <AlertTriangle size={22} />,
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      href: '/erp/inventory/stock'
    },
    {
      label: 'Out of Stock',
      value: kpis.outOfStockCount ?? 0,
      badge: (kpis.outOfStockCount || 0) > 0 ? 'Action Needed' : 'Zero Stockouts',
      icon: <AlertOctagon size={22} />,
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
      href: '/erp/inventory/stock'
    },
    {
      label: 'Inventory Asset Value',
      value: isLoading ? '—' : formatCurrency(kpis.inventoryValue),
      badge: 'Capital Assets',
      icon: <BadgeDollarSign size={22} />,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981, #047857)',
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
    <div className={styles.dashboardContainer}>
      
      {/* Top Header & Actions */}
      <div className={styles.headerWrapper}>
        <div className={styles.titleGroup}>
          <h1>Inventory Hub & Asset Overview</h1>
          <p>Real-time stock valuation, catalog health, and supplier procurement metrics.</p>
        </div>

        <div className={styles.actionGroup}>
          <button 
            onClick={handleRefreshClick}
            className={styles.btnSecondary}
            title="Refresh Inventory Dashboard"
          >
            <RefreshCw 
              size={16} 
              style={{ 
                animation: isRefreshing ? 'spin 0.6s linear infinite' : 'none' 
              }} 
            />
            <span>Refresh</span>
          </button>

          <button 
            onClick={() => setShowModal(true)}
            className={styles.btnPrimary}
          >
            <Plus size={18} />
            <span>Create Product</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className={styles.successBanner}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className={styles.kpiGrid}>
        {kpiCards.map((kpi) => (
          <Link 
            key={kpi.label}
            href={kpi.href}
            className={styles.kpiCard}
            style={{ ['--card-glow-color' as any]: kpi.color }}
          >
            <div className={styles.kpiCardHeader}>
              <div className={styles.kpiIconWrapper} style={{ background: kpi.gradient }}>
                {kpi.icon}
              </div>
              <span className={styles.kpiBadge} style={{ color: kpi.color, borderColor: `${kpi.color}40`, background: `${kpi.color}15` }}>
                {kpi.badge}
              </span>
            </div>

            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>{kpi.label}</span>
              <span className={styles.kpiValue} style={{ color: kpi.color }}>
                {isLoading ? <span style={{ opacity: 0.4 }}>···</span> : kpi.value}
              </span>
            </div>

            <div className={styles.kpiFooter}>
              <span>View details</span>
              <span className={styles.kpiLinkText}>
                Explore <ArrowRight size={13} />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Table: Recent Products */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>
            <Package size={18} color="var(--primary)" />
            Recent Catalog Additions
          </h2>
          <Link href="/erp/inventory/products" className={styles.panelViewAll}>
            <span>View All Products</span>
            <ArrowUpRight size={15} />
          </Link>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Product & SKU</th>
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
                        <Boxes size={32} />
                      </div>
                      <h3 className={styles.emptyTitle}>No Products Registered Yet</h3>
                      <p className={styles.emptyDesc}>
                        Build your inventory catalog to start tracking multi-warehouse stock, purchase orders, and sales delivery.
                      </p>
                      <button
                        onClick={() => setShowModal(true)}
                        className={styles.btnPrimary}
                      >
                        <Plus size={16} />
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
                          <Tag size={12} />
                          {categoryName}
                        </span>
                      </td>

                      {/* Selling Price */}
                      <td className={styles.td}>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                          {formatCurrency(sellingPrice)}
                        </span>
                      </td>

                      {/* Created At */}
                      <td className={styles.td}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
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

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
