"use client";

import React, { useState, useEffect } from 'react';
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
import { Bar, Line, Doughnut } from 'react-chartjs-2';

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

export default function MarketingDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for the marketing dashboard
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Simulate fetching marketing stats
    setTimeout(() => {
      setData({
        metrics: {
          totalCampaigns: 24,
          activeCampaigns: 5,
          totalReach: 145000,
          conversions: 1240,
          conversionRate: 0.85,
          totalSpend: 45000,
          roi: 240,
        },
        charts: {
          monthlyReach: {
            'Jan': 12000, 'Feb': 19000, 'Mar': 15000, 'Apr': 22000, 'May': 25000, 'Jun': 29000
          },
          channelDistribution: {
            'Social Media': 45,
            'Email': 25,
            'SEO': 20,
            'Paid Ads': 10
          }
        }
      });
      setIsLoading(false);
    }, 800);
  }, []);

  const formatCurrency = (val: string | number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val || 0));
  };

  const metrics = data?.metrics || {};
  const charts = data?.charts || {};

  const sortedMonths = Object.keys(charts.monthlyReach || {});
  
  const lineChartData = {
    labels: sortedMonths,
    datasets: [
      {
        label: 'Audience Reach',
        data: sortedMonths.map(m => charts.monthlyReach[m]),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
      },
    ],
  };

  const doughnutData = {
    labels: Object.keys(charts.channelDistribution || {}),
    datasets: [
      {
        data: Object.values(charts.channelDistribution || {}),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderWidth: 0,
      }
    ]
  };

  return (
    <div className="animate-fade-in w-full" style={{ padding: 'var(--spacing-6)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Marketing Automation</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>
            Manage campaigns, track reach, and measure marketing ROI.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary hover-lift">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>campaign</span>
            New Campaign
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 'var(--spacing-5)' }}>
          {[
            { label: 'Active Campaigns', value: metrics.activeCampaigns, color: 'var(--primary)', glow: 'primary' },
            { label: 'Total Audience Reach', value: metrics.totalReach?.toLocaleString(), color: 'var(--text-main)', glow: 'accent' },
            { label: 'Conversions', value: metrics.conversions?.toLocaleString(), color: 'var(--warning)', glow: 'warning' },
            { label: 'Avg Conversion Rate', value: `${metrics.conversionRate || 0}%`, color: 'var(--success)', glow: 'success' },
            { label: 'Marketing Spend', value: formatCurrency(metrics.totalSpend), color: 'var(--danger)', glow: 'danger' },
            { label: 'Estimated ROI', value: `${metrics.roi || 0}%`, color: 'var(--success)', glow: 'success' },
          ].map((kpi, idx) => (
            <div key={idx} className={`glass-panel hover-lift glow-border-${kpi.glow}`} style={{ padding: '24px', borderRadius: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '8px' }}>{kpi.label}</h3>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: kpi.color, letterSpacing: '-0.5px' }}>
                {isLoading ? '...' : kpi.value}
              </div>
            </div>
          ))}
        </div>

        {/* Charts & Tables */}
        <div className="grid-responsive-charts">
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4) 0', color: 'var(--text-main)' }}>Monthly Reach Trend</h2>
            <div style={{ height: '300px' }}>
              {!isLoading && <Line data={lineChartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(255,255,255,0.05)' } } } }} />}
            </div>
          </div>
          
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4) 0', color: 'var(--text-main)' }}>Channel Distribution</h2>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {!isLoading && (
                <div style={{ width: '250px', height: '250px' }}>
                  <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#ccc' } } } }} />
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
