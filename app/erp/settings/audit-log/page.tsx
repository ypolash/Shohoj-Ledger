"use client";

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { getAuditLogs } from '../actions';

export default function AuditLogPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs();
      setLogs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRefresh = () => {
    fetchLogs();
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Audit Log" 
        description="Review chronological logs of all critical system activities."
      />
      <div className="glass-card" style={{ padding: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>System Activity</h2>
          <button className="btn btn-secondary" onClick={handleRefresh}>
            <span className="material-symbols-outlined">refresh</span> Refresh
          </button>
        </div>
        
        <div className="table-responsive">
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '12px', fontWeight: 600 }}>Timestamp</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>User</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>Action</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>Entity</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading audit logs...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5 }}>history</span>
                      <p style={{ margin: 0 }}>No audit logs found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>
                      {log.user?.name || log.userId}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', background: 'var(--primary-10)', color: 'var(--primary)', fontWeight: 600 }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-main)' }}>
                      {log.entity} {log.entityId ? `(#${log.entityId.slice(0, 8)})` : ''}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      {log.metadata ? JSON.stringify(log.metadata) : 'N/A'}
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
