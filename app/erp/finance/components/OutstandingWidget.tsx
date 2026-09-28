"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export function OutstandingWidget({ data }: { data?: any }) {
  const router = useRouter();

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Liabilities &amp; Outstanding Summary</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Accounts Receivable */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_downward</span>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Accounts Receivable</span>
                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: 700 }}>Bill Due</span>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#ef4444' }}>৳ {(data?.kpis?.loanOutstanding || data?.kpis?.pendingReceivables || 0).toLocaleString()}</div>
            </div>
          </div>
          <button onClick={() => router.push('/erp/finance/income')} style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: 'var(--surface-hover)', border: '1px solid var(--border-light)', cursor: 'pointer' }}>View</button>
        </div>

        <div style={{ height: '1px', background: 'var(--border-light)' }}></div>

        {/* Accounts Payable / Bills Due */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.15)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>pending_actions</span>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Accounts Payable</span>
                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(37, 99, 235, 0.15)', color: '#2563eb', fontWeight: 700 }}>Bill Due</span>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#2563eb' }}>৳ {(data?.kpis?.billsDue || data?.kpis?.advanceOutstanding || 0).toLocaleString()}</div>
            </div>
          </div>
          <button onClick={() => router.push('/erp/finance/expenses')} style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: 'var(--surface-hover)', border: '1px solid var(--border-light)', cursor: 'pointer' }}>View Bills</button>
        </div>

        <div style={{ height: '1px', background: 'var(--border-light)' }}></div>

        {/* Corporate Loans */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(129, 140, 248, 0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>account_balance</span>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Active Corporate Loans</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#818cf8' }}>৳ {(data?.kpis?.activeLoans || 0).toLocaleString()}</div>
            </div>
          </div>
          <button onClick={() => router.push('/erp/finance/loans')} style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: 'var(--surface-hover)', border: '1px solid var(--border-light)', cursor: 'pointer' }}>View Loans</button>
        </div>
      </div>
    </div>
  );
}
