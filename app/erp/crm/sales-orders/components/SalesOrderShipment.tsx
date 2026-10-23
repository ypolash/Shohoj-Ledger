"use client";

import React, { useState, useEffect } from 'react';

export function SalesOrderShipment({ order, onRefresh }: { order?: any; onRefresh?: () => void }) {
  const [shipments, setShipments] = useState<any[]>(order?.deliveryOrders || []);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Line items state to track items & quantities being shipped
  const [shipmentLines, setShipmentLines] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    carrier: 'Standard Delivery',
    trackingNumber: '',
    deliveryDate: new Date().toISOString().slice(0, 10),
    remarks: ''
  });

  // Initialize shipment lines from order lines whenever modal opens or order changes
  useEffect(() => {
    if (order?.lines && order.lines.length > 0) {
      setShipmentLines(
        order.lines.map((line: any) => ({
          salesOrderLineId: line.id,
          productId: line.productId,
          itemName: line.description || line.product?.name || line.name || 'ht',
          orderedQty: Number(line.quantity || 1),
          shipQty: Number(line.quantity || 1),
          unitPrice: Number(line.unitPrice || line.price || 0),
          totalAmount: Number(line.totalAmount || line.total || (Number(line.quantity || 1) * Number(line.unitPrice || 0)))
        }))
      );
    } else if (order?.items && order.items.length > 0) {
      setShipmentLines(
        order.items.map((line: any) => ({
          salesOrderLineId: line.id,
          productId: line.productId || 'dummy',
          itemName: line.description || line.name || 'ht',
          orderedQty: Number(line.quantity || 1),
          shipQty: Number(line.quantity || 1),
          unitPrice: Number(line.unitPrice || line.price || 0),
          totalAmount: Number(line.total || 0)
        }))
      );
    }
  }, [order?.lines, order?.items, showModal]);

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

  const handleQtyChange = (index: number, val: number | string) => {
    const updated = [...shipmentLines];
    updated[index].shipQty = val === '' ? ('' as any) : Math.max(0, Number(val));
    setShipmentLines(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Filter lines that have shipQty > 0
    const linesToShip = shipmentLines
      .filter((l) => Number(l.shipQty) > 0)
      .map((l) => ({
        salesOrderLineId: l.salesOrderLineId,
        productId: l.productId,
        quantity: Number(l.shipQty),
        remarks: l.itemName
      }));

    if (linesToShip.length === 0) {
      alert('Please specify at least 1 item quantity to ship.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/crm/sales-orders/${order.id}/deliveries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrier: formData.carrier,
          trackingNumber: formData.trackingNumber,
          deliveryDate: formData.deliveryDate,
          remarks: formData.remarks,
          lines: linesToShip
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create shipment');
      }

      setShowModal(false);
      await fetchShipments();
      if (onRefresh) onRefresh();
      alert('Shipment created and dispatched successfully!');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error creating shipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ borderRadius: '0px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>Shipments & Deliveries</h4>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            Fulfill and track items dispatched for Order #{order?.orderNumber || order?.id?.substring(0, 8)}
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          style={{ 
            padding: '8px 16px', 
            background: '#10b981', 
            color: '#ffffff', 
            borderRadius: '0px', 
            fontSize: '13px', 
            fontWeight: 700, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            border: 'none',
            cursor: 'pointer' 
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>local_shipping</span>
          Create Shipment
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading shipments...</div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid var(--border-main)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#10b981', color: '#ffffff', borderBottom: '2px solid #059669', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '14px 20px', fontWeight: 800 }}>Shipment #</th>
                <th style={{ padding: '14px 20px', fontWeight: 800 }}>Items Shipped</th>
                <th style={{ padding: '14px 20px', fontWeight: 800 }}>Dispatch Date</th>
                <th style={{ padding: '14px 20px', fontWeight: 800 }}>Delivery Method / Courier</th>
                <th style={{ padding: '14px 20px', fontWeight: 800 }}>Tracking No</th>
                <th style={{ padding: '14px 20px', fontWeight: 800 }}>Status</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '13px' }}>
              {shipments.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No shipments recorded yet for this order. Click "Create Shipment" to dispatch order items.
                  </td>
                </tr>
              )}
              {shipments.map((shp: any) => (
                <tr key={shp.id} style={{ borderBottom: '1px solid var(--border-main)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-main)' }}>{shp.deliveryNumber || shp.deliveryOrderNumber || shp.id.substring(0, 8)}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-main)', fontWeight: 600 }}>
                    {shp.lines && shp.lines.length > 0 
                      ? shp.lines.map((l: any) => `${l.product?.name || l.remarks || 'Item'} (Qty: ${l.quantity})`).join(', ')
                      : `${shipmentLines[0]?.itemName || 'Order Line Item'} (Qty: ${order?.lines?.[0]?.quantity || 1})`
                    }
                  </td>
                  <td style={{ padding: '14px 20px' }}>{new Date(shp.deliveryDate || shp.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '14px 20px' }}>{shp.carrier || 'Standard Delivery'}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--primary)', fontWeight: 600 }}>{shp.trackingNumber || 'N/A'}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '0px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                      background: shp.status === 'DELIVERED' || shp.status === 'SHIPPED' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(6, 182, 212, 0.12)',
                      color: shp.status === 'DELIVERED' || shp.status === 'SHIPPED' ? '#10b981' : '#06b6d4',
                      border: `1px solid ${shp.status === 'DELIVERED' || shp.status === 'SHIPPED' ? '#10b981' : '#06b6d4'}`
                    }}>
                      {shp.status || 'SHIPPED'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Dialog for Creating Shipment with Item Selection */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface-card)', padding: '28px', borderRadius: '0px', border: '1px solid var(--border-main)', width: '100%', maxWidth: '640px', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-main)', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>Create New Shipment</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Select items and quantities to include in this delivery</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Order Items Section */}
              <div>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '11px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  📦 Items Being Shipped
                </label>
                
                {shipmentLines.length === 0 ? (
                  <div style={{ padding: '16px', background: 'var(--surface-hover)', borderRadius: '0px', border: '1px solid var(--border-main)', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                    No specific items found in order. Full order will be marked as shipped.
                  </div>
                ) : (
                  <div style={{ border: '1px solid var(--border-main)', borderRadius: '0px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#10b981', color: '#ffffff', textTransform: 'uppercase', fontSize: '11px', fontWeight: 800 }}>
                          <th style={{ padding: '10px 14px', textAlign: 'left' }}>Item & Description</th>
                          <th style={{ padding: '10px 14px', textAlign: 'center' }}>Ordered Qty</th>
                          <th style={{ padding: '10px 14px', textAlign: 'center', width: '110px' }}>Ship Qty</th>
                          <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shipmentLines.map((line, idx) => (
                          <tr key={idx} style={{ borderTop: idx > 0 ? '1px solid var(--border-main)' : 'none' }}>
                            <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-main)' }}>
                              {line.itemName}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-muted)' }}>
                              {line.orderedQty}
                            </td>
                            <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                              <input 
                                type="number" 
                                min="0" 
                                max={line.orderedQty} 
                                value={line.shipQty} 
                                onChange={(e) => handleQtyChange(idx, e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0)}
                                style={{ width: '64px', padding: '6px', textAlign: 'center', background: 'var(--surface-main)', border: '1px solid var(--border-main)', borderRadius: '0px', color: 'var(--text-main)', fontWeight: 700, outline: 'none', MozAppearance: 'textfield', appearance: 'textfield' }}
                              />
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>
                              BDT {line.totalAmount ? line.totalAmount.toLocaleString() : '0.00'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Delivery Details Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Delivery Method / Courier</label>
                  <input 
                    type="text" 
                    value={formData.carrier} 
                    onChange={e => setFormData({ ...formData, carrier: e.target.value })} 
                    placeholder="e.g. Handover, Steadfast, RedX..." 
                    style={{ width: '100%', padding: '10px', background: 'var(--surface-main)', border: '1px solid var(--border-main)', borderRadius: '0px', color: 'var(--text-main)', outline: 'none', fontSize: '13px' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tracking / Reference No (Optional)</label>
                  <input 
                    type="text" 
                    value={formData.trackingNumber} 
                    onChange={e => setFormData({ ...formData, trackingNumber: e.target.value })} 
                    placeholder="e.g. TRK-981240" 
                    style={{ width: '100%', padding: '10px', background: 'var(--surface-main)', border: '1px solid var(--border-main)', borderRadius: '0px', color: 'var(--text-main)', outline: 'none', fontSize: '13px' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dispatch Date *</label>
                  <input 
                    type="date" 
                    required 
                    value={formData.deliveryDate} 
                    onChange={e => setFormData({ ...formData, deliveryDate: e.target.value })} 
                    style={{ width: '100%', padding: '10px', background: 'var(--surface-main)', border: '1px solid var(--border-main)', borderRadius: '0px', color: 'var(--text-main)', outline: 'none', fontSize: '13px' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Remarks / Delivery Notes</label>
                  <input 
                    type="text" 
                    value={formData.remarks} 
                    onChange={e => setFormData({ ...formData, remarks: e.target.value })} 
                    placeholder="Delivery instructions..." 
                    style={{ width: '100%', padding: '10px', background: 'var(--surface-main)', border: '1px solid var(--border-main)', borderRadius: '0px', color: 'var(--text-main)', outline: 'none', fontSize: '13px' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid var(--border-main)', borderRadius: '0px', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  style={{ flex: 1, padding: '11px', background: '#10b981', border: 'none', borderRadius: '0px', color: '#fff', fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>local_shipping</span>
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
