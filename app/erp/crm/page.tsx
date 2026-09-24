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
import { Line } from 'react-chartjs-2';

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
  const [followUpData, setFollowUpData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchFollowUps();
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

  const fetchFollowUps = async () => {
    try {
      const res = await fetch(`/api/crm/follow-ups?take=5`);
      if (res.ok) {
        const json = await res.json();
        setFollowUpData(json);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatCurrency = (val: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0
    }).format(Number(val || 0));
  };

  const metrics = data?.metrics || {};
  const charts = data?.charts || {};
  const followUpCounts = followUpData?.counts || { today: 0, upcoming: 0, overdue: 0 };
  const upcomingFollowUps = followUpData?.data || [];

  const sortedMonths = Object.keys(charts.monthlyLeads || {}).sort();

  const lineChartData = {
    labels: sortedMonths,
    datasets: [
      {
        label: 'New Leads Created',
        data: sortedMonths.map((m) => charts.monthlyLeads[m]),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      },
    ],
  };

  return (
    <div className="animate-fade-in w-full" style={{ padding: '0 0 var(--spacing-6) 0' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: 'var(--spacing-6)',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: 'var(--text-main)' }}>
            CRM & Sales Overview
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>
            Track leads, appointments, customer follow-ups, and sales pipeline.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link
            href="/erp/crm/follow-ups"
            className="btn hover-lift"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              background: 'var(--surface-card)',
              border: '1px solid var(--border-main)',
              color: 'var(--text-main)',
              textDecoration: 'none',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#8b5cf6' }}>
              event_upcoming
            </span>
            <span>Follow-Ups ({followUpCounts.today + followUpCounts.upcoming})</span>
          </Link>

          <Link
            href="/erp/crm/leads"
            className="btn btn-primary hover-lift"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              view_kanban
            </span>
            <span>View Pipeline</span>
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 'var(--spacing-5)' }}>
          {[
            { label: "Today's Appointments", value: followUpCounts.today, color: '#3b82f6', glow: 'primary' },
            { label: 'Upcoming Later', value: followUpCounts.upcoming, color: '#8b5cf6', glow: 'accent' },
            { label: 'Overdue Follow-ups', value: followUpCounts.overdue, color: '#ef4444', glow: 'danger' },
            { label: 'Total Leads', value: metrics.totalLeads || 0, color: 'var(--text-main)', glow: 'accent' },
            { label: 'Qualified Leads', value: metrics.qualifiedLeads || 0, color: 'var(--warning)', glow: 'warning' },
            { label: 'Won Leads', value: metrics.wonLeads || 0, color: 'var(--success)', glow: 'success' },
            { label: 'Pipeline Value', value: formatCurrency(metrics.pipelineValue), color: 'var(--warning)', glow: 'warning' },
            { label: 'Total Sales (Won)', value: formatCurrency(metrics.wonValue), color: 'var(--success)', glow: 'success' },
          ].map((kpi, idx) => (
            <div key={idx} className={`glass-panel hover-lift glow-border-${kpi.glow}`} style={{ padding: '24px', borderRadius: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '8px' }}>
                {kpi.label}
              </h3>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: kpi.color, letterSpacing: '-0.5px' }}>
                {isLoading ? '...' : kpi.value}
              </div>
            </div>
          ))}
        </div>

        {/* Charts & Tables */}
        <div className="grid-responsive-charts">
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4) 0', color: 'var(--text-main)' }}>
              Monthly Lead Generation
            </h2>
            <div style={{ height: '300px' }}>
              {!isLoading && (
                <Line
                  data={lineChartData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { grid: { display: false } },
                      y: { grid: { color: 'rgba(255,255,255,0.05)' } },
                    },
                  }}
                />
              )}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4) 0', color: 'var(--text-main)' }}>
              Top Sales Performers
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {!isLoading && charts.topSalesPersons?.length > 0 ? (
                charts.topSalesPersons.map((p: any, idx: number) => (
                  <div
                    key={idx}
                    className="hover-lift"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '16px',
                      backgroundColor: 'var(--surface-hover)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-main)',
                    }}
                  >
                    <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{p.name}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>{formatCurrency(p.value)}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.won} Deals</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px', fontSize: '14px' }}>
                  No deals closed yet.
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
              <h2 style={{ fontSize: '16px', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ color: '#8b5cf6', fontSize: '20px' }}>
                  event_upcoming
                </span>
                Upcoming Appointments & Follow-Ups
              </h2>
              <Link
                href="/erp/crm/follow-ups"
                style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}
              >
                View All →
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {upcomingFollowUps.length > 0 ? (
                upcomingFollowUps.map((item: any) => (
                  <div
                    key={item.id}
                    className="hover-lift"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      backgroundColor: 'var(--surface-hover)',
                      borderRadius: '10px',
                      border: '1px solid var(--border-main)',
                      gap: '12px',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>👤 {item.customer?.name}</span>
                        <span>·</span>
                        <span>{new Date(item.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                    </div>

                    <Link
                      href="/erp/crm/follow-ups"
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'var(--primary-glow)',
                        color: 'var(--primary)',
                        fontSize: '11px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Follow Up
                    </Link>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0', fontSize: '13px' }}>
                  No upcoming follow-ups scheduled.{' '}
                  <Link href="/erp/crm/follow-ups" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                    Book an appointment
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
