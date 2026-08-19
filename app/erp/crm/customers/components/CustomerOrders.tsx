"use client";

import React, { useState, useEffect } from 'react';

export function CustomerOrders({ customer }: { customer?: any }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!customer?.id) return;
      try {
        const res = await fetch(`/api/crm/sales-orders?customerId=${customer.id}`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [customer?.id]);

  if (loading) {
    return <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', marginTop: '24px', textAlign: 'center' }}>Loading Orders...</div>;
  }

  return (
    <div className="glass-card" style={{ overflowX: 'auto', borderRadius: '12px', marginTop: '24px' }}>
      <h4 style={{ margin: '0', padding: '24px', fontSize: '16px', fontWeight: 600, borderBottom: '1px solid var(--border-main)' }}>Sales Orders</h4>
      
      {orders.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No recent sales orders found for this customer.
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 24px', fontWeight: 600 }}>Order ID</th>
              <th style={{ padding: '12px 24px', fontWeight: 600 }}>Date</th>
              <th style={{ padding: '12px 24px', fontWeight: 600 }}>Amount</th>
              <th style={{ padding: '12px 24px', fontWeight: 600 }}>Status</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '14px' }}>
            {orders.map(order => (
              <tr key={order.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--primary)' }}>{order.salesOrderNumber || order.id.slice(0,8)}</td>
                <td style={{ padding: '16px 24px' }}>{new Date(order.orderDate || order.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '16px 24px', fontWeight: 600 }}>
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'BDT' }).format(order.grandTotal || 0)}
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{
                    padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                    background: order.status === 'Completed' || order.status === 'Shipped' ? 'var(--success-glow)' : 'var(--warning-glow)',
                    color: order.status === 'Completed' || order.status === 'Shipped' ? 'var(--success)' : 'var(--warning)',
                  }}>{order.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
