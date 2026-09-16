"use client";

import React, { useState, useEffect } from 'react';
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
  X,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Search,
  Check,
  Zap,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import styles from './subscriptions.module.css';

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
        window.location.href = '/super-admin/login';
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
      setSubscriptions(prev => prev.map(s => s.id === subscriptionId ? { ...s, status: newStatus } : s));

      const res = await fetch('/api/system/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      showToast(`Subscription marked as ${newStatus}`, 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update subscription status', 'error');
      fetchSubscriptions();
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
    <div className={styles.pageContainer}>
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          className={styles.toast}
          style={{ backgroundColor: toastMessage.type === 'success' ? '#10b981' : '#ef4444' }}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Executive Mission Control Header Card */}
      <section className={styles.headerCard}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.liveBadgeRow}>
            <div className={styles.livePulseDot} />
            <span className={styles.liveBadgeText}>Automated Billing &amp; License Engine Active</span>
          </div>
          <h1 className={styles.pageTitle}>
            <CreditCard size={26} style={{ color: '#818cf8' }} />
            Tenant Subscriptions &amp; Billing Lifecycle
          </h1>
          <p className={styles.pageSubtitle}>
            Monitor tenant licensing, configure recurring billing terms, adjust subscription tier entitlements, and grant operational grace periods.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button 
            type="button" 
            onClick={fetchSubscriptions} 
            disabled={loading}
            className={styles.refreshBtn}
            title="Refresh subscriptions"
          >
            <RefreshCw size={15} className={loading ? styles.spinning : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh Status'}</span>
          </button>

          <Link href="/super-admin/plans" className={styles.secondaryActionBtn}>
            <Layers size={15} />
            <span>Manage Pricing Tiers</span>
          </Link>

          <button 
            type="button" 
            onClick={() => setShowAssignModal(true)} 
            className={styles.primaryActionBtn}
          >
            <PlusCircle size={16} />
            <span>Assign Plan</span>
          </button>
        </div>
      </section>

      {/* 2. Revenue & Licensing KPI Metric Cards Grid */}
      <section className={styles.kpiGrid}>
        {/* Active Subscriptions */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <CheckCircle2 size={24} />
            </div>
            <span className={styles.kpiBadge} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              Active
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Active Subscriptions</span>
            <span className={styles.kpiValue} style={{ color: '#34d399' }}>{metrics.activeSubscriptions}</span>
          </div>
        </div>

        {/* Estimated MRR */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
              <DollarSign size={24} />
            </div>
            <span className={styles.kpiBadge} style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc' }}>
              Revenue
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Estimated MRR</span>
            <span className={styles.kpiValue} style={{ color: '#a5b4fc' }}>
              ${metrics.estimatedMRR.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Past Due / Unpaid */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <AlertCircle size={24} />
            </div>
            <span 
              className={styles.kpiBadge} 
              style={{ 
                background: metrics.pastDueSubscriptions > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(100, 116, 139, 0.15)', 
                color: metrics.pastDueSubscriptions > 0 ? '#f87171' : '#94a3b8' 
              }}
            >
              {metrics.pastDueSubscriptions > 0 ? 'Action Needed' : 'Good Standing'}
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Past Due / In Grace</span>
            <span className={styles.kpiValue} style={{ color: metrics.pastDueSubscriptions > 0 ? '#f87171' : '#ffffff' }}>
              {metrics.pastDueSubscriptions}
            </span>
          </div>
        </div>

        {/* Unassigned Tenants */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
              <Layers size={24} />
            </div>
            <span className={styles.kpiBadge} style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
              Unassigned
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Unassigned Tenants</span>
            <span className={styles.kpiValue} style={{ color: '#c084fc' }}>
              {unassignedCompanies.length}
            </span>
          </div>
        </div>
      </section>

      {/* 3. Main Data Card & Governance Controls */}
      <section className={styles.mainCard}>
        {/* Controls Bar */}
        <div className={styles.controlsBar}>
          <div className={styles.controlsLeft}>
            {/* Search Input */}
            <div className={styles.searchWrapper}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search company or plan name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button 
                  type="button" 
                  onClick={() => setSearchQuery('')} 
                  className={styles.clearSearchBtn}
                  title="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Subscription Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="PAST_DUE">Past Due</option>
              <option value="CANCELED">Canceled</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div className={styles.filterTabsRow}>
          <button
            type="button"
            onClick={() => setStatusFilter('')}
            className={`${styles.filterTabBtn} ${statusFilter === '' ? styles.filterTabBtnActive : ''}`}
          >
            <CreditCard size={13} />
            <span>All Subscriptions ({subscriptions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={`${styles.filterTabBtn} ${statusFilter === 'ACTIVE' ? styles.filterTabBtnActive : ''}`}
          >
            <CheckCircle2 size={13} />
            <span>Active ({metrics.activeSubscriptions})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('PAST_DUE')}
            className={`${styles.filterTabBtn} ${statusFilter === 'PAST_DUE' ? styles.filterTabBtnActive : ''}`}
          >
            <AlertCircle size={13} />
            <span>Past Due ({metrics.pastDueSubscriptions})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('CANCELED')}
            className={`${styles.filterTabBtn} ${statusFilter === 'CANCELED' ? styles.filterTabBtnActive : ''}`}
          >
            <XCircle size={13} />
            <span>Canceled ({metrics.canceledSubscriptions})</span>
          </button>
        </div>

        {/* Subscriptions Table */}
        <div className={styles.tableContainer}>
          <table className={styles.subsTable}>
            <thead>
              <tr>
                <th>Company / Tenant</th>
                <th>Active Plan</th>
                <th>Status</th>
                <th>Period Valid From</th>
                <th>Renewal / Expiration</th>
                <th>Days Left</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <div className={styles.emptyState}>
                      <RefreshCw size={24} className={styles.spinning} style={{ color: '#818cf8' }} />
                      <span>Loading tenant subscriptions...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className={styles.emptyState}>
                      <CreditCard size={48} style={{ opacity: 0.3 }} />
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '15px', color: '#cbd5e1' }}>No subscription records found</p>
                      <span style={{ fontSize: '13px' }}>There are currently no active tenant subscriptions matching this filter.</span>
                      {unassignedCompanies.length > 0 && (
                        <button 
                          className={styles.primaryActionBtn} 
                          onClick={() => setShowAssignModal(true)}
                          style={{ marginTop: '10px' }}
                        >
                          <PlusCircle size={15} />
                          <span>Assign Plan to Tenant ({unassignedCompanies.length} awaiting plan)</span>
                        </button>
                      )}
                    </div>
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

                  const initials = sub.company?.name ? sub.company.name.slice(0, 2).toUpperCase() : 'CO';
                  const isPastDue = sub.status === 'PAST_DUE';
                  const isCanceled = sub.status === 'CANCELED';
                  const statusClass = isPastDue ? styles.statusPastDue : isCanceled ? styles.statusCanceled : styles.statusActive;

                  const daysClass = isExpired ? styles.daysLeftExpired : isExpiringSoon ? styles.daysLeftWarning : styles.daysLeftNormal;

                  return (
                    <tr key={sub.id} className={styles.subRow}>
                      {/* Company Name */}
                      <td>
                        <div className={styles.companyIdentityCell}>
                          <div className={styles.companyAvatar}>
                            {initials}
                          </div>
                          <div className={styles.companyInfoText}>
                            <span className={styles.companyName}>
                              {sub.company?.name || 'Unknown Company'}
                            </span>
                            <span className={styles.companySector}>
                              {sub.company?.businessType || 'Enterprise'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td>
                        <div className={styles.planName}>
                          <Sparkles size={13} />
                          <span>{sub.plan?.name || 'Custom Plan'}</span>
                        </div>
                        <div className={styles.planPrice}>
                          ${sub.plan?.price || 0} / {sub.plan?.billingCycle?.toLowerCase()}
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`${styles.statusPill} ${statusClass}`}>
                          <div className={styles.statusDot} />
                          <span>{sub.status}</span>
                        </span>
                      </td>

                      {/* Period Start */}
                      <td style={{ color: '#94a3b8', fontSize: '13px' }}>
                        {new Date(sub.currentPeriodStart).toLocaleDateString()}
                      </td>

                      {/* Period End */}
                      <td style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: 600 }}>
                        {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                      </td>

                      {/* Days Left */}
                      <td>
                        <span className={`${styles.daysLeftBadge} ${daysClass}`}>
                          <Clock size={12} />
                          <span>{isExpired ? 'Expired' : `${daysRemaining} days left`}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className={styles.actionsGroup}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSub(sub);
                              setShowExtendModal(true);
                            }}
                            className={styles.extendBtn}
                            title="Extend expiration or grant grace period"
                          >
                            <Clock size={13} />
                            <span>Extend</span>
                          </button>

                          <select
                            value={sub.status}
                            onChange={(e) => handleUpdateStatus(sub.id, e.target.value)}
                            className={styles.statusActionSelect}
                            title="Update Subscription Status"
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="PAST_DUE">Past Due</option>
                            <option value="CANCELED">Canceled</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleDeleteSubscription(sub.id)}
                            className={styles.iconDeleteBtn}
                            title="Terminate Subscription"
                          >
                            <XCircle size={15} />
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
      </section>

      {/* ASSIGN PLAN MODAL */}
      {showAssignModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAssignModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <PlusCircle size={18} style={{ color: '#818cf8' }} />
                Assign Subscription Plan
              </h3>
              <button 
                type="button" 
                onClick={() => setShowAssignModal(false)}
                className={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignPlan}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Select Company / Tenant *</label>
                  <select
                    required
                    value={assignForm.companyId}
                    onChange={(e) => setAssignForm({ ...assignForm, companyId: e.target.value })}
                    className={styles.formInput}
                  >
                    <option value="" disabled>Choose a company...</option>
                    {allCompanies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {unassignedCompanies.some(u => u.id === c.id) ? '(No active subscription)' : '(Has existing plan)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Select Subscription Plan *</label>
                  <select
                    required
                    value={assignForm.planId}
                    onChange={(e) => setAssignForm({ ...assignForm, planId: e.target.value })}
                    className={styles.formInput}
                  >
                    <option value="" disabled>Choose a plan...</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - ${p.price} / {p.billingCycle.toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Initial Duration Period</label>
                  <div className={styles.durationGrid}>
                    {[14, 30, 90, 365].map((days) => (
                      <button
                        type="button"
                        key={days}
                        onClick={() => setAssignForm({ ...assignForm, durationDays: days })}
                        className={`${styles.durationOptionBtn} ${assignForm.durationDays === days ? styles.durationOptionBtnActive : ''}`}
                      >
                        {days === 365 ? '1 Year' : `${days} Days`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className={styles.modalCancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={styles.modalSubmitBtn}
                >
                  {submitting ? 'Assigning...' : 'Assign & Activate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXTEND SUBSCRIPTION MODAL */}
      {showExtendModal && selectedSub && (
        <div className={styles.modalOverlay} onClick={() => setShowExtendModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <Clock size={18} style={{ color: '#818cf8' }} />
                Extend Subscription Period
              </h3>
              <button 
                type="button" 
                onClick={() => setShowExtendModal(false)}
                className={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#94a3b8' }}>
                Add extra duration days to <strong>{selectedSub.company?.name}</strong>. Current expiration: <strong>{new Date(selectedSub.currentPeriodEnd).toLocaleDateString()}</strong>.
              </p>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Extension Amount</label>
                <div className={styles.durationGrid}>
                  {[14, 30, 90, 365].map((days) => (
                    <button
                      type="button"
                      key={days}
                      onClick={() => setExtendDays(days)}
                      className={`${styles.durationOptionBtn} ${extendDays === days ? styles.durationOptionBtnActive : ''}`}
                    >
                      +{days === 365 ? '1 Yr' : `${days}d`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setShowExtendModal(false)}
                className={styles.modalCancelBtn}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleExtendSubscription} 
                className={styles.modalSubmitBtn} 
                disabled={submitting}
              >
                {submitting ? 'Extending...' : `Confirm +${extendDays} Days`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
