"use client";

import React, { useState, useEffect } from 'react';

export function SalesOrderShipment({ order, onRefresh }: { order?: any; onRefresh?: () => void }) {
  const [shipments, setShipments] = useState<any[]>(order?.deliveryOrders || []);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    carrier: 'Steadfast Courier',
    trackingNumber: '',
    deliveryDate: new Date().toISOString().slice(0, 10),
    remarks: ''
  });

  const fetchShipments = async () => {
    if (!order?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/sales-orders/${order.id}/deliveries`);
      if (res.ok) {
        const data = await res.json();
        setShipments(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (order?.id) {
      setShipments(order.deliveryOrders || []);
      fetchShipments();
    }
  }, [order?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/crm/sales-orders/${order.id}/deliveries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrier: formData.carrier,
          trackingNumber: formData.trackingNumber,
          deliveryDate: formData.deliveryDate,
          remarks: formData.remarks
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create shipment');
      }

      setShowModal(false);
      await fetchShipments();
      if (onRefresh) onRefresh();
      alert('Shipment created and processed successfully!');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error creating shipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Shipments & Deliveries</h4>
        <button 
          onClick={() => setShowModal(true)}
          style={{ 
            padding: '6px 12px', 
            background: 'var(--primary-glow)', 
            color: 'var(--primary)', 
            borderRadius: '6px', 
            fontSize: '12px', 
            fontWeight: 600, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            border: '1px solid var(--primary)',
            cursor: 'pointer' 
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>local_shipping</span>
          Create Shipment
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading shipments...</div>
      ) : (
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
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No shipments found for this order. Click "Create Shipment" to dispatch goods.
                </td>
              </tr>
            )}
            {shipments.map((shp: any) => (
              <tr key={shp.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '12px', fontWeight: 600 }}>{shp.deliveryNumber || shp.deliveryOrderNumber || shp.id.substring(0, 8)}</td>
                <td style={{ padding: '12px' }}>{new Date(shp.deliveryDate || shp.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '12px' }}>{shp.carrier || 'N/A'}</td>
                <td style={{ padding: '12px', color: 'var(--primary)', fontWeight: 500 }}>{shp.trackingNumber || 'N/A'}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                    background: shp.status === 'DELIVERED' || shp.status === 'SHIPPED' ? 'var(--success-glow)' : 'var(--info-glow)',
                    color: shp.status === 'DELIVERED' || shp.status === 'SHIPPED' ? 'var(--success)' : 'var(--info)'
                  }}>
                    {shp.status || 'SHIPPED'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal Dialog for Creating Shipment */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ background: 'var(--surface-main)', padding: '28px', borderRadius: '12px', width: '100%', maxWidth: '440px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Create New Shipment</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Courier / Carrier *</label>
                <select 
                  required 
                  value={formData.carrier} 
                  onChange={e => setFormData({ ...formData, carrier: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }}
                >
                  <option value="Steadfast Courier">Steadfast Courier</option>
                  <option value="Paperfly">Paperfly</option>
                  <option value="RedX">RedX</option>
                  <option value="Pathao Courier">Pathao Courier</option>
                  <option value="DHL Express">DHL Express</option>
                  <option value="FedEx">FedEx</option>
                  <option value="Internal Delivery Team">Internal Delivery Team</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tracking Number</label>
                <input 
                  type="text" 
                  value={formData.trackingNumber} 
                  onChange={e => setFormData({ ...formData, trackingNumber: e.target.value })} 
                  placeholder="e.g. ST-84920419" 
                  style={{ width: '100%', padding: '10px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Delivery Date *</label>
                <input 
                  type="date" 
                  required 
                  value={formData.deliveryDate} 
                  onChange={e => setFormData({ ...formData, deliveryDate: e.target.value })} 
                  style={{ width: '100%', padding: '10px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shipment Remarks / Instructions</label>
                <textarea 
                  value={formData.remarks} 
                  onChange={e => setFormData({ ...formData, remarks: e.target.value })} 
                  placeholder="Fragile items, call customer before delivery..." 
                  style={{ width: '100%', padding: '10px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', borderRadius: '8px', color: 'var(--text-main)', outline: 'none', minHeight: '60px', resize: 'vertical' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border-main)', borderRadius: '8px', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  style={{ flex: 1, padding: '10px', background: 'var(--primary)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
                >
                  {isSubmitting ? 'Dispatching...' : 'Dispatch Shipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
