"use client";

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { 
  Users, 
  Building2, 
  CreditCard, 
  Headphones, 
  Activity, 
  ShieldCheck, 
  PlusCircle, 
  ArrowUpRight, 
  ExternalLink, 
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function SaaSSuperAdminOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    activeCompanies: 0,
    activeSubscriptions: 0,
    openTickets: 0,
    urgentTickets: 0,
    uptimeHours: '0',
    dbStatus: 'Connected',
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const [dashRes, usersRes, ticketsRes, companiesRes] = await Promise.all([
        fetch('/api/system/dashboard').catch(() => null),
        fetch('/api/system/users').catch(() => null),
        fetch('/api/system/support/tickets').catch(() => null),
        fetch('/api/system/companies').catch(() => null),
      ]);

      if (dashRes?.status === 401 || usersRes?.status === 401) {
        window.location.href = '/login';
        return;
      }

      const dashData = dashRes && dashRes.ok ? await dashRes.json() : {};
      const usersData = usersRes && usersRes.ok ? await usersRes.json() : {};
      const ticketsData = ticketsRes && ticketsRes.ok ? await ticketsRes.json() : {};
      const companiesData = companiesRes && companiesRes.ok ? await companiesRes.json() : {};

      setRecentUsers((usersData.users || []).slice(0, 5));
      setRecentTickets((ticketsData.tickets || []).slice(0, 5));
      setCompanies((companiesData.companies || []).slice(0, 5));

      setStats({
        totalUsers: usersData.metrics?.totalUsers || dashData.metrics?.totalUsers || 0,
        totalCompanies: dashData.metrics?.totalCompanies || companiesData.companies?.length || 0,
        activeCompanies: dashData.metrics?.activeCompanies || 0,
        activeSubscriptions: 0, // calculated below or fetched
        openTickets: ticketsData.metrics?.open || 0,
        urgentTickets: ticketsData.metrics?.urgent || 0,
        uptimeHours: dashData.health?.uptimeHours || '24.0',
        dbStatus: dashData.health?.databaseStatus || 'Connected',
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  return (
    <PageContainer>
      <PageHeader 
        title="Super Admin Control Center" 
        description="Global mission control for managing all registered users, tenant subscriptions, customer support helpdesk, and multi-tenant instances."
      />

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        {/* Users Card */}
        <Link href="/super-admin/users" style={{ textDecoration: 'none' }}>
          <div className="glass-card" style={{ padding: '20px', transition: 'transform 0.15s ease-in-out', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                <Users size={24} />
              </div>
              <ArrowUpRight size={18} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Registered Users</div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
              {stats.totalUsers}
            </div>
          </div>
        </Link>

        {/* Support Tickets Card */}
        <Link href="/super-admin/support" style={{ textDecoration: 'none' }}>
          <div className="glass-card" style={{ padding: '20px', transition: 'transform 0.15s ease-in-out', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
                <Headphones size={24} />
              </div>
              <ArrowUpRight size={18} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Open Support Tickets</div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#c084fc', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {stats.openTickets}
              {stats.urgentTickets > 0 && (
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
                  {stats.urgentTickets} urgent
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* Companies / Tenants */}
        <Link href="/super-admin/companies" style={{ textDecoration: 'none' }}>
          <div className="glass-card" style={{ padding: '20px', transition: 'transform 0.15s ease-in-out', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                <Building2 size={24} />
              </div>
              <ArrowUpRight size={18} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Active Companies</div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#34d399', marginTop: '2px' }}>
              {stats.totalCompanies}
            </div>
          </div>
        </Link>

        {/* Subscriptions */}
        <Link href="/super-admin/subscriptions" style={{ textDecoration: 'none' }}>
          <div className="glass-card" style={{ padding: '20px', transition: 'transform 0.15s ease-in-out', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                <CreditCard size={24} />
              </div>
              <ArrowUpRight size={18} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Subscription Controls</div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
              Manage
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Launchpad */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: 700 }}>Super Admin Quick Launchpad</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <Link href="/super-admin/users" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '12px' }}>
            <Users size={16} /> Manage All Users
          </Link>
          <Link href="/super-admin/subscriptions" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '12px' }}>
            <CreditCard size={16} /> Assign / Extend Plans
          </Link>
          <Link href="/super-admin/support" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '12px' }}>
            <Headphones size={16} /> Customer Support Desk
          </Link>
          <Link href="/super-admin/plans" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '12px' }}>
            <Building2 size={16} /> Pricing Plans
          </Link>
          <Link href="/super-admin/system-health" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '12px' }}>
            <Activity size={16} /> System Health & Logs
          </Link>
        </div>
      </div>

      {/* Two Column Section: Recent Users & Recent Support Tickets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        
        {/* Recent Registered Users */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} style={{ color: '#3b82f6' }} /> Recent Registered Users
            </h3>
            <Link href="/super-admin/users" style={{ fontSize: '13px', color: '#818cf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View all <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentUsers.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>No users found.</p>
            ) : (
              recentUsers.map((u) => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', background: 'var(--surface-subtle)' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                      {u.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-main)' }}>{u.company?.name || 'No Company'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.role || 'Member'}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Support Tickets */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Headphones size={18} style={{ color: '#a855f7' }} /> Recent Customer Support Inquiries
            </h3>
            <Link href="/super-admin/support" style={{ fontSize: '13px', color: '#818cf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View desk <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentTickets.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>No pending support tickets.</p>
            ) : (
              recentTickets.map((t) => (
                <Link key={t.id} href="/super-admin/support" style={{ textDecoration: 'none' }}>
                  <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--surface-subtle)', transition: 'background 0.15s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color: '#818cf8' }}>
                        {t.ticketNumber}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontWeight: 600,
                        background: t.status === 'OPEN' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                        color: t.status === 'OPEN' ? '#60a5fa' : '#c084fc',
                      }}>
                        {t.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.subject}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      From {t.user?.name || 'Customer'} • {new Date(t.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

      </div>
    </PageContainer>
  );
}
