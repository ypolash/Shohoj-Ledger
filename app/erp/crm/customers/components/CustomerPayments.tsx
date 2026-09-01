"use client";

import React, { useState, useEffect } from 'react';

export function CustomerPayments({ customer }: { customer: any }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await fetch(`/api/crm/customer-payments?customerId=${customer.id}`);
        if (res.ok) {
          const data = await res.json();
          setPayments(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch payments", err);
      } finally {
        setLoading(false);
      }
    };
    if (customer?.id) fetchPayments();
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
          <span className="material-symbols-outlined" style={{ color: 'var(--success)', fontSize: '20px' }}>payments</span>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>Payment & Settlement Receipts</h3>
        </div>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--success)', background: 'var(--success-bg)', padding: '4px 10px', borderRadius: '8px' }}>
          {payments.length} {payments.length === 1 ? 'Receipt' : 'Receipts'}
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '12px 24px', fontWeight: 700 }}>Receipt #</th>
              <th style={{ padding: '12px 24px', fontWeight: 700 }}>Payment Date</th>
              <th style={{ padding: '12px 24px', fontWeight: 700 }}>Payment Method</th>
              <th style={{ padding: '12px 24px', fontWeight: 700 }}>Amount Received</th>
              <th style={{ padding: '12px 24px', fontWeight: 700 }}>Status</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '13px' }}>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading Payments...
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '36px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>
                    credit_card
                  </span>
                  No payment transactions recorded for this customer.
                </td>
              </tr>
            ) : payments.map(pay => (
              <tr key={pay.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '14px 24px', fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace' }}>
                  {pay.paymentNumber}
                </td>
                <td style={{ padding: '14px 24px', color: 'var(--text-muted)' }}>
                  {new Date(pay.paymentDate).toLocaleDateString()}
                </td>
                <td style={{ padding: '14px 24px', fontWeight: 600 }}>
                  {pay.paymentMethod || 'Bank Transfer'}
                </td>
                <td style={{ padding: '14px 24px', fontWeight: 700, color: 'var(--success)' }}>
                  {formatter.format(Number(pay.amount || 0))}
                </td>
                <td style={{ padding: '14px 24px' }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: pay.status === 'COMPLETED' || pay.status === 'ALLOCATED' ? 'var(--success-bg)' : 'var(--warning-bg)',
                      color: pay.status === 'COMPLETED' || pay.status === 'ALLOCATED' ? 'var(--success-text)' : 'var(--warning-text)',
                      textTransform: 'uppercase'
                    }}
                  >
                    {pay.status}
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
