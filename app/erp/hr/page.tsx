"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * ERP HR & Payroll Dashboard
 * Fetches live KPIs from employees, departments, attendance, leaves, and payroll APIs
 * and presents them as an operational command center.
 */
export default function HRDashboardPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  /** Loads all HR KPI data concurrently */
  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [empRes, deptRes, leaveRes, payRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/departments'),
        fetch('/api/leaves'),
        fetch('/api/payroll'),
      ]);
      if (empRes.ok)   setEmployees(await empRes.json());
      if (deptRes.ok)  setDepartments(await deptRes.json());
      if (leaveRes.ok) setLeaves(await leaveRes.json());
      if (payRes.ok)   setPayroll(await payRes.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(v || 0);

  const activeEmployees = employees.filter(e => e.status === 'ACTIVE').length;
  const pendingLeaves   = leaves.filter(l => l.status === 'PENDING').length;
  const summary         = payroll?.summary || {};

  const kpis = [
    { label: 'Total Employees',    value: employees.length,      icon: 'badge',         color: 'var(--primary)',   glow: 'primary' },
    { label: 'Active Employees',   value: activeEmployees,       icon: 'how_to_reg',    color: 'var(--success)',   glow: 'success' },
    { label: 'Departments',        value: departments.length,    icon: 'corporate_fare',color: 'var(--accent)',    glow: 'accent' },
    { label: 'Pending Leaves',     value: pendingLeaves,         icon: 'event_busy',    color: 'var(--warning)',   glow: 'warning' },
    { label: 'Payroll (Net)',       value: isLoading ? '—' : formatCurrency(summary.totalNetPay), icon: 'payments', color: 'var(--success)', glow: 'success' },
    { label: 'Pending Payslips',   value: summary.pendingCount ?? '—', icon: 'pending_actions', color: 'var(--warning)', glow: 'warning' },
  ];

  const quickLinks = [
    { href: '/erp/hr/employees',   icon: 'badge',         label: 'Manage Employees' },
    { href: '/erp/hr/departments', icon: 'corporate_fare',label: 'Departments' },
    { href: '/erp/hr/attendance',  icon: 'fact_check',    label: 'Record Attendance' },
    { href: '/erp/hr/leaves',      icon: 'event_busy',    label: 'Leave Requests' },
    { href: '/erp/hr/payroll',     icon: 'payments',      label: 'Run Payroll' },
  ];

  // Recent leave requests for activity feed
  const recentLeaves = leaves.slice(0, 8);

  const leaveStatusColor: Record<string, string> = {
    PENDING:  'var(--warning)',
    APPROVED: 'var(--success)',
    REJECTED: 'var(--danger)',
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>HR & Payroll Dashboard</h1>
          <p style={{ margin: '4px 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>
            Workforce overview, attendance tracking, and payroll operations.
          </p>
        </div>
        <button onClick={loadAll} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-4)' }}>
        {kpis.map(kpi => (
          <div key={kpi.label} className={`glass-panel hover-lift glow-border-${kpi.glow}`} style={{ padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px', color: kpi.color }}>{kpi.icon}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>{kpi.label}</span>
            </div>
            <div style={{ fontSize: '30px', fontWeight: 700, color: kpi.color, letterSpacing: '-0.5px' }}>
              {isLoading ? <span style={{ opacity: 0.4 }}>···</span> : kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links + Leave Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--spacing-6)' }}>

        {/* Quick Links */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 16px' }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {quickLinks.map(ql => (
              <Link key={ql.href} href={ql.href} className="hover-lift"
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', color: 'var(--text-main)', textDecoration: 'none', fontWeight: 500, fontSize: '14px', transition: 'all 0.15s' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }}>{ql.icon}</span>
                {ql.label}
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-muted)', marginLeft: 'auto' }}>chevron_right</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Leave Requests */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 16px' }}>Recent Leave Requests</h2>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1,2,3,4].map(i => <div key={i} style={{ height: '52px', borderRadius: '10px', background: 'var(--surface-hover)', opacity: 0.5 }} />)}
            </div>
          ) : recentLeaves.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '36px', opacity: 0.4, display: 'block', marginBottom: '8px' }}>event_busy</span>
              No leave requests yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentLeaves.map((l: any) => (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>person</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                      {l.employee?.firstName} {l.employee?.lastName}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {l.type} · {new Date(l.startDate).toLocaleDateString()} – {new Date(l.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, color: leaveStatusColor[l.status] || 'var(--text-muted)', background: `${leaveStatusColor[l.status] || 'var(--text-muted)'}20`, whiteSpace: 'nowrap' }}>
                    {l.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
