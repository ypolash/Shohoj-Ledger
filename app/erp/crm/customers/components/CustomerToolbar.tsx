"use client";

import React, { useState } from 'react';
import Link from 'next/link';

interface CustomerToolbarProps {
  onRefresh?: () => void;
  onExport?: () => void;
  onReference?: () => void;
  customers?: any[];
}

export function CustomerToolbar({ onRefresh, onExport, onReference, customers = [] }: CustomerToolbarProps) {
  const [showRefModal, setShowRefModal] = useState(false);

  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      alert("Exporting customer reference list as CSV...");
    }
  };

  const handleReferenceClick = () => {
    if (onReference) {
      onReference();
    } else {
      setShowRefModal(true);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Export Button */}
        <button 
          onClick={handleExport}
          style={{
            padding: '10px 16px',
            background: 'var(--surface-main)',
            border: '1px solid var(--border-main)',
            borderRadius: '8px',
            color: 'var(--text-main)',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
          Export
        </button>

        {/* Reference Button - Positioned Beside Export */}
        <button 
          onClick={handleReferenceClick}
          style={{
            padding: '10px 16px',
            background: 'var(--surface-main)',
            border: '1px solid var(--border-main)',
            borderRadius: '8px',
            color: 'var(--text-main)',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>badge</span>
          Reference
        </button>

        {/* Refresh Button */}
        <button 
          onClick={onRefresh}
          title="Refresh List"
          style={{
            padding: '10px 16px',
            background: 'var(--surface-main)',
            border: '1px solid var(--border-main)',
            borderRadius: '8px',
            color: 'var(--text-main)',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
        </button>

        {/* New Customer Button */}
        <Link href="/erp/crm/customers/new" style={{ textDecoration: 'none' }}>
          <button style={{
            padding: '10px 20px',
            background: 'var(--primary)',
            border: '1px solid var(--primary-700)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
            New Customer
          </button>
        </Link>
      </div>

      {/* Customer Reference Modal */}
      {showRefModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ background: 'var(--surface-main)', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '520px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>badge</span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Customer References</h3>
              </div>
              <button onClick={() => setShowRefModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Reference codes, tax IDs, and referral tracking details linked to active customers.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
              {customers.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', background: 'var(--surface-hover)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  No customer references recorded yet.
                </div>
              ) : (
                customers.map((c: any) => (
                  <div key={c.id} style={{ padding: '12px', background: 'var(--surface-hover)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{c.name || c.companyName || 'Customer'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Ref ID: <span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600 }}>{c.customerNumber || c.code || `#CUST-${c.id?.substring(0, 8)}`}</span></div>
                    </div>
                    <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'var(--primary-glow)', color: 'var(--primary)', fontWeight: 600 }}>
                      {c.source || c.group?.name || 'Direct Reference'}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRefModal(false)} style={{ padding: '8px 18px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
