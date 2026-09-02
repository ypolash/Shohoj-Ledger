"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Copy, 
  Check, 
  Barcode, 
  DollarSign, 
  Package, 
  TrendingUp, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  Printer, 
  Info, 
  Calendar, 
  FileText, 
  Tag, 
  ShieldCheck,
  Search,
  X,
  Plus
} from 'lucide-react';

import { useUI } from '@/lib/contexts/UIContext';
import ProductModal from '../../components/ProductModal';
import styles from './ProductDetails.module.css';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  'linear-gradient(135deg, #ec4899, #be185d)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #10b981, #047857)',
  'linear-gradient(135deg, #06b6d4, #0e7490)',
  'linear-gradient(135deg, #6366f1, #4338ca)',
];

function getAvatarGradient(name: string = '', id: string = ''): string {
  const str = name + id;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

function getInitials(name: string = ''): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

export default function ProductDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { setPageTitleOverride } = useUI();

  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'pricing'>('overview');
  
  // Interaction & Modals
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [successAlert, setSuccessAlert] = useState<string>('');

  // Stock Adjustment Form State
  const [stockForm, setStockForm] = useState({
    type: 'IN' as 'IN' | 'OUT' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN',
    quantity: '',
    reference: '',
    notes: ''
  });
  const [isSubmittingStock, setIsSubmittingStock] = useState(false);

  // Transaction Ledger Filters
  const [txFilter, setTxFilter] = useState<'ALL' | 'IN' | 'OUT' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN' | 'OPENING'>('ALL');
  const [txSearch, setTxSearch] = useState('');

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/inventory/products/${id}`);
      if (res.ok) {
        const d = await res.json();
        setProduct(d.product);
        if (d.product?.name) {
          setPageTitleOverride(d.product.name);
        }
      } else if (res.status === 404) {
        router.push('/erp/inventory/products');
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id, router, setPageTitleOverride]);

  useEffect(() => {
    fetchProduct();
    return () => setPageTitleOverride(null);
  }, [fetchProduct, setPageTitleOverride]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProduct();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDelete = async () => {
    if (!product) return;
    if (!confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/inventory/products/${product.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/erp/inventory/products');
      } else {
        const d = await res.json();
        alert(d.error || "Failed to delete product");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting product.");
    }
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !stockForm.quantity || Number(stockForm.quantity) <= 0) {
      alert("Please enter a valid positive quantity");
      return;
    }

    setIsSubmittingStock(true);
    try {
      const res = await fetch('/api/inventory/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          type: stockForm.type,
          quantity: Number(stockForm.quantity),
          reference: stockForm.reference || undefined,
          notes: stockForm.notes || undefined
        })
      });

      if (res.ok) {
        setShowStockModal(false);
        setStockForm({ type: 'IN', quantity: '', reference: '', notes: '' });
        setSuccessAlert("Stock adjusted successfully!");
        setTimeout(() => setSuccessAlert(''), 4000);
        await fetchProduct();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to adjust stock");
      }
    } catch (err) {
      console.error(err);
      alert("Network error adjusting stock");
    } finally {
      setIsSubmittingStock(false);
    }
  };

  // Financial Computations
  const purchasePrice = Number(product?.purchasePrice || 0);
  const sellingPrice = Number(product?.sellingPrice || 0);
  const currentStock = Number(product?.currentStock || 0);
  const minStock = Number(product?.minStock || 0);
  const maxStock = Number(product?.maxStock || 0);
  const reorderLevel = Number(product?.reorderLevel || 0);

  const unitProfit = sellingPrice - purchasePrice;
  const marginPercent = sellingPrice > 0 ? ((unitProfit / sellingPrice) * 100).toFixed(1) : '0';
  const markupPercent = purchasePrice > 0 ? ((unitProfit / purchasePrice) * 100).toFixed(1) : '0';
  const totalCostValuation = currentStock * purchasePrice;
  const totalRetailValuation = currentStock * sellingPrice;

  // Stock Status Badge
  const stockHealth = useMemo(() => {
    if (currentStock <= 0) {
      return {
        label: 'Out of Stock',
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.12)',
        border: 'rgba(239, 68, 68, 0.3)',
        icon: <AlertTriangle size={15} color="#ef4444" />
      };
    }
    if (minStock > 0 && currentStock <= minStock) {
      return {
        label: 'Low Stock Alert',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.12)',
        border: 'rgba(245, 158, 11, 0.3)',
        icon: <AlertTriangle size={15} color="#f59e0b" />
      };
    }
    return {
      label: 'Optimal In-Stock',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.3)',
      icon: <CheckCircle2 size={15} color="#10b981" />
    };
  }, [currentStock, minStock]);

  // Filtered Stock Transactions
  const filteredTransactions = useMemo(() => {
    if (!product?.stockTransactions) return [];
    return product.stockTransactions.filter((tx: any) => {
      if (txFilter !== 'ALL' && tx.type !== txFilter) return false;
      if (txSearch.trim()) {
        const q = txSearch.toLowerCase();
        const refMatch = tx.reference?.toLowerCase().includes(q);
        const notesMatch = tx.notes?.toLowerCase().includes(q);
        const typeMatch = tx.type?.toLowerCase().includes(q);
        if (!refMatch && !notesMatch && !typeMatch) return false;
      }
      return true;
    });
  }, [product?.stockTransactions, txFilter, txSearch]);

  const totalInflow = useMemo(() => {
    if (!product?.stockTransactions) return 0;
    return product.stockTransactions
      .filter((t: any) => ['IN', 'OPENING', 'RETURN'].includes(t.type))
      .reduce((sum: number, t: any) => sum + Math.abs(t.quantity || 0), 0);
  }, [product?.stockTransactions]);

  const totalOutflow = useMemo(() => {
    if (!product?.stockTransactions) return 0;
    return product.stockTransactions
      .filter((t: any) => ['OUT', 'DAMAGE'].includes(t.type))
      .reduce((sum: number, t: any) => sum + Math.abs(t.quantity || 0), 0);
  }, [product?.stockTransactions]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '40px 0' }}>
          <RefreshCw size={24} className="animate-spin" color="var(--primary)" />
          <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Loading product details...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Package size={32} />
          </div>
          <h3>Product Not Found</h3>
          <p>The product you are looking for does not exist or has been removed.</p>
          <button className={styles.btnPrimary} onClick={() => router.push('/erp/inventory/products')}>
            <ArrowLeft size={16} /> Return to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Top Navigation & Action Header */}
      <div className={styles.topNav}>
        <button 
          onClick={() => router.push('/erp/inventory/products')}
          className={styles.backBtn}
        >
          <ArrowLeft size={16} />
          <span>Back to Products</span>
        </button>

        <div className={styles.headerActions}>
          <button 
            className={styles.btnSecondary}
            onClick={handleRefresh}
            title="Refresh Data"
          >
            <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button 
            className={styles.btnSecondary}
            onClick={() => window.print()}
            title="Print Product Sheet"
          >
            <Printer size={15} />
            <span>Print</span>
          </button>

          <button 
            className={styles.btnSecondary}
            onClick={() => setShowStockModal(true)}
          >
            <Sliders size={15} />
            <span>Adjust Stock</span>
          </button>

          <button 
            className={styles.btnPrimary}
            onClick={() => setShowEditModal(true)}
          >
            <Edit3 size={15} />
            <span>Edit Product</span>
          </button>

          <button 
            className={styles.btnDanger}
            onClick={handleDelete}
            title="Delete Product"
          >
            <Trash2 size={15} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Success Alert Banner */}
      {successAlert && (
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
          <span>{successAlert}</span>
        </div>
      )}

      {/* Hero Product Profile Section */}
      <div className={styles.heroCard}>
        {/* Left Column: Image / Avatar */}
        <div className={styles.imageSection}>
          <div className={styles.imageContainer}>
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className={styles.productImg} />
            ) : (
              <div 
                className={styles.avatarFallback}
                style={{ background: getAvatarGradient(product.name, product.id) }}
              >
                {getInitials(product.name)}
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`${styles.statusPill} ${product.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive}`}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
              {product.status || 'ACTIVE'}
            </span>
            {product.category?.name && (
              <span className={styles.categoryBadge}>
                {product.category.name}
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Key Details & Stock Banner */}
        <div className={styles.infoSection}>
          <div className={styles.titleArea}>
            <div className={styles.categoryRow}>
              {product.brand && (
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {product.brand}
                </span>
              )}
            </div>
            
            <h1 className={styles.productName}>{product.name}</h1>

            <div className={styles.metaChips}>
              {/* Product Code */}
              <div 
                className={styles.chip} 
                onClick={() => handleCopy(product.productCode, 'code')}
                title="Click to copy Product Code"
              >
                <span className={styles.chipLabel}>Code:</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{product.productCode}</span>
                {copiedField === 'code' ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
              </div>

              {/* SKU */}
              {product.sku && (
                <div 
                  className={styles.chip} 
                  onClick={() => handleCopy(product.sku, 'sku')}
                  title="Click to copy SKU"
                >
                  <span className={styles.chipLabel}>SKU:</span>
                  <span>{product.sku}</span>
                  {copiedField === 'sku' ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                </div>
              )}

              {/* Barcode */}
              {product.barcode && (
                <div 
                  className={styles.chip} 
                  onClick={() => handleCopy(product.barcode, 'barcode')}
                  title="Click to copy Barcode"
                >
                  <Barcode size={13} />
                  <span>{product.barcode}</span>
                  {copiedField === 'barcode' ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                </div>
              )}

              {/* Unit of Measurement */}
              <div className={styles.chip} style={{ cursor: 'default' }}>
                <span className={styles.chipLabel}>Unit:</span>
                <span>{product.unit || 'pcs'}</span>
              </div>
            </div>
          </div>

          {/* Live Inventory Health Banner */}
          <div className={styles.stockHealthBanner}>
            <div className={styles.stockCountGroup}>
              <span className={styles.stockLabel}>On-Hand Inventory</span>
              <div className={styles.stockNumber}>
                {currentStock.toLocaleString()}
                <span className={styles.stockUnit}>{product.unit || 'pcs'}</span>
              </div>
            </div>

            <div 
              className={styles.stockStatusBadge}
              style={{
                color: stockHealth.color,
                background: stockHealth.bg,
                border: `1px solid ${stockHealth.border}`
              }}
            >
              {stockHealth.icon}
              <span>{stockHealth.label}</span>
            </div>

            <div className={styles.stockMetrics}>
              <div className={styles.stockMetricItem}>
                <span>Min Alert</span>
                <span>{minStock} {product.unit || 'pcs'}</span>
              </div>
              {reorderLevel > 0 && (
                <div className={styles.stockMetricItem}>
                  <span>Reorder Point</span>
                  <span>{reorderLevel} {product.unit || 'pcs'}</span>
                </div>
              )}
              {maxStock > 0 && (
                <div className={styles.stockMetricItem}>
                  <span>Max Capacity</span>
                  <span>{maxStock} {product.unit || 'pcs'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Executive Financial KPI Cards */}
      <div className={styles.kpiGrid}>
        {/* Cost Price */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Purchase Cost</span>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className={styles.kpiValue}>৳{purchasePrice.toLocaleString()}</div>
          <div className={styles.kpiFooter}>
            <span>Unit acquisition cost</span>
          </div>
        </div>

        {/* Selling Price */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Selling Price</span>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className={styles.kpiValue}>৳{sellingPrice.toLocaleString()}</div>
          <div className={styles.kpiFooter}>
            <span className={styles.kpiBadge} style={{ background: unitProfit >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)', color: unitProfit >= 0 ? '#10b981' : '#ef4444' }}>
              {unitProfit >= 0 ? `+৳${unitProfit.toLocaleString()} profit` : `-৳${Math.abs(unitProfit).toLocaleString()} loss`}
            </span>
          </div>
        </div>

        {/* Gross Margin */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Profit Margin</span>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className={styles.kpiValue}>{marginPercent}%</div>
          <div className={styles.kpiFooter}>
            <span style={{ color: 'var(--text-muted)' }}>Markup on cost: <strong style={{ color: 'var(--text-main)' }}>{markupPercent}%</strong></span>
          </div>
        </div>

        {/* Total Stock Valuation */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Inventory Valuation</span>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
              <Layers size={18} />
            </div>
          </div>
          <div className={styles.kpiValue}>৳{totalCostValuation.toLocaleString()}</div>
          <div className={styles.kpiFooter}>
            <span>Retail value: ৳{totalRetailValuation.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Tabbed Navigation */}
      <div className={styles.tabsContainer}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FileText size={16} />
          <span>Overview & Specifications</span>
        </button>

        <button 
          className={`${styles.tabBtn} ${activeTab === 'ledger' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('ledger')}
        >
          <Layers size={16} />
          <span>Stock History & Ledger</span>
          <span className={styles.tabBadge}>
            {product.stockTransactions ? product.stockTransactions.length : 0}
          </span>
        </button>

        <button 
          className={`${styles.tabBtn} ${activeTab === 'pricing' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('pricing')}
        >
          <DollarSign size={16} />
          <span>Pricing & Margin Analysis</span>
        </button>
      </div>

      {/* Tab 1: Overview & Specifications */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Specifications Card */}
          <div className={styles.panelCard}>
            <h3 className={styles.panelTitle}>
              <Tag size={18} color="var(--primary)" />
              Product Specifications & Metadata
            </h3>

            <div className={styles.specGrid}>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Product Code</span>
                <span className={styles.specValue}>{product.productCode}</span>
              </div>

              <div className={styles.specItem}>
                <span className={styles.specLabel}>SKU</span>
                <span className={styles.specValue}>{product.sku || '—'}</span>
              </div>

              <div className={styles.specItem}>
                <span className={styles.specLabel}>Barcode</span>
                <span className={styles.specValue}>{product.barcode || '—'}</span>
              </div>

              <div className={styles.specItem}>
                <span className={styles.specLabel}>Brand</span>
                <span className={styles.specValue}>{product.brand || '—'}</span>
              </div>

              <div className={styles.specItem}>
                <span className={styles.specLabel}>Category</span>
                <span className={styles.specValue}>{product.category?.name || 'Uncategorized'}</span>
              </div>

              <div className={styles.specItem}>
                <span className={styles.specLabel}>Unit of Measure</span>
                <span className={styles.specValue}>{product.unit || 'pcs'}</span>
              </div>

              <div className={styles.specItem}>
                <span className={styles.specLabel}>Opening Stock</span>
                <span className={styles.specValue}>{product.openingStock ?? 0} {product.unit || 'pcs'}</span>
              </div>

              <div className={styles.specItem}>
                <span className={styles.specLabel}>Minimum Stock Alert</span>
                <span className={styles.specValue}>{product.minStock || 0} {product.unit || 'pcs'}</span>
              </div>

              <div className={styles.specItem}>
                <span className={styles.specLabel}>Reorder Point</span>
                <span className={styles.specValue}>{product.reorderLevel || 0} {product.unit || 'pcs'}</span>
              </div>

              <div className={styles.specItem}>
                <span className={styles.specLabel}>Created Date</span>
                <span className={styles.specValue}>
                  {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '—'}
                </span>
              </div>
            </div>

            {/* Custom Attributes */}
            {product.customFields && Object.keys(product.customFields).length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <span className={styles.specLabel} style={{ marginBottom: '8px', display: 'block' }}>Custom Attributes</span>
                <div className={styles.specGrid}>
                  {Object.entries(product.customFields).map(([k, v]) => (
                    <div key={k} className={styles.specItem}>
                      <span className={styles.specLabel}>{k}</span>
                      <span className={styles.specValue}>{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Description & Internal Notes */}
          {(product.description || product.notes) && (
            <div className={styles.panelCard}>
              <h3 className={styles.panelTitle}>
                <Info size={18} color="var(--primary)" />
                Descriptions & Warehouse Notes
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {product.description && (
                  <div style={{ background: 'var(--surface-hover)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-main)' }}>
                    <span className={styles.specLabel} style={{ marginBottom: '6px', display: 'block' }}>Public Description</span>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                      {product.description}
                    </p>
                  </div>
                )}

                {product.notes && (
                  <div style={{ background: 'var(--surface-hover)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-main)' }}>
                    <span className={styles.specLabel} style={{ marginBottom: '6px', display: 'block' }}>Internal / Handling Notes</span>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                      {product.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Stock History & Inventory Ledger */}
      {activeTab === 'ledger' && (
        <div className={styles.panelCard}>
          {/* Toolbar & Filters */}
          <div className={styles.txToolbar}>
            <div className={styles.txFilterGroup}>
              {(['ALL', 'IN', 'OUT', 'ADJUSTMENT', 'OPENING', 'DAMAGE', 'RETURN'] as const).map(type => (
                <button
                  key={type}
                  className={`${styles.txFilterBtn} ${txFilter === type ? styles.txFilterBtnActive : ''}`}
                  onClick={() => setTxFilter(type)}
                >
                  {type}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative', minWidth: '220px' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text"
                  placeholder="Search reference, notes..."
                  value={txSearch}
                  onChange={e => setTxSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 32px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-main)',
                    background: 'var(--surface-hover)',
                    color: 'var(--text-main)',
                    fontSize: '0.825rem',
                    outline: 'none',
                    boxBox: 'border-box'
                  }}
                />
              </div>

              <button 
                className={styles.btnPrimary}
                onClick={() => setShowStockModal(true)}
                style={{ padding: '8px 14px', fontSize: '0.8rem' }}
              >
                <Plus size={14} /> Adjust Stock
              </button>
            </div>
          </div>

          {/* Quick Ledger Summary Pills */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
              Total Stock Inflow: <strong>+{totalInflow} {product.unit || 'pcs'}</strong>
            </div>
            <div style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>
              Total Stock Outflow: <strong>-{totalOutflow} {product.unit || 'pcs'}</strong>
            </div>
            <div style={{ padding: '8px 14px', borderRadius: '10px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Current Balance: <strong>{currentStock} {product.unit || 'pcs'}</strong>
            </div>
          </div>

          {/* Ledger Table */}
          {filteredTransactions.length > 0 ? (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Date & Time</th>
                    <th className={styles.th}>Type</th>
                    <th className={styles.th}>Quantity Change</th>
                    <th className={styles.th}>Reference / Source</th>
                    <th className={styles.th}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx: any) => {
                    const isPositive = ['IN', 'OPENING', 'RETURN'].includes(tx.type) || tx.quantity > 0;
                    return (
                      <tr key={tx.id} className={styles.tr}>
                        <td className={styles.td} style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td className={styles.td}>
                          <span 
                            className={styles.txBadge}
                            style={{
                              background: isPositive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: isPositive ? '#10b981' : '#ef4444',
                              border: `1px solid ${isPositive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
                            }}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className={styles.td} style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '0.9rem', color: isPositive ? '#10b981' : '#ef4444' }}>
                          {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity} {product.unit || 'pcs'}
                        </td>
                        <td className={styles.td} style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {tx.reference || '—'}
                        </td>
                        <td className={styles.td} style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                          {tx.notes || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Layers size={28} />
              </div>
              <h4 style={{ margin: 0, color: 'var(--text-main)' }}>No Transactions Found</h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                No stock movement matches your current filter criteria.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Pricing & Margin Analysis */}
      {activeTab === 'pricing' && (
        <div className={styles.panelCard}>
          <h3 className={styles.panelTitle}>
            <DollarSign size={18} color="var(--primary)" />
            Unit Economics & Margin Breakdown
          </h3>

          <div style={{ overflowX: 'auto', border: '1px solid var(--border-main)', borderRadius: '12px' }}>
            <table className={styles.table}>
              <tbody>
                <tr className={styles.tr}>
                  <td className={styles.td} style={{ width: '40%', fontWeight: 600 }}>Purchase / Unit Cost</td>
                  <td className={styles.td} style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>
                    ৳{purchasePrice.toLocaleString()}
                  </td>
                </tr>
                <tr className={styles.tr}>
                  <td className={styles.td} style={{ fontWeight: 600 }}>Selling / Retail Price</td>
                  <td className={styles.td} style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>
                    ৳{sellingPrice.toLocaleString()}
                  </td>
                </tr>
                <tr className={styles.tr}>
                  <td className={styles.td} style={{ fontWeight: 600 }}>Gross Profit per Unit</td>
                  <td className={styles.td} style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem', color: unitProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {unitProfit >= 0 ? `+৳${unitProfit.toLocaleString()}` : `-৳${Math.abs(unitProfit).toLocaleString()}`}
                  </td>
                </tr>
                <tr className={styles.tr}>
                  <td className={styles.td} style={{ fontWeight: 600 }}>Gross Profit Margin (%)</td>
                  <td className={styles.td} style={{ fontWeight: 800, color: unitProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {marginPercent}%
                  </td>
                </tr>
                <tr className={styles.tr}>
                  <td className={styles.td} style={{ fontWeight: 600 }}>Markup over Cost (%)</td>
                  <td className={styles.td} style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                    {markupPercent}%
                  </td>
                </tr>
                <tr className={styles.tr}>
                  <td className={styles.td} style={{ fontWeight: 600 }}>Total Inventory Cost Value</td>
                  <td className={styles.td} style={{ fontFamily: 'monospace', fontWeight: 800 }}>
                    ৳{totalCostValuation.toLocaleString()} ({currentStock} {product.unit || 'pcs'} @ ৳{purchasePrice})
                  </td>
                </tr>
                <tr className={styles.tr}>
                  <td className={styles.td} style={{ fontWeight: 600 }}>Potential Retail Sales Value</td>
                  <td className={styles.td} style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--primary)' }}>
                    ৳{totalRetailValuation.toLocaleString()} ({currentStock} {product.unit || 'pcs'} @ ৳{sellingPrice})
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showStockModal && (
        <div 
          className={styles.modalBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowStockModal(false);
          }}
        >
          <div className={styles.modalPanel}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={20} color="var(--primary)" />
                <h3 className={styles.modalTitle}>Adjust Inventory Stock</h3>
              </div>
              <button 
                onClick={() => setShowStockModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleStockSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Adjustment Type</label>
                <select 
                  className={styles.formSelect}
                  value={stockForm.type}
                  onChange={e => setStockForm({ ...stockForm, type: e.target.value as any })}
                >
                  <option value="IN">Stock In (Receive / Purchase)</option>
                  <option value="OUT">Stock Out (Issue / Dispatch)</option>
                  <option value="ADJUSTMENT">Stock Adjustment (Audit Correction)</option>
                  <option value="DAMAGE">Damage / Wastage</option>
                  <option value="RETURN">Customer Return</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Quantity ({product.unit || 'pcs'}) *
                </label>
                <input 
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="e.g. 10"
                  className={styles.formInput}
                  value={stockForm.quantity}
                  onChange={e => setStockForm({ ...stockForm, quantity: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Reference / PO / Invoice #</label>
                <input 
                  type="text"
                  placeholder="e.g. ADJ-2026-001"
                  className={styles.formInput}
                  value={stockForm.reference}
                  onChange={e => setStockForm({ ...stockForm, reference: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Reason / Notes</label>
                <textarea 
                  rows={3}
                  placeholder="Provide reason for stock change..."
                  className={styles.formTextarea}
                  value={stockForm.notes}
                  onChange={e => setStockForm({ ...stockForm, notes: e.target.value })}
                />
              </div>

              <div className={styles.modalFooter}>
                <button 
                  type="button" 
                  className={styles.btnSecondary}
                  onClick={() => setShowStockModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.btnPrimary}
                  disabled={isSubmittingStock}
                >
                  {isSubmittingStock ? "Saving..." : "Confirm Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      <ProductModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          setShowEditModal(false);
          setSuccessAlert("Product updated successfully!");
          setTimeout(() => setSuccessAlert(''), 4000);
          fetchProduct();
        }}
        editingId={product.id}
        initialData={product}
      />
    </div>
  );
}
