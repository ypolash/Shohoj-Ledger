"use client";

import React, { useState, useEffect } from 'react';
import styles from "../../income/page.module.css";
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function FinanceDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/finance/dashboard`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (val: string | number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val || 0));
  };

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};

  const sortedMonths = Object.keys(charts.monthlyData || {}).sort();
  
  const lineChartData = {
    labels: sortedMonths,
    datasets: [
      {
        label: 'Income',
        data: sortedMonths.map(m => charts.monthlyData[m].income),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
      },
      {
        label: 'Expense',
        data: sortedMonths.map(m => charts.monthlyData[m].expense),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
      },
    ],
  };

  const profitChartData = {
    labels: sortedMonths,
    datasets: [
      {
        label: 'Monthly Profit',
        data: sortedMonths.map(m => charts.monthlyData[m].profit),
        backgroundColor: sortedMonths.map(m => charts.monthlyData[m].profit >= 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)'),
      },
    ],
  };

  const expensePieData = {
    labels: charts.expenseCategories?.map((c: any) => c.label) || [],
    datasets: [
      {
        data: charts.expenseCategories?.map((c: any) => c.value) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
        ],
      },
    ],
  };

  const revenuePieData = {
    labels: charts.revenueCategories?.map((c: any) => c.label) || [],
    datasets: [
      {
        data: charts.revenueCategories?.map((c: any) => c.value) || [],
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(153, 102, 255, 0.7)',
        ],
      },
    ],
  };

  return (
    <div className="animate-fade-in container">
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <div>
          <h1 style={{ margin: 0 }}>Financial Overview</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>
            High-level summary of your company's financial health.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/dashboard/reports/finance" className="btn btn-secondary">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>analytics</span>
            Reports Hub
          </Link>
          <Link href="/dashboard/finance/ledger" className="btn btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>account_balance</span>
            View Ledger
          </Link>
        </div>
      </div>

      <div className={styles.container}>
        
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-5)', marginBottom: 'var(--spacing-6)' }}>
          {[
            { label: 'Total Revenue', value: kpis.revenue, color: 'var(--success)' },
            { label: 'Total Expenses', value: kpis.expenses, color: 'var(--danger)' },
            { label: 'Net Profit', value: kpis.profit, color: kpis.profit >= 0 ? 'var(--success)' : 'var(--danger)' },
            { label: 'Cash Balance', value: kpis.cash, color: 'var(--text)' },
            { label: 'Bank Balance', value: kpis.bank, color: 'var(--text)' },
            { label: 'Reserves', value: kpis.reserve, color: 'var(--primary)' },
            { label: 'Payroll Outflow', value: kpis.payroll, color: 'var(--warning)' },
            { label: 'Outstanding Loans', value: kpis.loanOutstanding, color: 'var(--warning)' },
            { label: 'Outstanding Advances', value: kpis.advanceOutstanding, color: 'var(--warning)' },
            { label: 'Net Cash Flow', value: kpis.cashFlow, color: kpis.cashFlow >= 0 ? 'var(--success)' : 'var(--danger)' },
          ].map((kpi, idx) => (
            <div key={idx} className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
              <h3 style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>{kpi.label}</h3>
              <div style={{ fontSize: '20px', fontWeight: 700, color: kpi.color, marginTop: '8px' }}>
                {isLoading ? '...' : formatCurrency(kpi.value)}
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-6)' }}>
          <div className="glass-card">
            <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4) 0' }}>Income vs Expense Trend</h2>
            <div style={{ height: '300px' }}>
              {!isLoading && <Line data={lineChartData} options={{ maintainAspectRatio: false }} />}
            </div>
          </div>
          
          <div className="glass-card">
            <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4) 0' }}>Monthly Profit</h2>
            <div style={{ height: '300px' }}>
              {!isLoading && <Bar data={profitChartData} options={{ maintainAspectRatio: false }} />}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-6)' }}>
          <div className="glass-card">
            <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4) 0' }}>Expense Breakdown</h2>
            <div style={{ height: '250px', display: 'flex', justifyContent: 'center' }}>
              {!isLoading && charts.expenseCategories?.length > 0 ? (
                <Pie data={expensePieData} options={{ maintainAspectRatio: false }} />
              ) : (
                <div style={{ alignSelf: 'center', color: 'var(--text-muted)' }}>No data</div>
              )}
            </div>
          </div>

          <div className="glass-card">
            <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4) 0' }}>Revenue Breakdown</h2>
            <div style={{ height: '250px', display: 'flex', justifyContent: 'center' }}>
              {!isLoading && charts.revenueCategories?.length > 0 ? (
                <Pie data={revenuePieData} options={{ maintainAspectRatio: false }} />
              ) : (
                <div style={{ alignSelf: 'center', color: 'var(--text-muted)' }}>No data</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
