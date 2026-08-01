"use client";

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/subscriptions');
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch subscriptions');
      }
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message}. Ensure you are logged in as a SUPER_ADMIN.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleUpdateStatus = async (subscriptionId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/system/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      setSubscriptions(prev => prev.map(s => s.id === subscriptionId ? { ...s, status: newStatus } : s));
    } catch (error) {
      console.error(error);
      alert('Failed to update subscription status');
    }
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Active Subscriptions" 
        description="Monitor and manage all active tenant subscriptions, statuses, and renewals."
      />
      <div className="glass-card" style={{ padding: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Tenant Subscriptions</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={fetchSubscriptions}>
              <span className="material-symbols-outlined">refresh</span> Refresh
            </button>
          </div>
        </div>
        
        <div className="table-responsive">
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '12px', fontWeight: 600 }}>Company</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>Plan</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>Current Period Start</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>Current Period End</th>
                <th style={{ padding: '12px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading subscriptions...</td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5 }}>receipt_long</span>
                      <p style={{ margin: 0 }}>No active subscriptions found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                      {sub.company?.name || 'Unknown Company'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-main)' }}>
                      {sub.plan?.name || 'Unknown Plan'} (${sub.plan?.price})
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        fontSize: '12px', padding: '4px 8px', borderRadius: '4px', fontWeight: 600,
                        background: sub.status === 'ACTIVE' ? 'var(--success-10)' : 'var(--danger-10)', 
                        color: sub.status === 'ACTIVE' ? 'var(--success)' : 'var(--danger)' 
                      }}>
                        {sub.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      {new Date(sub.currentPeriodStart).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <select 
                        value={sub.status}
                        onChange={(e) => handleUpdateStatus(sub.id, e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-main)', background: 'var(--surface-main)', color: 'var(--text-main)' }}
                      >
                        <option value="ACTIVE">Set Active</option>
                        <option value="CANCELED">Cancel</option>
                        <option value="PAST_DUE">Mark Past Due</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
