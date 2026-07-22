"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ClientDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/clients/dashboard`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (val: string | number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val || 0));
  };

  const metrics = data?.metrics || {};
  const activity = data?.recentActivity || [];

  return (
    <div className="animate-fade-in container">
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <div>
          <h1 style={{ margin: 0 }}>Client Hub</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>
            Enterprise overview of client engagement and revenue streams.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/dashboard/clients/list" className="btn btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>recent_actors</span>
            Client Directory
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
        
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-5)' }}>
          {[
            { label: 'Active Clients', value: metrics.activeClients, color: 'var(--primary)' },
            { label: 'Inactive Clients', value: metrics.inactiveClients, color: 'var(--danger)' },
            { label: 'New (Last 30 Days)', value: metrics.newClients, color: 'var(--success)' },
            { label: 'Total Client Projects', value: metrics.totalProjects, color: 'var(--text)' },
            { label: 'Generated Revenue', value: formatCurrency(metrics.totalRevenue), color: 'var(--warning)' },
          ].map((kpi, idx) => (
            <div key={idx} className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
              <h3 style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>{kpi.label}</h3>
              <div style={{ fontSize: '24px', fontWeight: 700, color: kpi.color, marginTop: '8px' }}>
                {isLoading ? '...' : kpi.value}
              </div>
            </div>
          ))}
        </div>

        {/* Layout for Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-6)' }}>
          <div className="glass-card">
            <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4) 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined">hub</span>
              Recent Client Activity
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '19px', top: '10px', bottom: '10px', width: '2px', backgroundColor: 'var(--border)', zIndex: 0 }}></div>
              {!isLoading && activity.length > 0 ? (
                activity.map((act: any) => (
                  <div key={act.id} style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                    <div style={{ 
                      width: '40px', height: '40px', borderRadius: '50%', 
                      backgroundColor: act.type === 'CREATED' ? 'var(--success)' : 'var(--primary)', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                        {act.type === 'CREATED' ? 'add_business' : act.type === 'DOC_UPLOADED' ? 'description' : 'update'}
                      </span>
                    </div>
                    <div style={{ backgroundColor: 'var(--background-alt)', padding: '12px', borderRadius: '8px', flex: 1, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '14px' }}>{act.client?.name}</strong>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {new Date(act.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text)' }}>
                        {act.description}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        By {act.performedBy?.name || 'System'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No recent client activity.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
