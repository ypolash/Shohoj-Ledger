"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProductModal, { EMPTY_PRODUCT_FORM } from '../components/ProductModal';
import BulkProductUploadModal from '../components/BulkProductUploadModal';

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
 * ERP Inventory — Products Page
 * Displays a searchable, filterable product list and supports adding new products.
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
    if (product.currentStock <= 0) return { label: 'Out of Stock', color: 'var(--danger)', bg: 'var(--danger-subtle)' };
    if (product.currentStock <= product.minStock) return { label: 'Low Stock', color: 'var(--warning)', bg: 'var(--warning-subtle)' };
    return { label: 'In Stock', color: 'var(--success)', bg: 'var(--success-subtle)' };
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Products</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            {total} product{total !== 1 ? 's' : ''} total
          </p>
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
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--success-subtle)', color: 'var(--success)', border: '1px solid var(--success)', fontSize: '14px' }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Filters */}
      <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '14px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: 'var(--text-muted)' }}>search</span>
          <input
            type="text"
            placeholder="Search by name, code, SKU, barcode..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '38px', padding: '10px 12px 10px 38px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
          style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', minWidth: '180px' }}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
                {['Image', 'Code', 'Name', 'Category', 'Unit', 'Stock', 'Sell Price', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-main)' }}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} style={{ padding: '14px 16px' }}>
                        <div style={{ height: '14px', borderRadius: '6px', background: 'var(--surface-hover)', opacity: 0.7 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4, display: 'block', marginBottom: '8px' }}>inventory_2</span>
                    No products found. Add one to get started.
                  </td>
                </tr>
              ) : products.map((p) => {
                const badge = stockBadge(p);
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-main)', transition: 'background 0.1s', cursor: 'pointer' }}
                    onClick={() => router.push(`/erp/inventory/products/${encodeURIComponent(p.name)}`)}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td style={{ padding: '10px 16px', width: '50px' }}>
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', background: 'var(--surface-hover)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--text-muted)' }}>image</span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>{p.productCode}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 500, color: 'var(--text-main)' }}>
                      <div>{p.name}</div>
                      {p.sku && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>SKU: {p.sku}</div>}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{p.category?.name || '—'}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{p.unit || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: badge.color, background: badge.bg }}>
                        {p.currentStock} · {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-main)', fontWeight: 500 }}>৳{Number(p.sellingPrice).toLocaleString()}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: p.status === 'ACTIVE' ? 'var(--success)' : 'var(--text-muted)', background: p.status === 'ACTIVE' ? 'var(--success-subtle)' : 'var(--surface-hover)' }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
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
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>more_vert</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid var(--border-main)' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total}</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 14px', fontSize: '13px' }}>← Prev</button>
              <span style={{ padding: '6px 14px', fontSize: '13px', color: 'var(--text-main)', fontWeight: 600 }}>{page} / {totalPages}</span>
              <button className="btn btn-secondary" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '6px 14px', fontSize: '13px' }}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Global Dropdown Menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed',
          right: `${menuOpen.right}px`,
          top: `${menuOpen.top + 4}px`,
          background: 'var(--surface-bg)',
          border: '1px solid var(--border-main)',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
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
              router.push(`/erp/inventory/products/${encodeURIComponent(menuOpen.name)}`);
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
          <button style={{ padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--danger)', borderRadius: '4px' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-subtle)'}
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
