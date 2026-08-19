"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SalesOrderItems } from './SalesOrderItems';
import { QuotationTotals } from '../../quotations/components/QuotationTotals'; // Reuse totals component

export function SalesOrderForm({ initialData = {} as any, isEdit = false }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customerId: initialData.customerId || '',
    quotationId: initialData.quotationId || '',
    orderDate: initialData.orderDate ? new Date(initialData.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    expectedDelivery: initialData.expectedDelivery ? new Date(initialData.expectedDelivery).toISOString().split('T')[0] : '',
    status: initialData.status || 'Confirmed',
    notes: initialData.notes || ''
  });

  const [items, setItems] = useState<any[]>(initialData.items || [
    { id: '1', description: '', quantity: 1, unitPrice: 0, discount: 0, total: 0 }
  ]);

  const [taxRate, setTaxRate] = useState(15); 
  const [globalDiscount, setGlobalDiscount] = useState(0);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch('/api/crm/customers?take=100');
        if (res.ok) {
          const data = await res.json();
          setCustomers(data.data || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCustomers();
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const itemDiscounts = items.reduce((sum, item) => sum + Number(item.discount), 0);
  const totalDiscount = itemDiscounts + globalDiscount;
  const taxableAmount = Math.max(0, subtotal - globalDiscount);
  const totalTax = (taxableAmount * taxRate) / 100;
  const grandTotal = taxableAmount + totalTax;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isEdit ? `/api/crm/sales-orders/${initialData.id}` : '/api/crm/sales-orders';
      const method = isEdit ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: formData.customerId,
          quotationId: formData.quotationId || undefined,
          orderDate: formData.orderDate,
          requestedDeliveryDate: formData.expectedDelivery || undefined,
          status: formData.status,
          notes: formData.notes,
          discountAmount: globalDiscount,
          taxRate: taxRate,
          lines: items.map(item => ({
            productId: item.productId || 'dummy',
            warehouseId: item.warehouseId || 'dummy',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountAmount: item.discount,
            remarks: item.description
          }))
        })
      });
      if (res.ok) {
        alert(`Sales Order ${isEdit ? 'updated' : 'created'} successfully!`);
        router.push(isEdit ? `/erp/crm/sales-orders/${initialData.id}` : '/erp/crm/sales-orders');
      } else {
        const error = await res.json();
        alert(`Failed to save order: ${error.error}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-main)',
    background: 'var(--bg-main)', fontSize: '14px', color: 'var(--text-main)', outline: 'none'
  };

  const labelStyle = {
    display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' as any
  };

  return (
    <div className="glass-card" style={{ padding: '32px', borderRadius: '12px' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Header Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Customer *</label>
            <select name="customerId" required value={formData.customerId} onChange={handleChange} style={inputStyle}>
              <option value="">Select Customer...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Link to Quotation</label>
            <select name="quotationId" value={formData.quotationId} onChange={handleChange} style={inputStyle}>
              <option value="">Select Quotation (Optional)...</option>
              <option value="qt_1">QT-2026-001</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Order Date *</label>
            <input type="date" name="orderDate" required value={formData.orderDate} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Expected Delivery Date</label>
            <input type="date" name="expectedDelivery" value={formData.expectedDelivery} onChange={handleChange} style={inputStyle} />
          </div>
          {isEdit && (
            <div>
              <label style={labelStyle}>Status</label>
              <select name="status" value={formData.status} onChange={handleChange} style={inputStyle}>
                <option value="Confirmed">Confirmed</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          )}
        </div>

        {/* Line Items Section */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>Line Items</h3>
          <SalesOrderItems items={items} onItemsChange={setItems} />
        </div>

        {/* Totals Section */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', gap: '32px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '200px' }}>
            <div>
              <label style={labelStyle}>Global Discount (Amount)</label>
              <input type="number" value={globalDiscount} onChange={e => setGlobalDiscount(Number(e.target.value))} style={inputStyle} min="0" />
            </div>
            <div>
              <label style={labelStyle}>Tax Rate (%)</label>
              <input type="number" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} style={inputStyle} min="0" max="100" />
            </div>
          </div>
          
          <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', background: 'var(--surface-main)' }}>
            <QuotationTotals subtotal={subtotal} totalDiscount={totalDiscount} totalTax={totalTax} grandTotal={grandTotal} />
          </div>
        </div>

        {/* Notes */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>Additional Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Private Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}></textarea>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
          <button 
            type="button" 
            onClick={() => router.back()}
            style={{ padding: '10px 20px', background: 'var(--surface-hover)', color: 'var(--text-main)', border: '1px solid var(--border-main)', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading}
            style={{ padding: '10px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Saving...' : (isEdit ? 'Update Order' : 'Create Order')}
          </button>
        </div>
      </form>
    </div>
  );
}
