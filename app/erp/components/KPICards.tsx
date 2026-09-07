"use client";

import React from 'react';
import styles from '../dashboard.module.css';

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
  totalEmployees?: number;
  attendanceToday?: number;
  inventoryValue?: number;
  activeProjects?: number;
  businessType?: string;
};

interface KPICardsProps {
  data: OverviewData | null;
  role: string;
}

const formatCurrency = (val: number | string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(val) || 0);
};

export function KPICards({ data, role }: KPICardsProps) {
  if (!data) return null;

  // Visibility logic
  const showFinance = ['Owner', 'CEO', 'Accountant'].includes(role);
  const showHR = ['Owner', 'CEO', 'HR'].includes(role);
  const businessType = (data.businessType || 'Product + Service').toUpperCase();
  const showProjects = ['Owner', 'CEO', 'Project Manager'].includes(role) && businessType !== 'PRODUCT';
  const showInventory = ['Owner', 'CEO', 'Inventory'].includes(role) && businessType !== 'SERVICE';

  // Calculate dynamic trends from monthlyData if available
  const mData = data.monthlyData || [];
  const currentM = mData.length > 0 ? mData[mData.length - 1] : null;
  const prevM = mData.length > 1 ? mData[mData.length - 2] : null;

  const calculateTrend = (curr: number, prev: number) => {
    if (!prev && !curr) return { text: '0.0%', isPositive: true, isNeutral: true };
    if (!prev && curr > 0) return { text: '+100%', isPositive: true, isNeutral: false };
    if (prev > 0 && curr === 0) return { text: '-100%', isPositive: false, isNeutral: false };
    if (!prev) return { text: '0.0%', isPositive: true, isNeutral: true };
    const diff = ((curr - prev) / prev) * 100;
    const sign = diff >= 0 ? '+' : '';
    return {
      text: `${sign}${diff.toFixed(1)}%`,
      isPositive: diff >= 0,
      isNeutral: diff === 0
    };
  };

  const incomeTrend = calculateTrend(currentM?.revenue || 0, prevM?.revenue || 0);
  const expenseTrend = calculateTrend(currentM?.expense || 0, prevM?.expense || 0);

  // Financial secondary calculations
  const netMargin = data.totalIncome > 0
    ? (((data.totalIncome - data.totalExpenses) / data.totalIncome) * 100).toFixed(1)
    : '0.0';

  const totalPayables = (data.activeAdvances || 0) + (data.outstandingLoans || 0);

  // HR calculations
  const totalEmp = data.totalEmployees || 0;
  const attToday = data.attendanceToday || 0;
  const attendancePercent = totalEmp > 0 ? Math.round((attToday / totalEmp) * 100) : 0;

  return (
    <div className={styles.kpiGrid}>
      {/* 1. Total Income */}
      {showFinance && (
        <div className={`${styles.kpiCard} ${styles.kpiGlowIncome}`}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconWrapper} style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <span className="material-symbols-outlined" style={{ color: '#34d399', fontSize: '24px' }}>
                trending_up
              </span>
            </div>
            <span className={`${styles.trendBadge} ${incomeTrend.isNeutral ? styles.trendNeutral : incomeTrend.isPositive ? styles.trendPositive : styles.trendNegative}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                {incomeTrend.isNeutral ? 'remove' : incomeTrend.isPositive ? 'arrow_upward' : 'arrow_downward'}
              </span>
              {incomeTrend.text}
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Total Inflow (Revenue)</span>
            <div className={styles.kpiValue}>{formatCurrency(data.totalIncome)}</div>
          </div>
          <div className={styles.kpiFooter}>
            <span>Net Margin: <strong style={{ color: Number(netMargin) >= 0 ? '#34d399' : '#f87171' }}>{netMargin}%</strong></span>
            <span>Recorded Cash</span>
          </div>
        </div>
      )}

      {/* 2. Total Expenses */}
      {showFinance && (
        <div className={`${styles.kpiCard} ${styles.kpiGlowExpense}`}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconWrapper} style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <span className="material-symbols-outlined" style={{ color: '#f87171', fontSize: '24px' }}>
                trending_down
              </span>
            </div>
            <span className={`${styles.trendBadge} ${expenseTrend.isNeutral ? styles.trendNeutral : expenseTrend.isPositive ? styles.trendNegative : styles.trendPositive}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                {expenseTrend.isNeutral ? 'remove' : expenseTrend.isPositive ? 'arrow_upward' : 'arrow_downward'}
              </span>
              {expenseTrend.text}
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Total Operating Outflow</span>
            <div className={styles.kpiValue}>{formatCurrency(data.totalExpenses)}</div>
          </div>
          <div className={styles.kpiFooter}>
            <span>Approved & Posted</span>
            <span>Operational Cost</span>
          </div>
        </div>
      )}

      {/* 3. Reserve Balance */}
      {showFinance && (
        <div className={`${styles.kpiCard} ${styles.kpiGlowPrimary}`}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconWrapper} style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <span className="material-symbols-outlined" style={{ color: '#60a5fa', fontSize: '24px' }}>
                account_balance
              </span>
            </div>
            <span className={`${styles.trendBadge} ${styles.trendPositive}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>shield</span>
              Liquid
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Net Reserve Balance</span>
            <div className={styles.kpiValue}>{formatCurrency(data.reserveBalance)}</div>
          </div>
          <div className={styles.kpiFooter}>
            <span>Liquid Capital</span>
            <span>Available Reserves</span>
          </div>
        </div>
      )}

      {/* 4. Payables & Liabilities */}
      {showFinance && (
        <div className={`${styles.kpiCard} ${styles.kpiGlowWarning}`}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconWrapper} style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <span className="material-symbols-outlined" style={{ color: '#fbbf24', fontSize: '24px' }}>
                receipt_long
              </span>
            </div>
            <span className={`${styles.trendBadge} ${styles.trendNeutral}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
              Pending
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Outstanding Payables & Loans</span>
            <div className={styles.kpiValue}>{formatCurrency(totalPayables)}</div>
          </div>
          <div className={styles.kpiFooter}>
            <span>Loans: {formatCurrency(data.outstandingLoans)}</span>
            <span>Advances: {formatCurrency(data.activeAdvances)}</span>
          </div>
        </div>
      )}

      {/* 5. HR Metrics */}
      {showHR && (
        <>
          <div className={`${styles.kpiCard} ${styles.kpiGlowPrimary}`}>
            <div className={styles.kpiTopRow}>
              <div className={styles.kpiIconWrapper} style={{ background: 'rgba(14, 165, 233, 0.15)', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
                <span className="material-symbols-outlined" style={{ color: '#38bdf8', fontSize: '24px' }}>badge</span>
              </div>
              <span className={`${styles.trendBadge} ${styles.trendPositive}`}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>group</span>
                Active
              </span>
            </div>
            <div className={styles.kpiBody}>
              <span className={styles.kpiLabel}>Total Workforce</span>
              <div className={styles.kpiValue}>{totalEmp} Employees</div>
            </div>
            <div className={styles.kpiFooter}>
              <span>Registered Staff</span>
              <span>All Departments</span>
            </div>
          </div>

          <div className={`${styles.kpiCard} ${styles.kpiGlowIncome}`}>
            <div className={styles.kpiTopRow}>
              <div className={styles.kpiIconWrapper} style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <span className="material-symbols-outlined" style={{ color: '#34d399', fontSize: '24px' }}>how_to_reg</span>
              </div>
              <span className={`${styles.trendBadge} ${attendancePercent >= 80 ? styles.trendPositive : styles.trendWarning}`}>
                {attendancePercent}%
              </span>
            </div>
            <div className={styles.kpiBody}>
              <span className={styles.kpiLabel}>Attendance Today</span>
              <div className={styles.kpiValue}>{attToday} Present</div>
            </div>
            <div className={styles.kpiFooter}>
              <span>Out of {totalEmp} Staff</span>
              <span>Today's Shift</span>
            </div>
          </div>
        </>
      )}

      {/* 6. Inventory Metric */}
      {showInventory && (
        <div className={`${styles.kpiCard} ${styles.kpiGlowPrimary}`}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconWrapper} style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              <span className="material-symbols-outlined" style={{ color: '#818cf8', fontSize: '24px' }}>inventory_2</span>
            </div>
            <span className={`${styles.trendBadge} ${styles.trendPositive}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>warehouse</span>
              Stock
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Inventory Valuation</span>
            <div className={styles.kpiValue}>{formatCurrency(data.inventoryValue || 0)}</div>
          </div>
          <div className={styles.kpiFooter}>
            <span>Warehouse Assets</span>
            <span>FIFO Valuation</span>
          </div>
        </div>
      )}

      {/* 7. Active Projects Metric */}
      {showProjects && (
        <div className={`${styles.kpiCard} ${styles.kpiGlowPrimary}`}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconWrapper} style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
              <span className="material-symbols-outlined" style={{ color: '#c084fc', fontSize: '24px' }}>account_tree</span>
            </div>
            <span className={`${styles.trendBadge} ${styles.trendPositive}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>play_arrow</span>
              Live
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Active Projects</span>
            <div className={styles.kpiValue}>{data.activeProjects || 0} In Progress</div>
          </div>
          <div className={styles.kpiFooter}>
            <span>Ongoing Milestones</span>
            <span>Client Deliverables</span>
          </div>
        </div>
      )}
    </div>
  );
}
