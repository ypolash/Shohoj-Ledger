"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { 
  Package, 
  Plus, 
  Upload, 
  Download, 
  RefreshCw, 
  Search, 
  X, 
  Eye, 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  MoreVertical, 
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

import ProductModal from '../components/ProductModal';
import BulkProductUploadModal from '../components/BulkProductUploadModal';
import styles from './ProductsPage.module.css';

/** Product record from API */
interface Product {
  id: string;
  productCode: string;
  name: string;
  sku?: string;
  barcode?: string;
  brand?: string;
  unit?: string;
  purchasePrice: number;
  sellingPrice: number;
  minStock: number;
  maxStock: number;
  reorderLevel: number;
  status: string;
  currentStock: number;
  categoryId?: string | null;
  description?: string | null;
  notes?: string | null;
  imageUrl?: string | null;
  category?: { name: string };
  createdAt?: string;
}

/** Category record from API */
interface Category {
  id: string;
  name: string;
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  'linear-gradient(135deg, #10b981, #047857)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  'linear-gradient(135deg, #ec4899, #be185d)',
  'linear-gradient(135deg, #06b6d4, #0e7490)',
  'linear-gradient(135deg, #6366f1, #4338ca)'
];

export default function ProductsPage() {
  const router = useRouter();

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'INACTIVE'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'stock_desc' | 'stock_asc' | 'price_desc' | 'price_asc' | 'newest'>('newest');
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState<{ id: string; name: string; top: number; right: number } | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Initial loads
  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  // Global click listener for closing kebab menu
  useEffect(() => {
    const handleClick = () => setMenuOpen(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  /** Fetch Categories */
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/inventory/categories');
      if (res.ok) {
        const d = await res.json();
        setCategories(d.categories || []);
      }
    } catch (e) {
      console.error('Failed to fetch categories:', e);
    }
  };

  /** Fetch Products */
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/inventory/products?limit=250');
      if (res.ok) {
        const d = await res.json();
        setProducts(d.products || []);
      }
    } catch (e) {
      console.error('Failed to fetch products:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchProducts();
    fetchCategories();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  /** Copy SKU to clipboard */
  const handleCopySku = (sku: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  /** Delete single product */
  const handleDelete = async (pId: string, name?: string) => {
    if (!confirm(`Are you sure you want to delete "${name || 'this product'}"?`)) return;
    setMenuOpen(null);
    try {
      const res = await fetch(`/api/inventory/products/${pId}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMsg("Product deleted successfully.");
        setTimeout(() => setSuccessMsg(''), 4000);
        setProducts(prev => prev.filter(p => p.id !== pId));
        setSelectedIds(prev => prev.filter(id => id !== pId));
      } else {
        const d = await res.json();
        alert(d.error || "Failed to delete product");
      }
    } catch (e) {
      alert("Network error while deleting");
    }
  };

  /** Bulk Delete selected products */
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected products?`)) return;
    try {
      await Promise.all(selectedIds.map(id => fetch(`/api/inventory/products/${id}`, { method: 'DELETE' })));
      setSuccessMsg(`Successfully deleted ${selectedIds.length} products.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setSelectedIds([]);
      fetchProducts();
    } catch (e) {
      alert("Failed to delete some products.");
    }
  };

  /** Export to Excel */
  const handleExportExcel = (itemsToExport = products) => {
    const data = itemsToExport.map(p => ({
      "Product Code": p.productCode,
      "Name": p.name,
      "SKU": p.sku || "",
      "Barcode": p.barcode || "",
      "Category": p.category?.name || "Uncategorized",
      "Brand": p.brand || "",
      "Unit": p.unit || "pcs",
      "Current Stock": p.currentStock,
      "Min Stock": p.minStock,
      "Purchase Price (৳)": p.purchasePrice,
      "Selling Price (৳)": p.sellingPrice,
      "Status": p.status,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products Catalog");
    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Shohoj_Inventory_Products_${today}.xlsx`);
  };

  /** Deterministic gradient avatar based on name */
  const getAvatarGradient = (name: string, id: string) => {
    let hash = 0;
    const str = name + id;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
  };

  /** Deterministic initials */
  const getInitials = (name: string) => {
    return (name || 'PR')
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  /** Stock badge helper */
  const getStockBadge = (p: Product) => {
    if (p.currentStock <= 0) {
      return {
        label: 'Out of Stock',
        color: 'var(--danger, #ef4444)',
        bg: 'rgba(239, 68, 68, 0.12)',
        border: 'rgba(239, 68, 68, 0.25)',
        dot: '#ef4444',
        pulse: true
      };
    }
    if (p.currentStock <= (p.minStock || 0)) {
      return {
        label: 'Low Stock',
        color: 'var(--warning, #f59e0b)',
        bg: 'rgba(245, 158, 11, 0.12)',
        border: 'rgba(245, 158, 11, 0.25)',
        dot: '#f59e0b',
        pulse: false
      };
    }
    return {
      label: 'In Stock',
      color: 'var(--success, #10b981)',
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.25)',
      dot: '#10b981',
      pulse: false
    };
  };

  // Counts for status tabs
  const statusCounts = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let inactive = 0;

    products.forEach(p => {
      const stock = p.currentStock || 0;
      if (p.status === 'INACTIVE') inactive++;
      if (stock <= 0) {
        outOfStock++;
      } else if (stock <= (p.minStock || 0)) {
        lowStock++;
      } else {
        inStock++;
      }
    });

    return {
      all: products.length,
      inStock,
      lowStock,
      outOfStock,
      inactive
    };
  }, [products]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        // Search filter
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = p.name?.toLowerCase().includes(q);
          const matchCode = p.productCode?.toLowerCase().includes(q);
          const matchSku = p.sku?.toLowerCase().includes(q);
          const matchBarcode = p.barcode?.toLowerCase().includes(q);
          const matchBrand = p.brand?.toLowerCase().includes(q);
          if (!matchName && !matchCode && !matchSku && !matchBarcode && !matchBrand) return false;
        }

        // Category filter
        if (categoryFilter && p.categoryId !== categoryFilter) {
          return false;
        }

        // Status tab filter
        if (statusFilter === 'IN_STOCK' && (p.currentStock <= (p.minStock || 0) || p.currentStock <= 0)) return false;
        if (statusFilter === 'LOW_STOCK' && (p.currentStock <= 0 || p.currentStock > (p.minStock || 0))) return false;
        if (statusFilter === 'OUT_OF_STOCK' && p.currentStock > 0) return false;
        if (statusFilter === 'INACTIVE' && p.status !== 'INACTIVE') return false;

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name_asc':
            return a.name.localeCompare(b.name);
          case 'name_desc':
            return b.name.localeCompare(a.name);
          case 'stock_desc':
            return b.currentStock - a.currentStock;
          case 'stock_asc':
            return a.currentStock - b.currentStock;
          case 'price_desc':
            return b.sellingPrice - a.sellingPrice;
          case 'price_asc':
            return a.sellingPrice - b.sellingPrice;
          case 'newest':
          default:
            return 0;
        }
      });
  }, [products, search, categoryFilter, statusFilter, sortBy]);

  // Selection toggle
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className={styles.pageContainer}>
      {/* Header Section */}
      <div className={styles.headerWrapper}>
        <div className={styles.titleGroup}>
          <h1>
            Products
            <span className={styles.titleBadge}>
              {products.length} {products.length === 1 ? 'Product' : 'Products'}
            </span>
          </h1>
          <p>Search, manage stock levels, view SKUs, and update product pricing.</p>
        </div>

        <div className={styles.actionGroup}>
          <button 
            className={styles.refreshBtn} 
            onClick={handleRefresh} 
            title="Refresh catalog data"
          >
            <RefreshCw size={16} className={isRefreshing ? styles.spinAnimation : ''} />
          </button>

          <button 
            className={styles.btnSecondary} 
            onClick={() => handleExportExcel(filteredProducts)}
            title="Export current view to Excel"
          >
            <Download size={15} />
            Export Excel
          </button>

          <button 
            className={styles.btnSecondary} 
            onClick={() => setIsBulkUploadOpen(true)}
          >
            <Upload size={15} />
            Bulk Upload
          </button>

          <button 
            className={styles.btnPrimary} 
            onClick={() => { setEditingId(null); setShowModal(true); }}
          >
            <Plus size={16} />
            Add Product
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: 'var(--success, #10b981)',
          fontSize: '0.875rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.2s ease'
        }}>
          <CheckCircle2 size={18} />
          {successMsg}
        </div>
      )}

      {/* Toolbar & Filters (Status Tabs, Search, Category, Sort) */}
      <div className={styles.toolbarContainer}>
        {/* Status Tabs */}
        <div className={styles.toolbarTopRow}>
          <div className={styles.statusTabs}>
            <button 
              className={`${styles.statusTab} ${statusFilter === 'ALL' ? styles.statusTabActive : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              All Products
              <span className={styles.statusTabCount}>{statusCounts.all}</span>
            </button>

            <button 
              className={`${styles.statusTab} ${statusFilter === 'IN_STOCK' ? styles.statusTabActive : ''}`}
              onClick={() => setStatusFilter('IN_STOCK')}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
              In Stock
              <span className={styles.statusTabCount}>{statusCounts.inStock}</span>
            </button>

            <button 
              className={`${styles.statusTab} ${statusFilter === 'LOW_STOCK' ? styles.statusTabActive : ''}`}
              onClick={() => setStatusFilter('LOW_STOCK')}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warning)' }} />
              Low Stock
              <span className={styles.statusTabCount}>{statusCounts.lowStock}</span>
            </button>

            <button 
              className={`${styles.statusTab} ${statusFilter === 'OUT_OF_STOCK' ? styles.statusTabActive : ''}`}
              onClick={() => setStatusFilter('OUT_OF_STOCK')}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)' }} />
              Out of Stock
              <span className={styles.statusTabCount}>{statusCounts.outOfStock}</span>
            </button>

            {statusCounts.inactive > 0 && (
              <button 
                className={`${styles.statusTab} ${statusFilter === 'INACTIVE' ? styles.statusTabActive : ''}`}
                onClick={() => setStatusFilter('INACTIVE')}
              >
                Inactive
                <span className={styles.statusTabCount}>{statusCounts.inactive}</span>
              </button>
            )}
          </div>
        </div>

        {/* Search, Category Filter, and Sort */}
        <div className={styles.toolbarBottomRow}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input 
              type="text"
              placeholder="Search by name, code, SKU, barcode, brand..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            {search && (
              <button 
                className={styles.searchClearBtn}
                onClick={() => setSearch('')}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className={styles.filterControls}>
            {/* Category Dropdown */}
            <select 
              value={categoryFilter} 
              onChange={e => setCategoryFilter(e.target.value)}
              className={styles.selectInput}
            >
              <option value="">All Categories ({categories.length})</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value as any)}
              className={styles.selectInput}
            >
              <option value="newest">Sort: Default / Newest</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
              <option value="stock_desc">Stock: High to Low</option>
              <option value="stock_asc">Stock: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="price_asc">Price: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className={styles.tablePanel}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th} style={{ width: '40px', textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length > 0 && selectedIds.length === filteredProducts.length}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th className={styles.th} style={{ width: '60px' }}>Item</th>
                <th className={styles.th}>Product Details</th>
                <th className={styles.th}>Code / SKU</th>
                <th className={styles.th}>Unit</th>
                <th className={styles.th}>Current Stock</th>
                <th className={styles.th}>Sell Price</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th} style={{ textAlign: 'right', paddingRight: '20px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className={styles.tr}>
                    <td colSpan={9} style={{ padding: '16px 20px' }}>
                      <div style={{ height: '18px', borderRadius: '6px', background: 'var(--surface-hover)', animation: 'pulse 1.5s infinite ease-in-out' }} />
                    </td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>
                        <Package size={28} />
                      </div>
                      <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        No products found
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-muted)', maxWidth: '320px' }}>
                        No products match your current search or category filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const isSelected = selectedIds.includes(p.id);
                  const badge = getStockBadge(p);
                  const margin = p.sellingPrice && p.purchasePrice 
                    ? Math.round(((p.sellingPrice - p.purchasePrice) / p.sellingPrice) * 100) 
                    : null;

                  return (
                    <tr 
                      key={p.id} 
                      className={`${styles.tr} ${isSelected ? styles.trSelected : ''}`}
                      onClick={() => router.push(`/erp/inventory/products/${encodeURIComponent(p.name.trim().replace(/ /g, '_'))}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Checkbox */}
                      <td className={styles.td} style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={(e) => toggleSelectOne(p.id, e as any)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>

                      {/* Thumbnail / Avatar */}
                      <td className={styles.td}>
                        <div className={styles.productAvatar}>
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} />
                          ) : (
                            <div 
                              className={styles.productAvatarFallback} 
                              style={{ background: getAvatarGradient(p.name, p.id) }}
                            >
                              {getInitials(p.name)}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Product Info */}
                      <td className={styles.td}>
                        <div className={styles.productInfo}>
                          <span className={styles.productNameLink}>
                            {p.name}
                          </span>
                          <div className={styles.productMeta}>
                            <span className={styles.categoryTag}>
                              {p.category?.name || 'Uncategorized'}
                            </span>
                            {p.brand && <span>· {p.brand}</span>}
                          </div>
                        </div>
                      </td>

                      {/* Code & SKU */}
                      <td className={styles.td}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                            {p.productCode}
                          </span>
                          {p.sku ? (
                            <span 
                              className={styles.skuChip} 
                              onClick={(e) => handleCopySku(p.sku!, e)}
                              title="Click to copy SKU"
                            >
                              {copiedSku === p.sku ? <Check size={11} color="var(--success)" /> : <Copy size={11} />}
                              {p.sku}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>—</span>
                          )}
                        </div>
                      </td>

                      {/* Unit */}
                      <td className={styles.td}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
                          {p.unit || 'pcs'}
                        </span>
                      </td>

                      {/* Current Stock */}
                      <td className={styles.td}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span 
                            className={styles.stockPill}
                            style={{
                              color: badge.color,
                              background: badge.bg,
                              border: `1px solid ${badge.border}`
                            }}
                          >
                            <span 
                              className={`${styles.stockDot} ${badge.pulse ? styles.stockDotPulse : ''}`} 
                              style={{ background: badge.dot }} 
                            />
                            {p.currentStock} {p.unit || 'pcs'} · {badge.label}
                          </span>
                          {p.minStock > 0 && (
                            <span style={{ fontSize: '0.685rem', color: 'var(--text-muted)' }}>
                              Min: {p.minStock} {p.unit || 'pcs'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Sell Price & Margin */}
                      <td className={styles.td}>
                        <div className={styles.priceCell}>
                          <span className={styles.sellPrice}>
                            ৳{Number(p.sellingPrice).toLocaleString()}
                          </span>
                          {margin !== null && margin > 0 && (
                            <span className={styles.marginTag}>
                              +{margin}% margin
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className={styles.td}>
                        <span 
                          style={{
                            padding: '3px 9px',
                            borderRadius: '20px',
                            fontSize: '0.725rem',
                            fontWeight: 700,
                            color: p.status === 'ACTIVE' ? 'var(--success)' : 'var(--text-muted)',
                            background: p.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.12)' : 'var(--surface-hover)',
                            border: `1px solid ${p.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-main)'}`
                          }}
                        >
                          {p.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className={styles.td} onClick={e => e.stopPropagation()}>
                        <div className={styles.actionBtns}>
                          <button 
                            className={styles.iconBtn} 
                            onClick={() => router.push(`/erp/inventory/products/${encodeURIComponent(p.name.trim().replace(/ /g, '_'))}`)}
                            title="View Full Details"
                          >
                            <Eye size={15} />
                          </button>
                          <button 
                            className={styles.iconBtn} 
                            onClick={() => {
                              setEditingId(p.id);
                              setShowModal(true);
                            }}
                            title="Edit product"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button 
                            className={styles.iconBtn} 
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMenuOpen({
                                id: p.id,
                                name: p.name,
                                top: rect.bottom,
                                right: window.innerWidth - rect.right
                              });
                            }}
                            title="More options"
                          >
                            <MoreVertical size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Bulk Selection Action Bar */}
      {selectedIds.length > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkCount}>
            {selectedIds.length} {selectedIds.length === 1 ? 'item' : 'items'} selected
          </span>

          <button 
            className={styles.btnSecondary} 
            onClick={() => {
              const selectedItems = products.filter(p => selectedIds.includes(p.id));
              handleExportExcel(selectedItems);
            }}
          >
            <Download size={14} />
            Export Selected
          </button>

          <button 
            className={styles.btnSecondary} 
            style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            onClick={handleBulkDelete}
          >
            <Trash2 size={14} />
            Delete Selected
          </button>

          <button 
            onClick={() => setSelectedIds([])}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Deselect All
          </button>
        </div>
      )}

      {/* Kebab Dropdown Menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed',
          right: `${menuOpen.right}px`,
          top: `${menuOpen.top + 4}px`,
          background: 'var(--surface-main)',
          border: '1px solid var(--border-main)',
          borderRadius: '10px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          padding: '6px',
          zIndex: 9999,
          minWidth: '160px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          animation: 'fadeIn 0.15s ease'
        }}>
          <button 
            style={{ padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.825rem', color: 'var(--text-main)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            onClick={() => {
              setMenuOpen(null);
              router.push(`/erp/inventory/products/${encodeURIComponent(menuOpen.name.trim().replace(/ /g, '_'))}`);
            }}
          >
            <ExternalLink size={14} />
            Full Details Page
          </button>

          <button 
            style={{ padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.825rem', color: 'var(--text-main)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            onClick={() => {
              const id = menuOpen.id;
              setMenuOpen(null);
              setEditingId(id);
              setShowModal(true);
            }}
          >
            <Edit3 size={14} />
            Edit Product
          </button>

          <button 
            style={{ padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.825rem', color: 'var(--danger)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            onClick={() => handleDelete(menuOpen.id, menuOpen.name)}
          >
            <Trash2 size={14} />
            Delete Product
          </button>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <ProductModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setSuccessMsg(`Product ${editingId ? 'updated' : 'created'} successfully!`);
          setTimeout(() => setSuccessMsg(''), 4000);
          fetchProducts();
        }}
        editingId={editingId}
        initialData={editingId ? products.find(p => p.id === editingId) : null}
      />

      {/* Bulk Product Upload Modal */}
      <BulkProductUploadModal 
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onSuccess={(count) => {
          setIsBulkUploadOpen(false);
          fetchProducts();
          setSuccessMsg(`Successfully imported ${count} products.`);
          setTimeout(() => setSuccessMsg(''), 4000);
        }}
      />
    </div>
  );
}
