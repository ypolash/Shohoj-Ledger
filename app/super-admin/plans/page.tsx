"use client";

import React, { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
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
} from "lucide-react";

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
    // By default, pre-select Full CRM suite for smooth initial flow
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
    // Preserve any existing non-CRM modules if selecting CRM preset
    const erpKeys = selectedFeatures.filter((k) => k.startsWith("mod_"));
    const newKeys = Array.from(new Set([...keys, ...erpKeys]));
    setSelectedFeatures(newKeys);
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
        // Update existing plan
        const res = await fetch("/api/system/plans", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: editingPlan.id, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update plan");
        showToast("Subscription plan updated successfully!");
      } else {
        // Create new plan
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
      const res = await fetch("/api/system/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update status");
      }
      setPlans((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, status: newStatus } : p))
      );
      showToast(`Plan marked as ${newStatus}`);
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Failed to update plan status", "error");
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

  const selectedCrmCount = selectedFeatures.filter((k) => k.startsWith("crm_")).length;
  const isAllCrmSelected = selectedCrmCount === CRM_FEATURES.length;

  return (
    <PageContainer>
      <PageHeader
        title="Subscription Plans & Feature Manager"
        description="Build custom subscription pricing tiers and choose which CRM features & system modules are enabled for each plan."
      />

      {/* Notification Toast */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "14px",
            fontWeight: 500,
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
            background: toastMessage.type === "success" ? "#064e3b" : "#7f1d1d",
            color: toastMessage.type === "success" ? "#34d399" : "#fca5a5",
            border: `1px solid ${toastMessage.type === "success" ? "#059669" : "#dc2626"}`,
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          {toastMessage.type === "success" ? <Check size={18} /> : <AlertTriangle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Glass Card */}
      <div className="glass-card" style={{ padding: "var(--spacing-6)", marginTop: "var(--spacing-4)" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "var(--spacing-5)",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text-main)" }}>
              Active SaaS Plans ({plans.length})
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
              Configure feature access, user limits, and billing frequencies for your subscribers.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn btn-secondary" onClick={fetchPlans} disabled={loading} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button className="btn btn-primary" onClick={openCreateModal} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Plus size={16} /> Create New Plan
            </button>
          </div>
        </div>

        {/* Plans Table */}
        <div className="table-responsive">
          <table className="table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-main)", background: "var(--surface-subtle)" }}>
                <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "13px", color: "var(--text-muted)" }}>Plan & Cycle</th>
                <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "13px", color: "var(--text-muted)" }}>Pricing</th>
                <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "13px", color: "var(--text-muted)" }}>User Limit</th>
                <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "13px", color: "var(--text-muted)" }}>Features Included</th>
                <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "13px", color: "var(--text-muted)" }}>Subscribers</th>
                <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "13px", color: "var(--text-muted)" }}>Status</th>
                <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "13px", color: "var(--text-muted)", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
                      <RefreshCw size={20} className="animate-spin" />
                      <span>Loading subscription plans...</span>
                    </div>
                  </td>
                </tr>
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "48px 16px", color: "var(--text-muted)" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "16px",
                          background: "var(--surface-subtle)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--text-muted)",
                        }}
                      >
                        <Layers size={28} />
                      </div>
                      <p style={{ margin: 0, fontWeight: 500, color: "var(--text-main)" }}>No pricing plans found</p>
                      <p style={{ margin: 0, fontSize: "13px", maxWidth: "340px" }}>
                        Create your first subscription plan and pick which CRM features are included.
                      </p>
                      <button className="btn btn-primary" onClick={openCreateModal} style={{ marginTop: "8px" }}>
                        <Plus size={16} /> Create Plan
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                plans.map((plan) => {
                  const planFeatures = plan.features || [];
                  const crmCount = planFeatures.filter((k) => k.startsWith("crm_")).length;
                  const isFullCrm = crmCount === CRM_FEATURES.length;
                  const activeSubCount = plan._count?.subscriptions || 0;

                  return (
                    <tr
                      key={plan.id}
                      style={{
                        borderBottom: "1px solid var(--border-main)",
                        transition: "background 0.15s ease",
                      }}
                      className="table-row-hover"
                    >
                      {/* Name & Cycle */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "10px",
                              background: "rgba(99, 102, 241, 0.12)",
                              border: "1px solid rgba(99, 102, 241, 0.25)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "var(--primary, #6366f1)",
                            }}
                          >
                            <Sparkles size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-main)" }}>
                              {plan.name}
                            </div>
                            <span
                              style={{
                                fontSize: "11px",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background: "var(--surface-subtle)",
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                                fontWeight: 600,
                              }}
                            >
                              {plan.billingCycle}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td style={{ padding: "14px 16px", fontWeight: 600, fontSize: "14px", color: "var(--text-main)" }}>
                        ${Number(plan.price).toFixed(2)}
                        <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 400 }}>
                          /{plan.billingCycle === "YEARLY" ? "yr" : "mo"}
                        </span>
                      </td>

                      {/* Max Users */}
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "var(--text-main)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Users size={14} style={{ color: "var(--text-muted)" }} />
                          <span>{plan.maxUsers ? `${plan.maxUsers} Users` : "Unlimited"}</span>
                        </div>
                      </td>

                      {/* Features Included */}
                      <td style={{ padding: "14px 16px", maxWidth: "340px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            {isFullCrm ? (
                              <span
                                style={{
                                  fontSize: "11px",
                                  padding: "3px 8px",
                                  borderRadius: "12px",
                                  fontWeight: 600,
                                  background: "rgba(16, 185, 129, 0.15)",
                                  color: "#10b981",
                                  border: "1px solid rgba(16, 185, 129, 0.3)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <CheckCircle2 size={12} /> Full CRM Suite ({crmCount}/7)
                              </span>
                            ) : crmCount > 0 ? (
                              <span
                                style={{
                                  fontSize: "11px",
                                  padding: "3px 8px",
                                  borderRadius: "12px",
                                  fontWeight: 600,
                                  background: "rgba(99, 102, 241, 0.15)",
                                  color: "#818cf8",
                                  border: "1px solid rgba(99, 102, 241, 0.3)",
                                }}
                              >
                                {crmCount} CRM Feature{crmCount > 1 ? "s" : ""}
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: "11px",
                                  padding: "3px 8px",
                                  borderRadius: "12px",
                                  background: "rgba(239, 68, 68, 0.1)",
                                  color: "#f87171",
                                }}
                              >
                                No CRM Features
                              </span>
                            )}

                            {planFeatures.length > crmCount && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  padding: "3px 8px",
                                  borderRadius: "12px",
                                  background: "rgba(245, 158, 11, 0.15)",
                                  color: "#fbbf24",
                                  border: "1px solid rgba(245, 158, 11, 0.3)",
                                }}
                              >
                                +{planFeatures.length - crmCount} ERP
                              </span>
                            )}
                          </div>

                          {/* Feature tags previews */}
                          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                            {planFeatures.slice(0, 3).map((fKey) => {
                              const fDef = getFeatureByKey(fKey);
                              return (
                                <span
                                  key={fKey}
                                  style={{
                                    fontSize: "10px",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    background: "var(--surface-subtle)",
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  {fDef ? fDef.name.replace(" & Metrics", "").replace(" & Kanban Pipeline", "") : fKey}
                                </span>
                              );
                            })}
                            {planFeatures.length > 3 && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  padding: "2px 5px",
                                  borderRadius: "4px",
                                  background: "var(--surface-subtle)",
                                  color: "var(--text-muted)",
                                }}
                              >
                                +{planFeatures.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Subscribers */}
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "var(--text-main)" }}>
                        <span
                          style={{
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: activeSubCount > 0 ? "rgba(59, 130, 246, 0.12)" : "var(--surface-subtle)",
                            color: activeSubCount > 0 ? "#60a5fa" : "var(--text-muted)",
                          }}
                        >
                          {activeSubCount} {activeSubCount === 1 ? "Company" : "Companies"}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 16px" }}>
                        <select
                          value={plan.status}
                          onChange={(e) => handleUpdateStatus(plan.id, e.target.value)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            border: `1px solid ${
                              plan.status === "ACTIVE" ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)"
                            }`,
                            background: plan.status === "ACTIVE" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                            color: plan.status === "ACTIVE" ? "#34d399" : "#f87171",
                            fontWeight: 600,
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          <option value="ACTIVE" style={{ background: "#18181b", color: "#fff" }}>ACTIVE</option>
                          <option value="ARCHIVED" style={{ background: "#18181b", color: "#fff" }}>ARCHIVED</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          <button
                            onClick={() => openEditModal(plan)}
                            title="Edit Plan & Features"
                            style={{
                              padding: "6px 10px",
                              borderRadius: "6px",
                              border: "1px solid var(--border-main)",
                              background: "var(--surface-subtle)",
                              color: "var(--text-main)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "12px",
                            }}
                          >
                            <Edit3 size={13} />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => setPlanToDelete(plan)}
                            title="Delete Plan"
                            style={{
                              padding: "6px 8px",
                              borderRadius: "6px",
                              border: "1px solid rgba(239, 68, 68, 0.2)",
                              background: "rgba(239, 68, 68, 0.08)",
                              color: "#f87171",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                            }}
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

      {/* Plan Creator / Editor Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            className="glass-card"
            style={{
              width: "100%",
              maxWidth: "760px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              borderRadius: "16px",
              border: "1px solid var(--border-main)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
              background: "#0f172a",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--border-main)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "rgba(30, 41, 59, 0.5)",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#fff" }}>
                  {editingPlan ? `Edit Plan: ${editingPlan.name}` : "Create New Subscription Plan"}
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
                  Configure pricing, limits, and select which CRM features are included.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body - Scrollable Form */}
            <form onSubmit={handleSavePlan} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div style={{ padding: "24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
                
                {/* Basic Details Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {/* Plan Name */}
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>
                      Plan Name <span style={{ color: "#f87171" }}>*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Sales Pro CRM, Enterprise Tier"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-main)",
                        background: "var(--surface-subtle)",
                        color: "#fff",
                        fontSize: "14px",
                      }}
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>
                      Price (USD $) <span style={{ color: "#f87171" }}>*</span>
                    </label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value === "" ? "" : parseFloat(e.target.value))}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-main)",
                        background: "var(--surface-subtle)",
                        color: "#fff",
                        fontSize: "14px",
                      }}
                    />
                  </div>

                  {/* Billing Cycle */}
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>
                      Billing Cycle
                    </label>
                    <select
                      value={billingCycle}
                      onChange={(e) => setBillingCycle(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-main)",
                        background: "var(--surface-subtle)",
                        color: "#fff",
                        fontSize: "14px",
                      }}
                    >
                      <option value="MONTHLY">Monthly</option>
                      <option value="YEARLY">Yearly</option>
                      <option value="QUARTERLY">Quarterly</option>
                      <option value="LIFETIME">Lifetime / One-time</option>
                    </select>
                  </div>

                  {/* Max Users / Seats */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>
                        User Limit
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-muted)", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={isUnlimitedUsers}
                          onChange={(e) => setIsUnlimitedUsers(e.target.checked)}
                        />
                        Unlimited
                      </label>
                    </div>
                    <input
                      disabled={isUnlimitedUsers}
                      type="number"
                      min="1"
                      placeholder={isUnlimitedUsers ? "Unlimited users allowed" : "Number of user seats"}
                      value={isUnlimitedUsers ? "" : maxUsers}
                      onChange={(e) => setMaxUsers(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-main)",
                        background: isUnlimitedUsers ? "rgba(255,255,255,0.04)" : "var(--surface-subtle)",
                        color: isUnlimitedUsers ? "var(--text-muted)" : "#fff",
                        fontSize: "14px",
                        opacity: isUnlimitedUsers ? 0.6 : 1,
                      }}
                    />
                  </div>
                </div>

                {/* FEATURE SELECTOR SECTION */}
                <div
                  style={{
                    border: "1px solid var(--border-main)",
                    borderRadius: "12px",
                    padding: "16px",
                    background: "rgba(15, 23, 42, 0.6)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Sparkles size={16} style={{ color: "#a855f7" }} />
                        CRM & System Features Included in Plan
                      </h4>
                      <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                        Companies subscribed to this plan will only get access to the features checked below.
                      </p>
                    </div>

                    {/* Feature selection tabs */}
                    <div style={{ display: "flex", gap: "6px", background: "rgba(0,0,0,0.3)", padding: "3px", borderRadius: "8px" }}>
                      <button
                        type="button"
                        onClick={() => setActiveTab("CRM")}
                        style={{
                          padding: "5px 12px",
                          borderRadius: "6px",
                          border: "none",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          background: activeTab === "CRM" ? "var(--primary, #6366f1)" : "transparent",
                          color: activeTab === "CRM" ? "#fff" : "var(--text-muted)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        CRM Features ({selectedCrmCount}/7)
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("ERP")}
                        style={{
                          padding: "5px 12px",
                          borderRadius: "6px",
                          border: "none",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          background: activeTab === "ERP" ? "var(--primary, #6366f1)" : "transparent",
                          color: activeTab === "ERP" ? "#fff" : "var(--text-muted)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        Additional ERP Modules ({selectedFeatures.filter(k => k.startsWith("mod_")).length})
                      </button>
                    </div>
                  </div>

                  {/* Preset Quick Actions */}
                  {activeTab === "CRM" && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: "var(--surface-subtle)",
                        marginBottom: "14px",
                      }}
                    >
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>
                        Presets:
                      </span>
                      <button
                        type="button"
                        onClick={() => applyPreset(FEATURE_PRESETS.FULL_CRM.keys)}
                        style={{
                          fontSize: "11px",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          border: "1px solid rgba(99, 102, 241, 0.4)",
                          background: isAllCrmSelected ? "rgba(99, 102, 241, 0.2)" : "transparent",
                          color: "#818cf8",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Full CRM Suite (All 7)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset(FEATURE_PRESETS.SALES_PIPELINE.keys)}
                        style={{
                          fontSize: "11px",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          border: "1px solid var(--border-main)",
                          background: "transparent",
                          color: "var(--text-main)",
                          cursor: "pointer",
                        }}
                      >
                        Sales Pipeline
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset(FEATURE_PRESETS.BASIC_CRM.keys)}
                        style={{
                          fontSize: "11px",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          border: "1px solid var(--border-main)",
                          background: "transparent",
                          color: "var(--text-main)",
                          cursor: "pointer",
                        }}
                      >
                        Basic CRM
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedFeatures(prev => prev.filter(k => !k.startsWith("crm_")))}
                        style={{
                          fontSize: "11px",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          border: "none",
                          background: "transparent",
                          color: "#f87171",
                          cursor: "pointer",
                          marginLeft: "auto",
                        }}
                      >
                        Clear CRM
                      </button>
                    </div>
                  )}

                  {/* Feature Cards Grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                      gap: "10px",
                      maxHeight: "260px",
                      overflowY: "auto",
                      paddingRight: "4px",
                    }}
                  >
                    {(activeTab === "CRM" ? CRM_FEATURES : ERP_SYSTEM_MODULES).map((feat) => {
                      const isChecked = selectedFeatures.includes(feat.key);
                      return (
                        <div
                          key={feat.key}
                          onClick={() => handleToggleFeature(feat.key)}
                          style={{
                            padding: "12px",
                            borderRadius: "10px",
                            border: `1px solid ${
                              isChecked ? "var(--primary, #6366f1)" : "var(--border-main)"
                            }`,
                            background: isChecked
                              ? "rgba(99, 102, 241, 0.12)"
                              : "var(--surface-subtle)",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "10px",
                            position: "relative",
                          }}
                        >
                          <div
                            style={{
                              marginTop: "2px",
                              width: "18px",
                              height: "18px",
                              borderRadius: "4px",
                              border: `1.5px solid ${isChecked ? "var(--primary, #6366f1)" : "var(--text-muted)"}`,
                              background: isChecked ? "var(--primary, #6366f1)" : "transparent",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              flexShrink: 0,
                            }}
                          >
                            {isChecked && <Check size={13} strokeWidth={3} />}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span
                                className="material-symbols-outlined"
                                style={{
                                  fontSize: "16px",
                                  color: isChecked ? "var(--primary, #818cf8)" : "var(--text-muted)",
                                }}
                              >
                                {feat.icon}
                              </span>
                              <span
                                style={{
                                  fontWeight: 600,
                                  fontSize: "13px",
                                  color: isChecked ? "#fff" : "var(--text-main)",
                                }}
                              >
                                {feat.name}
                              </span>
                            </div>
                            <p
                              style={{
                                margin: "4px 0 0 0",
                                fontSize: "11px",
                                color: "var(--text-muted)",
                                lineHeight: "1.4",
                              }}
                            >
                              {feat.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom Counter */}
                  <div
                    style={{
                      marginTop: "12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "12px",
                      color: "var(--text-muted)",
                    }}
                  >
                    <span>
                      Total selected:{" "}
                      <strong style={{ color: "#fff" }}>
                        {selectedFeatures.length} features
                      </strong>{" "}
                      ({selectedCrmCount} CRM, {selectedFeatures.length - selectedCrmCount} ERP)
                    </span>
                    {selectedCrmCount === 0 && (
                      <span style={{ color: "#f87171" }}>
                        Warning: No CRM features selected for this plan.
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Selection */}
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>
                    Plan Status
                  </label>
                  <select
                    value={planStatus}
                    onChange={(e) => setPlanStatus(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-main)",
                      background: "var(--surface-subtle)",
                      color: "#fff",
                      fontSize: "14px",
                    }}
                  >
                    <option value="ACTIVE">ACTIVE (Available for subscription)</option>
                    <option value="ARCHIVED">ARCHIVED (Hidden from new subscriptions)</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: "16px 24px",
                  borderTop: "1px solid var(--border-main)",
                  background: "rgba(30, 41, 59, 0.5)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  {editingPlan ? "Editing existing plan" : "Creating new pricing tier"}
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                    style={{ display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Check size={16} /> {editingPlan ? "Update Plan" : "Create Plan"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {planToDelete && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1050,
            padding: "20px",
          }}
        >
          <div
            className="glass-card"
            style={{
              width: "100%",
              maxWidth: "460px",
              padding: "24px",
              borderRadius: "14px",
              background: "#0f172a",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  background: "rgba(239, 68, 68, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ef4444",
                }}
              >
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#fff" }}>
                  Delete Subscription Plan
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
                  Are you sure you want to remove &quot;{planToDelete.name}&quot;?
                </p>
              </div>
            </div>

            {planToDelete._count && planToDelete._count.subscriptions > 0 ? (
              <div
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  color: "#fca5a5",
                  fontSize: "13px",
                  marginBottom: "20px",
                  lineHeight: "1.5",
                }}
              >
                <strong style={{ display: "block", marginBottom: "4px" }}>Active Subscriptions Detected:</strong>
                {planToDelete._count.subscriptions} company account(s) are currently assigned to this plan. You must reassign those companies or set the plan status to &quot;ARCHIVED&quot; instead of deleting.
              </div>
            ) : (
              <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "20px" }}>
                This action cannot be undone. This plan has no active subscriptions attached.
              </p>
            )}

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPlanToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePlan}
                disabled={isDeleting || (planToDelete._count ? planToDelete._count.subscriptions > 0 : false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#ef4444",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: (planToDelete._count ? planToDelete._count.subscriptions > 0 : false) ? "not-allowed" : "pointer",
                  opacity: (planToDelete._count ? planToDelete._count.subscriptions > 0 : false) ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {isDeleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
