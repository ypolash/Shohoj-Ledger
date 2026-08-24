"use client";

import React, { useState, useEffect } from 'react';

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

        {/* Campaign List */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', margin: '0', color: 'var(--text-main)' }}>Recent Campaigns</h2>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', minWidth: '800px', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 500 }}>Campaign Name</th>
                  <th style={{ padding: '12px 16px', fontWeight: 500 }}>Channel</th>
                  <th style={{ padding: '12px 16px', fontWeight: 500 }}>Start Date</th>
                  <th style={{ padding: '12px 16px', fontWeight: 500, textAlign: 'right' }}>Spend</th>
                  <th style={{ padding: '12px 16px', fontWeight: 500, textAlign: 'center' }}>Reach</th>
                  <th style={{ padding: '12px 16px', fontWeight: 500, textAlign: 'center' }}>Conversions</th>
                  <th style={{ padding: '12px 16px', fontWeight: 500 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading campaigns...</td>
                  </tr>
                ) : data?.campaigns?.length > 0 ? (
                  data.campaigns.map((campaign: any) => (
                    <tr key={campaign.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background-color 0.2s' }} className="hover:bg-[var(--surface-hover)]">
                      <td style={{ padding: '12px 16px', color: 'var(--text-main)', fontWeight: 500 }}>{campaign.name}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-main)' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'var(--surface-hover)', fontSize: '12px' }}>
                          {campaign.channel || 'Other'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-main)' }}>
                        {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-main)', textAlign: 'right', fontWeight: 500 }}>
                        {formatCurrency(campaign.spend)}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-main)', textAlign: 'center' }}>
                        {campaign.reach?.toLocaleString() || 0}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-main)', textAlign: 'center' }}>
                        {campaign.conversions?.toLocaleString() || 0}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 500,
                          background: campaign.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                          color: campaign.status === 'ACTIVE' ? 'var(--success)' : 'var(--text-muted)'
                        }}>
                          {campaign.status || 'ACTIVE'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No campaigns found. Click "New Campaign" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px', width: '400px', maxWidth: '90%' }}>
            <h2 style={{ marginTop: 0, marginBottom: '24px', color: 'var(--text-main)', fontSize: '20px' }}>New Campaign</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Campaign Name</label>
                <input 
                  required
                  type="text"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' }}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Channel</label>
                <select 
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' }}
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
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Budget (Spend)</label>
                <input 
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' }}
                  value={formData.spend}
                  onChange={(e) => setFormData({...formData, spend: e.target.value})}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Start Date</label>
                <input 
                  required
                  type="date"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' }}
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
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
