"use client";

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';

export default function SaaSSuperAdminPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/companies');
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch companies');
      }
      const data = await res.json();
      setCompanies(data.companies || []);
    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message}. Ensure you are logged in as a SUPER_ADMIN.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleUpdateStatus = async (companyId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/system/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      
      setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, status: newStatus } : c));
    } catch (error) {
      console.error(error);
      alert('Failed to update company status');
    }
  };

  return (
    <PageContainer>
      <PageHeader 
        title="SaaS Super Admin" 
        description="Global control panel for multi-tenant SaaS management, billing, and system health."
      />
      <div className="glass-card" style={{ padding: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Registered Companies</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={fetchCompanies}>
              <span className="material-symbols-outlined">refresh</span> Refresh
            </button>
          </div>
        </div>
        
        <div className="table-responsive">
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '12px', fontWeight: 600 }}>Company ID</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>Created At</th>
                <th style={{ padding: '12px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading records...</td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5 }}>admin_panel_settings</span>
                      <p style={{ margin: 0 }}>No saas super admin records found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr key={company.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {company.id.split('-')[0]}...
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>
                      {company.name}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-main)' }}>
                      {company.businessType}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        fontSize: '12px', padding: '4px 8px', borderRadius: '4px', fontWeight: 600,
                        background: company.status === 'ACTIVE' ? 'var(--success-10)' : 'var(--danger-10)', 
                        color: company.status === 'ACTIVE' ? 'var(--success)' : 'var(--danger)' 
                      }}>
                        {company.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      {new Date(company.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <select 
                        value={company.status}
                        onChange={(e) => handleUpdateStatus(company.id, e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-main)', background: 'var(--surface-main)', color: 'var(--text-main)' }}
                      >
                        <option value="ACTIVE">Set Active</option>
                        <option value="SUSPENDED">Suspend</option>
                        <option value="INACTIVE">Set Inactive</option>
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
