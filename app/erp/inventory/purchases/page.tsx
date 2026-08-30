"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]); // Placeholder for actual data
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
      {/* Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Purchases</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary hover-lift" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => router.push('/erp/inventory/products')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>inventory_2</span>
            Register Product
          </button>
          <button 
            className="btn btn-primary hover-lift" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => { alert('New Purchase logic to be implemented') }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
            New Purchase
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
                {['Invoice Number', 'Company Name', 'Date & Time', 'Purchase Money', 'Paid/Due', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-main)' }}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} style={{ padding: '14px 16px' }}>
                        <div style={{ height: '14px', borderRadius: '6px', background: 'var(--surface-hover)', opacity: 0.7 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4, display: 'block', marginBottom: '8px' }}>shopping_bag</span>
                    No purchases found. Click "New Purchase" to add one.
                  </td>
                </tr>
              ) : (
                purchases.map(p => (
                  <tr key={p.id}>
                    {/* Data mapping will go here */}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
