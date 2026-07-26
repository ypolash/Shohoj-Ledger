"use client";

import React from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface BusinessChartsProps {
  data: any;
  role: string;
}

export function BusinessCharts({ data, role }: BusinessChartsProps) {
  if (!data) return null;

  const showFinance = ['Owner', 'CEO', 'Accountant'].includes(role);
  const showSales = ['Owner', 'CEO', 'Sales'].includes(role);

  const getCssVar = (variable: string, fallback: string = '') => {
    if (typeof document !== 'undefined') {
      return getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || fallback;
    }
    return fallback;
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: getCssVar('--gray-800', '#1f2937'),
        titleColor: getCssVar('--gray-50', '#f9fafb'),
        bodyColor: getCssVar('--gray-300', '#d1d5db'),
        borderColor: getCssVar('--gray-700', '#374151'),
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        boxPadding: 4
      }
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { color: getCssVar('--text-muted', '#6b7280'), font: { family: getCssVar('--font-sans', 'sans-serif'), size: 12 } }
      },
      y: {
        grid: { color: getCssVar('--border-light', '#e5e7eb'), drawBorder: false, borderDash: [4, 4] },
        ticks: { color: getCssVar('--text-muted', '#6b7280'), font: { family: getCssVar('--font-sans', 'sans-serif'), size: 12 }, maxTicksLimit: 5 }
      }
    }
  };

  const donutOptions = {
    ...chartOptions,
    scales: undefined,
  };

  const revExpData = {
    labels: data?.monthlyData?.map((d: any) => d.label) || [],
    datasets: [
      {
        label: 'Revenue',
        data: data?.monthlyData?.map((d: any) => d.revenue) || [],
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, getCssVar('--primary', '#3b82f6')); 
          gradient.addColorStop(1, 'transparent');
          return gradient;
        },
        borderRadius: 50,
        barPercentage: 0.3,
        categoryPercentage: 0.8,
        borderWidth: { top: 1, right: 1, bottom: 0, left: 1 },
        borderColor: getCssVar('--primary', '#3b82f6')
      },
      {
        label: 'Expenses',
        data: data?.monthlyData?.map((d: any) => d.expense) || [],
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, getCssVar('--danger', '#ef4444'));
          gradient.addColorStop(1, 'transparent');
          return gradient;
        },
        borderRadius: 50,
        barPercentage: 0.3,
        categoryPercentage: 0.8,
        borderWidth: { top: 1, right: 1, bottom: 0, left: 1 },
        borderColor: getCssVar('--danger', '#ef4444')
      }
    ]
  };

  const cashFlowData = {
    labels: data?.monthlyData?.map((d: any) => d.label) || [],
    datasets: [
      {
        label: 'Net Cash',
        data: data?.monthlyData?.map((d: any) => d.netCash) || [],
        borderColor: getCssVar('--success', '#10b981'), 
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, getCssVar('--success-glow', 'rgba(16, 185, 129, 0.15)'));
          gradient.addColorStop(1, 'transparent');
          return gradient;
        },
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 0
      }
    ]
  };

  const salesFunnelData = {
    labels: ['Leads', 'Qualified', 'Proposals', 'Negotiation', 'Closed'],
    datasets: [{
      data: [300, 150, 75, 30, 15],
      backgroundColor: [
        getCssVar('--primary-300', '#93c5fd'),
        getCssVar('--primary-400', '#60a5fa'),
        getCssVar('--primary-500', '#3b82f6'),
        getCssVar('--primary-600', '#2563eb'),
        getCssVar('--primary-700', '#1d4ed8'),
      ],
      borderWidth: 0,
    }]
  };

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
      gap: '16px',
      marginBottom: '24px'
    }}>
      {showFinance && (
        <>
          <div className="glass-card" style={{ padding: '20px', height: '360px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, fontFamily: 'serif' }}>Revenue vs Expense</h3>
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <Bar data={revExpData} options={chartOptions as any} />
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px', height: '360px', display: 'flex', flexDirection: 'column', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, fontFamily: 'serif' }}>Cash Flow</h3>
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <Line data={cashFlowData} options={chartOptions as any} />
            </div>
          </div>
        </>
      )}

      {showSales && (
        <div className="glass-card" style={{ padding: '24px', height: '360px', display: 'flex', flexDirection: 'column', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, fontFamily: 'serif' }}>Sales Funnel</h3>
          </div>
          <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <Doughnut data={salesFunnelData} options={donutOptions as any} />
          </div>
        </div>
      )}
    </div>
  );
}
