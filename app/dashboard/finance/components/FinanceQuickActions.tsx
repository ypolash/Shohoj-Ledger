"use client";

import { useRouter } from 'next/navigation';

export function FinanceQuickActions() {
  const router = useRouter();
  
  const actions = [
    { label: 'Create Income', icon: 'add_circle', color: 'var(--success)', path: '/dashboard/finance/income' },
    { label: 'Create Expense', icon: 'remove_circle', color: 'var(--danger)', path: '/dashboard/finance/expenses' },
    { label: 'Transfer Funds', icon: 'swap_horiz', color: 'var(--info)', path: '/dashboard/finance/funds' },
    { label: 'Advance', icon: 'payments', color: 'var(--warning)', path: '/dashboard/finance/advances' },
    { label: 'Settlement', icon: 'receipt_long', color: 'var(--primary)', path: '/dashboard/finance/settlements' },
    { label: 'Reserve Deposit', icon: 'savings', color: 'var(--warning)', path: '/dashboard/finance/reserves' },
    { label: 'Export Report', icon: 'download', color: 'var(--text-main)', path: '/dashboard/finance/reports' }
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600 }}>Quick Actions</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
        {actions.map(action => (
          <button 
            key={action.label}
            onClick={() => router.push(action.path)}
            style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '16px', borderRadius: '8px', background: 'var(--surface-hover)', border: '1px solid var(--border-light)',
              cursor: 'pointer', transition: 'all 0.2s', color: 'var(--text-main)'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = action.color}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}
          >
            <span className="material-symbols-outlined" style={{ color: action.color, fontSize: '24px' }}>
              {action.icon}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
