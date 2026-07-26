"use client";

import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

export default function ExecutiveDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchBI();
    
    // Auto-refresh every 60 seconds (simulating real-time/preparing for websockets)
    const intervalId = setInterval(fetchBI, 60000);
    return () => clearInterval(intervalId);
  }, [filter]);

  const fetchBI = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/bi?filter=${filter}`);
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
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', notation: "compact", compactDisplay: "short" }).format(Number(val || 0));
  };

  const handleExport = async (format: "CSV" | "PDF") => {
    setIsExporting(true);
    try {
      await fetch(`/api/bi/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, filter })
      });
      
      if (format === "PDF") {
        window.print();
      } else {
        // Simple CSV generation mock
        const csvContent = "data:text/csv;charset=utf-8,Category,Value\\n" + 
          `Total Revenue,${data?.financials?.totalRevenue || 0}\\n` +
          `Total Expenses,${data?.financials?.totalExpenses || 0}\\n` +
          `Net Profit,${data?.financials?.netProfit || 0}\\n`;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Executive_Report_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="animate-fade-in container" id="executive-dashboard">
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: "var(--spacing-6)" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', background: 'linear-gradient(90deg, var(--primary) 0%, #8b5cf6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Executive Intelligence
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>
            Real-time unified business analytics and KPI aggregation.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select className="input" value={filter} onChange={e => setFilter(e.target.value)} style={{ fontWeight: 600 }}>
            <option value="ALL">All Time</option>
            <option value="YEAR">This Year</option>
            <option value="MONTH">This Month</option>
            <option value="WEEK">This Week</option>
            <option value="TODAY">Today</option>
          </select>
          <button className="btn btn-secondary" onClick={() => handleExport("CSV")} disabled={isExporting || isLoading}>
            <span className="material-symbols-outlined">download</span> CSV
          </button>
          <button className="btn btn-primary" onClick={() => handleExport("PDF")} disabled={isExporting || isLoading}>
            <span className="material-symbols-outlined">print</span> Print
          </button>
        </div>
      </div>

      {isLoading && !data ? (
        <div style={{ textAlign: "center", padding: "40px" }}>Aggregating Enterprise Data...</div>
      ) : data?.error ? (
        <div style={{ color: "var(--danger)", padding: "20px" }}>{data.error}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          
          {/* SECTION 1: FINANCIALS */}
          <div>
            <h2 style={{ fontSize: '16px', margin: '0 0 12px 0', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Financial Performance</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--spacing-5)' }}>
              <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--success)' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Revenue</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(data.financials.totalRevenue)}</div>
              </div>
              <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--danger)' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Expenses</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(data.financials.totalExpenses)}</div>
              </div>
              <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--primary)' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Net Profit</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(data.financials.netProfit)}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-6)' }}>
            
            {/* LINE CHART */}
            <div className="glass-card">
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Revenue & Expense Trends</h3>
              <div style={{ height: '300px' }}>
                <Line 
                  data={data.charts.lineChartData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    elements: { line: { tension: 0.4 } },
                    plugins: { legend: { position: 'top' } } 
                  }} 
                />
              </div>
            </div>

            {/* DONUT CHART */}
            <div className="glass-card">
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Project Status Distribution</h3>
              <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                <Doughnut 
                  data={data.charts.donutChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: { legend: { position: 'bottom' } }
                  }}
                />
              </div>
            </div>

          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-6)' }}>
            
            {/* SECTION 2: HR */}
            <div className="glass-card">
              <h2 style={{ fontSize: '16px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>groups</span>
                Human Resources
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Headcount</span>
                  <span style={{ fontWeight: 'bold' }}>{data.hr.totalEmployees}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Salary Cost (Active)</span>
                  <span style={{ fontWeight: 'bold' }}>{formatCurrency(data.hr.salaryCost)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Present Today</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>{data.hr.presentToday}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Absent Today</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--danger)' }}>{data.hr.absentToday}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Late Today</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--warning)' }}>{data.hr.lateToday}</span>
                </div>
              </div>
            </div>

            {/* SECTION 3: CRM */}
            <div className="glass-card">
              <h2 style={{ fontSize: '16px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>query_stats</span>
                Sales & CRM
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Active Clients</span>
                  <span style={{ fontWeight: 'bold' }}>{data.crm.activeClients}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Leads</span>
                  <span style={{ fontWeight: 'bold' }}>{data.crm.totalLeads}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Won Leads</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>{data.crm.wonLeads}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Lost Leads</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--danger)' }}>{data.crm.lostLeads}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Conversion Rate</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{data.crm.conversionRate}%</span>
                </div>
              </div>
            </div>

            {/* SECTION 4: PROJECTS */}
            <div className="glass-card">
              <h2 style={{ fontSize: '16px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>account_tree</span>
                Projects & Delivery
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Projects</span>
                  <span style={{ fontWeight: 'bold' }}>{data.projects.totalProjects}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Project Budgets</span>
                  <span style={{ fontWeight: 'bold' }}>{formatCurrency(data.projects.projectBudget)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Project Costs</span>
                  <span style={{ fontWeight: 'bold', color: data.projects.projectCost > data.projects.projectBudget ? 'var(--danger)' : 'var(--text)' }}>
                    {formatCurrency(data.projects.projectCost)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Tasks</span>
                  <span style={{ fontWeight: 'bold' }}>{data.projects.totalTasks}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Tasks Completed</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>{data.projects.completedTasks}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
