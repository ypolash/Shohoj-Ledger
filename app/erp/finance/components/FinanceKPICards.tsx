"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  subtitle?: string;
}

export function FinanceKPICards({ data, onCardSelect }: { data?: any; onCardSelect?: (title: string) => void }) {
  const router = useRouter();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const handleCardClick = (title: string) => {
    if (onCardSelect) {
      onCardSelect(title);
    }
    if (title === 'Active Loans') {
      router.push('/erp/finance/loans');
    } else if (title === 'Bills Due') {
      router.push('/erp/finance/bills');
    } else {
      setSelectedCard(title);
    }
  };

  const formatMoney = (val: number | string | undefined | null) => {
    const num = Math.round(Number(val || 0));
    return num.toLocaleString();
  };

  const formatTrend = (val: number | undefined | null) => {
    if (val === undefined || val === null || isNaN(val)) return '0%';
    return `${val > 0 ? '+' : ''}${val.toFixed(1)}%`;
  };

  const revenueTrend = data?.trends?.revenue ?? 0;
  const expensesTrend = data?.trends?.expenses ?? 0;
  const profitTrend = data?.trends?.profit ?? 0;

  const cashVal = Number(data?.kpis?.cash || 0);
  const bankVal = Number(data?.kpis?.bank || 0);
  const totalLiquid = cashVal + bankVal;

  const activeLoansVal = Number(data?.kpis?.activeLoans ?? data?.kpis?.loanOutstanding ?? 0);
  const billsDueVal = Number(data?.kpis?.billsDue ?? data?.kpis?.pendingBills ?? 0);

  const kpis: KPI[] = [
    { 
      title: 'Total Revenue', 
      value: `৳ ${formatMoney(data?.kpis?.revenue)}`, 
      trend: formatTrend(revenueTrend), 
      isGood: revenueTrend >= 0, 
      isUp: revenueTrend >= 0, 
      icon: 'account_balance_wallet', 
      color: 'var(--primary, #3b82f6)',
      subtitle: data?.periodInfo?.label ? `${data.periodInfo.label}` : 'Current Period'
    },
    { 
      title: 'Total Expenses', 
      value: `৳ ${formatMoney(data?.kpis?.expenses)}`, 
      trend: formatTrend(expensesTrend), 
      // For expenses, higher expense is usually bad (isGood = false), lower expense is good
      isGood: expensesTrend <= 0, 
      isUp: expensesTrend >= 0, 
      icon: 'receipt_long', 
      color: 'var(--danger, #ef4444)',
      subtitle: data?.periodInfo?.label ? `${data.periodInfo.label}` : 'Current Period'
    },
    { 
      title: 'Net Profit', 
      value: `৳ ${formatMoney(data?.kpis?.profit)}`, 
      trend: formatTrend(profitTrend), 
      isGood: Number(data?.kpis?.profit || 0) >= 0 && profitTrend >= 0, 
      isUp: profitTrend >= 0, 
      icon: 'trending_up', 
      color: 'var(--info, #06b6d4)',
      subtitle: 'Revenue − Expenses'
    },
    { 
      title: 'Cash Balance', 
      value: `৳ ${formatMoney(totalLiquid)}`, 
      trend: 'Up to date', 
      isGood: totalLiquid >= 0, 
      isUp: totalLiquid >= 0, 
      icon: 'payments', 
      color: 'var(--warning, #f59e0b)',
      subtitle: `Cash: ৳${formatMoney(cashVal)} | Bank: ৳${formatMoney(bankVal)}`
    },
    { 
      title: 'Active Loans', 
      value: `৳ ${formatMoney(activeLoansVal)}`, 
      trend: activeLoansVal > 0 ? 'Active' : 'Settled', 
      isGood: activeLoansVal === 0, 
      isUp: false, 
      icon: 'account_balance', 
      color: '#818cf8',
      subtitle: activeLoansVal > 0 ? 'Principal Outstanding' : 'Zero Active Debt'
    },
    { 
      title: 'Bills Due', 
      value: `৳ ${formatMoney(billsDueVal)}`, 
      trend: billsDueVal > 0 ? 'Payables' : 'Clear', 
      isGood: billsDueVal === 0, 
      isUp: billsDueVal > 0, 
      icon: 'pending_actions', 
      color: '#f43f5e',
      subtitle: billsDueVal > 0 ? 'Pending Disbursements' : 'No Overdue Bills'
    }
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
      case 'Active Loans':
      case 'Bills Due':
        return <OutstandingWidget data={data} />;
      default:
        return null;
    }
  };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        {kpis.map((kpi, idx) => (
          <div 
            key={idx} 
            className="glass-card hover-bg-surface-hover" 
            onClick={() => handleCardClick(kpi.title)}
            style={{ 
              padding: '20px', 
              borderRadius: '12px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px', 
              borderLeft: `4px solid ${kpi.color}`, 
              cursor: 'pointer', 
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              background: 'var(--surface-card, rgba(255, 255, 255, 0.03))',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '10px', 
                background: `color-mix(in srgb, ${kpi.color} 15%, transparent)`,
                color: kpi.color,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center'
              }}>
                <span className="material-symbols-outlined">{kpi.icon}</span>
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px', 
                fontSize: '12px', 
                fontWeight: 600,
                color: kpi.isGood ? 'var(--success, #10b981)' : 'var(--danger, #ef4444)',
                background: kpi.isGood ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                padding: '4px 8px', 
                borderRadius: '12px',
                border: `1px solid ${kpi.isGood ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
              }}>
                {kpi.trend !== 'Up to date' && kpi.trend !== 'Settled' && kpi.trend !== 'Clear' && kpi.trend !== 'Active' && kpi.trend !== 'Payables' && (
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                    {kpi.isUp ? 'arrow_upward' : 'arrow_downward'}
                  </span>
                )}
                {kpi.trend}
              </div>
            </div>

            <div>
              <div style={{ 
                fontSize: '28px', 
                fontWeight: 800, 
                color: 'var(--text-main, #ffffff)', 
                letterSpacing: '-0.5px',
                lineHeight: 1.2
              }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted, #94a3b8)', fontWeight: 600, marginTop: '4px' }}>
                {kpi.title}
              </div>
              {kpi.subtitle && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {kpi.subtitle}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Drill-down Modal on Card Click */}
      {selectedCard && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0,0,0,0.7)', 
            backdropFilter: 'blur(4px)',
            zIndex: 9999, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '24px' 
          }} 
          onClick={() => setSelectedCard(null)}
        >
          <div 
            style={{ 
              background: 'var(--surface-main, #0f172a)', 
              border: '1px solid var(--border-light, rgba(255,255,255,0.1))',
              borderRadius: '16px', 
              width: '100%', 
              maxWidth: '850px', 
              maxHeight: '90vh', 
              overflowY: 'auto', 
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }} 
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-light, rgba(255,255,255,0.1))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>analytics</span>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{selectedCard} Analysis</h2>
              </div>
              <button 
                onClick={() => setSelectedCard(null)} 
                style={{ 
                  background: 'var(--surface-hover, rgba(255,255,255,0.05))', 
                  border: '1px solid var(--border-light, rgba(255,255,255,0.1))', 
                  borderRadius: '8px',
                  color: 'var(--text-muted)', 
                  cursor: 'pointer', 
                  display: 'flex',
                  padding: '6px'
                }}
              >
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
