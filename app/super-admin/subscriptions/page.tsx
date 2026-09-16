"use client";

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { 
  CreditCard, 
  Layers, 
  RefreshCw, 
  Calendar, 
  Clock, 
  Building2, 
  PlusCircle, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';

interface SubscriptionRecord {
  id: string;
  companyId: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
  company?: {
    id: string;
    name: string;
    businessType: string;
    status: string;
  };
  plan?: {
    id: string;
    name: string;
    price: number;
    billingCycle: string;
    maxUsers?: number;
  };
}

interface PlanOption {
  id: string;
  name: string;
  price: number;
  billingCycle: string;
}

interface CompanyOption {
  id: string;
  name: string;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [allCompanies, setAllCompanies] = useState<CompanyOption[]>([]);
  const [unassignedCompanies, setUnassignedCompanies] = useState<CompanyOption[]>([]);
  const [metrics, setMetrics] = useState({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    pastDueSubscriptions: 0,
    canceledSubscriptions: 0,
    estimatedMRR: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState<SubscriptionRecord | null>(null);

  // Form states
  const [assignForm, setAssignForm] = useState({
    companyId: '',
    planId: '',
    durationDays: 30,
    status: 'ACTIVE',
  });
  const [extendDays, setExtendDays] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/subscriptions');
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch subscriptions');
      }
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
      setPlans(data.plans || []);
      setAllCompanies(data.allCompanies || []);
      setUnassignedCompanies(data.unassignedCompanies || []);
      if (data.metrics) setMetrics(data.metrics);

      // Pre-select first plan/company if available
      if (data.plans?.length > 0 && !assignForm.planId) {
        setAssignForm(prev => ({ ...prev, planId: data.plans[0].id }));
      }
      if (data.unassignedCompanies?.length > 0 && !assignForm.companyId) {
        setAssignForm(prev => ({ ...prev, companyId: data.unassignedCompanies[0].id }));
      } else if (data.allCompanies?.length > 0 && !assignForm.companyId) {
        setAssignForm(prev => ({ ...prev, companyId: data.allCompanies[0].id }));
      }
    } catch (error: any) {
      console.error(error);
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleAssignPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.companyId || !assignForm.planId) {
      showToast('Please select both a company and a subscription plan', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/system/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign plan');

      showToast('Subscription plan assigned successfully!', 'success');
      setShowAssignModal(false);
      fetchSubscriptions();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (subscriptionId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/system/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setSubscriptions(prev => prev.map(s => s.id === subscriptionId ? { ...s, status: newStatus } : s));
      showToast(`Subscription marked as ${newStatus}`, 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update subscription status', 'error');
    }
  };

  const handleExtendSubscription = async () => {
    if (!selectedSub) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/system/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: selectedSub.id,
          extendDays: Number(extendDays),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to extend subscription');

      showToast(`Extended by ${extendDays} days!`, 'success');
      setShowExtendModal(false);
      fetchSubscriptions();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubscription = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to terminate this tenant subscription?')) return;
    try {
      const res = await fetch(`/api/system/subscriptions?subscriptionId=${subscriptionId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      showToast('Subscription deleted successfully', 'success');
      fetchSubscriptions();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredSubs = subscriptions.filter(s => {
    if (statusFilter && s.status !== statusFilter) return false;
    if (searchQuery) {
      const compName = s.company?.name?.toLowerCase() || '';
      const planName = s.plan?.name?.toLowerCase() || '';
      if (!compName.includes(searchQuery.toLowerCase()) && !planName.includes(searchQuery.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  return (
    <PageContainer>
      <PageHeader 
        title="Tenant Subscriptions Control" 
        description="Monitor tenant lifecycle, manage billing terms, upgrade pricing plans, and grant grace period extensions."
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          padding: '12px 20px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#fff',
          backgroundColor: toastMessage.type === 'success' ? '#10b981' : '#ef4444',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{toastMessage.text}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Active Subscriptions</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#34d399' }}>{metrics.activeSubscriptions}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
            <CreditCard size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Estimated MRR</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#818cf8' }}>${metrics.estimatedMRR.toFixed(2)}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Past Due / Unpaid</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#f87171' }}>{metrics.pastDueSubscriptions}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
            <Layers size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Unassigned Tenants</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>{unassignedCompanies.length}</div>
          </div>
        </div>
      </div>

      {/* Main Glass Card */}
      <div className="glass-card" style={{ padding: '24px' }}>
        {/* Controls Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', flex: 1, minWidth: '300px' }}>
            <input
              type="text"
              placeholder="Search company or plan name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '260px',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-main)',
                background: 'var(--surface-subtle)',
                color: 'var(--text-main)',
                fontSize: '14px',
              }}
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-main)',
                background: 'var(--surface-subtle)',
                color: 'var(--text-main)',
                fontSize: '14px',
              }}
            >
              <option value="">All Subscription Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="PAST_DUE">Past Due</option>
              <option value="CANCELED">Canceled</option>
            </select>

            <button
              className="btn btn-secondary"
              onClick={fetchSubscriptions}
              title="Refresh subscriptions"
              style={{ padding: '9px 14px' }}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href="/super-admin/plans" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={16} /> Manage Pricing Tiers
            </Link>
            <button
              className="btn btn-primary"
              onClick={() => setShowAssignModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <PlusCircle size={16} /> Assign Plan to Company
            </button>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="table-responsive">
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Company / Tenant</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Active Plan</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Period Valid From</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Renewal / Expiration</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Days Left</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                    <p style={{ margin: 0 }}>Loading tenant subscriptions...</p>
                  </td>
                </tr>
              ) : filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    <CreditCard size={48} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                    <p style={{ margin: '0 0 12px 0', fontWeight: 500 }}>No active subscriptions found.</p>
                    {unassignedCompanies.length > 0 && (
                      <button className="btn btn-primary" onClick={() => setShowAssignModal(true)}>
                        Assign Plan to Existing Company ({unassignedCompanies.length} awaiting plan)
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => {
                  const end = new Date(sub.currentPeriodEnd);
                  const now = new Date();
                  const diffTime = end.getTime() - now.getTime();
                  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
                  const isExpired = daysRemaining <= 0;

                  return (
                    <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      {/* Company Name */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Building2 size={16} style={{ color: 'var(--text-muted)' }} />
                          <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>
                            {sub.company?.name || 'Unknown Company'}
                          </span>
                        </div>
                      </td>

                      {/* Plan */}
                      <td style={{ padding: '14px 16px', fontSize: '14px' }}>
                        <div style={{ fontWeight: 600, color: '#818cf8' }}>
                          {sub.plan?.name || 'Custom Plan'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          ${sub.plan?.price || 0} / {sub.plan?.billingCycle?.toLowerCase()}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontWeight: 700,
                          background: sub.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: sub.status === 'ACTIVE' ? '#10b981' : '#ef4444',
                        }}>
                          {sub.status === 'ACTIVE' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                          {sub.status}
                        </span>
                      </td>

                      {/* Start */}
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        {new Date(sub.currentPeriodStart).toLocaleDateString()}
                      </td>

                      {/* End */}
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-main)', fontWeight: 500 }}>
                        {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                      </td>

                      {/* Days Left */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: isExpired ? 'rgba(239, 68, 68, 0.2)' : isExpiringSoon ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                          color: isExpired ? '#f87171' : isExpiringSoon ? '#f59e0b' : '#34d399',
                        }}>
                          {isExpired ? 'Expired' : `${daysRemaining} days left`}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            onClick={() => {
                              setSelectedSub(sub);
                              setShowExtendModal(true);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '5px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Extend expiration or grant grace period"
                          >
                            <Clock size={13} /> Extend
                          </button>

                          <select
                            value={sub.status}
                            onChange={(e) => handleUpdateStatus(sub.id, e.target.value)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-main)',
                              background: 'var(--surface-subtle)',
                              color: 'var(--text-main)',
                              fontSize: '12px',
                            }}
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="PAST_DUE">Past Due</option>
                            <option value="CANCELED">Canceled</option>
                          </select>

                          <button
                            onClick={() => handleDeleteSubscription(sub.id)}
                            className="btn btn-secondary"
                            style={{ padding: '5px 8px', fontSize: '12px', color: '#ef4444' }}
                            title="Delete Subscription"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ASSIGN PLAN MODAL */}
      {showAssignModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '460px', padding: '28px', position: 'relative', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 700 }}>Assign Subscription Plan</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Attach a subscription plan to a company and activate their billing cycle.
            </p>

            <form onSubmit={handleAssignPlan}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Select Company / Tenant *</label>
                <select
                  required
                  value={assignForm.companyId}
                  onChange={(e) => setAssignForm({ ...assignForm, companyId: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-subtle)', color: 'var(--text-main)', fontSize: '14px' }}
                >
                  <option value="" disabled>Choose a company...</option>
                  {allCompanies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {unassignedCompanies.some(u => u.id === c.id) ? '(No active subscription)' : '(Has existing plan)'}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Select Subscription Plan *</label>
                <select
                  required
                  value={assignForm.planId}
                  onChange={(e) => setAssignForm({ ...assignForm, planId: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-subtle)', color: 'var(--text-main)', fontSize: '14px' }}
                >
                  <option value="" disabled>Choose a plan...</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ${p.price} / {p.billingCycle.toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Duration</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {[14, 30, 90, 365].map((days) => (
                    <button
                      type="button"
                      key={days}
                      onClick={() => setAssignForm({ ...assignForm, durationDays: days })}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        border: assignForm.durationDays === days ? '2px solid #6366f1' : '1px solid var(--border-main)',
                        background: assignForm.durationDays === days ? 'rgba(99, 102, 241, 0.2)' : 'var(--surface-subtle)',
                        color: assignForm.durationDays === days ? '#818cf8' : 'var(--text-main)',
                        cursor: 'pointer',
                      }}
                    >
                      {days === 365 ? '1 Year' : `${days} Days`}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Assigning...' : 'Assign & Activate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXTEND SUBSCRIPTION MODAL */}
      {showExtendModal && selectedSub && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '28px', position: 'relative', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700 }}>Extend Subscription Period</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Add extra days to <strong>{selectedSub.company?.name}</strong>. Current expiration: <strong>{new Date(selectedSub.currentPeriodEnd).toLocaleDateString()}</strong>.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '24px' }}>
              {[14, 30, 90, 365].map((days) => (
                <button
                  type="button"
                  key={days}
                  onClick={() => setExtendDays(days)}
                  style={{
                    padding: '10px 4px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    border: extendDays === days ? '2px solid #10b981' : '1px solid var(--border-main)',
                    background: extendDays === days ? 'rgba(16, 185, 129, 0.2)' : 'var(--surface-subtle)',
                    color: extendDays === days ? '#34d399' : 'var(--text-main)',
                    cursor: 'pointer',
                  }}
                >
                  +{days === 365 ? '1 Yr' : `${days}d`}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowExtendModal(false)}>
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleExtendSubscription} 
                className="btn btn-primary" 
                disabled={submitting}
              >
                {submitting ? 'Extending...' : `Confirm +${extendDays} Days`}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
