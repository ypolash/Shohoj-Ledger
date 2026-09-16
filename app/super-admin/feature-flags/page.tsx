"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  SlidersHorizontal,
  Search,
  RefreshCw,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Layers,
  Building2,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Flag,
  Percent,
} from "lucide-react";
import styles from "./featureFlags.module.css";

interface FeatureFlagItem {
  id: string;
  key: string;
  description: string | null;
  isEnabled: boolean;
  rolloutPercentage: number;
  enabledCompanyIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface CompanyItem {
  id: string;
  name: string;
  businessType?: string;
}

interface FeatureFlagsMetrics {
  totalFlags: number;
  activeFlags: number;
  canaryRollouts: number;
  targetedTenantsCount: number;
}

export default function SuperAdminFeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlagItem[]>([]);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [metrics, setMetrics] = useState<FeatureFlagsMetrics>({
    totalFlags: 0,
    activeFlags: 0,
    canaryRollouts: 0,
    targetedTenantsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "CANARY" | "INACTIVE">("ALL");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlagItem | null>(null);

  // Forms
  const [formData, setFormData] = useState({
    key: "",
    description: "",
    isEnabled: true,
    rolloutPercentage: 100,
    enabledCompanyIds: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);

  // Copy state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/system/feature-flags");
      if (res.status === 401) {
        window.location.href = "/super-admin/login";
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch feature flags");
      }
      const data = await res.json();
      setFlags(data.flags || []);
      setCompanies(data.companies || []);
      if (data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Error loading feature flags", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  // Filtered dataset
  const filteredFlags = useMemo(() => {
    return flags.filter((flag) => {
      // Tab filter
      if (activeTab === "ACTIVE" && (!flag.isEnabled || flag.rolloutPercentage < 100)) return false;
      if (activeTab === "CANARY" && (!flag.isEnabled || (flag.rolloutPercentage === 100 && (!flag.enabledCompanyIds || flag.enabledCompanyIds.length === 0)))) return false;
      if (activeTab === "INACTIVE" && flag.isEnabled) return false;

      // Status dropdown
      if (statusFilter === "ACTIVE" && !flag.isEnabled) return false;
      if (statusFilter === "INACTIVE" && flag.isEnabled) return false;
      if (statusFilter === "CANARY" && (!flag.isEnabled || (flag.rolloutPercentage === 100 && (!flag.enabledCompanyIds || flag.enabledCompanyIds.length === 0)))) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const keyMatch = flag.key.toLowerCase().includes(query);
        const descMatch = flag.description?.toLowerCase().includes(query) || false;
        return keyMatch || descMatch;
      }

      return true;
    });
  }, [flags, activeTab, statusFilter, searchTerm]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const total = flags.length;
    const active = flags.filter((f) => f.isEnabled && f.rolloutPercentage === 100 && (!f.enabledCompanyIds || f.enabledCompanyIds.length === 0)).length;
    const canary = flags.filter((f) => f.isEnabled && (f.rolloutPercentage < 100 || (f.enabledCompanyIds && f.enabledCompanyIds.length > 0))).length;
    const inactive = flags.filter((f) => !f.isEnabled).length;
    return { total, active, canary, inactive };
  }, [flags]);

  // Instant Toggle Flag
  const handleToggleFlag = async (flag: FeatureFlagItem) => {
    const newEnabled = !flag.isEnabled;
    // Optimistic UI update
    setFlags((prev) =>
      prev.map((f) => (f.id === flag.id ? { ...f, isEnabled: newEnabled } : f))
    );

    try {
      const res = await fetch("/api/system/feature-flags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: flag.id, isEnabled: newEnabled }),
      });

      if (!res.ok) {
        throw new Error("Failed to toggle feature flag state");
      }

      showToast(`Flag '${flag.key}' ${newEnabled ? "enabled" : "disabled"} successfully`);
      fetchFlags();
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Failed to update flag state", "error");
      // Revert optimistic update
      fetchFlags();
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormData({
      key: "",
      description: "",
      isEnabled: true,
      rolloutPercentage: 100,
      enabledCompanyIds: [],
    });
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (flag: FeatureFlagItem) => {
    setSelectedFlag(flag);
    setFormData({
      key: flag.key,
      description: flag.description || "",
      isEnabled: flag.isEnabled,
      rolloutPercentage: flag.rolloutPercentage,
      enabledCompanyIds: flag.enabledCompanyIds || [],
    });
    setIsEditModalOpen(true);
  };

  // Create Flag Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/system/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create feature flag");
      }

      showToast("Feature flag created successfully");
      setIsCreateModalOpen(false);
      fetchFlags();
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Failed to create feature flag", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Flag Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlag) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/system/feature-flags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedFlag.id,
          ...formData,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update feature flag");
      }

      showToast("Feature flag configuration updated successfully");
      setIsEditModalOpen(false);
      fetchFlags();
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Failed to update feature flag", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Flag
  const handleDeleteFlag = async (flag: FeatureFlagItem) => {
    if (!confirm(`Are you sure you want to delete feature flag '${flag.key}'? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/system/feature-flags?id=${flag.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete feature flag");
      }

      showToast(`Feature flag '${flag.key}' deleted successfully`);
      fetchFlags();
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Failed to delete feature flag", "error");
    }
  };

  // Copy Key to Clipboard
  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    showToast(`Flag key '${key}' copied to clipboard`);
  };

  // Company selection helper
  const handleToggleCompany = (companyId: string) => {
    setFormData((prev) => {
      const exists = prev.enabledCompanyIds.includes(companyId);
      return {
        ...prev,
        enabledCompanyIds: exists
          ? prev.enabledCompanyIds.filter((id) => id !== companyId)
          : [...prev.enabledCompanyIds, companyId],
      };
    });
  };

  return (
    <div className={styles.pageContainer}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={styles.toast}
          style={{
            background:
              toastMessage.type === "success"
                ? "linear-gradient(135deg, #059669 0%, #10b981 100%)"
                : "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
            border: `1px solid ${toastMessage.type === "success" ? "#34d399" : "#f87171"}`,
          }}
        >
          {toastMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.liveBadgeRow}>
            <span className={styles.livePulseDot}></span>
            <span className={styles.liveBadgeText}>CANARY &amp; FEATURE RELEASE TELEMETRY</span>
          </div>
          <h1 className={styles.pageTitle}>
            <SlidersHorizontal size={28} color="#34d399" />
            Feature Flags &amp; Canary Rollouts
          </h1>
          <p className={styles.pageSubtitle}>
            Dynamic platform capability switches, progressive percentage rollouts, and granular multi-tenant enterprise beta allocations.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            onClick={fetchFlags}
            disabled={loading}
            className={styles.refreshBtn}
            title="Refresh Flags"
          >
            <RefreshCw size={15} className={loading ? styles.spinning : ""} />
            Refresh
          </button>

          <button
            onClick={handleOpenCreateModal}
            className={styles.primaryActionBtn}
          >
            <Plus size={16} />
            Create Feature Flag
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics Grid */}
      <div className={styles.kpiGrid}>
        {/* Total Flags */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div
              className={styles.kpiIconBox}
              style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)" }}
            >
              <Flag size={22} color="#34d399" />
            </div>
            <span
              className={styles.kpiBadge}
              style={{ background: "rgba(16, 185, 129, 0.12)", color: "#a7f3d0" }}
            >
              <Layers size={12} /> Registry
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Total Feature Flags</span>
            <span className={styles.kpiValue}>
              {loading ? "..." : metrics.totalFlags.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Active Globally */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div
              className={styles.kpiIconBox}
              style={{ background: "rgba(59, 130, 246, 0.15)", border: "1px solid rgba(59, 130, 246, 0.3)" }}
            >
              <Zap size={22} color="#60a5fa" />
            </div>
            <span
              className={styles.kpiBadge}
              style={{ background: "rgba(59, 130, 246, 0.12)", color: "#93c5fd" }}
            >
              <CheckCircle2 size={12} /> 100% Live
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Active Globally</span>
            <span className={styles.kpiValue}>
              {loading ? "..." : metrics.activeFlags.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Canary Rollouts */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div
              className={styles.kpiIconBox}
              style={{ background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.3)" }}
            >
              <Percent size={22} color="#fbbf24" />
            </div>
            <span
              className={styles.kpiBadge}
              style={{ background: "rgba(245, 158, 11, 0.12)", color: "#fef3c7" }}
            >
              <Sparkles size={12} /> Progressive
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Canary &amp; Staged Rollouts</span>
            <span className={styles.kpiValue}>
              {loading ? "..." : metrics.canaryRollouts.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Targeted Tenants */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div
              className={styles.kpiIconBox}
              style={{ background: "rgba(168, 85, 247, 0.15)", border: "1px solid rgba(168, 85, 247, 0.3)" }}
            >
              <Building2 size={22} color="#c084fc" />
            </div>
            <span
              className={styles.kpiBadge}
              style={{ background: "rgba(168, 85, 247, 0.12)", color: "#e9d5ff" }}
            >
              <ShieldCheck size={12} /> Whitelisted
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Targeted Tenant Orgs</span>
            <span className={styles.kpiValue}>
              {loading ? "..." : metrics.targetedTenantsCount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Card & Table */}
      <div className={styles.mainCard}>
        {/* Controls & Filter Bar */}
        <div className={styles.controlsBar}>
          <div className={styles.controlsLeft}>
            <div className={styles.searchWrapper}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by flag key, feature, or description..."
                className={styles.searchInput}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className={styles.clearSearchBtn}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active (Enabled)</option>
              <option value="CANARY">Canary / Staged</option>
              <option value="INACTIVE">Inactive (Disabled)</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div className={styles.filterTabsRow}>
          <button
            onClick={() => setActiveTab("ALL")}
            className={`${styles.filterTabBtn} ${activeTab === "ALL" ? styles.filterTabBtnActive : ""}`}
          >
            All Flags ({tabCounts.total})
          </button>
          <button
            onClick={() => setActiveTab("ACTIVE")}
            className={`${styles.filterTabBtn} ${activeTab === "ACTIVE" ? styles.filterTabBtnActive : ""}`}
          >
            Active Globally ({tabCounts.active})
          </button>
          <button
            onClick={() => setActiveTab("CANARY")}
            className={`${styles.filterTabBtn} ${activeTab === "CANARY" ? styles.filterTabBtnActive : ""}`}
          >
            Canary / Staged ({tabCounts.canary})
          </button>
          <button
            onClick={() => setActiveTab("INACTIVE")}
            className={`${styles.filterTabBtn} ${activeTab === "INACTIVE" ? styles.filterTabBtnActive : ""}`}
          >
            Inactive ({tabCounts.inactive})
          </button>
        </div>

        {/* Flags Table */}
        <div className={styles.tableContainer}>
          <table className={styles.flagsTable}>
            <thead>
              <tr>
                <th>Feature Flag Key &amp; Scope</th>
                <th>Status</th>
                <th>Rollout %</th>
                <th>Targeted Tenants</th>
                <th style={{ textAlign: "center" }}>Instant Toggle</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>
                    <RefreshCw size={28} className={styles.spinning} color="#34d399" />
                    <span>Loading feature flags registry...</span>
                  </td>
                </tr>
              ) : filteredFlags.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>
                    <SlidersHorizontal size={40} style={{ opacity: 0.3 }} />
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "#f1f5f9" }}>
                      No matching feature flags found
                    </span>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      Try adjusting your search query, status filters, or tab selection.
                    </span>
                  </td>
                </tr>
              ) : (
                filteredFlags.map((flag) => {
                  const isCanary = flag.isEnabled && (flag.rolloutPercentage < 100 || (flag.enabledCompanyIds && flag.enabledCompanyIds.length > 0));

                  return (
                    <tr key={flag.id} className={styles.flagRow}>
                      <td>
                        <div className={styles.flagKeyCell}>
                          <div className={styles.flagKeyText}>
                            <span>{flag.key}</span>
                            <button
                              onClick={() => handleCopyKey(flag.key)}
                              className={styles.clearSearchBtn}
                              style={{ position: "static", transform: "none", color: "#64748b" }}
                              title="Copy Flag Key"
                            >
                              {copiedKey === flag.key ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                            </button>
                          </div>
                          <div className={styles.flagDescText}>
                            {flag.description || "No description provided for this feature flag."}
                          </div>
                        </div>
                      </td>

                      <td>
                        {!flag.isEnabled ? (
                          <span className={styles.badgeInactive}>
                            <X size={12} /> Disabled
                          </span>
                        ) : isCanary ? (
                          <span className={styles.badgeCanary}>
                            <Sparkles size={12} /> Canary ({flag.rolloutPercentage}%)
                          </span>
                        ) : (
                          <span className={styles.badgeActive}>
                            <CheckCircle2 size={12} /> Live (100%)
                          </span>
                        )}
                      </td>

                      <td>
                        <div className={styles.rolloutProgressWrapper}>
                          <div className={styles.rolloutProgressBar}>
                            <div
                              className={`${styles.rolloutProgressFill} ${
                                !flag.isEnabled
                                  ? styles.rolloutProgressFillDisabled
                                  : isCanary
                                  ? styles.rolloutProgressFillCanary
                                  : ""
                              }`}
                              style={{ width: `${flag.isEnabled ? flag.rolloutPercentage : 0}%` }}
                            />
                          </div>
                          <span className={styles.rolloutPercentText}>
                            {flag.isEnabled ? `${flag.rolloutPercentage}%` : "0%"}
                          </span>
                        </div>
                      </td>

                      <td>
                        {flag.enabledCompanyIds && flag.enabledCompanyIds.length > 0 ? (
                          <div className={styles.companiesPillList}>
                            {flag.enabledCompanyIds.map((cid) => {
                              const comp = companies.find((c) => c.id === cid);
                              return (
                                <span key={cid} className={styles.companyPill}>
                                  <Building2 size={11} color="#34d399" />
                                  {comp?.name || cid.slice(0, 8)}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span style={{ fontSize: "12px", color: "#64748b" }}>
                            {flag.isEnabled && flag.rolloutPercentage === 100 ? "All Tenants (Global)" : "None"}
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <label className={styles.switchToggle}>
                          <input
                            type="checkbox"
                            checked={flag.isEnabled}
                            onChange={() => handleToggleFlag(flag)}
                          />
                          <span className={styles.switchSlider}></span>
                        </label>
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <div className={styles.actionButtons}>
                          <button
                            onClick={() => handleOpenEditModal(flag)}
                            className={styles.iconActionBtn}
                            title="Configure Flag"
                          >
                            <Edit3 size={13} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteFlag(flag)}
                            className={`${styles.iconActionBtn} ${styles.iconActionBtnDelete}`}
                            title="Delete Flag"
                          >
                            <Trash2 size={13} />
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

      {/* 4. Create Feature Flag Modal */}
      {isCreateModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCreateModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Plus size={20} color="#34d399" />
                Create New Feature Flag
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Feature Flag Key *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AI_BILLING_COPILOT"
                    value={formData.key}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        key: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                      }))
                    }
                    className={styles.formInput}
                    style={{ fontFamily: "monospace" }}
                  />
                  <span className={styles.formHelper}>
                    Must be uppercase SNAKE_CASE identifier referenced in application guards.
                  </span>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description</label>
                  <textarea
                    rows={2}
                    placeholder="Explain what capability this flag enables and impact on tenants..."
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    className={styles.formInput}
                    style={{ resize: "vertical" }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label className={styles.formLabel}>Initial Activation State</label>
                    <label className={styles.switchToggle}>
                      <input
                        type="checkbox"
                        checked={formData.isEnabled}
                        onChange={(e) => setFormData((prev) => ({ ...prev, isEnabled: e.target.checked }))}
                      />
                      <span className={styles.switchSlider}></span>
                    </label>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label className={styles.formLabel}>Canary Rollout Percentage</label>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#34d399" }}>
                      {formData.rolloutPercentage}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={formData.rolloutPercentage}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, rolloutPercentage: Number(e.target.value) }))
                    }
                    style={{ width: "100%", accentColor: "#10b981", cursor: "pointer" }}
                  />
                  <span className={styles.formHelper}>
                    Determines stochastic rollout proportion across unpinned multi-tenant users.
                  </span>
                </div>

                {companies.length > 0 && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Target Specific Tenant Companies (Optional)</label>
                    <div className={styles.companyCheckboxList}>
                      {companies.map((company) => (
                        <label key={company.id} className={styles.checkboxItem}>
                          <input
                            type="checkbox"
                            checked={formData.enabledCompanyIds.includes(company.id)}
                            onChange={() => handleToggleCompany(company.id)}
                          />
                          <span>{company.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
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
                  disabled={submitting || !formData.key.trim()}
                  className={styles.modalSubmitBtn}
                >
                  {submitting ? "Creating Flag..." : "Create Flag"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Edit Feature Flag Modal */}
      {isEditModalOpen && selectedFlag && (
        <div className={styles.modalOverlay} onClick={() => setIsEditModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Edit3 size={20} color="#34d399" />
                Configure Flag: {selectedFlag.key}
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Feature Flag Key</label>
                  <input
                    type="text"
                    readOnly
                    value={formData.key}
                    className={styles.formInput}
                    style={{ fontFamily: "monospace", opacity: 0.7, background: "rgba(0,0,0,0.4)" }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description</label>
                  <textarea
                    rows={2}
                    placeholder="Feature flag description..."
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    className={styles.formInput}
                    style={{ resize: "vertical" }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label className={styles.formLabel}>Flag State (Enabled / Disabled)</label>
                    <label className={styles.switchToggle}>
                      <input
                        type="checkbox"
                        checked={formData.isEnabled}
                        onChange={(e) => setFormData((prev) => ({ ...prev, isEnabled: e.target.checked }))}
                      />
                      <span className={styles.switchSlider}></span>
                    </label>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label className={styles.formLabel}>Canary Rollout Percentage</label>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#34d399" }}>
                      {formData.rolloutPercentage}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={formData.rolloutPercentage}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, rolloutPercentage: Number(e.target.value) }))
                    }
                    style={{ width: "100%", accentColor: "#10b981", cursor: "pointer" }}
                  />
                </div>

                {companies.length > 0 && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Target Specific Tenant Companies</label>
                    <div className={styles.companyCheckboxList}>
                      {companies.map((company) => (
                        <label key={company.id} className={styles.checkboxItem}>
                          <input
                            type="checkbox"
                            checked={formData.enabledCompanyIds.includes(company.id)}
                            onChange={() => handleToggleCompany(company.id)}
                          />
                          <span>{company.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
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
                  disabled={submitting}
                  className={styles.modalSubmitBtn}
                >
                  {submitting ? "Saving Changes..." : "Save Configuration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
