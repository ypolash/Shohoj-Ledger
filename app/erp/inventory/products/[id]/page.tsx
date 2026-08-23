"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { useUI } from '@/lib/contexts/UIContext';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { setPageTitleOverride } = useUI();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/inventory/products/${id}`);
        if (res.ok) {
          const d = await res.json();
          setProduct(d.product);
          if (d.product?.name) {
            setPageTitleOverride(d.product.name);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchProduct();
    
    // Cleanup on unmount (optional since UIContext handles pathname changes, but good practice)
    return () => setPageTitleOverride(null);
  }, [id, setPageTitleOverride]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '4px' }}>
        <button 
          onClick={() => router.push('/erp/inventory/products')}
          className="ios-back-button"
        >
          Back to Products
        </button>
      </div>

      {!isLoading && product && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Top Row: Combined Panel */}
          <div className="glass-panel" style={{ display: 'flex', flexWrap: 'wrap', borderRadius: '16px' }}>
            {/* Left Column */}
            <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '400px', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderRight: '1px solid var(--border-main)' }}>
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} style={{ width: '100%', maxWidth: '250px', aspectRatio: '1/1', objectFit: 'contain', borderRadius: '16px', marginBottom: '24px', border: '1px solid var(--border-main)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', background: 'var(--surface-bg)' }} />
              ) : (
                <div style={{ width: '100%', maxWidth: '250px', aspectRatio: '1/1', background: 'var(--surface-hover)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', border: '1px solid var(--border-main)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--text-muted)' }}>image</span>
                </div>
              )}
              <h2 style={{ margin: '0 0 12px 0', fontSize: '24px', color: 'var(--text-main)', fontWeight: 600 }}>{product.name}</h2>
              <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, color: product.status === 'ACTIVE' ? 'var(--success)' : 'var(--text-muted)', background: product.status === 'ACTIVE' ? 'var(--success-subtle)' : 'var(--surface-hover)' }}>
                {product.status}
              </span>
              
              {/* Vertical Stock Badge on the border */}
              <div style={{
                position: 'absolute',
                top: '35%',
                right: '-1px', // Flush with the right border
                transform: 'translateY(-50%)',
                background: product.currentStock >= (product.minStock || 0) ? 'var(--success)' : 'var(--danger)',
                color: '#fff',
                padding: '16px 6px',
                borderRadius: '16px 0 0 16px', // Notch style (flat on the right, rounded on the left)
                fontWeight: 700,
                fontSize: '12px',
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                boxShadow: '-4px 0px 12px rgba(0,0,0,0.15)', // Shadow only to the left
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                letterSpacing: '1px'
              }}>
                STOCK {product.currentStock}
              </div>
            </div>

            {/* Right Column */}
            <div style={{ flex: '2 1 500px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: 'var(--text-main)', borderBottom: '1px solid var(--border-main)', paddingBottom: '12px' }}>Product Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
                <DetailItem label="Product Code" value={product.productCode} />
                <DetailItem label="Purchase Price" value={`৳${Number(product.purchasePrice).toLocaleString()}`} />
                <DetailItem label="Selling Price" value={`৳${Number(product.sellingPrice).toLocaleString()}`} />
              </div>
            </div>
          </div>

          {/* Additional Details (Description & Notes) */}
          {(product.description || product.notes) && (
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: 'var(--text-main)' }}>Additional Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {product.description && <DetailItem label="Description" value={product.description} />}
                {product.notes && <DetailItem label="Notes" value={product.notes} />}
              </div>
            </div>
          )}

          {/* Bottom Row: Stock History */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: 'var(--text-main)' }}>Stock History</h3>
            {product.stockTransactions && product.stockTransactions.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Date</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Type</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Quantity</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.stockTransactions.map((tx: any) => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-main)' }}>
                        <td style={{ padding: '12px 16px', color: 'var(--text-main)' }}>{new Date(tx.createdAt).toLocaleString()}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ 
                            padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                            background: tx.type === 'IN' || tx.type === 'OPENING' || tx.type === 'RETURN' ? 'var(--success-subtle)' : 'var(--danger-subtle)',
                            color: tx.type === 'IN' || tx.type === 'OPENING' || tx.type === 'RETURN' ? 'var(--success)' : 'var(--danger)'
                          }}>
                            {tx.type}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-main)' }}>
                          {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{tx.reference || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px', opacity: 0.5, display: 'block', marginBottom: '8px' }}>history</span>
                No stock transactions found.
              </div>
            )}
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
