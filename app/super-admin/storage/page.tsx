"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  HardDrive,
  Database,
  FileText,
  Archive,
  RefreshCw,
  Plus,
  Trash2,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  Building2,
  ShieldCheck,
  Server,
  Cloud,
  Zap,
  Clock,
  Sparkles,
  Info,
  Check,
  Cpu,
} from "lucide-react";
import styles from "./storage.module.css";

interface BackupItem {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  status: string;
  triggeredBy: string;
  createdAt: string;
  completedAt: string | null;
}

interface TenantStorageItem {
  id: string;
  name: string;
  plan: string;
  status: string;
  usedGB: number;
  quotaGB: number;
  usedPercent: number;
  documentsCount: number;
}

interface CloudBucketItem {
  id: string;
  name: string;
  provider: string;
  region: string;
  type: string;
  totalFiles: number;
  usedGB: string;
  status: string;
  encryption: string;
  latency: string;
}

interface StorageMetrics {
  totalCapacityGB: number;
  totalUsedGB: number;
  totalUsedPercent: number;
  dbSizeGB: number;
  docSizeGB: number;
  backupsSizeGB: number;
  freeSpaceGB: number;
  totalBackupsCount: number;
  totalTenantsCount: number;
}

export default function SuperAdminStoragePage() {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [tenants, setTenants] = useState<TenantStorageItem[]>([]);
  const [buckets, setBuckets] = useState<CloudBucketItem[]>([]);
  const [metrics, setMetrics] = useState<StorageMetrics>({
    totalCapacityGB: 500,
    totalUsedGB: 85.3,
    totalUsedPercent: 17,
    dbSizeGB: 18.4,
    docSizeGB: 42.8,
    backupsSizeGB: 24.1,
    freeSpaceGB: 414.7,
    totalBackupsCount: 4,
    totalTenantsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filter & Navigation
  const [activeTab, setActiveTab] = useState<"BACKUPS" | "TENANTS" | "BUCKETS">("BACKUPS");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals & Triggers
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [submittingBackup, setSubmittingBackup] = useState(false);
  const [purgingCache, setPurgingCache] = useState(false);
  const [backupForm, setBackupForm] = useState({
    note: "",
    targetBucket: "shohoj-ledger-prod-us-east",
    compression: "zstd",
  });

  // Toast Feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchStorageData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/system/storage");
      if (res.status === 401) {
        window.location.href = "/super-admin/login";
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch storage telemetry");
      }
      const data = await res.json();
      setBackups(data.backups || []);
      setTenants(data.tenants || []);
      setBuckets(data.buckets || []);
      if (data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Error loading storage data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageData();
  }, []);

  // Filtered Backups
  const filteredBackups = useMemo(() => {
    if (!searchTerm.trim()) return backups;
    const query = searchTerm.toLowerCase();
    return backups.filter(
      (b) =>
        b.fileName.toLowerCase().includes(query) ||
        b.triggeredBy.toLowerCase().includes(query) ||
        b.status.toLowerCase().includes(query)
    );
  }, [backups, searchTerm]);

  // Filtered Tenants
  const filteredTenants = useMemo(() => {
    if (!searchTerm.trim()) return tenants;
    const query = searchTerm.toLowerCase();
    return tenants.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.plan.toLowerCase().includes(query) ||
        t.status.toLowerCase().includes(query)
    );
  }, [tenants, searchTerm]);

  // Filtered Buckets
  const filteredBuckets = useMemo(() => {
    if (!searchTerm.trim()) return buckets;
    const query = searchTerm.toLowerCase();
    return buckets.filter(
      (b) =>
        b.name.toLowerCase().includes(query) ||
        b.provider.toLowerCase().includes(query) ||
        b.region.toLowerCase().includes(query)
    );
  }, [buckets, searchTerm]);

  // Trigger Immediate Backup Submit
  const handleTriggerBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingBackup(true);
    try {
      const res = await fetch("/api/system/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TRIGGER_BACKUP",
          note: backupForm.note,
          targetBucket: backupForm.targetBucket,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to trigger backup snapshot");
      }

      showToast("Manual database snapshot completed and archived successfully");
      setIsBackupModalOpen(false);
      setBackupForm({ note: "", targetBucket: "shohoj-ledger-prod-us-east", compression: "zstd" });
      fetchStorageData();
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Failed to trigger backup", "error");
    } finally {
      setSubmittingBackup(false);
    }
  };

  // Purge Temporary Cache
  const handlePurgeCache = async () => {
    if (!confirm("Are you sure you want to purge temporary spool files and PDF rendering cache?")) {
      return;
    }

    setPurgingCache(true);
    try {
      const res = await fetch("/api/system/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "PURGE_CACHE" }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to purge storage cache");
      }

      const data = await res.json();
      showToast(data.message || "Temporary cache purged successfully");
      fetchStorageData();
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Failed to purge cache", "error");
    } finally {
      setPurgingCache(false);
    }
  };

  // Delete Backup
  const handleDeleteBackup = async (backup: BackupItem) => {
    if (!confirm(`Are you sure you want to delete backup '${backup.fileName}'?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/system/storage?id=${backup.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete backup");
      }

      showToast(`Backup '${backup.fileName}' removed from archive`);
      fetchStorageData();
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Failed to delete backup", "error");
    }
  };

  // Simulated Download
  const handleDownloadBackup = (backup: BackupItem) => {
    showToast(`Initiating secure download of '${backup.fileName}'...`);
  };

  return (
    <div className={styles.pageContainer}>
      {/* Toast Feedback */}
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
            <span className={styles.liveBadgeText}>STORAGE VOLUMES &amp; COLD ARCHIVES TELEMETRY</span>
          </div>
          <h1 className={styles.pageTitle}>
            <HardDrive size={28} color="#22d3ee" />
            Storage Volumes &amp; Backups
          </h1>
          <p className={styles.pageSubtitle}>
            Multi-tenant object storage telemetry, automated PostgreSQL snapshots, cold archive redundancy, and tenant quota governance.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            onClick={fetchStorageData}
            disabled={loading}
            className={styles.refreshBtn}
            title="Refresh Storage Data"
          >
            <RefreshCw size={15} className={loading ? styles.spinning : ""} />
            Refresh
          </button>

          <button
            onClick={handlePurgeCache}
            disabled={purgingCache}
            className={styles.refreshBtn}
            title="Purge Spool Cache"
          >
            <Trash2 size={15} />
            {purgingCache ? "Purging..." : "Purge Cache"}
          </button>

          <button
            onClick={() => setIsBackupModalOpen(true)}
            className={styles.primaryActionBtn}
          >
            <Plus size={16} />
            Trigger Immediate Backup
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics Grid */}
      <div className={styles.kpiGrid}>
        {/* Total Storage Used */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div
              className={styles.kpiIconBox}
              style={{ background: "rgba(6, 182, 212, 0.15)", border: "1px solid rgba(6, 182, 212, 0.3)" }}
            >
              <HardDrive size={22} color="#22d3ee" />
            </div>
            <span
              className={styles.kpiBadge}
              style={{ background: "rgba(6, 182, 212, 0.12)", color: "#a5f3fc" }}
            >
              {loading ? "..." : `${metrics.totalUsedPercent}% Utilized`}
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Total Storage Used</span>
            <span className={styles.kpiValue}>
              {loading ? "..." : `${metrics.totalUsedGB} GB`}
              <span style={{ fontSize: "14px", color: "#64748b", fontWeight: 500, marginLeft: "6px" }}>
                / {metrics.totalCapacityGB} GB
              </span>
            </span>
          </div>
        </div>

        {/* Database Size */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div
              className={styles.kpiIconBox}
              style={{ background: "rgba(59, 130, 246, 0.15)", border: "1px solid rgba(59, 130, 246, 0.3)" }}
            >
              <Database size={22} color="#60a5fa" />
            </div>
            <span
              className={styles.kpiBadge}
              style={{ background: "rgba(59, 130, 246, 0.12)", color: "#93c5fd" }}
            >
              <CheckCircle2 size={12} /> PostgreSQL
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Database &amp; Ledger Size</span>
            <span className={styles.kpiValue}>
              {loading ? "..." : `${metrics.dbSizeGB} GB`}
            </span>
          </div>
        </div>

        {/* Document Attachments */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div
              className={styles.kpiIconBox}
              style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)" }}
            >
              <FileText size={22} color="#34d399" />
            </div>
            <span
              className={styles.kpiBadge}
              style={{ background: "rgba(16, 185, 129, 0.12)", color: "#a7f3d0" }}
            >
              <Layers size={12} /> Multi-Tenant
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Tenant Attachments</span>
            <span className={styles.kpiValue}>
              {loading ? "..." : `${metrics.docSizeGB} GB`}
            </span>
          </div>
        </div>

        {/* Active Cloud Backups */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div
              className={styles.kpiIconBox}
              style={{ background: "rgba(168, 85, 247, 0.15)", border: "1px solid rgba(168, 85, 247, 0.3)" }}
            >
              <Archive size={22} color="#c084fc" />
            </div>
            <span
              className={styles.kpiBadge}
              style={{ background: "rgba(168, 85, 247, 0.12)", color: "#e9d5ff" }}
            >
              <ShieldCheck size={12} /> Verified
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Cloud Backups Size</span>
            <span className={styles.kpiValue}>
              {loading ? "..." : `${metrics.backupsSizeGB} GB`}
              <span style={{ fontSize: "14px", color: "#64748b", fontWeight: 500, marginLeft: "6px" }}>
                ({metrics.totalBackupsCount} Snapshots)
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Storage Allocation Breakdown Bar */}
      <div className={styles.storageBreakdownCard}>
        <div className={styles.breakdownHeader}>
          <div className={styles.breakdownTitleGroup}>
            <Server size={18} color="#22d3ee" />
            <h2 className={styles.breakdownTitle}>Platform Storage Volume Allocation</h2>
          </div>
          <span style={{ fontSize: "12.5px", color: "#94a3b8" }}>
            Total Allocated: <strong style={{ color: "#ffffff" }}>{metrics.totalUsedGB} GB</strong> of {metrics.totalCapacityGB} GB ({metrics.freeSpaceGB} GB Free)
          </span>
        </div>

        {/* Segmented Progress Bar */}
        <div className={styles.segmentedBar}>
          <div
            className={styles.segmentDb}
            style={{ width: `${(metrics.dbSizeGB / metrics.totalCapacityGB) * 100}%` }}
            title={`Database: ${metrics.dbSizeGB} GB`}
          />
          <div
            className={styles.segmentDocs}
            style={{ width: `${(metrics.docSizeGB / metrics.totalCapacityGB) * 100}%` }}
            title={`Documents & Attachments: ${metrics.docSizeGB} GB`}
          />
          <div
            className={styles.segmentBackups}
            style={{ width: `${(metrics.backupsSizeGB / metrics.totalCapacityGB) * 100}%` }}
            title={`Backups & Archives: ${metrics.backupsSizeGB} GB`}
          />
          <div className={styles.segmentFree} style={{ flex: 1 }} title={`Free Capacity: ${metrics.freeSpaceGB} GB`} />
        </div>

        {/* Legend */}
        <div className={styles.legendRow}>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: "#60a5fa" }} />
            <span>Database ({metrics.dbSizeGB} GB)</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: "#22d3ee" }} />
            <span>Tenant Attachments ({metrics.docSizeGB} GB)</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: "#c084fc" }} />
            <span>Backups &amp; Snapshots ({metrics.backupsSizeGB} GB)</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: "rgba(255, 255, 255, 0.2)" }} />
            <span>Free Space ({metrics.freeSpaceGB} GB)</span>
          </div>
        </div>
      </div>

      {/* 4. Main Tabbed Card */}
      <div className={styles.mainCard}>
        {/* Navigation Tabs & Search Controls */}
        <div className={styles.controlsBar}>
          <div className={styles.controlsLeft}>
            <div className={styles.searchWrapper}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  activeTab === "BACKUPS"
                    ? "Search snapshots by filename, source, status..."
                    : activeTab === "TENANTS"
                    ? "Search tenants, subscription plan..."
                    : "Search cloud buckets, regions..."
                }
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
          </div>
        </div>

        {/* Tab Selection */}
        <div className={styles.filterTabsRow}>
          <button
            onClick={() => setActiveTab("BACKUPS")}
            className={`${styles.filterTabBtn} ${activeTab === "BACKUPS" ? styles.filterTabBtnActive : ""}`}
          >
            <Archive size={15} />
            System Backups &amp; Snapshots ({backups.length})
          </button>
          <button
            onClick={() => setActiveTab("TENANTS")}
            className={`${styles.filterTabBtn} ${activeTab === "TENANTS" ? styles.filterTabBtnActive : ""}`}
          >
            <Building2 size={15} />
            Tenant Storage Quotas ({tenants.length})
          </button>
          <button
            onClick={() => setActiveTab("BUCKETS")}
            className={`${styles.filterTabBtn} ${activeTab === "BUCKETS" ? styles.filterTabBtnActive : ""}`}
          >
            <Cloud size={15} />
            Cloud Buckets &amp; Infrastructure ({buckets.length})
          </button>
        </div>

        {/* Tab 1: System Backups Table */}
        {activeTab === "BACKUPS" && (
          <div className={styles.tableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Snapshot File Name</th>
                  <th>Archive Size</th>
                  <th>Status</th>
                  <th>Trigger Source</th>
                  <th>Created At</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className={styles.emptyState}>
                      <RefreshCw size={28} className={styles.spinning} color="#22d3ee" />
                      <span>Loading snapshot archive registry...</span>
                    </td>
                  </tr>
                ) : filteredBackups.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.emptyState}>
                      <Archive size={40} style={{ opacity: 0.3 }} />
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#f1f5f9" }}>
                        No snapshot records found
                      </span>
                    </td>
                  </tr>
                ) : (
                  filteredBackups.map((bkp) => {
                    const formattedDate = new Date(bkp.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <tr key={bkp.id} className={styles.dataRow}>
                        <td>
                          <div className={styles.fileNameCell}>
                            <div className={styles.fileNameText}>
                              <Archive size={14} color="#22d3ee" />
                              <span>{bkp.fileName}</span>
                            </div>
                            <span className={styles.fileMetaText}>
                              ID: {bkp.id.slice(0, 8)} &bull; Encrypted AES-256
                            </span>
                          </div>
                        </td>

                        <td>
                          <span style={{ fontWeight: 700, color: "#ffffff", fontFamily: "monospace" }}>
                            {bkp.fileSizeFormatted}
                          </span>
                        </td>

                        <td>
                          <span className={styles.badgeSuccess}>
                            <CheckCircle2 size={12} /> {bkp.status}
                          </span>
                        </td>

                        <td>
                          <span style={{ fontSize: "12.5px", color: "#cbd5e1" }}>
                            {bkp.triggeredBy}
                          </span>
                        </td>

                        <td>
                          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                            {formattedDate}
                          </span>
                        </td>

                        <td style={{ textAlign: "right" }}>
                          <div className={styles.actionButtons}>
                            <button
                              onClick={() => handleDownloadBackup(bkp)}
                              className={styles.iconActionBtn}
                              title="Download Snapshot"
                            >
                              <Download size={13} />
                              Download
                            </button>
                            <button
                              onClick={() => handleDeleteBackup(bkp)}
                              className={`${styles.iconActionBtn} ${styles.iconActionBtnDelete}`}
                              title="Delete Snapshot"
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
        )}

        {/* Tab 2: Tenant Quotas Table */}
        {activeTab === "TENANTS" && (
          <div className={styles.tableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Tenant Company</th>
                  <th>Subscription Tier</th>
                  <th>Storage Consumed</th>
                  <th>Quota Utilization</th>
                  <th>Files &amp; Attachments</th>
                  <th style={{ textAlign: "right" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className={styles.emptyState}>
                      <RefreshCw size={28} className={styles.spinning} color="#22d3ee" />
                      <span>Loading multi-tenant storage quotas...</span>
                    </td>
                  </tr>
                ) : filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.emptyState}>
                      <Building2 size={40} style={{ opacity: 0.3 }} />
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#f1f5f9" }}>
                        No tenant quota records found
                      </span>
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className={styles.dataRow}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              background: "rgba(6, 182, 212, 0.15)",
                              border: "1px solid rgba(6, 182, 212, 0.3)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#22d3ee",
                              fontWeight: 800,
                              fontSize: "13px",
                            }}
                          >
                            {tenant.name.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#ffffff" }}>
                              {tenant.name}
                            </span>
                            <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>
                              ID: {tenant.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: "rgba(59, 130, 246, 0.15)",
                            border: "1px solid rgba(59, 130, 246, 0.3)",
                            color: "#60a5fa",
                          }}
                        >
                          {tenant.plan}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontWeight: 700, color: "#ffffff", fontFamily: "monospace" }}>
                          {tenant.usedGB} GB
                        </span>
                        <span style={{ fontSize: "12px", color: "#64748b" }}> / {tenant.quotaGB} GB</span>
                      </td>

                      <td>
                        <div className={styles.quotaProgressWrapper}>
                          <div className={styles.quotaProgressBar}>
                            <div
                              className={`${styles.quotaProgressFill} ${
                                tenant.usedPercent > 80 ? styles.quotaProgressFillWarning : ""
                              }`}
                              style={{ width: `${tenant.usedPercent}%` }}
                            />
                          </div>
                          <span className={styles.quotaPercentText}>{tenant.usedPercent}%</span>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: "12.5px", color: "#cbd5e1" }}>
                          {tenant.documentsCount.toLocaleString()} items
                        </span>
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <span className={styles.badgeSuccess}>
                          <CheckCircle2 size={12} /> {tenant.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Cloud Buckets Table */}
        {activeTab === "BUCKETS" && (
          <div className={styles.tableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Cloud Object Bucket</th>
                  <th>Storage Provider</th>
                  <th>Region &amp; Tier</th>
                  <th>Encryption &amp; Security</th>
                  <th>Latency</th>
                  <th>Stored Volume</th>
                  <th style={{ textAlign: "right" }}>Health</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className={styles.emptyState}>
                      <RefreshCw size={28} className={styles.spinning} color="#22d3ee" />
                      <span>Loading cloud storage infrastructure...</span>
                    </td>
                  </tr>
                ) : (
                  filteredBuckets.map((bucket) => (
                    <tr key={bucket.id} className={styles.dataRow}>
                      <td>
                        <div className={styles.fileNameCell}>
                          <div className={styles.fileNameText}>
                            <Cloud size={14} color="#22d3ee" />
                            <span>{bucket.name}</span>
                          </div>
                          <span className={styles.fileMetaText}>
                            {bucket.type} &bull; {bucket.totalFiles.toLocaleString()} files
                          </span>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>
                          {bucket.provider}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: "12.5px", color: "#cbd5e1" }}>
                          {bucket.region}
                        </span>
                      </td>

                      <td>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: "rgba(16, 185, 129, 0.15)",
                            border: "1px solid rgba(16, 185, 129, 0.3)",
                            color: "#34d399",
                          }}
                        >
                          {bucket.encryption}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#34d399" }}>
                          {bucket.latency}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontWeight: 700, color: "#ffffff", fontFamily: "monospace" }}>
                          {bucket.usedGB}
                        </span>
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <span className={styles.badgeSuccess}>
                          <CheckCircle2 size={12} /> {bucket.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Trigger Immediate Backup Modal */}
      {isBackupModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsBackupModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Archive size={20} color="#22d3ee" />
                Trigger Immediate Snapshot
              </h2>
              <button
                onClick={() => setIsBackupModalOpen(false)}
                className={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleTriggerBackup}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Target Cloud Storage Bucket</label>
                  <select
                    value={backupForm.targetBucket}
                    onChange={(e) => setBackupForm((prev) => ({ ...prev, targetBucket: e.target.value }))}
                    className={styles.formInput}
                  >
                    <option value="shohoj-ledger-prod-us-east">Primary AWS S3 Hot (us-east-1)</option>
                    <option value="shohoj-cold-archive-eu">Cloudflare R2 Cold Archive (eu-central)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Compression Algorithm</label>
                  <select
                    value={backupForm.compression}
                    onChange={(e) => setBackupForm((prev) => ({ ...prev, compression: e.target.value }))}
                    className={styles.formInput}
                  >
                    <option value="zstd">Zstandard Ultra (Fast + High Ratio)</option>
                    <option value="gzip">Gzip Standard (.sql.gz)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Snapshot Annotation / Reason</label>
                  <input
                    type="text"
                    placeholder="e.g. Pre-deployment schema migration checkpoint"
                    value={backupForm.note}
                    onChange={(e) => setBackupForm((prev) => ({ ...prev, note: e.target.value }))}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsBackupModalOpen(false)}
                  className={styles.modalCancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBackup}
                  className={styles.modalSubmitBtn}
                >
                  {submittingBackup ? "Capturing Snapshot..." : "Trigger Backup Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
