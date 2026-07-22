"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function StaffManagementDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/overview/hr')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error);
  }, []);

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', fontFamily: 'serif' }}>Staff Management Overview</h1>
        <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#94a3b8' }}>Monitor employees, attendance, and payroll metrics.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="glass-card topo-bg" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Employees</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color: '#fff' }}>{stats?.totalEmployees || 0}</p>
          <div style={{ fontSize: '13px', color: '#10b981', marginTop: '4px' }}>{stats?.activeEmployees || 0} Active</div>
          <Link href="/dashboard/staff-management/employees" style={{ fontSize: '13px', color: '#6366f1', textDecoration: 'none', display: 'inline-block', marginTop: '12px' }}>Manage Employees &rarr;</Link>
        </div>
        
        <div className="glass-card topo-bg" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Departments</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color: '#fff' }}>{stats?.totalDepartments || 0}</p>
          <div style={{ fontSize: '13px', color: '#6366f1', marginTop: '4px' }}>{stats?.totalDesignations || 0} Designations</div>
          <Link href="/dashboard/staff-management/departments" style={{ fontSize: '13px', color: '#6366f1', textDecoration: 'none', display: 'inline-block', marginTop: '12px' }}>View Departments &rarr;</Link>
        </div>

        <div className="glass-card topo-bg" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Pending Leave</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color: '#f59e0b' }}>0</p>
          <Link href="/dashboard/staff-management/leave" style={{ fontSize: '13px', color: '#f59e0b', textDecoration: 'none', display: 'inline-block', marginTop: '12px' }}>Review Requests &rarr;</Link>
        </div>

        <div className="glass-card topo-bg" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>New Hires (This Month)</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color: '#fff' }}>{stats?.newHiresThisMonth || 0}</p>
          <div style={{ fontSize: '13px', color: '#f59e0b', marginTop: '4px' }}>{stats?.onProbation || 0} on Probation</div>
        </div>

        <div className="glass-card topo-bg" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Attrition (This Month)</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color: '#ef4444' }}>{stats?.attritionThisMonth || 0}</p>
          <div style={{ fontSize: '13px', color: '#ef4444', marginTop: '4px' }}>{stats?.terminated || 0} Terminated • {stats?.resigned || 0} Resigned</div>
        </div>
      </div>
    </div>
  );
}
