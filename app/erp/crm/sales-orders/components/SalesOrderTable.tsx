"use client";

import React from 'react';
import Link from 'next/link';
import { SalesOrderStatus } from './SalesOrderStatus';

interface SalesOrderTableProps {
  orders: any[];
  onDelete?: (id: string) => void;
}

export function SalesOrderTable({ orders, onDelete }: SalesOrderTableProps) {
  return (
    <div className="glass-card" style={{ overflowX: 'auto', borderRadius: '12px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
            <th style={{ padding: '16px 24px', fontWeight: 600 }}>Order No</th>
            <th style={{ padding: '16px 24px', fontWeight: 600 }}>Customer</th>
            <th style={{ padding: '16px 24px', fontWeight: 600 }}>Date</th>
            <th style={{ padding: '16px 24px', fontWeight: 600 }}>Amount</th>
            <th style={{ padding: '16px 24px', fontWeight: 600 }}>Status</th>
            <th style={{ padding: '16px 24px', fontWeight: 600 }}>Payment</th>
            <th style={{ padding: '16px 24px', fontWeight: 600 }}>Shipment</th>
            <th style={{ padding: '16px 24px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '14px' }}>
          {orders.map((order) => (
            <tr 
              key={order.id} 
              style={{ borderBottom: '1px solid var(--border-light)', transition: 'background var(--transition-fast)', cursor: 'pointer' }} 
              className="hover-row"
              onClick={() => window.location.href = `/erp/crm/sales-orders/${order.id}`}
            >
              <td style={{ padding: '16px 24px' }}>
                <Link href={`/erp/crm/sales-orders/${order.id}`} style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>
                  {order.orderNo || order.id.substring(0, 8)}
                </Link>
              </td>
              <td style={{ padding: '16px 24px', color: 'var(--text-main)', fontWeight: 500 }}>
                {order.customer?.customerName || '-'}
              </td>
              <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>
                {new Date(order.orderDate || order.createdAt).toLocaleDateString()}
              </td>
              <td style={{ padding: '16px 24px', fontWeight: 600 }}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'BDT', maximumFractionDigits: 0 }).format(order.grandTotal || order.totalAmount || 0)}
              </td>
              <td style={{ padding: '16px 24px' }}>
                <SalesOrderStatus status={order.status} />
              </td>
              <td style={{ padding: '16px 24px' }}>
                <span style={{
                  padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                  background: order.paymentStatus === 'Paid' ? 'var(--success-glow)' : order.paymentStatus === 'Partial' ? 'var(--info-glow)' : 'var(--warning-glow)',
                  color: order.paymentStatus === 'Paid' ? 'var(--success)' : order.paymentStatus === 'Partial' ? 'var(--info)' : 'var(--warning)'
                }}>
                  {order.paymentStatus || 'Unpaid'}
                </span>
              </td>
              <td style={{ padding: '16px 24px' }}>
                <span style={{
                  padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                  background: order.status === 'DELIVERED' ? 'var(--success-glow)' : 'var(--info-glow)',
                  color: order.status === 'DELIVERED' ? 'var(--success)' : 'var(--info)'
                }}>
                  {order.status === 'DELIVERED' ? 'Delivered' : order.status === 'PARTIALLY_DELIVERED' ? 'Partial' : 'Pending'}
                </span>
              </td>
              <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <Link href={`/erp/crm/sales-orders/${order.id}/edit`}>
                    <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} title="Edit">
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit</span>
                    </button>
                  </Link>
                  <button onClick={() => onDelete && onDelete(order.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)' }} title="Delete">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <style dangerouslySetInnerHTML={{__html: `
        .hover-row:hover { background: var(--surface-hover); }
      `}} />
    </div>
  );
}
