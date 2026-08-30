"use client";

import React, { useState } from 'react';
import { Drawer } from '@/components/ui/Drawer/Drawer';

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<'due' | 'paid'>('due');
  const [payments, setPayments] = useState<any[]>([]); // Placeholder for actual data
  const [isLoading, setIsLoading] = useState(false);
  
  // Drawer state for updating payments
  const [selectedDueItem, setSelectedDueItem] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');

  const handleUpdatePayment = () => {
    alert(`Processing payment of ৳${paymentAmount} for invoice ${selectedDueItem?.invoiceNumber}`);
    setSelectedDueItem(null);
    setPaymentAmount('');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Payments</h1>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-main)' }}>
        <button
          onClick={() => setActiveTab('due')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'due' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'due' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'due' ? 600 : 500,
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}
        >
          Due Purchases
        </button>
        <button
          onClick={() => setActiveTab('paid')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'paid' ? '2px solid var(--success)' : '2px solid transparent',
            color: activeTab === 'paid' ? 'var(--success)' : 'var(--text-muted)',
            fontWeight: activeTab === 'paid' ? 600 : 500,
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}
        >
          Paid Purchases
        </button>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
                {['Invoice Number', 'Company Name', 'Date', 'Total Amount', activeTab === 'due' ? 'Due Balance' : 'Paid Amount'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-main)' }}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} style={{ padding: '14px 16px' }}>
                        <div style={{ height: '14px', borderRadius: '6px', background: 'var(--surface-hover)', opacity: 0.7 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4, display: 'block', marginBottom: '8px' }}>payments</span>
                    No {activeTab} payments found.
                  </td>
                </tr>
              ) : (
                payments.map(p => (
                  <tr 
                    key={p.id} 
                    style={{ borderBottom: '1px solid var(--border-main)', cursor: activeTab === 'due' ? 'pointer' : 'default', transition: 'background 0.2s' }}
                    onClick={() => activeTab === 'due' && setSelectedDueItem(p)}
                    onMouseEnter={e => activeTab === 'due' && (e.currentTarget.style.background = 'var(--surface-hover)')}
                    onMouseLeave={e => activeTab === 'due' && (e.currentTarget.style.background = '')}
                  >
                    {/* Data mapping will go here */}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Update Drawer */}
      <Drawer
        isOpen={!!selectedDueItem}
        onClose={() => setSelectedDueItem(null)}
        position="right"
        size="md"
        title="Update Payment"
      >
        {selectedDueItem && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'var(--surface-hover)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-main)' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-muted)' }}>Invoice Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Invoice Number</div>
                  <div style={{ fontWeight: 600 }}>{selectedDueItem.invoiceNumber || 'INV-0000'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Company Name</div>
                  <div style={{ fontWeight: 600 }}>{selectedDueItem.companyName || 'Unknown Company'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Amount</div>
                  <div style={{ fontWeight: 600 }}>৳{selectedDueItem.totalAmount || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Due Balance</div>
                  <div style={{ fontWeight: 600, color: 'var(--warning)' }}>৳{selectedDueItem.dueBalance || 0}</div>
                </div>
              </div>
            </div>

            <div>
              <label className="label">Enter Paid Amount (৳)</label>
              <input
                type="number"
                className="input"
                placeholder="0.00"
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                style={{ fontSize: '18px', padding: '12px 16px' }}
              />
            </div>

            <button 
              className="btn btn-primary" 
              onClick={handleUpdatePayment}
              disabled={!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0}
              style={{ width: '100%', padding: '12px', fontSize: '15px' }}
            >
              Update Payment
            </button>
          </div>
        )}
      </Drawer>
    </div>
  );
}
