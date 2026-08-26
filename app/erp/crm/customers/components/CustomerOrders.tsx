"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function CustomerOrders({ customer }: { customer?: any }) {
  const router = useRouter();
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
    return <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', textAlign: 'center' }}>Loading Orders...</div>;
  }

  return (
    <div className="glass-card" style={{ overflowX: 'auto', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-main)' }}>
        <h4 style={{ margin: '0', fontSize: '16px', fontWeight: 600 }}>Sales Orders ({orders.length})</h4>
        {customer?.id && (
          <button 
            onClick={() => router.push(`/erp/crm/sales-orders/new?customerId=${customer.id}`)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 12px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add_shopping_cart</span>
            + New Order for {customer.displayName || customer.name || 'Customer'}
          </button>
        )}
      </div>
      
      {orders.length === 0 ? (
        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px', opacity: 0.5, display: 'block', marginBottom: '8px' }}>receipt_long</span>
          No sales orders found for this customer. Click the button above to create one.
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 24px', fontWeight: 600 }}>Order ID</th>
              <th style={{ padding: '12px 24px', fontWeight: 600 }}>Date</th>
              <th style={{ padding: '12px 24px', fontWeight: 600 }}>Items</th>
              <th style={{ padding: '12px 24px', fontWeight: 600 }}>Total Amount</th>
              <th style={{ padding: '12px 24px', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '12px 24px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '14px' }}>
            {orders.map(order => (
              <tr 
                key={order.id} 
                onClick={() => router.push(`/erp/crm/sales-orders/${order.id}`)}
                style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--primary)' }}>
                  {order.salesOrderNumber || order.orderNumber || order.id.slice(0,8)}
                </td>
                <td style={{ padding: '16px 24px' }}>{new Date(order.orderDate || order.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>
                  {order.lines?.length || order.items?.length || 1} item(s)
                </td>
                <td style={{ padding: '16px 24px', fontWeight: 600 }}>
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'BDT' }).format(Number(order.grandTotal || order.total || 0))}
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{
                    padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                    background: order.status === 'Completed' || order.status === 'Shipped' || order.status === 'DELIVERED' ? 'var(--success-glow)' : 'var(--warning-glow)',
                    color: order.status === 'Completed' || order.status === 'Shipped' || order.status === 'DELIVERED' ? 'var(--success)' : 'var(--warning)',
                  }}>{order.status}</span>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); router.push(`/erp/crm/sales-orders/${order.id}`); }}
                    style={{ padding: '6px 12px', color: 'var(--primary)', borderRadius: '6px', background: 'var(--primary-glow)', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
