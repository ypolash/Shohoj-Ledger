"use client";

import React from 'react';

type MonthlyData = {
  label: string;
  revenue: number;
  expense: number;
  netCash: number;
};

type OverviewData = {
  reserveBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  outstandingLoans: number;
  activeAdvances: number;
  monthlyData: MonthlyData[];
  recentTransactions: any[];
};

interface KPICardsProps {
  data: OverviewData | null;
  role: string;
}

const formatCurrency = (val: number | string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val));
};

export function KPICards({ data, role }: KPICardsProps) {
  if (!data) return null;

  // Visibility based on role
  const showFinance = ['Owner', 'CEO', 'Accountant'].includes(role);
  const showHR = ['Owner', 'CEO', 'HR'].includes(role);
  const showProjects = ['Owner', 'CEO', 'Project Manager'].includes(role);
  const showInventory = ['Owner', 'CEO', 'Inventory'].includes(role);

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
      gap: '24px',
      marginBottom: '24px'
    }}>
      
      {showFinance && (
        <>
          {/* Total Income */}
          <div className="glass-card topo-bg" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px' }}>
            <div style={{ width: '36px', height: '36px', background: 'var(--success-glow)', border: '1px solid var(--success)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--success)', fontSize: '18px' }}>attach_money</span>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Income</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '28px', fontWeight: 'bold' }}>{formatCurrency(data.totalIncome)}</span>
              <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 600, background: 'var(--success-glow)', padding: '2px 6px', borderRadius: '4px' }}>+12%</span>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="glass-card topo-bg" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px' }}>
            <div style={{ width: '36px', height: '36px', background: 'var(--danger-glow)', border: '1px solid var(--danger)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--danger)', fontSize: '18px' }}>account_balance_wallet</span>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Expenses</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '28px', fontWeight: 'bold' }}>{formatCurrency(data.totalExpenses)}</span>
              <span style={{ fontSize: '12px', color: 'var(--warning)', fontWeight: 600, background: 'var(--warning-glow)', padding: '2px 6px', borderRadius: '4px' }}>-2%</span>
            </div>
          </div>

          {/* Reserve Balance */}
          <div className="glass-card topo-bg" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px' }}>
            <div style={{ width: '36px', height: '36px', background: 'var(--primary-glow)', border: '1px solid var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '18px' }}>savings</span>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Reserve Balance</span>
            <span style={{ fontSize: '28px', fontWeight: 'bold' }}>{formatCurrency(data.reserveBalance)}</span>
          </div>

          {/* Payables */}
          <div className="glass-card topo-bg" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px' }}>
            <div style={{ width: '36px', height: '36px', background: 'var(--warning-glow)', border: '1px solid var(--warning)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--warning)', fontSize: '18px' }}>receipt_long</span>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Payables</span>
            <span style={{ fontSize: '28px', fontWeight: 'bold' }}>{formatCurrency(data.activeAdvances)}</span>
          </div>
        </>
      )}

      {showHR && (
        <>
          {/* Employees */}
          <div className="glass-card topo-bg" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px' }}>
            <div style={{ width: '36px', height: '36px', background: 'var(--info-glow)', border: '1px solid var(--info)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--info)', fontSize: '18px' }}>group</span>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Employees</span>
            <span style={{ fontSize: '28px', fontWeight: 'bold' }}>142</span>
          </div>

          {/* Attendance */}
          <div className="glass-card topo-bg" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px' }}>
            <div style={{ width: '36px', height: '36px', background: 'var(--success-glow)', border: '1px solid var(--success)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--success)', fontSize: '18px' }}>how_to_reg</span>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Attendance Today</span>
            <span style={{ fontSize: '28px', fontWeight: 'bold' }}>94%</span>
          </div>
        </>
      )}

      {showInventory && (
        <>
          {/* Inventory Value */}
          <div className="glass-card topo-bg" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px' }}>
            <div style={{ width: '36px', height: '36px', background: 'var(--secondary-glow)', border: '1px solid var(--secondary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: '18px' }}>inventory_2</span>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Inventory Value</span>
            <span style={{ fontSize: '28px', fontWeight: 'bold' }}>{formatCurrency(1250000)}</span>
          </div>
        </>
      )}

      {showProjects && (
        <>
          {/* Active Projects */}
          <div className="glass-card topo-bg" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px' }}>
            <div style={{ width: '36px', height: '36px', background: 'var(--accent-glow)', border: '1px solid var(--accent)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: '18px' }}>account_tree</span>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Active Projects</span>
            <span style={{ fontSize: '28px', fontWeight: 'bold' }}>12</span>
          </div>
        </>
      )}
    </div>
  );
}
