"use client";

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const [maxUsers, setMaxUsers] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/plans');
      if (!res.ok) throw new Error('Failed to fetch plans');
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error(error);
      alert('Failed to load plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleUpdateStatus = async (planId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/system/plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      setPlans(prev => prev.map(p => p.id === planId ? { ...p, status: newStatus } : p));
    } catch (error) {
      console.error(error);
      alert('Failed to update plan status');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/system/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price, billingCycle, maxUsers })
      });
      if (!res.ok) throw new Error('Failed to create plan');
      setShowModal(false);
      fetchPlans();
    } catch (error) {
      console.error(error);
      alert('Failed to create plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Subscription Plans" 
        description="Configure pricing tiers and subscription offerings for your SaaS."
      />
      <div className="glass-card" style={{ padding: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Available Plans</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={fetchPlans}>
              <span className="material-symbols-outlined">refresh</span> Refresh
            </button>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <span className="material-symbols-outlined">add</span> Create New Plan
            </button>
          </div>
        </div>
        
        <div className="table-responsive">
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '12px', fontWeight: 600 }}>Plan Name</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>Price</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>Billing Cycle</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>Max Users</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading plans...</td>
                </tr>
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5 }}>loyalty</span>
                      <p style={{ margin: 0 }}>No pricing plans created yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                      {plan.name}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-main)' }}>
                      ${plan.price}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-main)' }}>
                      {plan.billingCycle}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-main)' }}>
                      {plan.maxUsers || 'Unlimited'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        fontSize: '12px', padding: '4px 8px', borderRadius: '4px', fontWeight: 600,
                        background: plan.status === 'ACTIVE' ? 'var(--success-10)' : 'var(--danger-10)', 
                        color: plan.status === 'ACTIVE' ? 'var(--success)' : 'var(--danger)' 
                      }}>
                        {plan.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <select 
                        value={plan.status}
                        onChange={(e) => handleUpdateStatus(plan.id, e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-main)', background: 'var(--surface-main)', color: 'var(--text-main)' }}
                      >
                        <option value="ACTIVE">Set Active</option>
                        <option value="ARCHIVED">Archive</option>
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
            <h3 style={{ marginTop: 0 }}>Create New Plan</h3>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Plan Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-main)', background: 'var(--surface-subtle)', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Price ($)</label>
                <input required type="number" step="0.01" value={price} onChange={e => setPrice(parseFloat(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-main)', background: 'var(--surface-subtle)', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Billing Cycle</label>
                <select value={billingCycle} onChange={e => setBillingCycle(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-main)', background: 'var(--surface-subtle)', color: '#fff' }}>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Max Users</label>
                <input required type="number" value={maxUsers} onChange={e => setMaxUsers(parseInt(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-main)', background: 'var(--surface-subtle)', color: '#fff' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Plan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
