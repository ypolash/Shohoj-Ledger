"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuotationItems } from './QuotationItems';
import { QuotationTotals } from './QuotationTotals';

export function QuotationForm({ initialData = {} as any, isEdit = false }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerId: initialData.customerId || '',
    opportunityId: initialData.opportunityId || '',
    issueDate: initialData.issueDate ? new Date(initialData.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    expiryDate: initialData.expiryDate ? new Date(initialData.expiryDate).toISOString().split('T')[0] : '',
    terms: initialData.terms || 'Standard payment terms apply (Net 30).',
    status: initialData.status || 'Draft',
    notes: initialData.remarks || initialData.notes || ''
  });

  const defaultItems = initialData.lines ? initialData.lines.map((line: any) => ({
    id: line.id || Math.random().toString(),
    productId: line.productId,
    warehouseId: line.warehouseId,
    description: line.remarks || line.product?.name || '',
    quantity: Number(line.quantity),
    unitPrice: Number(line.unitPrice),
    discount: Number(line.discountAmount) || 0,
    total: Number(line.lineTotal) || 0
  })) : initialData.items;

  const [items, setItems] = useState<any[]>(defaultItems || [
    { id: '1', description: '', quantity: 1, unitPrice: 0, discount: 0, total: 0 }
  ]);

  const [taxRate, setTaxRate] = useState(15); // e.g. 15% VAT
  const [globalDiscount, setGlobalDiscount] = useState(Number(initialData.discountAmount) || 0);

  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);
  const itemDiscounts = items.reduce((sum, item) => sum + Number(item.discount || 0), 0);
  const totalDiscount = itemDiscounts + globalDiscount;
  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const totalTax = (taxableAmount * taxRate) / 100;
  const grandTotal = taxableAmount + totalTax;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const url = isEdit ? `/api/crm/quotations/${initialData.id}` : '/api/crm/quotations';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: formData.customerId,
          opportunityId: formData.opportunityId || undefined,
          quotationDate: formData.issueDate,
          expiryDate: formData.expiryDate || undefined,
          status: formData.status,
          notes: formData.notes,
          terms: formData.terms,
          discountAmount: globalDiscount,
          taxRate: taxRate,
          lines: items.map(item => ({
            productId: item.productId || 'dummy',
            warehouseId: item.warehouseId || 'dummy',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountAmount: item.discount,
            description: item.description
          }))
        })
      });
      if (res.ok) {
        alert(`Quotation ${isEdit ? 'updated' : 'created'} successfully!`);
        router.push(isEdit ? `/erp/crm/quotations/${initialData.id}` : '/erp/crm/quotations');
      } else {
        const error = await res.json();
        alert(`Failed to save quotation: ${error.error}`);
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
              <option value="cust_1">Acme Corporation</option>
              <option value="cust_2">Globex Inc.</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Opportunity</label>
            <select name="opportunityId" value={formData.opportunityId} onChange={handleChange} style={inputStyle}>
              <option value="">Select Opportunity (Optional)...</option>
              <option value="opp_1">Acme Corp 2026 License</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Issue Date *</label>
            <input type="date" name="issueDate" required value={formData.issueDate} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Expiry Date</label>
            <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} style={inputStyle} />
          </div>
          {isEdit && (
            <div>
              <label style={labelStyle}>Status</label>
              <select name="status" value={formData.status} onChange={handleChange} style={inputStyle}>
                <option value="DRAFT">Draft</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="SENT">Sent</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          )}
        </div>

        {/* Line Items Section */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>Line Items</h3>
          <QuotationItems items={items} onItemsChange={setItems} />
        </div>

        {/* Totals Section */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', gap: '32px', flexWrap: 'wrap' }}>
          {/* Tax & Discount Inputs */}
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

        {/* Terms & Notes */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>Additional Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Terms & Conditions</label>
              <textarea name="terms" value={formData.terms} onChange={handleChange} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}></textarea>
            </div>
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
            {loading ? 'Saving...' : (isEdit ? 'Update Quotation' : 'Create Quotation')}
          </button>
        </div>
      </form>
    </div>
  );
}
