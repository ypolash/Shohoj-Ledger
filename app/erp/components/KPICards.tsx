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
          <div className="glass-panel hover-lift glow-border-success" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px' }}>
            <div style={{ width: '42px', height: '42px', background: 'var(--success-glow)', border: '1px solid var(--success)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--success)', fontSize: '22px' }}>attach_money</span>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 500 }}>Total Income</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>{formatCurrency(data.totalIncome)}</span>
              <span style={{ fontSize: '13px', color: 'var(--success)', fontWeight: 600, background: 'var(--success-glow)', padding: '2px 8px', borderRadius: '6px' }}>+12%</span>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="glass-panel hover-lift glow-border-danger" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px' }}>
            <div style={{ width: '42px', height: '42px', background: 'var(--danger-glow)', border: '1px solid var(--danger)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--danger)', fontSize: '22px' }}>account_balance_wallet</span>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 500 }}>Total Expenses</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>{formatCurrency(data.totalExpenses)}</span>
              <span style={{ fontSize: '13px', color: 'var(--danger)', fontWeight: 600, background: 'var(--danger-glow)', padding: '2px 8px', borderRadius: '6px' }}>-2%</span>
            </div>
          </div>

          {/* Reserve Balance */}
          <div className="glass-panel hover-lift glow-border-primary" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px' }}>
            <div style={{ width: '42px', height: '42px', background: 'var(--primary-glow)', border: '1px solid var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '22px' }}>savings</span>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 500 }}>Reserve Balance</span>
            <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>{formatCurrency(data.reserveBalance)}</span>
          </div>

          {/* Payables */}
          <div className="glass-panel hover-lift glow-border-warning" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px' }}>
            <div style={{ width: '42px', height: '42px', background: 'var(--warning-glow)', border: '1px solid var(--warning)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--warning)', fontSize: '22px' }}>receipt_long</span>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 500 }}>Payables</span>
            <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>{formatCurrency(data.activeAdvances)}</span>
          </div>
        </>
      )}

      {showHR && (
        <>
          {/* Employees */}
          <div className="glass-panel hover-lift glow-border-info" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px' }}>
            <div style={{ width: '42px', height: '42px', background: 'var(--info-glow)', border: '1px solid var(--info)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--info)', fontSize: '22px' }}>group</span>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 500 }}>Total Employees</span>
            <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>142</span>
          </div>

          {/* Attendance */}
          <div className="glass-panel hover-lift glow-border-success" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px' }}>
            <div style={{ width: '42px', height: '42px', background: 'var(--success-glow)', border: '1px solid var(--success)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--success)', fontSize: '22px' }}>how_to_reg</span>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 500 }}>Attendance Today</span>
            <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>94%</span>
          </div>
        </>
      )}

      {showInventory && (
        <>
          {/* Inventory Value */}
          <div className="glass-panel hover-lift glow-border-accent" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px' }}>
            <div style={{ width: '42px', height: '42px', background: 'var(--accent-glow)', border: '1px solid var(--accent)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: '22px' }}>inventory_2</span>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 500 }}>Inventory Value</span>
            <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>{formatCurrency(1250000)}</span>
          </div>
        </>
      )}

      {showProjects && (
        <>
          {/* Active Projects */}
          <div className="glass-panel hover-lift glow-border-accent" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px' }}>
            <div style={{ width: '42px', height: '42px', background: 'var(--accent-glow)', border: '1px solid var(--accent)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: '22px' }}>account_tree</span>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 500 }}>Active Projects</span>
            <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>12</span>
          </div>
        </>
      )}
    </div>
  );
}
