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

type OverviewData = {
  reserveBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  outstandingLoans: number;
  activeAdvances: number;
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
        ticks: { color: '#94A3B8', font: { family: 'Inter', size: 12 } }
      },
      y: {
        grid: { color: '#334155', drawBorder: false, borderDash: [4, 4] },
        ticks: { color: '#94A3B8', font: { family: 'Inter', size: 12 }, maxTicksLimit: 5 }
      }
    }
  };

  // Mock data for charts (would be replaced by real API data in the future)
  const revExpData = {
    labels: ['Feb', 'Mar', 'Jun', 'Dec'],
    datasets: [
      {
        label: 'Revenue',
        data: [80, 60, 95, 75],
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, '#06b6d4'); // Cyan
          gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
          return gradient;
        },
        borderRadius: 50,
        barPercentage: 0.3,
        categoryPercentage: 0.8,
        borderWidth: { top: 1, right: 1, bottom: 0, left: 1 },
        borderColor: '#06b6d4'
      },
      {
        label: 'Expenses',
        data: [40, 30, 60, 45],
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, '#a855f7'); // Purple
          gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
          return gradient;
        },
        borderRadius: 50,
        barPercentage: 0.3,
        categoryPercentage: 0.8,
        borderWidth: { top: 1, right: 1, bottom: 0, left: 1 },
        borderColor: '#a855f7'
      }
    ]
  };

  const cashFlowData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Net Cash',
        data: [150, 220, 180, 350, 210, 320],
        borderColor: '#06b6d4', // Cyan
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
          gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
          return gradient;
        },
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 0
      },
      {
        label: 'Expenses',
        data: [80, 150, 120, 200, 160, 240],
        borderColor: '#a855f7', // Purple
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(168, 85, 247, 0.4)');
          gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
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
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', fontFamily: 'serif' }}>Shohoj Ledger - Premium Dark Dashboard</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#94a3b8' }}>A premium, soft-UI financial dashboard</p>
        </div>
        
        {/* Weather Widget */}
        <div className="glass-panel" style={{ display: 'flex', gap: '16px', padding: '12px 20px', borderRadius: '12px', alignItems: 'center', maxWidth: '350px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '24px' }}>⛅</span>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>27°C</span>
              <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>26°</span>
            </div>
          </div>
          <div>
            <span style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Daily Tip</span>
            <span style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4, display: 'block' }}>
              Breach your mornsy svetiwas: Alex, and hwnt mvt.came down iteep hant.
            </span>
          </div>
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
          <div style={{ width: '36px', height: '36px', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: '0 0 15px rgba(6, 182, 212, 0.2)' }}>
            <span className="material-symbols-outlined" style={{ color: '#06b6d4', fontSize: '18px' }}>attach_money</span>
          </div>
          <span style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Total Income</span>
          <span style={{ fontSize: '28px', fontWeight: 'bold' }}>{formatCurrency(data.totalIncome)}</span>
        </div>

        {/* Total Expenses */}
        <div className="glass-card topo-bg" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px' }}>
          <div style={{ width: '36px', height: '36px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: '0 0 15px rgba(168, 85, 247, 0.2)' }}>
            <span className="material-symbols-outlined" style={{ color: '#a855f7', fontSize: '18px' }}>account_balance_wallet</span>
          </div>
          <span style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Total Expenses</span>
          <span style={{ fontSize: '28px', fontWeight: 'bold' }}>{formatCurrency(data.totalExpenses)}</span>
        </div>

        {/* Reserve Balance */}
        <div className="glass-card topo-bg" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px' }}>
          <div style={{ width: '36px', height: '36px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: '0 0 15px rgba(59, 130, 246, 0.2)' }}>
            <span className="material-symbols-outlined" style={{ color: '#3b82f6', fontSize: '18px' }}>savings</span>
          </div>
          <span style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Reserve Balance</span>
          <span style={{ fontSize: '28px', fontWeight: 'bold' }}>{formatCurrency(data.reserveBalance)}</span>
        </div>

        {/* Due Balance */}
        <div className="glass-card topo-bg" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px' }}>
          <div style={{ width: '36px', height: '36px', background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.3)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: '0 0 15px rgba(14, 165, 233, 0.2)' }}>
            <span className="material-symbols-outlined" style={{ color: '#0ea5e9', fontSize: '18px' }}>calendar_today</span>
          </div>
          <span style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Due Balance</span>
          <span style={{ fontSize: '28px', fontWeight: 'bold' }}>{formatCurrency(data.activeAdvances)}</span>
        </div>

        {/* Pending Payments */}
        <div className="glass-card topo-bg" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px' }}>
          <div style={{ width: '36px', height: '36px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: '0 0 15px rgba(139, 92, 246, 0.2)' }}>
            <span className="material-symbols-outlined" style={{ color: '#8b5cf6', fontSize: '18px' }}>pending_actions</span>
          </div>
          <span style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Pending Payments</span>
          <span style={{ fontSize: '28px', fontWeight: 'bold' }}>0</span>
        </div>

        {/* Active Loans */}
        <div className="glass-card topo-bg" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px' }}>
          <div style={{ width: '36px', height: '36px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: '0 0 15px rgba(99, 102, 241, 0.2)' }}>
            <span className="material-symbols-outlined" style={{ color: '#6366f1', fontSize: '18px' }}>monetization_on</span>
          </div>
          <span style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Active Loans</span>
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
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Month ⌄</div>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <Bar data={revExpData} options={chartOptions as any} />
          </div>
        </div>

        {/* Cash Flow Line Chart */}
        <div className="glass-card" style={{ padding: '24px', height: '360px', display: 'flex', flexDirection: 'column', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, fontFamily: 'serif' }}>Cash Flow</h3>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Month ⌄</div>
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
            <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '12px', fontWeight: 'normal' }}>Date</th>
              <th style={{ padding: '12px', fontWeight: 'normal' }}>Category</th>
              <th style={{ padding: '12px', fontWeight: 'normal', textAlign: 'right' }}>Amount</th>
              <th style={{ padding: '12px', fontWeight: 'normal', textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '14px' }}>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <td style={{ padding: '16px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', background: 'rgba(59,130,246,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justify: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#3b82f6', margin: 'auto' }}>receipt_long</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 500 }}>Bcoiment</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Dollar</div>
                  </div>
                </div>
              </td>
              <td style={{ padding: '16px 12px', color: '#94a3b8' }}>06/1/2024</td>
              <td style={{ padding: '16px 12px', textAlign: 'right', color: '#a855f7' }}>-$1,000.00</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <td style={{ padding: '16px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', background: 'rgba(59,130,246,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justify: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#3b82f6', margin: 'auto' }}>sync_alt</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 500 }}>Seniment</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Dollar</div>
                  </div>
                </div>
              </td>
              <td style={{ padding: '16px 12px', color: '#94a3b8' }}>06/1/2023</td>
              <td style={{ padding: '16px 12px', textAlign: 'right', color: '#a855f7' }}>-$3,000.00</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <td style={{ padding: '16px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', background: 'rgba(59,130,246,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justify: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#3b82f6', margin: 'auto' }}>account_balance</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 500 }}>Payment</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Bank</div>
                  </div>
                </div>
              </td>
              <td style={{ padding: '16px 12px', color: '#94a3b8' }}>08/1/2023</td>
              <td style={{ padding: '16px 12px', textAlign: 'right', color: '#a855f7' }}>-$2,000.00</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}
