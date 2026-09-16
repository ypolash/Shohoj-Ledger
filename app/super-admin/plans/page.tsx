"use client";

import React, { useState, useEffect } from "react";
import {
  CRM_FEATURES,
  ERP_SYSTEM_MODULES,
  FEATURE_PRESETS,
  getFeatureByKey,
} from "@/lib/billing/crmFeatures";
import {
  Plus,
  RefreshCw,
  Edit3,
  Trash2,
  Check,
  X,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Users,
  CheckCircle2,
  XCircle,
  DollarSign,
  Search,
  Sliders,
  CheckSquare,
  Square,
  Building2,
} from "lucide-react";
import styles from "./plans.module.css";

interface SubscriptionPlanItem {
  id: string;
  name: string;
  price: number;
  billingCycle: string;
  features: string[];
  maxUsers: number | null;
  status: string;
  createdAt?: string;
  _count?: {
    subscriptions: number;
  };
}

export default function PlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlanItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cycleFilter, setCycleFilter] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanItem | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | string>(0);
  const [billingCycle, setBillingCycle] = useState("MONTHLY");
  const [isUnlimitedUsers, setIsUnlimitedUsers] = useState(false);
  const [maxUsers, setMaxUsers] = useState<number | string>(10);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [planStatus, setPlanStatus] = useState("ACTIVE");
  const [activeTab, setActiveTab] = useState<"CRM" | "ERP">("CRM");

  // Deletion Modal
  const [planToDelete, setPlanToDelete] = useState<SubscriptionPlanItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/system/plans");
      if (res.status === 401) {
        window.location.href = "/super-admin/login";
        return;
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch plans");
      }
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Failed to load plans", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setName("");
    setPrice(0);
    setBillingCycle("MONTHLY");
    setIsUnlimitedUsers(false);
    setMaxUsers(10);
    setSelectedFeatures(FEATURE_PRESETS.FULL_CRM.keys);
    setPlanStatus("ACTIVE");
    setActiveTab("CRM");
    setShowModal(true);
  };

  const openEditModal = (plan: SubscriptionPlanItem) => {
    setEditingPlan(plan);
    setName(plan.name);
    setPrice(plan.price);
    setBillingCycle(plan.billingCycle || "MONTHLY");
    setIsUnlimitedUsers(!plan.maxUsers);
    setMaxUsers(plan.maxUsers || 10);
    setSelectedFeatures(plan.features || []);
    setPlanStatus(plan.status || "ACTIVE");
    setActiveTab("CRM");
    setShowModal(true);
  };

  const handleToggleFeature = (featureKey: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureKey)
        ? prev.filter((k) => k !== featureKey)
        : [...prev, featureKey]
    );
  };

  const applyPreset = (keys: string[]) => {
    const erpKeys = selectedFeatures.filter((k) => k.startsWith("mod_"));
    const newKeys = Array.from(new Set([...keys, ...erpKeys]));
    setSelectedFeatures(newKeys);
  };

  const applyAllErp = () => {
    const allErpKeys = ERP_SYSTEM_MODULES.map((m) => m.key);
    const crmKeys = selectedFeatures.filter((k) => k.startsWith("crm_"));
    setSelectedFeatures(Array.from(new Set([...crmKeys, ...allErpKeys])));
  };

  const clearAllFeatures = () => {
    setSelectedFeatures([]);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Plan name is required", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        price: Number(price) || 0,
        billingCycle,
        maxUsers: isUnlimitedUsers ? null : Number(maxUsers) || 0,
        features: selectedFeatures,
        status: planStatus,
      };

      if (editingPlan) {
        const res = await fetch("/api/system/plans", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: editingPlan.id, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update plan");
        showToast("Subscription plan updated successfully!");
      } else {
        const res = await fetch("/api/system/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create plan");
        showToast("Subscription plan created successfully!");
      }

      setShowModal(false);
      fetchPlans();
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Failed to save plan", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (planId: string, newStatus: string) => {
    try {
      setPlans((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, status: newStatus } : p))
      );

      const res = await fetch("/api/system/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update status");
      }
      showToast(`Plan marked as ${newStatus}`);
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Failed to update plan status", "error");
      fetchPlans();
    }
  };

  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/system/plans?planId=${planToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete plan");

      showToast("Plan deleted successfully");
      setPlanToDelete(null);
      fetchPlans();
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Failed to delete plan", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Metrics
  const totalPlans = plans.length;
  const activePlans = plans.filter((p) => p.status === "ACTIVE").length;
  const totalSubscribers = plans.reduce((sum, p) => sum + (p._count?.subscriptions || 0), 0);
  const avgPrice = totalPlans > 0 ? (plans.reduce((sum, p) => sum + p.price, 0) / totalPlans).toFixed(2) : "0.00";

  // Filtered plans
  const filteredPlans = plans.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.features?.some((f) => f.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = !statusFilter || p.status === statusFilter;
    const matchesCycle = !cycleFilter || p.billingCycle === cycleFilter;

    return matchesSearch && matchesStatus && matchesCycle;
  });

  return (
    <div className={styles.pageContainer}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={styles.toast}
          style={{ backgroundColor: toastMessage.type === "success" ? "#10b981" : "#ef4444" }}
        >
          {toastMessage.type === "success" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Executive Mission Control Header Card */}
      <section className={styles.headerCard}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.liveBadgeRow}>
            <div className={styles.livePulseDot} />
            <span className={styles.liveBadgeText}>Subscription Tier Engine &amp; Entitlement Matrix Active</span>
          </div>
          <h1 className={styles.pageTitle}>
            <Sparkles size={26} style={{ color: "#c084fc" }} />
            Subscription Plans &amp; Feature Manager
          </h1>
          <p className={styles.pageSubtitle}>
            Build custom subscription pricing tiers, set user seat thresholds, and configure granular CRM features and ERP system modules enabled for each tier.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={fetchPlans}
            disabled={loading}
            className={styles.refreshBtn}
            title="Refresh Plans"
          >
            <RefreshCw size={15} className={loading ? styles.spinning : ""} />
            <span>{loading ? "Refreshing..." : "Refresh Plans"}</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className={styles.primaryActionBtn}
          >
            <Plus size={16} />
            <span>Create New Plan</span>
          </button>
        </div>
      </section>

      {/* 2. KPI Metric Cards Grid */}
      <section className={styles.kpiGrid}>
        {/* Total Plans */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div className={styles.kpiIconBox} style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc" }}>
              <Layers size={24} />
            </div>
            <span className={styles.kpiBadge} style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc" }}>
              Tiers
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Configured Plans</span>
            <span className={styles.kpiValue} style={{ color: "#c084fc" }}>{totalPlans}</span>
          </div>
        </div>

        {/* Active Tiers */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div className={styles.kpiIconBox} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
              <ShieldCheck size={24} />
            </div>
            <span className={styles.kpiBadge} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
              Live
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Active Plans</span>
            <span className={styles.kpiValue} style={{ color: "#34d399" }}>{activePlans}</span>
          </div>
        </div>

        {/* Subscribed Companies */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div className={styles.kpiIconBox} style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}>
              <Building2 size={24} />
            </div>
            <span className={styles.kpiBadge} style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}>
              Tenants
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Subscribed Tenants</span>
            <span className={styles.kpiValue} style={{ color: "#60a5fa" }}>{totalSubscribers}</span>
          </div>
        </div>

        {/* Average Tier Price */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div className={styles.kpiIconBox} style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
              <DollarSign size={24} />
            </div>
            <span className={styles.kpiBadge} style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
              Pricing
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Average Tier Price</span>
            <span className={styles.kpiValue} style={{ color: "#fbbf24" }}>${avgPrice}</span>
          </div>
        </div>
      </section>

      {/* 3. Main Card & Data Controls */}
      <section className={styles.mainCard}>
        {/* Controls Bar */}
        <div className={styles.controlsBar}>
          <div className={styles.controlsLeft}>
            {/* Search Input */}
            <div className={styles.searchWrapper}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search plans by name or features..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
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
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            {/* Billing Cycle Filter */}
            <select
              value={cycleFilter}
              onChange={(e) => setCycleFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Cycles</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div className={styles.filterTabsRow}>
          <button
            type="button"
            onClick={() => { setStatusFilter(""); setCycleFilter(""); }}
            className={`${styles.filterTabBtn} ${statusFilter === "" && cycleFilter === "" ? styles.filterTabBtnActive : ""}`}
          >
            <Layers size={13} />
            <span>All Tiers ({totalPlans})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("ACTIVE")}
            className={`${styles.filterTabBtn} ${statusFilter === "ACTIVE" ? styles.filterTabBtnActive : ""}`}
          >
            <CheckCircle2 size={13} />
            <span>Active ({activePlans})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("INACTIVE")}
            className={`${styles.filterTabBtn} ${statusFilter === "INACTIVE" ? styles.filterTabBtnActive : ""}`}
          >
            <AlertTriangle size={13} />
            <span>Inactive ({plans.filter((p) => p.status === "INACTIVE").length})</span>
          </button>
        </div>

        {/* Plans Table */}
        <div className={styles.tableContainer}>
          <table className={styles.plansTable}>
            <thead>
              <tr>
                <th>Plan &amp; Cycle</th>
                <th>Pricing</th>
                <th>User Limit</th>
                <th>Features Included</th>
                <th>Subscribers</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <div className={styles.emptyState}>
                      <RefreshCw size={24} className={styles.spinning} style={{ color: "#c084fc" }} />
                      <span>Loading subscription plans...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className={styles.emptyState}>
                      <Layers size={48} style={{ opacity: 0.3 }} />
                      <p style={{ margin: 0, fontWeight: 600, fontSize: "15px", color: "#cbd5e1" }}>No subscription plans found</p>
                      <span style={{ fontSize: "13px" }}>Create your first tier or adjust your search filter.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => {
                  const crmFeaturesCount = (plan.features || []).filter((f) => f.startsWith("crm_")).length;
                  const erpModulesCount = (plan.features || []).filter((f) => f.startsWith("mod_")).length;
                  const previewFeatures = (plan.features || []).slice(0, 3);
                  const remainingCount = Math.max(0, (plan.features || []).length - 3);

                  return (
                    <tr key={plan.id} className={styles.planRow}>
                      {/* Plan & Cycle */}
                      <td>
                        <div className={styles.planIdentityCell}>
                          <div className={styles.planIconBox}>
                            <Sparkles size={20} />
                          </div>
                          <div className={styles.planInfoText}>
                            <span className={styles.planName}>{plan.name}</span>
                            <span className={styles.billingCycleBadge}>{plan.billingCycle}</span>
                          </div>
                        </div>
                      </td>

                      {/* Pricing */}
                      <td>
                        <span className={styles.priceDisplay}>${plan.price.toFixed(2)}</span>
                        <span className={styles.priceCycle}>/{plan.billingCycle === "YEARLY" ? "yr" : "mo"}</span>
                      </td>

                      {/* User Limit */}
                      <td>
                        <span className={styles.userLimitBadge}>
                          <Users size={14} style={{ color: "#a855f7" }} />
                          <span>{plan.maxUsers ? `${plan.maxUsers} Users` : "Unlimited Users"}</span>
                        </span>
                      </td>

                      {/* Features Included */}
                      <td>
                        <div className={styles.featuresList}>
                          <div className={styles.featurePillRow}>
                            {crmFeaturesCount > 0 ? (
                              <span className={styles.featureCountTag} style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc", borderColor: "rgba(168, 85, 247, 0.3)" }}>
                                +{crmFeaturesCount} CRM
                              </span>
                            ) : (
                              <span className={styles.featureCountTag} style={{ background: "rgba(239, 68, 68, 0.1)", color: "#f87171", borderColor: "rgba(239, 68, 68, 0.25)" }}>
                                No CRM Features
                              </span>
                            )}
                            {erpModulesCount > 0 && (
                              <span className={styles.featureCountTag} style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", borderColor: "rgba(245, 158, 11, 0.3)" }}>
                                +{erpModulesCount} ERP
                              </span>
                            )}
                          </div>

                          <div className={styles.featurePillRow}>
                            {previewFeatures.map((fKey) => {
                              const feat = getFeatureByKey(fKey);
                              return (
                                <span key={fKey} className={styles.featureTag}>
                                  • {feat ? feat.name : fKey}
                                </span>
                              );
                            })}
                            {remainingCount > 0 && (
                              <span className={styles.featureTag} style={{ color: "#a855f7", fontWeight: 600 }}>
                                +{remainingCount} more
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Subscribers */}
                      <td>
                        <span className={styles.subscribersBadge}>
                          <Building2 size={13} />
                          <span>{plan._count?.subscriptions || 0} Compan{plan._count?.subscriptions === 1 ? "y" : "ies"}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`${styles.statusPill} ${plan.status === "ACTIVE" ? styles.statusActive : styles.statusInactive}`}>
                          <div className={styles.statusDot} />
                          <span>{plan.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className={styles.actionsGroup}>
                          <select
                            value={plan.status}
                            onChange={(e) => handleUpdateStatus(plan.id, e.target.value)}
                            className={styles.statusActionSelect}
                          >
                            <option value="ACTIVE">Set Active</option>
                            <option value="INACTIVE">Set Inactive</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => openEditModal(plan)}
                            className={styles.iconEditBtn}
                            title="Edit Plan"
                          >
                            <Edit3 size={13} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPlanToDelete(plan)}
                            className={styles.iconDeleteBtn}
                            title="Delete Plan"
                          >
                            <Trash2 size={14} />
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

      {/* 4. Plan Customizer Modal (Create & Edit) */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <Sparkles size={18} style={{ color: "#c084fc" }} />
                <span>{editingPlan ? "Edit Subscription Plan" : "Create New Subscription Plan"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePlan}>
              <div className={styles.modalScrollBody}>
                {/* Basic Details */}
                <div className={styles.formGridTwoCol}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Plan Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Enterprise Ultimate"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Price (USD) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className={styles.formInput}
                    />
                  </div>
                </div>

                <div className={styles.formGridTwoCol}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Billing Frequency</label>
                    <select
                      value={billingCycle}
                      onChange={(e) => setBillingCycle(e.target.value)}
                      className={styles.formInput}
                    >
                      <option value="MONTHLY">Monthly</option>
                      <option value="YEARLY">Yearly</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>User Seat Limit</label>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <input
                        type="number"
                        min="1"
                        disabled={isUnlimitedUsers}
                        value={maxUsers}
                        onChange={(e) => setMaxUsers(e.target.value)}
                        className={styles.formInput}
                        style={{ flex: 1, opacity: isUnlimitedUsers ? 0.4 : 1 }}
                      />
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#cbd5e1", cursor: "pointer", whiteSpace: "nowrap" }}>
                        <input
                          type="checkbox"
                          checked={isUnlimitedUsers}
                          onChange={(e) => setIsUnlimitedUsers(e.target.checked)}
                          style={{ accentColor: "#a855f7" }}
                        />
                        Unlimited
                      </label>
                    </div>
                  </div>
                </div>

                {/* One-Click Presets */}
                <div className={styles.presetSection}>
                  <span className={styles.presetTitle}>One-Click Feature Presets</span>
                  <div className={styles.presetBtnsRow}>
                    <button
                      type="button"
                      onClick={() => applyPreset(FEATURE_PRESETS.FULL_CRM.keys)}
                      className={styles.presetBtn}
                    >
                      Full CRM Suite
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset(FEATURE_PRESETS.STANDARD_CRM.keys)}
                      className={styles.presetBtn}
                    >
                      Standard CRM
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset(FEATURE_PRESETS.BASIC_CRM.keys)}
                      className={styles.presetBtn}
                    >
                      Basic CRM
                    </button>
                    <button
                      type="button"
                      onClick={applyAllErp}
                      className={styles.presetBtn}
                    >
                      All ERP Modules
                    </button>
                    <button
                      type="button"
                      onClick={clearAllFeatures}
                      className={styles.presetBtn}
                      style={{ color: "#f87171", borderColor: "rgba(239, 68, 68, 0.3)" }}
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Feature Selector Tabs */}
                <div className={styles.tabSwitcher}>
                  <button
                    type="button"
                    onClick={() => setActiveTab("CRM")}
                    className={`${styles.tabBtn} ${activeTab === "CRM" ? styles.tabBtnActive : ""}`}
                  >
                    CRM Features ({CRM_FEATURES.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("ERP")}
                    className={`${styles.tabBtn} ${activeTab === "ERP" ? styles.tabBtnActive : ""}`}
                  >
                    ERP Core Modules ({ERP_SYSTEM_MODULES.length})
                  </button>
                </div>

                {/* Feature Grid */}
                <div className={styles.featureGrid}>
                  {(activeTab === "CRM" ? CRM_FEATURES : ERP_SYSTEM_MODULES).map((feat) => {
                    const isSelected = selectedFeatures.includes(feat.key);
                    return (
                      <div
                        key={feat.key}
                        onClick={() => handleToggleFeature(feat.key)}
                        className={`${styles.featureCheckboxCard} ${isSelected ? styles.featureCheckboxCardActive : ""}`}
                      >
                        <div className={`${styles.featureCheckbox} ${isSelected ? styles.featureCheckboxActive : ""}`}>
                          {isSelected && <Check size={12} />}
                        </div>
                        <div className={styles.featureCardText}>
                          <span className={styles.featureName}>{feat.name}</span>
                          <span className={styles.featureDesc}>{feat.description}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={styles.modalCancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={styles.modalSubmitBtn}
                >
                  {isSubmitting ? "Saving..." : editingPlan ? "Update Plan" : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Modal */}
      {planToDelete && (
        <div className={styles.modalOverlay} onClick={() => setPlanToDelete(null)}>
          <div className={styles.modalContent} style={{ maxWidth: "460px" }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ color: "#f87171" }}>
                <AlertTriangle size={18} />
                Delete Subscription Plan
              </h3>
              <button
                type="button"
                onClick={() => setPlanToDelete(null)}
                className={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalScrollBody} style={{ gap: "12px" }}>
              <p style={{ margin: 0, fontSize: "14px", color: "#cbd5e1" }}>
                Are you sure you want to delete <strong>{planToDelete.name}</strong>?
              </p>
              {(planToDelete._count?.subscriptions || 0) > 0 && (
                <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5", fontSize: "13px" }}>
                  <strong>Warning:</strong> This plan is currently used by <strong>{planToDelete._count?.subscriptions}</strong> subscribed tenant organization(s).
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setPlanToDelete(null)}
                className={styles.modalCancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePlan}
                disabled={isDeleting}
                className={styles.modalSubmitBtn}
                style={{ background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)", boxShadow: "0 4px 14px rgba(220, 38, 38, 0.4)" }}
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
