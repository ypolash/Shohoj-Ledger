"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function SalesOrderPayments({ order, onRefresh }: { order: any, onRefresh?: () => void }) {
  const router = useRouter();
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const grandTotal = Number(order.totalAmount || 0);
  const amountPaid = allocations.reduce((sum, a) => sum + Number(a.allocatedAmount), 0);
  const balanceDue = grandTotal - amountPaid;

  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'CASH',
    referenceNumber: '',
    paymentDate: new Date().toISOString().slice(0, 10),
  });

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/sales-orders/${order.id}/payments`);
      if (res.ok) {
        const data = await res.json();
        setAllocations(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (order?.id) fetchPayments();
  }, [order?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Create Payment
      const pRes = await fetch('/api/crm/customer-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: order.customerId,
          amount: Number(formData.amount),
          paymentMethod: formData.paymentMethod,
          referenceNumber: formData.referenceNumber,
          paymentDate: new Date(formData.paymentDate).toISOString(),
          currency: order.currency || 'BDT'
        })
      });
      if (!pRes.ok) throw new Error("Failed to create payment");
      const payment = await pRes.json();

      // 2. Post Payment
      const postRes = await fetch(`/api/crm/customer-payments/${payment.id}/post`, { method: 'POST' });
      if (!postRes.ok) throw new Error("Failed to post payment");

      // 3. Allocate Payment to Sales Order
      const aRes = await fetch(`/api/crm/customer-payments/${payment.id}/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceType: 'SALES_ORDER',
          referenceId: order.id,
          amountToAllocate: Number(formData.amount)
        })
      });
      if (!aRes.ok) throw new Error("Failed to allocate payment");

      setShowModal(false);
      fetchPayments();
      // Force page refresh to update KPIs and Status
      if (onRefresh) onRefresh();
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error recording payment. See console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Received Payments</h4>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            Balance Due: {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'BDT', maximumFractionDigits: 0 }).format(balanceDue)}
          </p>
        </div>
        <button 
          onClick={() => {
            setFormData(prev => ({ ...prev, amount: balanceDue.toString() }));
            setShowModal(true);
          }}
          disabled={balanceDue <= 0}
          style={{ padding: '6px 12px', background: balanceDue > 0 ? 'var(--success-glow)' : 'var(--surface-hover)', color: balanceDue > 0 ? 'var(--success)' : 'var(--text-muted)', borderRadius: '6px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', border: balanceDue > 0 ? '1px solid var(--success)' : 'none', cursor: balanceDue > 0 ? 'pointer' : 'not-allowed' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>payments</span>
          {balanceDue > 0 ? 'Record Payment' : 'Fully Paid'}
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading payments...</div>
      ) : allocations.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface-hover)', borderRadius: '8px' }}>
          No payments recorded yet.
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px', fontWeight: 600 }}>Payment #</th>
              <th style={{ padding: '12px', fontWeight: 600 }}>Date</th>
              <th style={{ padding: '12px', fontWeight: 600 }}>Method</th>
              <th style={{ padding: '12px', fontWeight: 600 }}>Allocated</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '14px' }}>
            {allocations.map((alloc) => (
              <tr key={alloc.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '12px', fontWeight: 600 }}>{alloc.customerPayment?.paymentNumber}</td>
                <td style={{ padding: '12px' }}>{new Date(alloc.customerPayment?.paymentDate).toLocaleDateString()}</td>
                <td style={{ padding: '12px' }}>{alloc.customerPayment?.paymentMethod}</td>
                <td style={{ padding: '12px', fontWeight: 600, color: 'var(--success)' }}>
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: alloc.customerPayment?.currency || 'BDT', maximumFractionDigits: 0 }).format(alloc.allocatedAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ background: 'var(--surface-main)', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Record Payment</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Amount</label>
                <input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', borderRadius: '8px', color: 'var(--text-main)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Payment Method</label>
                <select required value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', borderRadius: '8px', color: 'var(--text-main)' }}>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Payment Date</label>
                <input type="date" required value={formData.paymentDate} onChange={e => setFormData({...formData, paymentDate: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', borderRadius: '8px', color: 'var(--text-main)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Reference # (Optional)</label>
                <input type="text" value={formData.referenceNumber} onChange={e => setFormData({...formData, referenceNumber: e.target.value})} placeholder="Check or Txn ID" style={{ width: '100%', padding: '10px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', borderRadius: '8px', color: 'var(--text-main)' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border-main)', borderRadius: '8px', color: 'var(--text-main)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '10px', background: 'var(--primary)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                  {isSubmitting ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
