"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/inventory/products/${id}`);
        if (res.ok) {
          const d = await res.json();
          setProduct(d.product);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
        <button 
          onClick={() => router.push('/erp/inventory/products')}
          className="btn btn-secondary"
          style={{ width: 'fit-content', padding: '6px 14px', fontSize: '13px' }}
        >
          &larr; Back to Products
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, color: 'var(--text-main)' }}>
              {isLoading ? 'Loading...' : product?.name || 'Product Not Found'}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
              {product?.productCode}
            </p>
          </div>
        </div>
      </div>

      {!isLoading && product && (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', color: 'var(--text-main)' }}>Product Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <DetailItem label="Code" value={product.productCode} />
            <DetailItem label="Name" value={product.name} />
            <DetailItem label="Category" value={product.category?.name || '—'} />
            <DetailItem label="Brand" value={product.brand || '—'} />
            <DetailItem label="SKU" value={product.sku || '—'} />
            <DetailItem label="Barcode" value={product.barcode || '—'} />
            <DetailItem label="Unit" value={product.unit || '—'} />
            <DetailItem label="Purchase Price" value={`৳${product.purchasePrice}`} />
            <DetailItem label="Selling Price" value={`৳${product.sellingPrice}`} />
            <DetailItem label="Min Stock" value={product.minStock} />
            <DetailItem label="Max Stock" value={product.maxStock} />
            <DetailItem label="Reorder Level" value={product.reorderLevel} />
            <DetailItem label="Status" value={product.status} />
          </div>
          <div style={{ marginTop: '20px' }}>
            <DetailItem label="Description" value={product.description || '—'} />
          </div>
          <div style={{ marginTop: '20px' }}>
            <DetailItem label="Notes" value={product.notes || '—'} />
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</span>
      <div style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: 500 }}>{value}</div>
    </div>
  );
}
