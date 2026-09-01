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

  const formatter = new Intl.NumberFormat('en-BD', { style: 'currency', currency: customer.currency || 'BDT' });

  return (
    <div
      style={{
        background: 'var(--surface-main)',
        border: '1px solid var(--border-main)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>receipt_long</span>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>Customer Invoices & Billing Records</h3>
        </div>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-glow)', padding: '4px 10px', borderRadius: '8px' }}>
          {invoices.length} {invoices.length === 1 ? 'Invoice' : 'Invoices'}
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '12px 24px', fontWeight: 700 }}>Invoice / Order #</th>
              <th style={{ padding: '12px 24px', fontWeight: 700 }}>Issue Date</th>
              <th style={{ padding: '12px 24px', fontWeight: 700 }}>Due Date</th>
              <th style={{ padding: '12px 24px', fontWeight: 700 }}>Total Amount</th>
              <th style={{ padding: '12px 24px', fontWeight: 700 }}>Payment Status</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '13px' }}>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading Invoices...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '36px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>
                    receipt
                  </span>
                  No invoice records found for this customer.
                </td>
              </tr>
            ) : invoices.map(inv => (
              <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '14px 24px', fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace' }}>
                  {inv.salesOrderNumber}
                </td>
                <td style={{ padding: '14px 24px', color: 'var(--text-muted)' }}>
                  {new Date(inv.orderDate).toLocaleDateString()}
                </td>
                <td style={{ padding: '14px 24px', color: 'var(--text-muted)' }}>
                  {inv.deliveryDate ? new Date(inv.deliveryDate).toLocaleDateString() : '—'}
                </td>
                <td style={{ padding: '14px 24px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {formatter.format(Number(inv.totalAmount || 0))}
                </td>
                <td style={{ padding: '14px 24px' }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: inv.paymentStatus === 'Paid' ? 'var(--success-bg)' : 'var(--warning-bg)',
                      color: inv.paymentStatus === 'Paid' ? 'var(--success-text)' : 'var(--warning-text)',
                      textTransform: 'uppercase'
                    }}
                  >
                    {inv.paymentStatus || 'Unpaid'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
