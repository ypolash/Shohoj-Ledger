"use client";

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';

export default function BillingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [companyId, setCompanyId] = useState('');
  const [amount, setAmount] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/billing');
      if (!res.ok) throw new Error('Failed to fetch billing data');
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (error) {
      console.error(error);
      alert('Failed to load billing records.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/system/companies');
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
        if (data.companies?.length > 0) {
          setCompanyId(data.companies[0].id);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchCompanies();
  }, []);

  const handleUpdateStatus = async (invoiceId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/system/billing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId, status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status: newStatus } : inv));
    } catch (error) {
      console.error(error);
      alert('Failed to update invoice status');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/system/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, amount, dueDate })
      });
      if (!res.ok) throw new Error('Failed to create invoice');
      setShowModal(false);
      fetchInvoices();
    } catch (error) {
      console.error(error);
      alert('Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader 
        title="SaaS Billing & Invoices" 
        description="Monitor and manage all tenant invoices, payments, and overdue accounts."
      />
      <div className="glass-card" style={{ padding: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Tenant Invoices</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={fetchInvoices}>
              <span className="material-symbols-outlined">refresh</span> Refresh
            </button>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <span className="material-symbols-outlined">add</span> Generate Invoice
            </button>
          </div>
        </div>
        
        <div className="table-responsive">
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '12px', fontWeight: 600 }}>Invoice #</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>Tenant / Company</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>Amount</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>Due Date</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading records...</td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5 }}>receipt_long</span>
                      <p style={{ margin: 0 }}>No billing records found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {invoice.invoiceNumber}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                      {invoice.company?.name || 'Unknown Company'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-main)' }}>
                      ${invoice.amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        fontSize: '12px', padding: '4px 8px', borderRadius: '4px', fontWeight: 600,
                        background: invoice.status === 'PAID' ? 'var(--success-10)' : invoice.status === 'OVERDUE' ? 'var(--danger-10)' : 'var(--warning-10)', 
                        color: invoice.status === 'PAID' ? 'var(--success)' : invoice.status === 'OVERDUE' ? 'var(--danger)' : 'var(--warning)' 
                      }}>
                        {invoice.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <select 
                        value={invoice.status}
                        onChange={(e) => handleUpdateStatus(invoice.id, e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-main)', background: 'var(--surface-main)', color: 'var(--text-main)' }}
                      >
                        <option value="UNPAID">Mark Unpaid</option>
                        <option value="PAID">Mark Paid</option>
                        <option value="OVERDUE">Mark Overdue</option>
                        <option value="VOID">Void</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '400px', padding: '24px', position: 'relative' }}>
            <h3 style={{ marginTop: 0 }}>Generate SaaS Invoice</h3>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Tenant (Company)</label>
                <select required value={companyId} onChange={e => setCompanyId(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-main)', background: 'var(--surface-subtle)', color: '#fff' }}>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Amount ($)</label>
                <input required type="number" step="0.01" value={amount} onChange={e => setAmount(parseFloat(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-main)', background: 'var(--surface-subtle)', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Due Date</label>
                <input required type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-main)', background: 'var(--surface-subtle)', color: '#fff' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Generating...' : 'Generate Invoice'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
