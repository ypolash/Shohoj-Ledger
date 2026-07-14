"use client";

import React from 'react';
import Link from 'next/link';

export default function StaffPortal() {
  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', fontFamily: 'serif' }}>Employee Portal</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#94a3b8' }}>Welcome to your personal dashboard.</p>
        </div>
        <button className="btn" style={{ background: 'rgba(255,255,255,0.05)' }}>Logout</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="glass-card topo-bg" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: '#3b82f6' }}>account_balance_wallet</span> 
            My Salary
          </h3>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Last Month Net Pay</span>
            <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#10b981' }}>৳ 0.00</p>
          </div>
          <Link href="/staff/payslips" style={{ fontSize: '14px', color: '#6366f1', textDecoration: 'none' }}>Download Payslips &rarr;</Link>
        </div>
        
        <div className="glass-card topo-bg" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: '#f59e0b' }}>event_available</span> 
            Attendance & Leave
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Late Days</span>
              <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '4px 0 0 0' }}>0</p>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Leaves Taken</span>
              <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '4px 0 0 0' }}>0</p>
            </div>
          </div>
          <Link href="/staff/leave" style={{ fontSize: '14px', color: '#f59e0b', textDecoration: 'none' }}>Request Leave &rarr;</Link>
        </div>

        <div className="glass-card topo-bg" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: '#ec4899' }}>redeem</span> 
            Bonuses & Perks
          </h3>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>YTD Bonuses</span>
            <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#fff' }}>৳ 0.00</p>
          </div>
          <Link href="/staff/bonuses" style={{ fontSize: '14px', color: '#ec4899', textDecoration: 'none' }}>View History &rarr;</Link>
        </div>
      </div>
    </div>
  );
}
