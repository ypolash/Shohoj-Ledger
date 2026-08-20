"use client";

import React, { useState, useEffect } from 'react';

export function CustomerInvoices({ customer }: { customer: any }) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await fetch(`/api/crm/sales-orders?customerId=${customer.id}`);
        if (res.ok) {
          const data = await res.json();
          // Using sales orders as invoices, filtering out cancelled/draft ones maybe?
          setInvoices(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch invoices", err);
      } finally {
        setLoading(false);
      }
    };
    if (customer?.id) fetchInvoices();
  }, [customer?.id]);

  return (
    <div className="glass-card" style={{ overflowX: 'auto', borderRadius: '12px', marginTop: '24px' }}>
      <h4 style={{ margin: '0', padding: '24px', fontSize: '16px', fontWeight: 600, borderBottom: '1px solid var(--border-main)' }}>Invoices</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
            <th style={{ padding: '12px 24px', fontWeight: 600 }}>Invoice #</th>
            <th style={{ padding: '12px 24px', fontWeight: 600 }}>Date</th>
            <th style={{ padding: '12px 24px', fontWeight: 600 }}>Due Date</th>
            <th style={{ padding: '12px 24px', fontWeight: 600 }}>Amount</th>
            <th style={{ padding: '12px 24px', fontWeight: 600 }}>Status</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '14px' }}>
          {loading ? (
            <tr><td colSpan={5} style={{ padding: '16px 24px', textAlign: 'center' }}>Loading...</td></tr>
          ) : invoices.length === 0 ? (
            <tr><td colSpan={5} style={{ padding: '16px 24px', textAlign: 'center' }}>No invoices found</td></tr>
          ) : invoices.map(inv => (
            <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
              <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--primary)' }}>{inv.salesOrderNumber}</td>
              <td style={{ padding: '16px 24px' }}>{new Date(inv.orderDate).toISOString().split('T')[0]}</td>
              <td style={{ padding: '16px 24px' }}>{inv.deliveryDate ? new Date(inv.deliveryDate).toISOString().split('T')[0] : 'N/A'}</td>
              <td style={{ padding: '16px 24px', fontWeight: 600 }}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: inv.currency || 'BDT' }).format(inv.totalAmount)}
              </td>
              <td style={{ padding: '16px 24px' }}>
                <span style={{
                  padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                  background: inv.paymentStatus === 'Paid' ? 'var(--success-glow)' : 'var(--danger-glow)',
                  color: inv.paymentStatus === 'Paid' ? 'var(--success)' : 'var(--danger)',
                }}>{inv.paymentStatus || 'Unpaid'}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
