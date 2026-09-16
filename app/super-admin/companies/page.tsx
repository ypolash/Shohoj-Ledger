"use client";

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  RefreshCw, 
  Plus, 
  Users, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  X, 
  Edit3, 
  ExternalLink,
  Layers,
  Briefcase,
  Copy,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import styles from './companies.module.css';

interface PlanOption {
  id: string;
  name: string;
  price: number;
}

interface CompanyRecord {
  id: string;
  name: string;
  businessType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  logoUrl?: string | null;
  subscription?: {
    id: string;
    status: string;
    plan?: {
      id: string;
      name: string;
      price: number;
    } | null;
  } | null;
  _count?: {
    users: number;
  };
}

export default function SuperAdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyRecord | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    businessType: 'Service',
    status: 'ACTIVE',
    planId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/companies');
      if (res.status === 401) {
        window.location.href = '/super-admin/login';
        return;
      }
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch company directory');
      }
      const data = await res.json();
      setCompanies(data.companies || []);
      if (data.plans) {
        setPlans(data.plans);
      }
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Failed to load companies', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleStatusChange = async (companyId: string, newStatus: string) => {
    try {
      // Optimistic update
      setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, status: newStatus } : c));

      const res = await fetch('/api/system/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, status: newStatus })
      });

      if (!res.ok) throw new Error('Failed to update company status');
      showToast(`Company status updated to ${newStatus}`, 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update status', 'error');
      fetchCompanies(); // revert on failure
    }
  };

  const handlePlanChange = async (companyId: string, planId: string) => {
    try {
      const selectedPlan = plans.find(p => p.id === planId);
      
      // Optimistic update
      setCompanies(prev => prev.map(c => {
        if (c.id === companyId) {
          return {
            ...c,
            subscription: planId ? {
              id: c.subscription?.id || `temp-sub-${Date.now()}`,
              status: 'ACTIVE',
              plan: selectedPlan ? {
                id: selectedPlan.id,
                name: selectedPlan.name,
                price: selectedPlan.price
              } : null
            } : null
          };
        }
        return c;
      }));

      const res = await fetch('/api/system/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, planId: planId || '' })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update company plan');
      }

      const data = await res.json();
      if (data.company) {
        setCompanies(prev => prev.map(c => c.id === companyId ? data.company : c));
      }

      showToast(`Assigned plan updated to ${selectedPlan ? selectedPlan.name : 'Free / Basic'}`, 'success');
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Failed to update plan', 'error');
      fetchCompanies();
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      businessType: 'Service',
      status: 'ACTIVE',
      planId: plans[0]?.id || '',
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (company: CompanyRecord) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      businessType: company.businessType || 'Service',
      status: company.status || 'ACTIVE',
      planId: company.subscription?.plan?.id || '',
    });
    setIsEditModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/system/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create tenant');
      }

      const data = await res.json();
      setCompanies(prev => [data.company, ...prev]);
      setIsCreateModalOpen(false);
      showToast('Tenant organization provisioned successfully!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Error creating tenant', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !formData.name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/system/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompany.id,
          name: formData.name,
          businessType: formData.businessType,
          status: formData.status,
          planId: formData.planId,
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update tenant');
      }

      const data = await res.json();
      setCompanies(prev => prev.map(c => c.id === selectedCompany.id ? data.company : c));
      setIsEditModalOpen(false);
      showToast('Tenant details updated successfully!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Error updating tenant', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics Calculation
  const totalCompanies = companies.length;
  const activeCompanies = companies.filter(c => c.status === 'ACTIVE').length;
  const suspendedCompanies = companies.filter(c => c.status === 'SUSPENDED' || c.status === 'INACTIVE').length;
  const totalUsers = companies.reduce((acc, c) => acc + (c._count?.users || 0), 0);

  // Filtered dataset
  const filteredCompanies = companies.filter(c => {
    const matchesSearch = searchTerm === '' || 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.businessType && c.businessType.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === '' || c.status === statusFilter;
    const matchesType = typeFilter === '' || c.businessType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className={styles.pageContainer}>
      {/* Toast Feedback */}
      {toastMessage && (
        <div 
          className={styles.toast} 
          style={{ 
            background: toastMessage.type === 'success' 
              ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' 
              : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
            border: `1px solid ${toastMessage.type === 'success' ? '#34d399' : '#f87171'}`
          }}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.liveBadgeRow}>
            <span className={styles.livePulseDot}></span>
            <span className={styles.liveBadgeText}>MULTI-TENANT GOVERNANCE</span>
          </div>
          <h1 className={styles.pageTitle}>
            <Building2 size={28} style={{ color: '#10b981' }} />
            Tenants &amp; Companies Directory
          </h1>
          <p className={styles.pageSubtitle}>
            Provision, manage, and govern multi-tenant organizations, business classifications, assigned subscription plan tiers, and lifecycle statuses.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button 
            onClick={fetchCompanies} 
            disabled={loading}
            className={styles.refreshBtn}
            title="Refresh Directory"
          >
            <RefreshCw size={15} className={loading ? styles.spinning : ''} />
            Refresh
          </button>
          
          <button 
            onClick={handleOpenCreate}
            className={styles.createTenantBtn}
          >
            <Plus size={16} />
            Provision Tenant
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics Grid */}
      <div className={styles.kpiGrid}>
        {/* Total Tenants */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div 
              className={styles.kpiIconBox}
              style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}
            >
              <Building2 size={22} style={{ color: '#34d399' }} />
            </div>
            <span 
              className={styles.kpiBadge}
              style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#a7f3d0' }}
            >
              Total
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Registered Tenants</span>
            <span className={styles.kpiValue}>{loading ? '...' : totalCompanies}</span>
          </div>
        </div>

        {/* Active Tenants */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div 
              className={styles.kpiIconBox}
              style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)' }}
            >
              <ShieldCheck size={22} style={{ color: '#60a5fa' }} />
            </div>
            <span 
              className={styles.kpiBadge}
              style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#93c5fd' }}
            >
              Operational
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Active Organizations</span>
            <span className={styles.kpiValue}>{loading ? '...' : activeCompanies}</span>
          </div>
        </div>

        {/* Suspended/Inactive */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div 
              className={styles.kpiIconBox}
              style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
            >
              <AlertTriangle size={22} style={{ color: '#f87171' }} />
            </div>
            <span 
              className={styles.kpiBadge}
              style={{ 
                background: suspendedCompanies > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(100, 116, 139, 0.15)', 
                color: suspendedCompanies > 0 ? '#fca5a5' : '#94a3b8' 
              }}
            >
              {suspendedCompanies > 0 ? 'Attention Required' : 'Zero Issues'}
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Suspended / Inactive</span>
            <span className={styles.kpiValue}>{loading ? '...' : suspendedCompanies}</span>
          </div>
        </div>

        {/* Total Users */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div 
              className={styles.kpiIconBox}
              style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)' }}
            >
              <Users size={22} style={{ color: '#c084fc' }} />
            </div>
            <span 
              className={styles.kpiBadge}
              style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#e9d5ff' }}
            >
              Tenant Seats
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Total Tenant Users</span>
            <span className={styles.kpiValue}>{loading ? '...' : totalUsers}</span>
          </div>
        </div>
      </div>

      {/* 3. Main Data Card */}
      <section className={styles.mainCard}>
        {/* Controls & Filter Bar */}
        <div className={styles.controlsBar}>
          <div className={styles.controlsLeft}>
            {/* Search Input */}
            <div className={styles.searchWrapper}>
              <Search size={16} className={styles.searchIcon} />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by company name, ID, or industry..."
                className={styles.searchInput}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className={styles.clearSearchBtn}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            {/* Industry/Type Dropdown */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Industries / Types</option>
              <option value="Service">Service</option>
              <option value="Product">Product</option>
              <option value="Retail">Retail &amp; Commerce</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Consulting">Consulting</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Technology">Technology</option>
              <option value="General">General</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Pill Tabs */}
        <div className={styles.filterTabsRow}>
          <button 
            onClick={() => { setStatusFilter(''); setTypeFilter(''); }}
            className={`${styles.filterTabBtn} ${statusFilter === '' && typeFilter === '' ? styles.filterTabBtnActive : ''}`}
          >
            <Building2 size={14} />
            All Tenants ({totalCompanies})
          </button>
          <button 
            onClick={() => setStatusFilter('ACTIVE')}
            className={`${styles.filterTabBtn} ${statusFilter === 'ACTIVE' ? styles.filterTabBtnActive : ''}`}
          >
            <CheckCircle2 size={14} />
            Active ({activeCompanies})
          </button>
          <button 
            onClick={() => setStatusFilter('SUSPENDED')}
            className={`${styles.filterTabBtn} ${statusFilter === 'SUSPENDED' ? styles.filterTabBtnActive : ''}`}
          >
            <AlertTriangle size={14} />
            Suspended ({companies.filter(c => c.status === 'SUSPENDED').length})
          </button>
        </div>

        {/* Table View */}
        <div className={styles.tableContainer}>
          <table className={styles.tenantsTable}>
            <thead>
              <tr>
                <th>Company &amp; ID</th>
                <th>Industry / Type</th>
                <th>Active Plan (Manual Assignment)</th>
                <th>Team Members</th>
                <th>Lifecycle Status</th>
                <th>Created Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    <RefreshCw size={28} className={styles.spinning} style={{ color: '#10b981' }} />
                    <p style={{ marginTop: '12px', fontSize: '14px', color: '#94a3b8' }}>
                      Loading verified tenant registry...
                    </p>
                  </td>
                </tr>
              ) : filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    <Building2 size={40} style={{ opacity: 0.3 }} />
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>
                      No matching tenant organizations found
                    </p>
                    <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                      Try adjusting your search query, status filters, or industry classification.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((c) => {
                  const statusClass = c.status === 'ACTIVE' 
                    ? styles.statusActive 
                    : c.status === 'SUSPENDED' 
                    ? styles.statusSuspended 
                    : styles.statusInactive;

                  const initials = c.name
                    ? c.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
                    : 'CO';

                  return (
                    <tr key={c.id} className={styles.tenantRow}>
                      <td>
                        <div className={styles.companyIdentityCell}>
                          <div className={styles.companyAvatar}>
                            {initials}
                          </div>
                          <div className={styles.companyInfoText}>
                            <span className={styles.companyName}>{c.name}</span>
                            <span className={styles.companyIdTag}>
                              {c.id.substring(0, 8)}...
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(c.id);
                                  showToast('Company ID copied to clipboard', 'success');
                                }}
                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#64748b' }}
                                title="Copy full ID"
                              >
                                <Copy size={11} />
                              </button>
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={styles.typeBadge}>
                          <Briefcase size={12} />
                          <span>{c.businessType || 'General'}</span>
                        </span>
                      </td>

                      <td>
                        <select
                          value={c.subscription?.plan?.id || ""}
                          onChange={(e) => handlePlanChange(c.id, e.target.value)}
                          className={styles.planSelectDropdown}
                          title="Manually select plan for this tenant"
                        >
                          <option value="">Free / Basic (No Plan)</option>
                          {plans.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (৳{p.price.toLocaleString()}/mo)
                            </option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <span className={styles.usersCountBadge}>
                          <Users size={13} />
                          <span>{c._count?.users || 1} User{c._count?.users !== 1 ? 's' : ''}</span>
                        </span>
                      </td>

                      <td>
                        <span className={`${styles.statusPill} ${statusClass}`}>
                          <div className={styles.statusDot} />
                          <span>{c.status}</span>
                        </span>
                      </td>

                      <td style={{ color: '#94a3b8', fontSize: '12.5px' }}>
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>

                      <td>
                        <div className={styles.actionsGroup}>
                          {/* Status Modifier Selector */}
                          <select
                            value={c.status}
                            onChange={(e) => handleStatusChange(c.id, e.target.value)}
                            className={styles.statusActionSelect}
                            title="Update Company Status"
                          >
                            <option value="ACTIVE">Set Active</option>
                            <option value="SUSPENDED">Suspend</option>
                            <option value="INACTIVE">Set Inactive</option>
                          </select>

                          {/* Edit Details Modal Opener */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            className={styles.iconActionBtn}
                            title="Edit Tenant Information"
                          >
                            <Edit3 size={14} />
                          </button>

                          {/* Inspect Subscriptions Link */}
                          <Link
                            href={`/super-admin/subscriptions`}
                            className={styles.iconActionBtn}
                            title="Manage Subscriptions"
                          >
                            <ExternalLink size={14} />
                          </Link>
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

      {/* 4. Provision Tenant Modal */}
      {isCreateModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCreateModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <Building2 size={18} style={{ color: '#10b981' }} />
                Provision New Tenant Organization
              </h3>
              <button 
                type="button" 
                onClick={() => setIsCreateModalOpen(false)}
                className={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Organization / Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Global Logistics"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Business Type / Sector</label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessType: e.target.value }))}
                    className={styles.formInput}
                  >
                    <option value="Service">Service</option>
                    <option value="Product">Product</option>
                    <option value="Retail">Retail &amp; Commerce</option>
                    <option value="Manufacturing">Manufacturing &amp; Industrial</option>
                    <option value="Consulting">Consulting &amp; Advisory</option>
                    <option value="Healthcare">Healthcare &amp; Pharma</option>
                    <option value="Technology">Technology &amp; SaaS</option>
                    <option value="General">General Business</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Assigned Subscription Plan</label>
                  <select
                    value={formData.planId}
                    onChange={(e) => setFormData(prev => ({ ...prev, planId: e.target.value }))}
                    className={styles.formInput}
                  >
                    <option value="">Free / Basic (No Plan)</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (৳{p.price.toLocaleString()}/mo)
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Initial Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className={styles.formInput}
                  >
                    <option value="ACTIVE">Active (Immediate Access)</option>
                    <option value="SUSPENDED">Suspended (Provision Only)</option>
                    <option value="INACTIVE">Inactive (Pending Onboarding)</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className={styles.modalCancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.name.trim()}
                  className={styles.modalSubmitBtn}
                >
                  {submitting ? 'Provisioning...' : 'Provision Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Edit Tenant Modal */}
      {isEditModalOpen && selectedCompany && (
        <div className={styles.modalOverlay} onClick={() => setIsEditModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <Edit3 size={18} style={{ color: '#10b981' }} />
                Edit Tenant Organization
              </h3>
              <button 
                type="button" 
                onClick={() => setIsEditModalOpen(false)}
                className={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Company ID</label>
                  <input
                    type="text"
                    disabled
                    value={selectedCompany.id}
                    className={styles.formInput}
                    style={{ opacity: 0.6, cursor: 'not-allowed', fontFamily: 'monospace' }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Organization Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Business Type / Sector</label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessType: e.target.value }))}
                    className={styles.formInput}
                  >
                    <option value="Service">Service</option>
                    <option value="Product">Product</option>
                    <option value="Retail">Retail &amp; Commerce</option>
                    <option value="Manufacturing">Manufacturing &amp; Industrial</option>
                    <option value="Consulting">Consulting &amp; Advisory</option>
                    <option value="Healthcare">Healthcare &amp; Pharma</option>
                    <option value="Technology">Technology &amp; SaaS</option>
                    <option value="General">General Business</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Assigned Subscription Plan</label>
                  <select
                    value={formData.planId}
                    onChange={(e) => setFormData(prev => ({ ...prev, planId: e.target.value }))}
                    className={styles.formInput}
                  >
                    <option value="">Free / Basic (No Plan)</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (৳{p.price.toLocaleString()}/mo)
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Lifecycle Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className={styles.formInput}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className={styles.modalCancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.name.trim()}
                  className={styles.modalSubmitBtn}
                >
                  {submitting ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
