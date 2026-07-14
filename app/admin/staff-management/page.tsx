"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function StaffManagementDashboard() {
  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', fontFamily: 'serif' }}>Staff Management Overview</h1>
        <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#94a3b8' }}>Monitor employees, attendance, and payroll metrics.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="glass-card topo-bg" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Employees</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color: '#fff' }}>0</p>
          <Link href="/admin/staff-management/employees" style={{ fontSize: '13px', color: '#6366f1', textDecoration: 'none', display: 'inline-block', marginTop: '12px' }}>Manage Employees &rarr;</Link>
        </div>
        
        <div className="glass-card topo-bg" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Today's Attendance</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color: '#fff' }}>0 / 0</p>
          <Link href="/admin/staff-management/attendance" style={{ fontSize: '13px', color: '#6366f1', textDecoration: 'none', display: 'inline-block', marginTop: '12px' }}>View Register &rarr;</Link>
        </div>

        <div className="glass-card topo-bg" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Pending Leave</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color: '#f59e0b' }}>0</p>
          <Link href="/admin/staff-management/leave" style={{ fontSize: '13px', color: '#f59e0b', textDecoration: 'none', display: 'inline-block', marginTop: '12px' }}>Review Requests &rarr;</Link>
        </div>

        <div className="glass-card topo-bg" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Payroll (This Month)</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color: '#10b981' }}>৳ 0.00</p>
          <Link href="/admin/staff-management/payroll" style={{ fontSize: '13px', color: '#10b981', textDecoration: 'none', display: 'inline-block', marginTop: '12px' }}>Process Payroll &rarr;</Link>
        </div>
      </div>
    </div>
  );
}
