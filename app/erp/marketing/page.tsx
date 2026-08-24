"use client";

import React, { useState, useEffect } from 'react';
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
import { Line, Doughnut } from 'react-chartjs-2';

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
  const [data, setData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    channel: '',
    spend: '',
    startDate: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/marketing/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ name: '', channel: '', spend: '', startDate: '' });
        fetchData(); // Refresh data
      } else {
        alert("Failed to create campaign");
      }
    } catch (err) {
      console.error("Submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: string | number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val || 0));
  };

  const metrics = data?.stats || {};
  const chartDataRaw = data?.chartData || [];

  // Dummy monthly reach since we don't track reach over time yet in our schema
  const sortedMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const monthlyReach = [12000, 19000, 15000, 22000, 25000, 29000];
  
  const lineChartData = {
    labels: sortedMonths,
    datasets: [
      {
        label: 'Audience Reach',
        data: monthlyReach,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
      },
    ],
  };

  const doughnutData = {
    labels: chartDataRaw.map((d: any) => d.name),
    datasets: [
      {
        data: chartDataRaw.map((d: any) => d.value),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)'
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
          <button className="btn btn-primary hover-lift" onClick={() => setIsModalOpen(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>campaign</span>
            New Campaign
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 'var(--spacing-5)' }}>
          {[
            { label: 'Total Campaigns', value: metrics.totalCampaigns || 0, color: 'var(--primary)', glow: 'primary' },
            { label: 'Active Campaigns', value: metrics.activeCampaigns || 0, color: 'var(--text-main)', glow: 'accent' },
            { label: 'Total Audience Reach', value: metrics.totalReach?.toLocaleString() || 0, color: 'var(--warning)', glow: 'warning' },
            { label: 'Conversions', value: metrics.conversions?.toLocaleString() || 0, color: 'var(--success)', glow: 'success' },
            { label: 'Marketing Spend', value: formatCurrency(metrics.totalSpend), color: 'var(--danger)', glow: 'danger' },
            { label: 'Estimated ROI', value: metrics.roi || '0%', color: 'var(--success)', glow: 'success' },
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
            <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4) 0', color: 'var(--text-main)' }}>Spend by Channel</h2>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {!isLoading && chartDataRaw.length > 0 && (
                <div style={{ width: '250px', height: '250px' }}>
                  <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#ccc' } } } }} />
                </div>
              )}
              {!isLoading && chartDataRaw.length === 0 && (
                <div style={{ color: 'var(--text-muted)' }}>No data available</div>
              )}
            </div>
          </div>
        </div>

      </div>

      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px', width: '400px', maxWidth: '90%' }}>
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>New Campaign</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px' }}>Campaign Name</label>
                <input 
                  required
                  type="text"
                  className="input-field w-full"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px' }}>Channel</label>
                <select 
                  required
                  className="input-field w-full"
                  value={formData.channel}
                  onChange={(e) => setFormData({...formData, channel: e.target.value})}
                >
                  <option value="">Select Channel</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Email">Email</option>
                  <option value="SEO">SEO</option>
                  <option value="Paid Ads">Paid Ads</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px' }}>Budget (Spend)</label>
                <input 
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field w-full"
                  value={formData.spend}
                  onChange={(e) => setFormData({...formData, spend: e.target.value})}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px' }}>Start Date</label>
                <input 
                  required
                  type="date"
                  className="input-field w-full"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
