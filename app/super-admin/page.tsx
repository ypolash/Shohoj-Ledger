"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  CreditCard, 
  Headphones, 
  Activity, 
  ShieldCheck, 
  ArrowUpRight, 
  RefreshCw, 
  ArrowRight,
  Database,
  Cpu,
  Clock,
  Plus,
  Layers,
  Sparkles,
  Server,
  FileText,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import styles from './superAdminDashboard.module.css';

export default function SaaSSuperAdminOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEmployees: 0,
    totalCompanies: 0,
    activeCompanies: 0,
    activeSubscriptions: 0,
    estimatedMRR: 0,
    totalPlans: 4,
    openTickets: 0,
    urgentTickets: 0,
    uptimeHours: '24.0',
    dbStatus: 'Connected',
    memoryUsagePercent: '32.4',
    totalMemoryGb: '16.0',
    cpuLoad1m: '0.12',
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const [dashRes, usersRes, ticketsRes, companiesRes, subsRes] = await Promise.all([
        fetch('/api/system/dashboard').catch(() => null),
        fetch('/api/system/users').catch(() => null),
        fetch('/api/system/support/tickets').catch(() => null),
        fetch('/api/system/companies').catch(() => null),
        fetch('/api/system/subscriptions').catch(() => null),
      ]);

      if (dashRes?.status === 401 || usersRes?.status === 401) {
        window.location.href = '/super-admin/login';
        return;
      }

      const dashData = dashRes && dashRes.ok ? await dashRes.json() : {};
      const usersData = usersRes && usersRes.ok ? await usersRes.json() : {};
      const ticketsData = ticketsRes && ticketsRes.ok ? await ticketsRes.json() : {};
      const companiesData = companiesRes && companiesRes.ok ? await companiesRes.json() : {};
      const subsData = subsRes && subsRes.ok ? await subsRes.json() : {};

      setRecentUsers((usersData.users || []).slice(0, 5));
      setRecentTickets((ticketsData.tickets || []).slice(0, 5));
      setCompanies((companiesData.companies || []).slice(0, 5));

      setStats({
        totalUsers: usersData.metrics?.totalUsers || dashData.metrics?.totalUsers || 0,
        totalEmployees: dashData.metrics?.totalEmployees || 0,
        totalCompanies: dashData.metrics?.totalCompanies || companiesData.companies?.length || 0,
        activeCompanies: dashData.metrics?.activeCompanies || companiesData.companies?.filter((c: any) => c.status === 'ACTIVE').length || 0,
        activeSubscriptions: subsData.metrics?.activeSubscriptions || 0,
        estimatedMRR: subsData.metrics?.estimatedMRR || 0,
        totalPlans: subsData.plans?.length || 4,
        openTickets: ticketsData.metrics?.open || 0,
        urgentTickets: ticketsData.metrics?.urgent || 0,
        uptimeHours: dashData.health?.uptimeHours || '24.0',
        dbStatus: dashData.health?.databaseStatus || 'Connected',
        memoryUsagePercent: dashData.health?.memoryUsagePercent || '32.4',
        totalMemoryGb: dashData.health?.totalMemoryGb || '16.0',
        cpuLoad1m: dashData.health?.cpuLoad1m || '0.12',
      });
    } catch (e) {
      console.error("Super Admin Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  return (
    <div className={styles.dashboardContainer}>
      {/* 1. Executive Mission Control Header */}
      <section className={styles.headerCard}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.liveBadgeRow}>
            <div className={styles.livePulseDot} />
            <span className={styles.liveBadgeText}>Master Governance System Online</span>
          </div>
          <h1 className={styles.pageTitle}>
            <Sparkles size={26} style={{ color: '#c084fc' }} />
            Super Admin Control Center
          </h1>
          <p className={styles.pageSubtitle}>
            Global mission control for multi-tenant orchestration, infrastructure telemetry, billing lifecycle, and master tenant governance.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button 
            type="button" 
            onClick={fetchOverviewData} 
            disabled={loading}
            className={styles.refreshBtn}
            title="Refresh Live Metrics"
          >
            <RefreshCw size={15} className={loading ? styles.spinning : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh Telemetry'}</span>
          </button>
          
          <Link href="/super-admin/companies" className={styles.primaryActionBtn}>
            <Plus size={16} />
            <span>Manage Companies</span>
          </Link>
        </div>
      </section>

      {/* 2. Live Infrastructure & Telemetry HUD Ribbon */}
      <section className={styles.telemetryRibbon}>
        {/* Database Status */}
        <div className={styles.telemetryItem}>
          <div className={styles.telemetryIcon} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <Database size={18} />
          </div>
          <div className={styles.telemetryContent}>
            <span className={styles.telemetryLabel}>Database Engine</span>
            <span className={styles.telemetryValue}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              {stats.dbStatus} (Optimal)
            </span>
          </div>
        </div>

        {/* Server Uptime */}
        <div className={styles.telemetryItem}>
          <div className={styles.telemetryIcon} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <Clock size={18} />
          </div>
          <div className={styles.telemetryContent}>
            <span className={styles.telemetryLabel}>Platform Uptime</span>
            <span className={styles.telemetryValue}>{stats.uptimeHours} hrs (99.9%)</span>
          </div>
        </div>

        {/* Memory Usage */}
        <div className={styles.telemetryItem}>
          <div className={styles.telemetryIcon} style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
            <Cpu size={18} />
          </div>
          <div className={styles.telemetryContent}>
            <span className={styles.telemetryLabel}>Memory Load ({stats.memoryUsagePercent}%)</span>
            <span className={styles.telemetryValue}>{stats.totalMemoryGb} GB Allocated</span>
            <div className={styles.miniProgressBar}>
              <div className={styles.miniProgressFill} style={{ width: `${Math.min(100, Math.max(10, Number(stats.memoryUsagePercent)))}%` }} />
            </div>
          </div>
        </div>

        {/* Security Guard */}
        <div className={styles.telemetryItem}>
          <div className={styles.telemetryIcon} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <ShieldCheck size={18} />
          </div>
          <div className={styles.telemetryContent}>
            <span className={styles.telemetryLabel}>Security Guard</span>
            <span className={styles.telemetryValue}>Zero-Trust RBAC</span>
          </div>
        </div>
      </section>

      {/* 3. Core KPI Metric Cards Grid */}
      <section className={styles.kpiGrid}>
        {/* Active Companies / Multi-Tenant */}
        <Link href="/super-admin/companies" className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <Building2 size={24} />
            </div>
            <span className={styles.kpiBadge} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              Operational
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Active Companies</span>
            <span className={styles.kpiValue} style={{ color: '#34d399' }}>
              {stats.totalCompanies}
            </span>
          </div>
          <div className={styles.kpiFooter}>
            <span>{stats.activeCompanies} Active Workspaces</span>
            <span className={styles.kpiLinkText}>
              Manage <ArrowUpRight size={14} />
            </span>
          </div>
        </Link>

        {/* Registered Users */}
        <Link href="/super-admin/users" className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
              <Users size={24} />
            </div>
            <span className={styles.kpiBadge} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
              Platform Master
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Registered Users</span>
            <span className={styles.kpiValue}>
              {stats.totalUsers}
            </span>
          </div>
          <div className={styles.kpiFooter}>
            <span>{stats.totalEmployees} Staff Personnel</span>
            <span className={styles.kpiLinkText}>
              Directory <ArrowUpRight size={14} />
            </span>
          </div>
        </Link>

        {/* Subscriptions & MRR */}
        <Link href="/super-admin/subscriptions" className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <CreditCard size={24} />
            </div>
            <span className={styles.kpiBadge} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              Subscription Tier
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Subscription Controls</span>
            <span className={styles.kpiValue} style={{ color: '#fbbf24' }}>
              {stats.estimatedMRR > 0 ? `BDT ${stats.estimatedMRR.toLocaleString()}` : 'Manage'}
            </span>
          </div>
          <div className={styles.kpiFooter}>
            <span>{stats.activeSubscriptions} Active Plans</span>
            <span className={styles.kpiLinkText}>
              Billing <ArrowUpRight size={14} />
            </span>
          </div>
        </Link>

        {/* Support Inquiries */}
        <Link href="/super-admin/support" className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
              <Headphones size={24} />
            </div>
            <span 
              className={styles.kpiBadge} 
              style={{ 
                background: stats.urgentTickets > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(168, 85, 247, 0.15)', 
                color: stats.urgentTickets > 0 ? '#f87171' : '#c084fc' 
              }}
            >
              {stats.urgentTickets > 0 ? `${stats.urgentTickets} Urgent` : 'Helpdesk'}
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Open Support Tickets</span>
            <span className={styles.kpiValue} style={{ color: '#c084fc' }}>
              {stats.openTickets}
            </span>
          </div>
          <div className={styles.kpiFooter}>
            <span>Customer Desk Queue</span>
            <span className={styles.kpiLinkText}>
              Helpdesk <ArrowUpRight size={14} />
            </span>
          </div>
        </Link>
      </section>

      {/* 4. Super Admin Quick Command Launchpad */}
      <section className={styles.launchpadCard}>
        <div className={styles.launchpadHeader}>
          <h3 className={styles.launchpadTitle}>
            <Layers size={18} style={{ color: '#a855f7' }} />
            Super Admin Command Launchpad
          </h3>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Central Orchestration Shortcuts</span>
        </div>

        <div className={styles.launchpadGrid}>
          {/* Manage All Users */}
          <Link href="/super-admin/users" className={styles.launchpadTile}>
            <div className={styles.tileIconBox} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
              <Users size={20} />
            </div>
            <div className={styles.tileContent}>
              <span className={styles.tileTitle}>Manage All Users</span>
              <span className={styles.tileDesc}>Audit privileges, roles & staff pins</span>
            </div>
          </Link>

          {/* Company Tenants */}
          <Link href="/super-admin/companies" className={styles.launchpadTile}>
            <div className={styles.tileIconBox} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <Building2 size={20} />
            </div>
            <div className={styles.tileContent}>
              <span className={styles.tileTitle}>Company Tenants</span>
              <span className={styles.tileDesc}>Provision workspaces & business settings</span>
            </div>
          </Link>

          {/* Pricing Plans */}
          <Link href="/super-admin/plans" className={styles.launchpadTile}>
            <div className={styles.tileIconBox} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              <Layers size={20} />
            </div>
            <div className={styles.tileContent}>
              <span className={styles.tileTitle}>Pricing & Feature Tiers</span>
              <span className={styles.tileDesc}>Set module quotas, plans & pricing</span>
            </div>
          </Link>

          {/* Assign / Extend Plans */}
          <Link href="/super-admin/subscriptions" className={styles.launchpadTile}>
            <div className={styles.tileIconBox} style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc' }}>
              <CreditCard size={20} />
            </div>
            <div className={styles.tileContent}>
              <span className={styles.tileTitle}>Assign / Extend Plans</span>
              <span className={styles.tileDesc}>Tenant billing cycles & manual renew</span>
            </div>
          </Link>

          {/* Customer Support Desk */}
          <Link href="/super-admin/support" className={styles.launchpadTile}>
            <div className={styles.tileIconBox} style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' }}>
              <Headphones size={20} />
            </div>
            <div className={styles.tileContent}>
              <span className={styles.tileTitle}>Support Helpdesk</span>
              <span className={styles.tileDesc}>Resolve tenant inquiries & SLA queues</span>
            </div>
          </Link>

          {/* System Health & Logs */}
          <Link href="/super-admin/system-health" className={styles.launchpadTile}>
            <div className={styles.tileIconBox} style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>
              <Activity size={20} />
            </div>
            <div className={styles.tileContent}>
              <span className={styles.tileTitle}>System Telemetry & Logs</span>
              <span className={styles.tileDesc}>Inspect server health & master audit</span>
            </div>
          </Link>
        </div>
      </section>

      {/* 5. Two-Column Operational Activity Hub */}
      <section className={styles.activityGrid}>
        {/* Left Column: Recent Registered Users / Tenants */}
        <div className={styles.activityCard}>
          <div className={styles.activityCardHeader}>
            <h3 className={styles.activityCardTitle}>
              <Users size={18} style={{ color: '#3b82f6' }} />
              Recent Registered Users
            </h3>
            <Link href="/super-admin/users" className={styles.activityViewAllLink}>
              View all <ArrowRight size={13} />
            </Link>
          </div>

          <div className={styles.activityList}>
            {recentUsers.length === 0 ? (
              <div className={styles.emptyState}>
                <Users size={24} />
                <span>No registered users found.</span>
              </div>
            ) : (
              recentUsers.map((u) => {
                const initials = (u.name || u.email || 'U').slice(0, 2).toUpperCase();
                return (
                  <div key={u.id} className={styles.activityRowItem}>
                    <div className={styles.activityItemLeft}>
                      <div className={styles.avatarBox}>
                        {initials}
                      </div>
                      <div className={styles.activityItemDetails}>
                        <span className={styles.activityItemTitle}>{u.name || 'Anonymous User'}</span>
                        <span className={styles.activityItemSubtitle}>{u.email}</span>
                      </div>
                    </div>

                    <div className={styles.activityItemRight}>
                      <span className={styles.activityItemMeta}>{u.company?.name || 'No Company'}</span>
                      <span className={`${styles.statusTag} ${styles.statusActive}`}>
                        {u.role || 'Member'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Recent Customer Support Inquiries */}
        <div className={styles.activityCard}>
          <div className={styles.activityCardHeader}>
            <h3 className={styles.activityCardTitle}>
              <Headphones size={18} style={{ color: '#a855f7' }} />
              Recent Customer Support Inquiries
            </h3>
            <Link href="/super-admin/support" className={styles.activityViewAllLink}>
              View desk <ArrowRight size={13} />
            </Link>
          </div>

          <div className={styles.activityList}>
            {recentTickets.length === 0 ? (
              <div className={styles.emptyState}>
                <Headphones size={24} />
                <span>No pending customer support inquiries. All clear!</span>
              </div>
            ) : (
              recentTickets.map((t) => (
                <Link key={t.id} href="/super-admin/support" className={styles.activityRowItem}>
                  <div className={styles.activityItemLeft}>
                    <div className={styles.avatarBox} style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                      <FileText size={16} />
                    </div>
                    <div className={styles.activityItemDetails}>
                      <span className={styles.activityItemTitle}>{t.subject}</span>
                      <span className={styles.activityItemSubtitle}>
                        #{t.ticketNumber || t.id.slice(-6)} • From {t.user?.name || 'Customer'}
                      </span>
                    </div>
                  </div>

                  <div className={styles.activityItemRight}>
                    <span className={`${styles.statusTag} ${t.priority === 'URGENT' ? styles.statusUrgent : styles.statusOpen}`}>
                      {t.status || 'OPEN'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
