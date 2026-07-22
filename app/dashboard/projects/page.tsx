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
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val || 0));
  };

  const metrics = data?.metrics || {};
  const deadlines = data?.upcomingDeadlines || [];
  const activity = data?.recentActivity || [];

  return (
    <div className="animate-fade-in container">
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <div>
          <h1 style={{ margin: 0 }}>Project Portfolio Management</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>
            Overview of all enterprise projects, budgets, and workloads.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/dashboard/projects/list" className="btn btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>list_alt</span>
            View All Projects
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
        
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-5)' }}>
          {[
            { label: 'Active Projects', value: metrics.activeProjects, color: 'var(--primary)' },
            { label: 'Completed Projects', value: metrics.completedProjects, color: 'var(--success)' },
            { label: 'Delayed Projects', value: metrics.delayedProjects, color: 'var(--danger)' },
            { label: 'Avg Progress', value: `${metrics.averageProgress || 0}%`, color: 'var(--success)' },
            { label: 'Budget Usage', value: `${metrics.budgetUsage || 0}%`, color: 'var(--warning)' },
            { label: 'Total Budget', value: formatCurrency(metrics.totalBudget), color: 'var(--text)' },
            { label: 'Total Actual Cost', value: formatCurrency(metrics.totalCost), color: 'var(--danger)' },
          ].map((kpi, idx) => (
            <div key={idx} className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
              <h3 style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>{kpi.label}</h3>
              <div style={{ fontSize: '20px', fontWeight: 700, color: kpi.color, marginTop: '8px' }}>
                {isLoading ? '...' : kpi.value}
              </div>
            </div>
          ))}
        </div>

        {/* Layout for Deadlines & Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-6)' }}>
          
          {/* Deadlines */}
          <div className="glass-card">
            <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4) 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--danger)' }}>warning</span>
              Upcoming Deadlines
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {!isLoading && deadlines.length > 0 ? (
                deadlines.map((d: any, idx: number) => {
                  const isOverdue = new Date(d.date).getTime() < new Date().getTime();
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--background)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 500 }}>{d.name}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Project Delivery</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ color: isOverdue ? 'var(--danger)' : 'var(--warning)', fontWeight: 'bold', fontSize: '14px' }}>
                          {new Date(d.date).toLocaleDateString()}
                        </span>
                        <span style={{ fontSize: '11px', color: isOverdue ? 'var(--danger)' : 'var(--text-muted)' }}>
                          {isOverdue ? 'OVERDUE' : 'UPCOMING'}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No upcoming deadlines.</div>
              )}
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <div className="glass-card">
            <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4) 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined">history</span>
              Recent Portfolio Activity
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '19px', top: '10px', bottom: '10px', width: '2px', backgroundColor: 'var(--border)', zIndex: 0 }}></div>
              {!isLoading && activity.length > 0 ? (
                activity.map((act: any) => (
                  <div key={act.id} style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                    <div style={{ 
                      width: '40px', height: '40px', borderRadius: '50%', 
                      backgroundColor: 'var(--primary)', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                        {act.type.includes('TASK') ? 'task_alt' : 'folder'}
                      </span>
                    </div>
                    <div style={{ backgroundColor: 'var(--background-alt)', padding: '12px', borderRadius: '8px', flex: 1, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '14px' }}>{act.project?.name}</strong>
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
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No recent activity.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
