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
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Archive,
  Filter,
  ArrowUpDown,
  Palette
} from 'lucide-react';

import ProductModal from '../components/ProductModal';
import BulkProductUploadModal from '../components/BulkProductUploadModal';
import styles from './ProductsPage.module.css';
import invStyles from '../inventory.module.css';

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

  // Table Header Color Customization
  const [headerColor, setHeaderColor] = useState('#10b981');
  const [headerBorder, setHeaderBorder] = useState('#059669');
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const colorPickerRef = React.useRef<HTMLDivElement>(null);

  const COLOR_PRESETS = [
    { name: 'Emerald', bg: '#10b981', border: '#059669' },
    { name: 'Royal Blue', bg: '#2563eb', border: '#1d4ed8' },
    { name: 'Violet', bg: '#7c3aed', border: '#6d28d9' },
    { name: 'Slate Dark', bg: '#1e293b', border: '#0f172a' },
    { name: 'Teal', bg: '#0d9488', border: '#0f766e' },
    { name: 'Rose', bg: '#e11d48', border: '#be123c' },
    { name: 'Amber', bg: '#d97706', border: '#b45309' },
    { name: 'Midnight', bg: '#0b1120', border: '#1e293b' },
  ];

  useEffect(() => {
    try {
      const saved = localStorage.getItem('products_header_color');
      const savedBorder = localStorage.getItem('products_header_border');
      if (saved) setHeaderColor(saved);
      if (savedBorder) setHeaderBorder(savedBorder);
    } catch (e) {}
  }, []);

  const selectHeaderColor = (bg: string, border: string) => {
    setHeaderColor(bg);
    setHeaderBorder(border);
    try {
      localStorage.setItem('products_header_color', bg);
      localStorage.setItem('products_header_border', border);
    } catch (e) {}
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setColorPickerOpen(false);
      }
    };
    if (colorPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [colorPickerOpen]);

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
      {/* 1. Executive Minimalist Header */}
      <header className={invStyles.headerCard}>
        <div className={invStyles.headerTitleGroup}>
          <h1 className={invStyles.pageTitle}>
            Products Catalog
            <span className={invStyles.titleBadge}>
              {products.length} {products.length === 1 ? 'Product' : 'Products'}
            </span>
          </h1>
        </div>

        <div className={invStyles.headerActions}>
          <button 
            className={invStyles.headerIconBtn} 
            onClick={handleRefresh} 
            title="Refresh catalog data"
            aria-label="Refresh catalog data"
            disabled={isLoading}
          >
            <span className={`material-symbols-outlined ${isRefreshing || isLoading ? invStyles.spinning : ''}`} style={{ fontSize: '20px' }}>
              refresh
            </span>
          </button>

          <button 
            className={invStyles.headerIconBtn} 
            onClick={() => handleExportExcel(filteredProducts)}
            title="Export current view to Excel"
            aria-label="Export to Excel"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              download
            </span>
          </button>

          <button 
            className={invStyles.headerIconBtn} 
            onClick={() => setIsBulkUploadOpen(true)}
            title="Bulk Upload CSV/Excel"
            aria-label="Bulk Upload CSV/Excel"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              upload_file
            </span>
          </button>

          <button 
            className={`${invStyles.headerIconBtn} ${invStyles.headerIconBtnPrimary}`} 
            onClick={() => { setEditingId(null); setShowModal(true); }}
            title="Add Product"
            aria-label="Add Product"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              add
            </span>
          </button>
        </div>
      </header>

      {/* Success Banner */}
      {successMsg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '0',
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

      {/* Toolbar & Filters (Single Compact Row) */}
      <div className={styles.toolbarContainer}>
        {/* Status Tabs (Square Icon View) */}
        <div className={styles.tabsContainer}>
          {[
            {
              id: 'ALL',
              label: 'All Products',
              icon: <Package size={15} />,
              count: statusCounts.all,
              colorKey: 'all',
            },
            {
              id: 'IN_STOCK',
              label: 'In Stock Products',
              icon: <CheckCircle2 size={15} />,
              count: statusCounts.inStock,
              colorKey: 'in_stock',
            },
            {
              id: 'LOW_STOCK',
              label: 'Low Stock Alert',
              icon: <AlertTriangle size={15} />,
              count: statusCounts.lowStock,
              colorKey: 'low_stock',
            },
            {
              id: 'OUT_OF_STOCK',
              label: 'Out of Stock Products',
              icon: <AlertOctagon size={15} />,
              count: statusCounts.outOfStock,
              colorKey: 'out_of_stock',
            },
            ...(statusCounts.inactive > 0 ? [{
              id: 'INACTIVE',
              label: 'Inactive Products',
              icon: <Archive size={15} />,
              count: statusCounts.inactive,
              colorKey: 'inactive',
            }] : [])
          ].map(tab => (
            <div key={tab.id} className={styles.squareWrapper}>
              <button
                type="button"
                role="tab"
                aria-selected={statusFilter === tab.id}
                aria-label={`${tab.label} (${tab.count})`}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`${styles.squareBtn} ${styles[`square_${tab.colorKey}`]} ${statusFilter === tab.id ? styles.squareBtnActive : ''}`}
              >
                <span className={styles.squareIcon}>
                  {tab.icon}
                </span>
                <span className={styles.squareCount}>{tab.count}</span>
              </button>
              <div className={styles.squareTooltip}>
                <div style={{ fontWeight: 700 }}>{tab.label} ({tab.count})</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className={styles.searchWrapper}>
          <Search size={14} className={styles.searchIcon} />
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
              <X size={12} />
            </button>
          )}
        </div>

        {/* Right Side: Active Notice & Action Controls (Filter, Sort, Color Switcher) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Active Filter Notice */}
          <div className={styles.activeFilterNotice}>
            <span>
              {statusFilter === 'ALL' && 'All Products'}
              {statusFilter === 'IN_STOCK' && 'In Stock'}
              {statusFilter === 'LOW_STOCK' && 'Low Stock Alert'}
              {statusFilter === 'OUT_OF_STOCK' && 'Out of Stock'}
              {statusFilter === 'INACTIVE' && 'Inactive Products'}
            </span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span style={{ fontWeight: 700 }}>
              {statusFilter === 'ALL' && statusCounts.all}
              {statusFilter === 'IN_STOCK' && statusCounts.inStock}
              {statusFilter === 'LOW_STOCK' && statusCounts.lowStock}
              {statusFilter === 'OUT_OF_STOCK' && statusCounts.outOfStock}
              {statusFilter === 'INACTIVE' && statusCounts.inactive} Products
            </span>
          </div>

          {/* Right Controls: Filter, Sort, Color Switcher */}
          <div className={styles.tabsContainer}>
            {/* Category Filter Icon View */}
            <div className={styles.squareWrapper}>
              <div 
                className={`${styles.squareBtn} ${styles.square_all} ${categoryFilter ? styles.iconFilterActive : ''}`}
              >
                <span className={styles.squareIcon}>
                  <Filter size={15} />
                </span>
                <span className={styles.squareCount}>
                  {categoryFilter ? 'Cat' : categories.length}
                </span>

                <select 
                  value={categoryFilter} 
                  onChange={e => setCategoryFilter(e.target.value)}
                  className={styles.hiddenSelectOverlay}
                  aria-label="Filter by Category"
                  title="Filter by Category"
                >
                  <option value="">All Categories ({categories.length})</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.squareTooltip}>
                <div style={{ fontWeight: 700 }}>
                  {categoryFilter 
                    ? `Category: ${categories.find(c => c.id === categoryFilter)?.name}` 
                    : `All Categories (${categories.length})`}
                </div>
              </div>
            </div>

            {/* Sort Filter Icon View */}
            <div className={styles.squareWrapper}>
              <div 
                className={`${styles.squareBtn} ${styles.square_all} ${sortBy !== 'newest' ? styles.iconFilterActive : ''}`}
              >
                <span className={styles.squareIcon}>
                  <ArrowUpDown size={15} />
                </span>
                <span className={styles.squareCount}>
                  Sort
                </span>

                <select 
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value as any)}
                  className={styles.hiddenSelectOverlay}
                  aria-label="Sort products"
                  title="Sort products"
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

              <div className={styles.squareTooltip}>
                <div style={{ fontWeight: 700 }}>
                  Sort: {
                    sortBy === 'name_asc' ? 'Name: A to Z' :
                    sortBy === 'name_desc' ? 'Name: Z to A' :
                    sortBy === 'stock_desc' ? 'Stock: High to Low' :
                    sortBy === 'stock_asc' ? 'Stock: Low to High' :
                    sortBy === 'price_desc' ? 'Price: High to Low' :
                    sortBy === 'price_asc' ? 'Price: Low to High' :
                    'Default / Newest'
                  }
                </div>
              </div>
            </div>

            {/* Color Switcher Icon View */}
            <div className={styles.squareWrapper} ref={colorPickerRef}>
              <button
                type="button"
                className={`${styles.squareBtn} ${colorPickerOpen ? styles.squareBtnActive : ''}`}
                onClick={() => setColorPickerOpen(prev => !prev)}
                title={`Header Color: ${headerColor}`}
                aria-label="Change table header color"
              >
                <span className={styles.squareIcon} style={{ color: headerColor }}>
                  <Palette size={15} />
                </span>
                <span 
                  style={{ 
                    width: '12px', 
                    height: '3px', 
                    background: headerColor, 
                    display: 'inline-block',
                    marginTop: '2px' 
                  }} 
                />
              </button>

              {/* Color Switcher Popover */}
              {colorPickerOpen && (
                <div className={styles.colorPopover}>
                  <div className={styles.colorPopoverHeader}>
                    <span>Header Color</span>
                    <button 
                      type="button" 
                      onClick={() => setColorPickerOpen(false)} 
                      className={styles.colorPopoverClose}
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <div className={styles.colorPresetsGrid}>
                    {COLOR_PRESETS.map(preset => (
                      <button
                        key={preset.name}
                        type="button"
                        className={`${styles.colorPresetBtn} ${headerColor === preset.bg ? styles.colorPresetBtnActive : ''}`}
                        style={{ background: preset.bg }}
                        onClick={() => {
                          selectHeaderColor(preset.bg, preset.border);
                          setColorPickerOpen(false);
                        }}
                        title={preset.name}
                      >
                        {headerColor === preset.bg && <Check size={12} color="#ffffff" />}
                      </button>
                    ))}
                  </div>
                  <div className={styles.customColorRow}>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input 
                        type="color" 
                        value={headerColor} 
                        onChange={e => {
                          const val = e.target.value;
                          selectHeaderColor(val, val);
                        }}
                        style={{ width: '20px', height: '20px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                      />
                      <span>Custom</span>
                    </label>
                    <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--text-secondary)' }}>
                      {headerColor}
                    </span>
                  </div>
                </div>
              )}

              <div className={styles.squareTooltip}>
                <div style={{ fontWeight: 700 }}>Header Color</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className={styles.tablePanel}>
        <div className={styles.tableWrapper}>
          <table 
            className={styles.table}
            style={{ '--table-header-bg': headerColor, '--table-header-border': headerBorder } as React.CSSProperties}
          >
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
                <th className={styles.th}>Code</th>
                <th className={styles.th}>SKU</th>
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
                    <td colSpan={10} style={{ padding: '8px 12px' }}>
                      <div style={{ height: '18px', borderRadius: '0', background: 'var(--surface-hover)', animation: 'pulse 1.5s infinite ease-in-out' }} />
                    </td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10}>
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
                        </div>
                      </td>

                      {/* Code */}
                      <td className={styles.td}>
                        <span className={styles.productCode}>
                          {p.productCode}
                        </span>
                      </td>

                      {/* SKU */}
                      <td className={styles.td}>
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
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* Unit */}
                      <td className={styles.td}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', whiteSpace: 'nowrap' }}>
                          {p.unit || 'pcs'}
                        </span>
                      </td>

                      {/* Current Stock */}
                      <td className={styles.td}>
                        <div className={styles.stockCell}>
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
                        </div>
                      </td>

                      {/* Sell Price */}
                      <td className={styles.td}>
                        <div className={styles.priceCell}>
                          <span className={styles.sellPrice}>
                            ৳{Number(p.sellingPrice).toLocaleString()}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className={styles.td}>
                        <span 
                          style={{
                            padding: '2px 8px',
                            borderRadius: '0',
                            fontSize: '0.725rem',
                            fontWeight: 700,
                            color: p.status === 'ACTIVE' ? 'var(--success)' : 'var(--text-muted)',
                            background: p.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.12)' : 'var(--surface-hover)',
                            border: `1px solid ${p.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-main)'}`,
                            whiteSpace: 'nowrap'
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
          borderRadius: '0',
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
            style={{ padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.825rem', color: 'var(--text-main)', borderRadius: '0', display: 'flex', alignItems: 'center', gap: '8px' }}
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
            style={{ padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.825rem', color: 'var(--text-main)', borderRadius: '0', display: 'flex', alignItems: 'center', gap: '8px' }}
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
            style={{ padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.825rem', color: 'var(--danger)', borderRadius: '0', display: 'flex', alignItems: 'center', gap: '8px' }}
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
