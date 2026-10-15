"use client";

import React, { useState } from 'react';

interface MonthlyDataPoint {
  month: string;
  monthFull: string;
  monthKey: string;
  monthIndex: number;
  year: number;
  revenue: number;
  expense: number;
  profit: number;
  cashIn: number;
  cashOut: number;
  netMargin: number;
  isCurrentMonth: boolean;
  isSelected: boolean;
}

interface FinanceMonthlyChartProps {
  data?: any;
  selectedMonth?: string;
  onSelectMonth?: (monthKey: string) => void;
}

export function FinanceMonthlyChart({ data, selectedMonth, onSelectMonth }: FinanceMonthlyChartProps) {
  const [activeTab, setActiveTab] = useState<'bars' | 'trend' | 'cash' | 'table'>('bars');
  const [hoveredMonth, setHoveredMonth] = useState<MonthlyDataPoint | null>(null);

  const series: MonthlyDataPoint[] = data?.charts?.monthlySeries || [];
  const year = data?.periodInfo?.year || new Date().getFullYear();

  // Compute maximum value for scaling the bar heights
  const maxBarValue = Math.max(
    ...series.map(s => Math.max(s.revenue, s.expense, Math.abs(s.profit))),
    1000
  );

  // Totals for the 12-month graph
  const totalRevenue = series.reduce((sum, s) => sum + s.revenue, 0);
  const totalExpense = series.reduce((sum, s) => sum + s.expense, 0);
  const totalProfit = totalRevenue - totalExpense;
  const overallMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 1000) / 10 : 0;

  // Best performing month
  const bestMonth = [...series].sort((a, b) => b.revenue - a.revenue)[0];

  const formatMoney = (val: number | string | undefined | null) => {
    return Math.round(Number(val || 0)).toLocaleString();
  };

  return (
    <div 
      className="glass-card" 
      style={{ 
        padding: '24px', 
        borderRadius: '16px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '20px',
        border: '1px solid var(--border-light, rgba(255, 255, 255, 0.08))',
        background: 'var(--surface-card, rgba(255, 255, 255, 0.02))',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
      }}
    >
      {/* Header and Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary, #3b82f6)', fontSize: '24px' }}>
              finance_mode
            </span>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main, #ffffff)' }}>
              Monthly Financial Performance ({year})
            </h2>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted, #94a3b8)' }}>
            Real-time monthly revenue, operating expenses, and net margins across all 12 months.
          </p>
        </div>

        {/* View Mode Tabs */}
        <div style={{ display: 'flex', background: 'var(--surface-main, rgba(0,0,0,0.3))', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-light, rgba(255,255,255,0.1))', gap: '4px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('bars')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeTab === 'bars' ? 'var(--primary, #3b82f6)' : 'transparent',
              color: activeTab === 'bars' ? '#ffffff' : 'var(--text-muted, #94a3b8)',
              transition: 'all 0.15s ease'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>bar_chart</span>
            Income vs Expense
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trend')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeTab === 'trend' ? 'var(--primary, #3b82f6)' : 'transparent',
              color: activeTab === 'trend' ? '#ffffff' : 'var(--text-muted, #94a3b8)',
              transition: 'all 0.15s ease'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>trending_up</span>
            Profit Trend
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cash')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeTab === 'cash' ? 'var(--primary, #3b82f6)' : 'transparent',
              color: activeTab === 'cash' ? '#ffffff' : 'var(--text-muted, #94a3b8)',
              transition: 'all 0.15s ease'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>account_balance</span>
            Cash Flow
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('table')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeTab === 'table' ? 'var(--primary, #3b82f6)' : 'transparent',
              color: activeTab === 'table' ? '#ffffff' : 'var(--text-muted, #94a3b8)',
              transition: 'all 0.15s ease'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>table_rows</span>
            Monthly Table
          </button>
        </div>
      </div>

      {/* Quick Summary Pill Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', padding: '14px 18px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid var(--border-light, rgba(255,255,255,0.06))' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Yearly Total Revenue</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>৳ {formatMoney(totalRevenue)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Yearly Total Expenses</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#ef4444', marginTop: '2px' }}>৳ {formatMoney(totalExpense)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Net Profit & Margin</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: totalProfit >= 0 ? '#38bdf8' : '#f87171', marginTop: '2px' }}>
            ৳ {formatMoney(totalProfit)} <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.8 }}>({overallMargin}%)</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Best Revenue Month</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>
            {bestMonth?.revenue > 0 ? `${bestMonth.monthFull} (৳${formatMoney(bestMonth.revenue)})` : 'None'}
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      {activeTab === 'bars' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Chart Header Legend */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981', display: 'inline-block' }}></span>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Revenue</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ef4444', display: 'inline-block' }}></span>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Expenses</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', display: 'inline-block' }}></span>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Net Margin Indicator</span>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
              Click any month bar to filter data
            </div>
          </div>

          {/* Bar Chart Grid */}
          <div style={{ height: '260px', width: '100%', display: 'flex', alignItems: 'flex-end', gap: '8px', paddingBottom: '30px', position: 'relative' }}>
            {/* Horizontal Grid lines */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: '30px', pointerEvents: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {[0, 1, 2, 3].map((_, i) => (
                <div key={i} style={{ borderTop: '1px dashed rgba(255, 255, 255, 0.07)', width: '100%', height: 0 }}></div>
              ))}
            </div>

            {/* 12 Months Bars */}
            {series.map((item, idx) => {
              const revHeight = maxBarValue > 0 ? (item.revenue / maxBarValue) * 100 : 0;
              const expHeight = maxBarValue > 0 ? (item.expense / maxBarValue) * 100 : 0;
              const isSelected = selectedMonth ? (item.monthKey === selectedMonth || String(item.monthIndex + 1) === selectedMonth) : item.isCurrentMonth;
              const isHovered = hoveredMonth?.monthKey === item.monthKey;

              return (
                <div 
                  key={item.monthKey || idx}
                  onClick={() => onSelectMonth && onSelectMonth(item.monthKey)}
                  onMouseEnter={() => setHoveredMonth(item)}
                  onMouseLeave={() => setHoveredMonth(null)}
                  style={{
                    flex: 1,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    cursor: 'pointer',
                    position: 'relative',
                    padding: '0 2px',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(59, 130, 246, 0.08)' : (isHovered ? 'rgba(255, 255, 255, 0.03)' : 'transparent'),
                    border: isSelected ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Floating tooltip on hover */}
                  {isHovered && (
                    <div style={{
                      position: 'absolute',
                      bottom: '100%',
                      marginBottom: '8px',
                      background: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      zIndex: 100,
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      minWidth: '140px'
                    }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                        {item.monthFull} {item.year}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#10b981' }}>
                        <span>Revenue:</span>
                        <span style={{ fontWeight: 600 }}>৳ {formatMoney(item.revenue)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#ef4444' }}>
                        <span>Expenses:</span>
                        <span style={{ fontWeight: 600 }}>৳ {formatMoney(item.expense)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: item.profit >= 0 ? '#38bdf8' : '#f87171' }}>
                        <span>Net Profit:</span>
                        <span style={{ fontWeight: 700 }}>৳ {formatMoney(item.profit)}</span>
                      </div>
                    </div>
                  )}

                  {/* Dual Bars: Revenue & Expense */}
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '3px' }}>
                    {/* Revenue Bar */}
                    <div 
                      style={{ 
                        width: '45%', 
                        height: `${Math.max(revHeight, 2)}%`, 
                        background: 'linear-gradient(180deg, #34d399 0%, #059669 100%)', 
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.4s ease'
                      }} 
                    />
                    {/* Expense Bar */}
                    <div 
                      style={{ 
                        width: '45%', 
                        height: `${Math.max(expHeight, 2)}%`, 
                        background: 'linear-gradient(180deg, #f87171 0%, #dc2626 100%)', 
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.4s ease'
                      }} 
                    />
                  </div>

                  {/* Profit Dot / Indicator */}
                  {item.revenue > 0 && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: '6px',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: item.profit >= 0 ? '#38bdf8' : '#ef4444',
                        boxShadow: `0 0 8px ${item.profit >= 0 ? '#38bdf8' : '#ef4444'}`
                      }}
                    />
                  )}

                  {/* Month Label */}
                  <div style={{ 
                    position: 'absolute', 
                    bottom: '6px', 
                    fontSize: '11px', 
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? '#60a5fa' : 'var(--text-muted, #94a3b8)' 
                  }}>
                    {item.month}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Profit Trend Chart */}
      {activeTab === 'trend' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted, #94a3b8)' }}>
              Net Profit trajectory per month (Green = Positive Margin, Red = Deficit)
            </span>
          </div>

          <div style={{ height: '240px', width: '100%', position: 'relative' }}>
            <svg style={{ width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none" viewBox="0 0 100 100">
              {/* Zero baseline */}
              <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />

              {/* Profit Line Points */}
              {series.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  points={series.map((s, i) => {
                    const x = (i / (series.length - 1)) * 100;
                    // Normalized to 50 as zero point
                    const normalized = maxBarValue > 0 ? (s.profit / maxBarValue) * 45 : 0;
                    const y = 50 - normalized;
                    return `${x},${y}`;
                  }).join(' ')}
                />
              )}
            </svg>

            {/* Month Dots & Labels */}
            {series.map((s, i) => {
              const x = (i / (series.length - 1)) * 100;
              const normalized = maxBarValue > 0 ? (s.profit / maxBarValue) * 45 : 0;
              const y = 50 - normalized;

              return (
                <div 
                  key={s.monthKey}
                  onClick={() => onSelectMonth && onSelectMonth(s.monthKey)}
                  style={{
                    position: 'absolute',
                    left: `${x}%`,
                    top: `${y}%`,
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: s.profit >= 0 ? '#10b981' : '#ef4444',
                    border: '2px solid #ffffff',
                    transform: 'translate(-50%, -50%)',
                    cursor: 'pointer',
                    zIndex: 10
                  }}
                  title={`${s.monthFull}: ৳ ${formatMoney(s.profit)}`}
                />
              );
            })}

            <div style={{ position: 'absolute', left: 0, right: 0, bottom: '0px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
              {series.map(s => <span key={s.monthKey}>{s.month}</span>)}
            </div>
          </div>
        </div>
      )}

      {/* Cash Flow View */}
      {activeTab === 'cash' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#3b82f6', display: 'inline-block' }}></span>
              <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Cash Received</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f59e0b', display: 'inline-block' }}></span>
              <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Cash Disbursed</span>
            </div>
          </div>

          <div style={{ height: '240px', width: '100%', display: 'flex', alignItems: 'flex-end', gap: '8px', paddingBottom: '30px' }}>
            {series.map((item) => {
              const inHeight = maxBarValue > 0 ? (item.cashIn / maxBarValue) * 100 : 0;
              const outHeight = maxBarValue > 0 ? (item.cashOut / maxBarValue) * 100 : 0;

              return (
                <div key={item.monthKey} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', position: 'relative' }}>
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '3px' }}>
                    <div style={{ width: '45%', height: `${Math.max(inHeight, 2)}%`, background: '#3b82f6', borderRadius: '4px 4px 0 0' }} title={`Cash In: ৳${formatMoney(item.cashIn)}`} />
                    <div style={{ width: '45%', height: `${Math.max(outHeight, 2)}%`, background: '#f59e0b', borderRadius: '4px 4px 0 0' }} title={`Cash Out: ৳${formatMoney(item.cashOut)}`} />
                  </div>
                  <div style={{ position: 'absolute', bottom: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {item.month}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed Monthly Table */}
      {activeTab === 'table' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light, rgba(255, 255, 255, 0.1))', color: 'var(--text-muted, #94a3b8)' }}>
                <th style={{ padding: '10px 12px' }}>Month</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Revenue</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Expenses</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Net Profit</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Net Margin</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {series.map((item) => (
                <tr 
                  key={item.monthKey}
                  style={{ 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    background: item.isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent'
                  }}
                >
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-main, #ffffff)' }}>
                    {item.monthFull} {item.year}
                    {item.isCurrentMonth && (
                      <span style={{ marginLeft: '6px', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>Current</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>
                    ৳ {formatMoney(item.revenue)}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#ef4444' }}>
                    ৳ {formatMoney(item.expense)}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: item.profit >= 0 ? '#38bdf8' : '#f87171' }}>
                    ৳ {formatMoney(item.profit)}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: item.netMargin >= 0 ? '#10b981' : '#ef4444' }}>
                    {item.netMargin}%
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => onSelectMonth && onSelectMonth(item.monthKey)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-light, rgba(255,255,255,0.15))',
                        background: 'var(--surface-hover, rgba(255,255,255,0.06))',
                        color: 'var(--text-main, #ffffff)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Filter Month
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
