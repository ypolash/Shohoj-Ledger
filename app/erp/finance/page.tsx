"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { FinanceToolbar } from './components/FinanceToolbar';
import { FinanceFilters } from './components/FinanceFilters';
import { FinanceKPICards } from './components/FinanceKPICards';
import { RevenueWidget } from './components/RevenueWidget';
import { ExpenseWidget } from './components/ExpenseWidget';
import { CashFlowWidget } from './components/CashFlowWidget';
import { ProfitLossWidget } from './components/ProfitLossWidget';
import { BalanceWidget } from './components/BalanceWidget';
import { OutstandingWidget } from './components/OutstandingWidget';
import { IncomeExpenseChart } from './components/IncomeExpenseChart';
import { CashFlowChart } from './components/CashFlowChart';
import { RevenueTrendChart } from './components/RevenueTrendChart';
import { ExpenseTrendChart } from './components/ExpenseTrendChart';
import { AccountBalanceTable } from './components/AccountBalanceTable';
import { RecentTransactions } from './components/RecentTransactions';
import { FinancialSummary } from './components/FinancialSummary';
import { BudgetSummary } from './components/BudgetSummary';
import { FinanceQuickActions } from './components/FinanceQuickActions';

export default function FinanceDashboardPage() {
  const [financeData, setFinanceData] = useState<any>(null);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [financeRes, overviewRes] = await Promise.all([
        fetch("/api/finance/dashboard"),
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
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading || !financeData) {
    return (
      <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="text-slate-500 animate-pulse flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-4xl">hourglass_empty</span>
          <span>Calculating Ledger Balances...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      <FinanceToolbar />
      <FinanceFilters />
      
      {/* KPI Cards Row */}
      <div style={{ marginBottom: '24px' }}>
        <FinanceKPICards data={financeData} />
      </div>

      {/* Action & Overview Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div>
          <BalanceWidget data={financeData} />
        </div>
        <div>
          <OutstandingWidget data={financeData} />
        </div>
        <div>
          <FinanceQuickActions />
        </div>
      </div>
      
      {/* Top Widgets Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <RevenueWidget data={financeData} />
        <ExpenseWidget data={financeData} />
        <CashFlowWidget data={financeData} />
        <ProfitLossWidget data={financeData} />
      </div>

      {/* Main Charts & Summaries */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateRows: '1fr', gap: '24px', gridColumn: 'span 2' }}>
          <IncomeExpenseChart data={financeData} />
        </div>
        <div style={{ display: 'grid', gridTemplateRows: '1fr', gap: '24px' }}>
          <CashFlowChart data={financeData} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateRows: '1fr', gap: '24px', gridColumn: 'span 2' }}>
          <RevenueTrendChart data={financeData} />
        </div>
        <div style={{ display: 'grid', gridTemplateRows: '1fr', gap: '24px', gridColumn: 'span 2' }}>
          <ExpenseTrendChart data={financeData} />
        </div>
      </div>

      {/* Tables and Info Columns */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
        <AccountBalanceTable />
        <RecentTransactions transactions={overviewData?.recentTransactions || []} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div>
          <FinancialSummary data={financeData} />
        </div>
        <div>
          <BudgetSummary data={financeData} />
        </div>
      </div>
      
    </div>
  );
}
