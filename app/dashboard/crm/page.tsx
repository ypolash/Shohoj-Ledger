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
import { Bar, Line } from 'react-chartjs-2';

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

export default function CRMDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/crm/dashboard`);
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

  const metrics = data?.metrics || {};
  const charts = data?.charts || {};

  const sortedMonths = Object.keys(charts.monthlyLeads || {}).sort();
  
  const lineChartData = {
    labels: sortedMonths,
    datasets: [
      {
        label: 'New Leads Created',
        data: sortedMonths.map(m => charts.monthlyLeads[m]),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      },
    ],
  };

  return (
    <div className="animate-fade-in container">
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <div>
          <h1 style={{ margin: 0 }}>CRM & Lead Management</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>
            Track leads, analyze pipeline, and manage sales follow-ups.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/dashboard/crm/leads" className="btn btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>view_kanban</span>
            View Pipeline
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
        
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-5)' }}>
          {[
            { label: 'Total Leads', value: metrics.totalLeads, color: 'var(--primary)' },
            { label: 'New Leads', value: metrics.newLeads, color: 'var(--text)' },
            { label: 'Qualified Leads', value: metrics.qualifiedLeads, color: 'var(--warning)' },
            { label: 'Won Leads', value: metrics.wonLeads, color: 'var(--success)' },
            { label: 'Lost Leads', value: metrics.lostLeads, color: 'var(--danger)' },
            { label: 'Conversion Rate', value: `${metrics.conversionRate || 0}%`, color: 'var(--success)' },
            { label: 'Pipeline Value', value: formatCurrency(metrics.pipelineValue), color: 'var(--warning)' },
            { label: 'Total Sales (Won)', value: formatCurrency(metrics.wonValue), color: 'var(--success)' },
          ].map((kpi, idx) => (
            <div key={idx} className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
              <h3 style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>{kpi.label}</h3>
              <div style={{ fontSize: '20px', fontWeight: 700, color: kpi.color, marginTop: '8px' }}>
                {isLoading ? '...' : kpi.value}
              </div>
            </div>
          ))}
        </div>

        {/* Charts & Tables */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-6)' }}>
          <div className="glass-card">
            <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4) 0' }}>Monthly Lead Generation</h2>
            <div style={{ height: '300px' }}>
              {!isLoading && <Line data={lineChartData} options={{ maintainAspectRatio: false }} />}
            </div>
          </div>
          
          <div className="glass-card">
            <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4) 0' }}>Top Sales Performers</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {!isLoading && charts.topSalesPersons?.length > 0 ? (
                charts.topSalesPersons.map((p: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--background)', borderRadius: '8px' }}>
                    <span style={{ fontWeight: 500 }}>{p.name}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>{formatCurrency(p.value)}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.won} Deals</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>No deals closed yet.</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
