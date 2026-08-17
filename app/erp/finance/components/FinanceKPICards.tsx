"use client";

import React, { useState } from 'react';
import { RevenueTrendChart } from './RevenueTrendChart';
import { ExpenseTrendChart } from './ExpenseTrendChart';
import { IncomeExpenseChart } from './IncomeExpenseChart';
import { CashFlowChart } from './CashFlowChart';
import { OutstandingWidget } from './OutstandingWidget';

interface KPI {
  title: string;
  value: string;
  trend: string;
  isGood: boolean;
  isUp: boolean;
  icon: string;
  color: string;
}

export function FinanceKPICards({ data }: { data?: any }) {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const formatTrend = (val: number) => {
    if (val === undefined || val === null) return '0%';
    return `${val > 0 ? '+' : ''}${val.toFixed(1)}%`;
  };

  const kpis: KPI[] = [
    { title: 'Total Revenue', value: `৳ ${(data?.kpis?.revenue || 0).toLocaleString()}`, trend: formatTrend(data?.trends?.revenue), isGood: (data?.trends?.revenue || 0) >= 0, isUp: (data?.trends?.revenue || 0) >= 0, icon: 'account_balance_wallet', color: 'var(--primary)' },
    { title: 'Total Expenses', value: `৳ ${(data?.kpis?.expenses || 0).toLocaleString()}`, trend: formatTrend(data?.trends?.expenses), isGood: (data?.trends?.expenses || 0) <= 0, isUp: (data?.trends?.expenses || 0) >= 0, icon: 'receipt_long', color: 'var(--danger)' },
    { title: 'Net Profit', value: `৳ ${(data?.kpis?.profit || 0).toLocaleString()}`, trend: formatTrend(data?.trends?.profit), isGood: (data?.trends?.profit || 0) >= 0, isUp: (data?.trends?.profit || 0) >= 0, icon: 'trending_up', color: 'var(--info)' },
    { title: 'Cash Balance', value: `৳ ${(data?.kpis?.cash || 0).toLocaleString()}`, trend: 'Up to date', isGood: true, isUp: true, icon: 'payments', color: 'var(--warning)' },
    { title: 'Outstanding Recv', value: `৳ ${(data?.kpis?.loanOutstanding || 0).toLocaleString()}`, trend: 'Pending', isGood: false, isUp: false, icon: 'move_to_inbox', color: 'var(--primary)' }
  ];

  const renderChart = () => {
    switch (selectedCard) {
      case 'Total Revenue':
        return <RevenueTrendChart data={data} />;
      case 'Total Expenses':
        return <ExpenseTrendChart data={data} />;
      case 'Net Profit':
        return <IncomeExpenseChart data={data} />;
      case 'Cash Balance':
        return <CashFlowChart data={data} />;
      case 'Outstanding Recv':
        return <OutstandingWidget data={data} />;
      default:
        return null;
    }
  };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        {kpis.map((kpi, idx) => (
          <div 
            key={idx} 
            className="glass-card hover-bg-surface-hover" 
            onClick={() => setSelectedCard(kpi.title)}
            style={{ 
              padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', 
              borderLeft: `4px solid ${kpi.color}`, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ 
                width: '40px', height: '40px', borderRadius: '10px', 
                background: `color-mix(in srgb, ${kpi.color} 15%, transparent)`,
                color: kpi.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <span className="material-symbols-outlined">{kpi.icon}</span>
              </div>
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600,
                color: kpi.isGood ? 'var(--success)' : 'var(--danger)',
                background: kpi.isGood ? 'var(--success-glow)' : 'var(--danger-glow)',
                padding: '4px 8px', borderRadius: '12px'
              }}>
                {kpi.trend !== 'Up to date' && kpi.trend !== 'Pending' && (
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                    {kpi.isUp ? 'arrow_upward' : 'arrow_downward'}
                  </span>
                )}
                {kpi.trend}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>{kpi.value}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500, marginTop: '4px' }}>{kpi.title}</div>
            </div>
          </div>
        ))}
      </div>

      {selectedCard && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setSelectedCard(null)}>
          <div style={{ background: 'var(--surface)', borderRadius: '16px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>{selectedCard} Details</h2>
              <button onClick={() => setSelectedCard(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div style={{ padding: '24px', overflowX: 'auto' }}>
              {renderChart()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
