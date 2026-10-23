"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { FinanceToolbar } from './components/FinanceToolbar';
import { FinanceFilters } from './components/FinanceFilters';
import { FinanceKPICards } from './components/FinanceKPICards';
import { FinanceMonthlyChart } from './components/FinanceMonthlyChart';
import { BalanceWidget } from './components/BalanceWidget';
import { OutstandingWidget } from './components/OutstandingWidget';
import { RecentTransactions } from './components/RecentTransactions';

export default function FinanceDashboardPage() {
  const [financeData, setFinanceData] = useState<any>(null);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter States
  const currentYear = new Date().getFullYear();
  const [period, setPeriod] = useState<string>('this_month');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedAccount, setSelectedAccount] = useState<string>('ALL');

  const fetchDashboardData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setIsRefreshing(true);

    try {
      const params = new URLSearchParams();
      if (period) params.set('period', period);
      if (selectedYear) params.set('year', String(selectedYear));
      if (selectedMonth && selectedMonth !== 'ALL') params.set('month', selectedMonth);
      if (selectedAccount && selectedAccount !== 'ALL') params.set('account', selectedAccount);

      const [financeRes, overviewRes] = await Promise.all([
        fetch(`/api/finance/dashboard?${params.toString()}`),
        fetch("/api/overview")
      ]);
      const financeJson = await financeRes.json();
      const overviewJson = await overviewRes.json();
      setFinanceData(financeJson);
      setOverviewData(overviewJson);
    } catch (err) {
      console.error("Error fetching finance data:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [period, selectedYear, selectedMonth, selectedAccount]);

  useEffect(() => {
    fetchDashboardData(financeData === null);
  }, [fetchDashboardData]);

  // Handler for month click from the graph
  const handleGraphMonthSelect = (monthKey: string) => {
    // monthKey is e.g. "2026-10"
    if (monthKey) {
      const parts = monthKey.split('-');
      const y = parseInt(parts[0], 10);
      const m = String(parseInt(parts[1], 10)); // e.g. "10"
      setSelectedYear(y);
      setSelectedMonth(m);
      setPeriod('custom');
    }
  };

  if (loading || !financeData) {
    return (
      <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="text-slate-500 animate-pulse flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-4xl">hourglass_empty</span>
          <span>Calculating Ledger Balances &amp; Monthly Metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      <FinanceToolbar />
      
      {/* Interactive Time & Category Filters */}
      <FinanceFilters 
        period={period}
        onPeriodChange={setPeriod}
        year={selectedYear}
        onYearChange={setSelectedYear}
        month={selectedMonth}
        onMonthChange={setSelectedMonth}
        account={selectedAccount}
        onAccountChange={setSelectedAccount}
        availableYears={financeData?.periodInfo?.availableYears || [currentYear]}
        periodLabel={financeData?.periodInfo?.label}
      />


      {/* KPI Cards Row (Filtered in real time by selected month/period) */}
      <div style={{ marginBottom: '24px', position: 'relative' }}>
        {isRefreshing && (
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            right: 0, 
            padding: '4px 12px', 
            borderRadius: '20px', 
            background: 'rgba(59, 130, 246, 0.2)', 
            color: '#60a5fa', 
            fontSize: '11px', 
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            zIndex: 10
          }}>
            <span className="material-symbols-outlined animate-spin" style={{ fontSize: '14px' }}>sync</span>
            Updating metrics...
          </div>
        )}
        <FinanceKPICards 
          data={financeData} 
          onCardSelect={(title) => {
            // Option to jump to chart or drilldown
          }}
        />
      </div>

      {/* Prominent Monthly Financial Graph Section */}
      <div style={{ marginBottom: '24px' }}>
        <FinanceMonthlyChart 
          data={financeData} 
          selectedMonth={selectedMonth !== 'ALL' ? `${selectedYear}-${selectedMonth.padStart(2, '0')}` : undefined}
          onSelectMonth={handleGraphMonthSelect}
        />
      </div>

      {/* Action & Overview Row: Liquidity & Liabilities */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div>
          <BalanceWidget data={financeData} />
        </div>
        <div>
          <OutstandingWidget data={financeData} />
        </div>
      </div>

      {/* Tables and Info Columns */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
        <RecentTransactions transactions={overviewData?.recentTransactions || []} />
      </div>
    </div>
  );
}
