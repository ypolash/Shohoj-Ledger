"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProductModal from '../components/ProductModal';
import BulkProductUploadModal from '../components/BulkProductUploadModal';
import { InventoryDataTable, InventoryColumn } from '../components/InventoryDataTable';

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
}

/** Category record from API */
interface Category {
  id: string;
  name: string;
}

/**
 * ERP Inventory — Products Page (Universal Table Redesign 2.0)
 * Displays a searchable, filterable product list and supports adding/editing products.
 */
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [menuOpen, setMenuOpen] = useState<{ id: string, name: string, top: number, right: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const router = useRouter();
  const LIMIT = 20;

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchProducts(); }, [page, search, categoryFilter]);
  useEffect(() => {
    const handleClick = () => setMenuOpen(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  /** Loads categories for the filter dropdown and create form */
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/inventory/categories');
      if (res.ok) { const d = await res.json(); setCategories(d.categories || []); }
    } catch (e) { console.error(e); }
  };

  /** Loads paginated, filtered products from the API */
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (search) params.set('search', search);
      if (categoryFilter) params.set('categoryId', categoryFilter);
      const res = await fetch(`/api/inventory/products?${params}`);
      if (res.ok) {
        const d = await res.json();
        setProducts(d.products || []);
        setTotal(d.pagination?.total || 0);
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, [page, search, categoryFilter]);

  /** Handles search input with page reset */
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  const handleEditClick = (pId: string) => {
    const p = products.find(prod => prod.id === pId);
    if (!p) return;
    setEditingId(p.id);
    setShowModal(true);
    setMenuOpen(null);
  };

  const handleDelete = async (pId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setMenuOpen(null);
    try {
      const res = await fetch(`/api/inventory/products/${pId}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMsg("Product deleted successfully.");
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchProducts();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to delete product");
      }
    } catch (e) {
      alert("Network error while deleting");
    }
  };

  /** Returns a badge style based on current stock vs. min stock threshold */
  const stockBadge = (product: Product) => {
    if (product.currentStock <= 0) return { label: 'Out of Stock', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', dot: '#ef4444' };
    if (product.currentStock <= product.minStock) return { label: 'Low Stock', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', dot: '#f59e0b' };
    return { label: 'In Stock', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', dot: '#10b981' };
  };

  const totalPages = Math.ceil(total / LIMIT);

  const columns: InventoryColumn<Product>[] = [
    {
      key: 'image',
      header: 'Item',
      width: '60px',
      render: (p) => (
        <div style={{ width: '42px', height: '42px', borderRadius: '10px', overflow: 'hidden', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-main)' }}>
          {p.imageUrl ? (
            <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--text-muted)' }}>image</span>
          )}
        </div>
      )
    },
    {
      key: 'productCode',
      header: 'Code / SKU',
      render: (p) => (
        <div>
          <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--primary, #38bdf8)', fontWeight: 600 }}>
            {p.productCode}
          </span>
          {p.sku && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>SKU: {p.sku}</div>}
        </div>
      )
    },
    {
      key: 'name',
      header: 'Product Details',
      render: (p) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>{p.name}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {p.category?.name || 'Uncategorized'} {p.brand ? `· ${p.brand}` : ''}
          </div>
        </div>
      )
    },
    {
      key: 'unit',
      header: 'Unit',
      render: (p) => <span style={{ color: 'var(--text-secondary)' }}>{p.unit || '—'}</span>
    },
    {
      key: 'stock',
      header: 'Current Stock',
      render: (p) => {
        const badge = stockBadge(p);
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              color: badge.color,
              background: badge.bg,
              border: `1px solid ${badge.color}30`
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: badge.dot }} />
            {p.currentStock} {p.unit || 'pcs'} · {badge.label}
          </span>
        );
      }
    },
    {
      key: 'sellingPrice',
      header: 'Sell Price',
      render: (p) => (
        <span style={{ color: 'var(--text-main)', fontWeight: 600, fontFamily: 'monospace', fontSize: '13px' }}>
          ৳{Number(p.sellingPrice).toLocaleString()}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => (
        <span
          style={{
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 600,
            color: p.status === 'ACTIVE' ? 'var(--success, #10b981)' : 'var(--text-muted)',
            background: p.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.12)' : 'var(--surface-hover)'
          }}
        >
          {p.status}
        </span>
      )
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '60px',
      render: (p) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (menuOpen?.id === p.id) {
              setMenuOpen(null);
            } else {
              const rect = e.currentTarget.getBoundingClientRect();
              setMenuOpen({
                id: p.id,
                name: p.name,
                top: rect.bottom,
                right: window.innerWidth - rect.right
              });
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>more_vert</span>
        </button>
      )
    }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Products</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary hover-lift" onClick={() => setIsBulkUploadOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>upload</span>
            Bulk Upload
          </button>
          <button className="btn btn-primary hover-lift" onClick={() => { setEditingId(null); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
            Add Product
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success, #10b981)', border: '1px solid var(--success)', fontSize: '14px' }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Universal Inventory Table */}
      <InventoryDataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        emptyIcon="inventory_2"
        emptyTitle="No products found"
        emptySubtitle="Try adjusting your search query or category filters to find products."
        searchValue={search}
        onSearchChange={handleSearch}
        searchPlaceholder="Search by name, code, SKU, barcode..."
        filterSlot={
          <select
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
            style={{
              padding: '9px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border-main)',
              background: 'var(--surface-input, rgba(15, 23, 42, 0.6))',
              color: 'var(--text-main)',
              fontSize: '13px',
              outline: 'none'
            }}
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        }
        page={page}
        totalPages={totalPages}
        totalItems={total}
        itemsPerPage={LIMIT}
        onPageChange={setPage}
        onRowClick={(p) => router.push(`/erp/inventory/products/${encodeURIComponent(p.name.trim().replace(/ /g, '_'))}`)}
      />

      {/* Global Dropdown Menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed',
          right: `${menuOpen.right}px`,
          top: `${menuOpen.top + 4}px`,
          background: 'var(--surface-bg, #1e293b)',
          border: '1px solid var(--border-main)',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          padding: '4px',
          zIndex: 9999,
          minWidth: '140px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <button style={{ padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-main)', borderRadius: '4px' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            onClick={() => {
              setMenuOpen(null);
              router.push(`/erp/inventory/products/${encodeURIComponent(menuOpen.name.trim().replace(/ /g, '_'))}`);
            }}
          >
            View Details
          </button>
          <button style={{ padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-main)', borderRadius: '4px' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            onClick={() => handleEditClick(menuOpen.id)}
          >
            Edit Product
          </button>
          <button style={{ padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--danger, #ef4444)', borderRadius: '4px' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            onClick={() => handleDelete(menuOpen.id)}
          >
            Delete
          </button>
        </div>
      )}

      {/* Add Product Modal */}
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
