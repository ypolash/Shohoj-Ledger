"use client";

import React, { useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import styles from '../dashboard.module.css';
import { useUI } from '@/lib/contexts/UIContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface BusinessChartsProps {
  data: any;
  role: string;
}

const formatCurrency = (val: number | string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(val) || 0);
};

export function BusinessCharts({ data, role }: BusinessChartsProps) {
  const [viewMode, setViewMode] = useState<'sideBySide' | 'revExp' | 'cashFlow'>('sideBySide');

  if (!data) return null;

  const showFinance = ['Owner', 'CEO', 'Accountant'].includes(role);
  if (!showFinance) return null;

  const monthly = data.monthlyData || [];
  const totalRev = monthly.reduce((acc: number, m: any) => acc + (Number(m.revenue) || 0), 0);
  const totalExp = monthly.reduce((acc: number, m: any) => acc + (Number(m.expense) || 0), 0);
  const totalNet = totalRev - totalExp;

  const hasData = monthly.some((m: any) => (m.revenue || 0) > 0 || (m.expense || 0) > 0);

  const { theme } = useUI();
  const isLight = theme === 'light';

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          color: isLight ? '#475569' : '#94a3b8',
          font: { family: 'inherit', size: 12 },
          boxWidth: 12,
          boxHeight: 12,
          borderRadius: 4,
          useBorderRadius: true
        }
      },
      tooltip: {
        backgroundColor: isLight ? '#ffffff' : '#0f172a',
        titleColor: isLight ? '#0f172a' : '#f8fafc',
        bodyColor: isLight ? '#334155' : '#cbd5e1',
        borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        boxPadding: 4,
        callbacks: {
          label: (context: any) => {
            return ` ${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { color: isLight ? '#475569' : '#64748b', font: { family: 'inherit', size: 12 } }
      },
      y: {
        grid: { color: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.05)', drawBorder: false },
        ticks: {
          color: isLight ? '#475569' : '#64748b',
          font: { family: 'inherit', size: 11 },
          maxTicksLimit: 5,
          callback: (value: any) => formatCurrency(value)
        }
      }
    }
  };

  const revExpData = {
    labels: monthly.map((d: any) => d.label) || [],
    datasets: [
      {
        label: 'Revenue Inflow',
        data: monthly.map((d: any) => d.revenue) || [],
        backgroundColor: '#3b82f6',
        borderRadius: 8,
        barPercentage: 0.5,
        categoryPercentage: 0.7
      },
      {
        label: 'Expense Outflow',
        data: monthly.map((d: any) => d.expense) || [],
        backgroundColor: '#ef4444',
        borderRadius: 8,
        barPercentage: 0.5,
        categoryPercentage: 0.7
      }
    ]
  };

  const cashFlowData = {
    labels: monthly.map((d: any) => d.label) || [],
    datasets: [
      {
        label: 'Net Cash Flow',
        data: monthly.map((d: any) => d.netCash) || [],
        borderColor: '#10b981',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 320);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
          return gradient;
        },
        borderWidth: 3,
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  return (
    <div className={styles.chartPanel}>
      <div className={styles.chartHeader}>
        <div className={styles.chartTitleGroup}>
          <div className={styles.chartTitle}>
            <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#60a5fa' }}>
              insights
            </span>
            Financial Performance Analytics
          </div>
          <span className={styles.chartSub}>Rolling 6-month comparative operational analysis</span>
        </div>

        <div className={styles.chartControls}>
          <div className={styles.chartTabs}>
            <button
              className={`${styles.chartTabBtn} ${viewMode === 'sideBySide' ? styles.chartTabBtnActive : ''}`}
              onClick={() => setViewMode('sideBySide')}
            >
              Side-by-Side
            </button>
            <button
              className={`${styles.chartTabBtn} ${viewMode === 'revExp' ? styles.chartTabBtnActive : ''}`}
              onClick={() => setViewMode('revExp')}
            >
              Revenue vs Expenses
            </button>
            <button
              className={`${styles.chartTabBtn} ${viewMode === 'cashFlow' ? styles.chartTabBtnActive : ''}`}
              onClick={() => setViewMode('cashFlow')}
            >
              Cash Flow Trend
            </button>
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className={styles.chartSummaryRow}>
        <div className={styles.chartSummaryItem}>
          <div className={styles.chartSummaryDot} style={{ background: '#3b82f6' }} />
          <div className={styles.chartSummaryContent}>
            <span className={styles.chartSummaryLabel}>Period Revenue</span>
            <span className={styles.chartSummaryVal}>{formatCurrency(totalRev)}</span>
          </div>
        </div>

        <div className={styles.chartSummaryItem}>
          <div className={styles.chartSummaryDot} style={{ background: '#ef4444' }} />
          <div className={styles.chartSummaryContent}>
            <span className={styles.chartSummaryLabel}>Period Expenses</span>
            <span className={styles.chartSummaryVal}>{formatCurrency(totalExp)}</span>
          </div>
        </div>

        <div className={styles.chartSummaryItem}>
          <div className={styles.chartSummaryDot} style={{ background: '#10b981' }} />
          <div className={styles.chartSummaryContent}>
            <span className={styles.chartSummaryLabel}>Net Cash Flow</span>
            <span className={styles.chartSummaryVal} style={{ color: totalNet >= 0 ? '#34d399' : '#f87171' }}>
              {formatCurrency(totalNet)}
            </span>
          </div>
        </div>
      </div>

      {/* Chart Canvas Rendering */}
      {viewMode === 'sideBySide' && (
        <div className={styles.sideBySideGrid}>
          <div style={{ height: '300px', position: 'relative' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '12px' }}>
              Revenue & Expense Comparison
            </h4>
            <div style={{ height: '260px', position: 'relative' }}>
              <Bar data={revExpData} options={chartOptions} />
            </div>
          </div>

          <div style={{ height: '300px', position: 'relative' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '12px' }}>
              Net Cash Flow Trajectory
            </h4>
            <div style={{ height: '260px', position: 'relative' }}>
              <Line data={cashFlowData} options={chartOptions} />
            </div>
          </div>
        </div>
      )}

      {viewMode === 'revExp' && (
        <div className={styles.chartCanvasContainer}>
          <Bar data={revExpData} options={chartOptions} />
        </div>
      )}

      {viewMode === 'cashFlow' && (
        <div className={styles.chartCanvasContainer}>
          <Line data={cashFlowData} options={chartOptions} />
        </div>
      )}
    </div>
  );
}
