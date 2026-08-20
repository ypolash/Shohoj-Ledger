"use client";

import React from 'react';

export function SalesOrderShipment({ order }: { order?: any }) {
  const shipments = order?.deliveryOrders || [];

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Shipments & Deliveries</h4>
        <button style={{ padding: '6px 12px', background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: '6px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--primary)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>local_shipping</span>
          Create Shipment
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
            <th style={{ padding: '12px', fontWeight: 600 }}>Shipment #</th>
            <th style={{ padding: '12px', fontWeight: 600 }}>Date</th>
            <th style={{ padding: '12px', fontWeight: 600 }}>Carrier</th>
            <th style={{ padding: '12px', fontWeight: 600 }}>Tracking No</th>
            <th style={{ padding: '12px', fontWeight: 600 }}>Status</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '14px' }}>
          {shipments.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No shipments found for this order.
              </td>
            </tr>
          )}
          {shipments.map((shp: any) => (
            <tr key={shp.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
              <td style={{ padding: '12px', fontWeight: 600 }}>{shp.deliveryOrderNumber || shp.id}</td>
              <td style={{ padding: '12px' }}>{new Date(shp.deliveryDate || shp.createdAt).toLocaleDateString()}</td>
              <td style={{ padding: '12px' }}>{shp.carrier || 'N/A'}</td>
              <td style={{ padding: '12px', color: 'var(--primary)', fontWeight: 500 }}>{shp.trackingNumber || 'N/A'}</td>
              <td style={{ padding: '12px' }}>
                <span style={{
                  padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                  background: shp.status === 'DELIVERED' ? 'var(--success-glow)' : 'var(--info-glow)',
                  color: shp.status === 'DELIVERED' ? 'var(--success)' : 'var(--info)'
                }}>
                  {shp.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
