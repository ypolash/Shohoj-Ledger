import React from 'react';
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
  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      <FinanceToolbar />
      <FinanceFilters />
      
      {/* KPI Cards Row */}
      <div style={{ marginBottom: '24px' }}>
        <FinanceKPICards />
      </div>
      
      {/* Top Widgets Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <RevenueWidget />
        <ExpenseWidget />
        <CashFlowWidget />
        <ProfitLossWidget />
      </div>

      {/* Main Charts & Summaries */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateRows: '1fr', gap: '24px', gridColumn: 'span 2' }}>
          <IncomeExpenseChart />
        </div>
        <div style={{ display: 'grid', gridTemplateRows: '1fr', gap: '24px' }}>
          <CashFlowChart />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateRows: '1fr', gap: '24px', gridColumn: 'span 2' }}>
          <RevenueTrendChart />
        </div>
        <div style={{ display: 'grid', gridTemplateRows: '1fr', gap: '24px', gridColumn: 'span 2' }}>
          <ExpenseTrendChart />
        </div>
      </div>

      {/* Tables and Info Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div style={{ gridColumn: 'span 2' }}>
          <AccountBalanceTable />
        </div>
        <div>
          <BalanceWidget />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div style={{ gridColumn: 'span 2' }}>
          <RecentTransactions />
        </div>
        <div>
          <OutstandingWidget />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div>
          <FinancialSummary />
        </div>
        <div>
          <BudgetSummary />
        </div>
        <div>
          <FinanceQuickActions />
        </div>
      </div>
      
    </div>
  );
}
