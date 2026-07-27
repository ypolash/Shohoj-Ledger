"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ProjectDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/dashboard`);
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
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(Number(val || 0));
  };

  const metrics = data?.metrics || {};
  const deadlines = data?.upcomingDeadlines || [];
  const activity = data?.recentActivity || [];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Project Portfolio Management</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            Overview of all enterprise projects, budgets, and workloads.
          </p>
        </div>
        <Link href="/erp/projects/list" className="btn btn-primary hover-lift" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>list_alt</span>
          View All Projects
        </Link>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-4)' }}>
        {[
          { label: 'Active Projects', value: metrics.activeProjects, icon: 'folder_open', color: 'var(--primary)' },
          { label: 'Completed Projects', value: metrics.completedProjects, icon: 'task_alt', color: 'var(--success)' },
          { label: 'Delayed Projects', value: metrics.delayedProjects, icon: 'warning', color: 'var(--danger)' },
          { label: 'Avg Progress', value: `${metrics.averageProgress || 0}%`, icon: 'donut_large', color: 'var(--success)' },
          { label: 'Budget Usage', value: `${metrics.budgetUsage || 0}%`, icon: 'account_balance', color: 'var(--warning)' },
          { label: 'Total Budget', value: formatCurrency(metrics.totalBudget), icon: 'payments', color: 'var(--text-main)' },
          { label: 'Total Actual Cost', value: formatCurrency(metrics.totalCost), icon: 'receipt_long', color: 'var(--danger)' },
        ].map((kpi, idx) => (
          <div key={idx} className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: kpi.color }}>{kpi.icon}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{kpi.label}</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: kpi.color }}>
              {isLoading ? <span style={{ opacity: 0.4 }}>···</span> : kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Deadlines & Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-5)' }}>
        
        {/* Deadlines */}
        <div className="glass-panel" style={{ borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--danger)' }}>event_busy</span>
            Upcoming & Overdue Deadlines
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} style={{ height: '48px', borderRadius: '8px', background: 'var(--surface-hover)', opacity: 0.7 }} />)
            ) : deadlines.length > 0 ? (
              deadlines.map((d: any, idx: number) => {
                const isOverdue = new Date(d.date).getTime() < new Date().getTime();
                return (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: 'var(--surface-hover)', borderRadius: '12px', border: '1px solid var(--border-main)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{d.name}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Project Delivery</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ color: isOverdue ? 'var(--danger)' : 'var(--warning)', fontWeight: 700, fontSize: '14px' }}>
                        {new Date(d.date).toLocaleDateString()}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: isOverdue ? 'var(--danger)' : 'var(--text-muted)' }}>
                        {isOverdue ? 'OVERDUE' : 'UPCOMING'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0' }}>No upcoming deadlines.</div>
            )}
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="glass-panel" style={{ borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>history</span>
            Recent Portfolio Activity
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
            {!isLoading && activity.length > 0 && <div style={{ position: 'absolute', left: '19px', top: '10px', bottom: '10px', width: '2px', backgroundColor: 'var(--border-main)', zIndex: 0 }} />}
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ height: '60px', borderRadius: '8px', background: 'var(--surface-hover)', opacity: 0.7 }} />)
            ) : activity.length > 0 ? (
              activity.map((act: any) => (
                <div key={act.id} style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '50%', 
                    backgroundColor: 'var(--primary-subtle)', color: 'var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      {act.type.includes('TASK') ? 'task_alt' : 'folder'}
                    </span>
                  </div>
                  <div style={{ backgroundColor: 'var(--surface-hover)', padding: '14px', borderRadius: '12px', flex: 1, border: '1px solid var(--border-main)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{act.project?.name}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(act.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {act.description}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                      By {act.performedBy?.name || 'System'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0' }}>No recent activity.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
