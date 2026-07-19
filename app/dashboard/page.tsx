"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
import { Bar, Line } from 'react-chartjs-2';

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

type TransactionData = {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: { name: string } | string | null;
  amount: number;
  date: string;
  subtitle: string | null;
};

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
  recentTransactions: TransactionData[];
};


export default function DashboardIndex() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await fetch("/api/overview");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val));
  };

  // Chart Configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1F2937',
        titleColor: '#F8FAFC',
        bodyColor: '#c3c6d7',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        boxPadding: 4
      }
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { color: '#64748b', font: { family: 'Inter', size: 12 } }
      },
      y: {
        grid: { color: '#f1f5f9', drawBorder: false, borderDash: [4, 4] },
        ticks: { color: '#64748b', font: { family: 'Inter', size: 12 }, maxTicksLimit: 5 }
      }
    }
  };

  // Mock data for charts (would be replaced by real API data in the future)
  const revExpData = {
    labels: data?.monthlyData.map(d => d.label) || [],
    datasets: [
      {
        label: 'Revenue',
        data: data?.monthlyData.map(d => d.revenue) || [],
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, '#5B7CFA'); // Primary
          gradient.addColorStop(1, 'rgba(91, 124, 250, 0)');
          return gradient;
        },
        borderRadius: 50,
        barPercentage: 0.3,
        categoryPercentage: 0.8,
        borderWidth: { top: 1, right: 1, bottom: 0, left: 1 },
        borderColor: '#5B7CFA'
      },
      {
        label: 'Expenses',
        data: data?.monthlyData.map(d => d.expense) || [],
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, '#EF4444'); // Danger
          gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
          return gradient;
        },
        borderRadius: 50,
        barPercentage: 0.3,
        categoryPercentage: 0.8,
        borderWidth: { top: 1, right: 1, bottom: 0, left: 1 },
        borderColor: '#EF4444'
      }
    ]
  };

  const cashFlowData = {
    labels: data?.monthlyData.map(d => d.label) || [],
    datasets: [
      {
        label: 'Net Cash',
        data: data?.monthlyData.map(d => d.netCash) || [],
        borderColor: '#10B981', // Success/Secondary
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
          return gradient;
        },
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 0
      },
      {
        label: 'Expenses',
        data: data?.monthlyData.map(d => d.expense) || [],
        borderColor: '#EF4444', // Danger
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
          gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
          return gradient;
        },
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 0
      }
    ]
  };

  if (loading || !data) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading metrics...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      
      {/* Dashboard Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', fontFamily: 'serif', color: 'var(--text)' }}>Shohoj Ledger - Premium Dashboard</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>A premium, soft-UI financial dashboard</p>
        </div>
      </div>

      {/* Bento Grid Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '24px',
        marginBottom: '24px'
      }}>
        
        {/* Total Income */}
        <div className="glass-card topo-bg" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px' }}>
          <div style={{ width: '36px', height: '36px', background: 'var(--success-glow)', border: '1px solid var(--success)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--success)', fontSize: '18px' }}>attach_money</span>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Income</span>
          <span style={{ fontSize: '28px', fontWeight: 'bold' }}>{formatCurrency(data.totalIncome)}</span>
        </div>

        {/* Total Expenses */}
        <div className="glass-card topo-bg" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px' }}>
          <div style={{ width: '36px', height: '36px', background: 'var(--danger-glow)', border: '1px solid var(--danger)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--danger)', fontSize: '18px' }}>account_balance_wallet</span>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Expenses</span>
          <span style={{ fontSize: '28px', fontWeight: 'bold' }}>{formatCurrency(data.totalExpenses)}</span>
        </div>

        {/* Reserve Balance */}
        <div className="glass-card topo-bg" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px' }}>
          <div style={{ width: '36px', height: '36px', background: 'var(--primary-glow)', border: '1px solid var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '18px' }}>savings</span>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Reserve Balance</span>
          <span style={{ fontSize: '28px', fontWeight: 'bold' }}>{formatCurrency(data.reserveBalance)}</span>
        </div>

        {/* Due Balance */}
        <div className="glass-card topo-bg" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px' }}>
          <div style={{ width: '36px', height: '36px', background: 'var(--danger-glow)', border: '1px solid var(--danger)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--danger)', fontSize: '18px' }}>calendar_today</span>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Due Balance</span>
          <span style={{ fontSize: '28px', fontWeight: 'bold' }}>{formatCurrency(data.activeAdvances)}</span>
        </div>

        {/* Pending Payments */}
        <div className="glass-card topo-bg" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px' }}>
          <div style={{ width: '36px', height: '36px', background: 'var(--warning)', border: '1px solid var(--warning)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--text-inverse)', fontSize: '18px' }}>pending_actions</span>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Pending Payments</span>
          <span style={{ fontSize: '28px', fontWeight: 'bold' }}>0</span>
        </div>

        {/* Active Loans */}
        <div className="glass-card topo-bg" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px' }}>
          <div style={{ width: '36px', height: '36px', background: 'var(--primary-glow)', border: '1px solid var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '18px' }}>monetization_on</span>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Active Loans</span>
          <span style={{ fontSize: '28px', fontWeight: 'bold' }}>{data.outstandingLoans > 0 ? formatCurrency(data.outstandingLoans) : '0'}</span>
        </div>

      </div>

      {/* Charts Section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Revenue vs Expense Chart */}
        <div className="glass-card" style={{ padding: '20px', height: '360px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, fontFamily: 'serif' }}>Revenue vs Expense</h3>
            <div style={{ background: 'var(--border-light)', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', color: 'var(--text)' }}>Month ⌄</div>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <Bar data={revExpData} options={chartOptions as any} />
          </div>
        </div>

        {/* Cash Flow Line Chart */}
        <div className="glass-card" style={{ padding: '24px', height: '360px', display: 'flex', flexDirection: 'column', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, fontFamily: 'serif' }}>Cash Flow</h3>
            <div style={{ background: 'var(--border-light)', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', color: 'var(--text)' }}>Month ⌄</div>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <Line data={cashFlowData} options={chartOptions as any} />
          </div>
        </div>
      </div>
      
      {/* Recent Transactions Table */}
      <div className="glass-card" style={{ padding: '24px', overflowX: 'auto', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, fontFamily: 'serif' }}>Recent Transactions</h3>

          <Link href="/dashboard/income" style={{ color: 'var(--primary)', fontSize: '12px', fontWeight: 600 }}>View Complete Ledger &rarr;</Link>
        </div>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--border-light)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '12px', fontWeight: 'normal' }}>Date</th>
              <th style={{ padding: '12px', fontWeight: 'normal' }}>Category</th>
              <th style={{ padding: '12px', fontWeight: 'normal', textAlign: 'right' }}>Amount</th>
              <th style={{ padding: '12px', fontWeight: 'normal', textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '14px' }}>
            {data.recentTransactions.length > 0 ? (
              data.recentTransactions.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', background: tx.type === 'INCOME' ? 'var(--success-glow)' : 'var(--danger-glow)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: tx.type === 'INCOME' ? 'var(--success)' : 'var(--danger)', margin: 'auto' }}>
                          {tx.type === 'INCOME' ? 'arrow_downward' : 'arrow_upward'}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: 'var(--text)' }}>
                          {typeof tx.category === 'object' && tx.category !== null ? tx.category.name : (tx.category || 'Uncategorized')}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{tx.subtitle || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 12px', color: 'var(--text-muted)' }}>{new Date(tx.date).toLocaleDateString()}</td>
                  <td style={{ padding: '16px 12px', textAlign: 'right', color: tx.type === 'INCOME' ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                    {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </td>
                  <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, background: 'var(--border-light)', color: 'var(--text-muted)' }}>
                      Completed
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                  No recent transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
