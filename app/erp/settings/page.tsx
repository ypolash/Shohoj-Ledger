"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SystemSettingsDashboard() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fallback data for the UI if API isn't fully ready yet for this specific dash
  useEffect(() => {
    // Just simulating a load for the dashboard layout
    setTimeout(() => {
      setData({
        activeUsers: 14,
        totalRoles: 5,
        activeModules: 8,
        lastBackup: new Date().toISOString()
      });
      setIsLoading(false);
    }, 600);
  }, []);

  const categories = [
    {
      group: 'General Settings',
      items: [
        { id: 'company', title: 'Company Profile', desc: 'Manage legal name, address, tax IDs, and fiscal year.', icon: 'business', color: 'var(--primary)' },
        { id: 'branding', title: 'Branding & UI', desc: 'Configure logos, colors, and interface preferences.', icon: 'palette', color: 'var(--accent)' },
      ]
    },
    {
      group: 'Access Management',
      items: [
        { id: 'users', title: 'Users & Staff', desc: 'Manage employee logins, statuses, and profiles.', icon: 'group', color: 'var(--success)' },
        { id: 'roles', title: 'Roles & Hierarchy', desc: 'Define access roles, reporting lines, and limits.', icon: 'badge', color: 'var(--primary)' },
        { id: 'permissions', title: 'Permissions', desc: 'Granular control over specific module actions.', icon: 'vpn_key', color: 'var(--warning)' },
      ]
    },
    {
      group: 'System & Security',
      items: [
        { id: 'modules', title: 'Enterprise Modules', desc: 'Enable/disable ERP modules (HR, Inventory, CRM).', icon: 'apps', color: 'var(--accent)' },
        { id: 'security', title: 'Security Settings', desc: 'Password policies, 2FA, and session timeouts.', icon: 'security', color: 'var(--danger)' },
        { id: 'audit-log', title: 'Audit Trail', desc: 'Review chronological logs of all system activities.', icon: 'history', color: 'var(--text-main)' },
      ]
    }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
      <div>
        <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Enterprise Settings Hub</h1>
        <p style={{ margin: '4px 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>
          Manage global configurations, access control, and security policies for your Shohoj Ledger instance.
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-5)' }}>
        {[
          { label: 'Active Users', value: data?.activeUsers, icon: 'group', color: 'var(--success)' },
          { label: 'Configured Roles', value: data?.totalRoles, icon: 'badge', color: 'var(--primary)' },
          { label: 'Active Modules', value: data?.activeModules, icon: 'apps', color: 'var(--accent)' },
          { label: 'Last Backup', value: data?.lastBackup ? new Date(data.lastBackup).toLocaleDateString() : 'N/A', icon: 'cloud_done', color: 'var(--text-main)' },
        ].map((kpi, idx) => (
          <div key={idx} className="glass-panel" style={{ padding: '20px', borderRadius: '14px', border: '1px solid var(--border-main)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: kpi.color }}>{kpi.icon}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>{kpi.label}</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>
              {isLoading ? <span style={{ opacity: 0.4 }}>···</span> : kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Settings Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {categories.map((group, idx) => (
          <div key={idx}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text-main)', borderBottom: '1px solid var(--border-main)', paddingBottom: '8px' }}>
              {group.group}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {group.items.map(item => (
                <Link key={item.id} href={`/erp/settings/${item.id}`} style={{ textDecoration: 'none' }}>
                  <div className="glass-panel hover-lift" style={{ padding: '20px', borderRadius: '14px', display: 'flex', gap: '16px', height: '100%', cursor: 'pointer', border: '1px solid var(--border-main)', transition: 'all 0.2s' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '22px', color: item.color }}>{item.icon}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-main)', fontWeight: 600 }}>{item.title}</h3>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{item.desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
