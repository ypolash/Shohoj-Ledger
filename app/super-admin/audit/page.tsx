"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Plus,
  Download,
  Filter,
  Eye,
  X,
  FileText,
  KeyRound,
  Layers,
  Users,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Terminal,
  Server,
  Sparkles,
  Info,
  Shield,
  Activity,
} from "lucide-react";
import styles from "./audit.module.css";

interface AuditLogItem {
  id: string;
  action: string;
  module: string;
  entityType: string;
  entityId: string;
  description: string;
  ipAddress: string;
  status: string;
  createdAt: string;
  company?: {
    id: string;
    name: string;
  } | null;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    role?: string;
  } | null;
}

interface AuditMetrics {
  totalEvents: number;
  loginEvents: number;
  mutationEvents: number;
  uniqueActors: number;
}

export default function SuperAdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [metrics, setMetrics] = useState<AuditMetrics>({
    totalEvents: 0,
    loginEvents: 0,
    mutationEvents: 0,
    uniqueActors: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "LOGIN" | "MUTATION" | "SECURITY">("ALL");

  // Modals & Inspection
  const [isCheckpointModalOpen, setIsCheckpointModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AuditLogItem | null>(null);
  const [submittingCheckpoint, setSubmittingCheckpoint] = useState(false);
  const [checkpointForm, setCheckpointForm] = useState({
    action: "AUDIT_CHECKPOINT",
    module: "SECURITY",
    companyId: "",
    description: "",
  });

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/system/audit");
      if (res.status === 401) {
        window.location.href = "/super-admin/login";
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch audit records");
      }
      const data = await res.json();
      setLogs(data.logs || []);
      setCompanies(data.companies || []);
      if (data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Error loading audit records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  // Filtered dataset
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Tab filter
      if (activeTab === "LOGIN" && log.action !== "LOGIN") return false;
      if (activeTab === "MUTATION" && !["CREATE", "UPDATE", "DELETE"].includes(log.action)) return false;
      if (activeTab === "SECURITY" && !["AUDIT_CHECKPOINT", "SECURITY_AUDIT", "POLICY_REVIEW", "RBAC"].includes(log.action) && log.module !== "SECURITY" && log.module !== "RBAC") return false;

      // Dropdown filters
      if (actionFilter && log.action !== actionFilter) return false;
      if (moduleFilter && log.module?.toUpperCase() !== moduleFilter.toUpperCase()) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const actorName = log.user?.name?.toLowerCase() || "";
        const actorEmail = log.user?.email?.toLowerCase() || "";
        const companyName = log.company?.name?.toLowerCase() || "";
        const desc = log.description?.toLowerCase() || "";
        const entity = log.entityType?.toLowerCase() || "";
        const ip = log.ipAddress?.toLowerCase() || "";
        const action = log.action?.toLowerCase() || "";

        return (
          actorName.includes(query) ||
          actorEmail.includes(query) ||
          companyName.includes(query) ||
          desc.includes(query) ||
          entity.includes(query) ||
          ip.includes(query) ||
          action.includes(query)
        );
      }

      return true;
    });
  }, [logs, activeTab, actionFilter, moduleFilter, searchTerm]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const total = logs.length;
    const logins = logs.filter((l) => l.action === "LOGIN").length;
    const mutations = logs.filter((l) => ["CREATE", "UPDATE", "DELETE"].includes(l.action)).length;
    const security = logs.filter((l) => ["AUDIT_CHECKPOINT", "SECURITY_AUDIT", "POLICY_REVIEW", "RBAC"].includes(l.action) || l.module === "SECURITY" || l.module === "RBAC").length;
    return { total, logins, mutations, security };
  }, [logs]);

  // Handle Export CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      showToast("No audit records to export", "error");
      return;
    }

    const headers = ["ID", "Timestamp", "Action", "Module", "Entity Type", "Entity ID", "Actor Name", "Actor Email", "Tenant", "Description", "IP Address", "Status"];
    const rows = filteredLogs.map((log) => [
      `"${log.id}"`,
      `"${new Date(log.createdAt).toISOString()}"`,
      `"${log.action}"`,
      `"${log.module}"`,
      `"${log.entityType}"`,
      `"${log.entityId}"`,
      `"${log.user?.name || "System"}"`,
      `"${log.user?.email || "system@shohoj.internal"}"`,
      `"${log.company?.name || "Global Master"}"`,
      `"${log.description.replace(/"/g, '""')}"`,
      `"${log.ipAddress}"`,
      `"${log.status}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `shohoj_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Audit records exported successfully as CSV");
  };

  // Handle Create Checkpoint
  const handleCreateCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCheckpoint(true);
    try {
      const res = await fetch("/api/system/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkpointForm),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to record audit checkpoint");
      }

      showToast("Security checkpoint registered successfully");
      setIsCheckpointModalOpen(false);
      setCheckpointForm({
        action: "AUDIT_CHECKPOINT",
        module: "SECURITY",
        companyId: "",
        description: "",
      });
      fetchAuditLogs();
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Failed to record checkpoint", "error");
    } finally {
      setSubmittingCheckpoint(false);
    }
  };

  const getActionBadgeClass = (action: string) => {
    switch (action?.toUpperCase()) {
      case "CREATE":
        return `${styles.actionBadge} ${styles.actionCreate}`;
      case "UPDATE":
        return `${styles.actionBadge} ${styles.actionUpdate}`;
      case "DELETE":
        return `${styles.actionBadge} ${styles.actionDelete}`;
      case "LOGIN":
        return `${styles.actionBadge} ${styles.actionLogin}`;
      default:
        return `${styles.actionBadge} ${styles.actionApproval}`;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action?.toUpperCase()) {
      case "CREATE":
        return <Plus size={12} />;
      case "UPDATE":
        return <RefreshCw size={12} />;
      case "DELETE":
        return <AlertTriangle size={12} />;
      case "LOGIN":
        return <KeyRound size={12} />;
      default:
        return <Shield size={12} />;
    }
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
            <span className={styles.liveBadgeText}>AUDIT TRAILS &amp; SYSTEM TELEMETRY</span>
          </div>
          <h1 className={styles.pageTitle}>
            <ShieldCheck size={28} color="#60a5fa" />
            Audit Trails &amp; Governance
          </h1>
          <p className={styles.pageSubtitle}>
            Comprehensive multi-tenant immutable audit log capturing operator actions, authentication events, data mutations, and security checkpoints.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            onClick={fetchAuditLogs}
            disabled={loading}
            className={styles.refreshBtn}
            title="Refresh Audit Data"
          >
            <RefreshCw size={15} className={loading ? styles.spinning : ""} />
            Refresh
          </button>

          <button
            onClick={handleExportCSV}
            className={styles.refreshBtn}
            title="Export CSV"
          >
            <Download size={15} />
            Export CSV
          </button>

          <button
            onClick={() => setIsCheckpointModalOpen(true)}
            className={styles.primaryActionBtn}
          >
            <Plus size={16} />
            Record Checkpoint
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics Grid */}
      <div className={styles.kpiGrid}>
        {/* Total Audit Events */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div
              className={styles.kpiIconBox}
              style={{ background: "rgba(59, 130, 246, 0.15)", border: "1px solid rgba(59, 130, 246, 0.3)" }}
            >
              <FileText size={22} color="#60a5fa" />
            </div>
            <span
              className={styles.kpiBadge}
              style={{ background: "rgba(59, 130, 246, 0.12)", color: "#93c5fd" }}
            >
              <Activity size={12} /> Logged
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Total Events Logged</span>
            <span className={styles.kpiValue}>
              {loading ? "..." : metrics.totalEvents.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Security & Access Logins */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div
              className={styles.kpiIconBox}
              style={{ background: "rgba(168, 85, 247, 0.15)", border: "1px solid rgba(168, 85, 247, 0.3)" }}
            >
              <KeyRound size={22} color="#c084fc" />
            </div>
            <span
              className={styles.kpiBadge}
              style={{ background: "rgba(168, 85, 247, 0.12)", color: "#e9d5ff" }}
            >
              <ShieldCheck size={12} /> Auth
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Security &amp; Auth Logins</span>
            <span className={styles.kpiValue}>
              {loading ? "..." : metrics.loginEvents.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Entity Mutations */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div
              className={styles.kpiIconBox}
              style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)" }}
            >
              <Layers size={22} color="#34d399" />
            </div>
            <span
              className={styles.kpiBadge}
              style={{ background: "rgba(16, 185, 129, 0.12)", color: "#a7f3d0" }}
            >
              <Sparkles size={12} /> State Mutations
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Entity Mutations</span>
            <span className={styles.kpiValue}>
              {loading ? "..." : metrics.mutationEvents.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Unique Operators */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div
              className={styles.kpiIconBox}
              style={{ background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.3)" }}
            >
              <Users size={22} color="#fbbf24" />
            </div>
            <span
              className={styles.kpiBadge}
              style={{ background: "rgba(245, 158, 11, 0.12)", color: "#fef3c7" }}
            >
              <Shield size={12} /> Operators
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Active Operators</span>
            <span className={styles.kpiValue}>
              {loading ? "..." : metrics.uniqueActors.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Data Table Card */}
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
                placeholder="Search by actor, email, action, entity, IP..."
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
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Actions</option>
              <option value="LOGIN">LOGIN</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="AUDIT_CHECKPOINT">CHECKPOINT</option>
            </select>

            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Modules</option>
              <option value="AUTH">AUTH</option>
              <option value="BILLING">BILLING</option>
              <option value="RBAC">RBAC</option>
              <option value="SYSTEM">SYSTEM</option>
              <option value="CORE">CORE</option>
              <option value="SECURITY">SECURITY</option>
              <option value="FINANCIAL">FINANCIAL</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div className={styles.filterTabsRow}>
          <button
            onClick={() => setActiveTab("ALL")}
            className={`${styles.filterTabBtn} ${activeTab === "ALL" ? styles.filterTabBtnActive : ""}`}
          >
            All Events ({tabCounts.total})
          </button>
          <button
            onClick={() => setActiveTab("LOGIN")}
            className={`${styles.filterTabBtn} ${activeTab === "LOGIN" ? styles.filterTabBtnActive : ""}`}
          >
            Logins &amp; Auth ({tabCounts.logins})
          </button>
          <button
            onClick={() => setActiveTab("MUTATION")}
            className={`${styles.filterTabBtn} ${activeTab === "MUTATION" ? styles.filterTabBtnActive : ""}`}
          >
            Data Mutations ({tabCounts.mutations})
          </button>
          <button
            onClick={() => setActiveTab("SECURITY")}
            className={`${styles.filterTabBtn} ${activeTab === "SECURITY" ? styles.filterTabBtnActive : ""}`}
          >
            Security &amp; Checkpoints ({tabCounts.security})
          </button>
        </div>

        {/* Data Table */}
        <div className={styles.tableContainer}>
          <table className={styles.auditTable}>
            <thead>
              <tr>
                <th>Action</th>
                <th>Operator / Actor</th>
                <th>Tenant / Workspace</th>
                <th>Module &amp; Entity</th>
                <th>Description</th>
                <th>IP Source</th>
                <th>Timestamp</th>
                <th style={{ textAlign: "right" }}>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className={styles.emptyState}>
                    <RefreshCw size={28} className={styles.spinning} color="#60a5fa" />
                    <span>Loading audit records &amp; telemetry...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.emptyState}>
                    <ShieldCheck size={40} style={{ opacity: 0.3 }} />
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "#f1f5f9" }}>
                      No matching audit records found
                    </span>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      Try adjusting your search terms, action filters, or tab selection.
                    </span>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const actorInitial = log.user?.name ? log.user.name.charAt(0).toUpperCase() : "S";
                  const formattedDate = new Date(log.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr key={log.id} className={styles.auditRow}>
                      <td>
                        <span className={getActionBadgeClass(log.action)}>
                          {getActionIcon(log.action)}
                          {log.action}
                        </span>
                      </td>

                      <td>
                        <div className={styles.actorCell}>
                          <div className={styles.actorAvatar}>{actorInitial}</div>
                          <div className={styles.actorInfoText}>
                            <span className={styles.actorName}>
                              {log.user?.name || "System Operator"}
                            </span>
                            <span className={styles.actorEmail}>
                              {log.user?.email || "system@shohoj.internal"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className={styles.tenantTag}>
                          <Building2 size={13} color="#94a3b8" />
                          <span>{log.company?.name || "Platform Master"}</span>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <span className={styles.moduleTag}>
                            {log.module}
                          </span>
                          <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>
                            {log.entityType} {log.entityId ? `#${log.entityId.slice(0, 6)}` : ""}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className={styles.logDescription} title={log.description}>
                          {log.description}
                        </div>
                      </td>

                      <td>
                        <span className={styles.ipTag}>{log.ipAddress || "127.0.0.1"}</span>
                      </td>

                      <td>
                        <span className={styles.timestampCell}>{formattedDate}</span>
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <button
                          onClick={() => setSelectedEvent(log)}
                          className={styles.refreshBtn}
                          style={{ padding: "6px 10px", fontSize: "12px" }}
                          title="Inspect Event Details"
                        >
                          <Eye size={13} />
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Event Inspection Modal */}
      {selectedEvent && (
        <div className={styles.modalOverlay} onClick={() => setSelectedEvent(null)}>
          <div
            className={styles.modalContent}
            style={{ maxWidth: "600px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <ShieldCheck size={20} color="#60a5fa" />
                Audit Event Telemetry Deep Dive
              </h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Event ID</label>
                  <input
                    type="text"
                    readOnly
                    value={selectedEvent.id}
                    className={styles.formInput}
                    style={{ fontFamily: "monospace", fontSize: "12px", background: "rgba(0,0,0,0.4)" }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Timestamp</label>
                  <input
                    type="text"
                    readOnly
                    value={new Date(selectedEvent.createdAt).toLocaleString()}
                    className={styles.formInput}
                    style={{ fontSize: "12px", background: "rgba(0,0,0,0.4)" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Action &amp; Status</label>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span className={getActionBadgeClass(selectedEvent.action)}>
                      {selectedEvent.action}
                    </span>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 700,
                        background: "rgba(16, 185, 129, 0.15)",
                        color: "#34d399",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                      }}
                    >
                      {selectedEvent.status}
                    </span>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Module</label>
                  <span className={styles.moduleTag} style={{ width: "fit-content" }}>
                    {selectedEvent.module}
                  </span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Actor Details</label>
                <div
                  style={{
                    padding: "12px",
                    background: "rgba(0, 0, 0, 0.3)",
                    borderRadius: "10px",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>
                    {selectedEvent.user?.name || "System Operator / Service Account"}
                  </span>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                    {selectedEvent.user?.email || "internal@system.master"} &bull; Role: {selectedEvent.user?.role || "SUPER_ADMIN"}
                  </span>
                  <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>
                    Source IP: {selectedEvent.ipAddress}
                  </span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tenant Context</label>
                <div
                  style={{
                    padding: "10px 12px",
                    background: "rgba(0, 0, 0, 0.3)",
                    borderRadius: "10px",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    fontSize: "13px",
                    color: "#cbd5e1",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Building2 size={16} color="#60a5fa" />
                  <span>{selectedEvent.company?.name || "Platform Master / Global Scope"}</span>
                  {selectedEvent.company?.id && (
                    <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "auto", fontFamily: "monospace" }}>
                      ID: {selectedEvent.company.id.slice(0, 8)}...
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Event Description &amp; Payload Summary</label>
                <div
                  style={{
                    padding: "12px",
                    background: "rgba(0, 0, 0, 0.4)",
                    borderRadius: "10px",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    fontSize: "13px",
                    color: "#f1f5f9",
                    lineHeight: 1.5,
                  }}
                >
                  {selectedEvent.description}
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className={styles.modalCancelBtn}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Record Checkpoint Modal */}
      {isCheckpointModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCheckpointModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <ShieldCheck size={20} color="#60a5fa" />
                Record Security &amp; Audit Checkpoint
              </h2>
              <button
                onClick={() => setIsCheckpointModalOpen(false)}
                className={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCheckpoint}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Audit Module</label>
                  <select
                    value={checkpointForm.module}
                    onChange={(e) => setCheckpointForm((prev) => ({ ...prev, module: e.target.value }))}
                    className={styles.formInput}
                  >
                    <option value="SECURITY">SECURITY</option>
                    <option value="RBAC">RBAC &amp; ACCESS</option>
                    <option value="BILLING">BILLING &amp; PLANS</option>
                    <option value="SYSTEM">SYSTEM CORE</option>
                    <option value="COMPLIANCE">COMPLIANCE &amp; GOVERNANCE</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Action Type</label>
                  <select
                    value={checkpointForm.action}
                    onChange={(e) => setCheckpointForm((prev) => ({ ...prev, action: e.target.value }))}
                    className={styles.formInput}
                  >
                    <option value="AUDIT_CHECKPOINT">AUDIT_CHECKPOINT</option>
                    <option value="SECURITY_AUDIT">SECURITY_AUDIT</option>
                    <option value="POLICY_REVIEW">POLICY_REVIEW</option>
                    <option value="MANUAL_OVERRIDE">MANUAL_OVERRIDE</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Target Tenant Workspace (Optional)</label>
                  <select
                    value={checkpointForm.companyId}
                    onChange={(e) => setCheckpointForm((prev) => ({ ...prev, companyId: e.target.value }))}
                    className={styles.formInput}
                  >
                    <option value="">Platform Master / Global Scope</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Checkpoint Description / Notes *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter explicit description of this governance or compliance audit event..."
                    value={checkpointForm.description}
                    onChange={(e) => setCheckpointForm((prev) => ({ ...prev, description: e.target.value }))}
                    className={styles.formInput}
                    style={{ resize: "vertical" }}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsCheckpointModalOpen(false)}
                  className={styles.modalCancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCheckpoint || !checkpointForm.description.trim()}
                  className={styles.modalSubmitBtn}
                >
                  {submittingCheckpoint ? "Recording..." : "Record Checkpoint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
