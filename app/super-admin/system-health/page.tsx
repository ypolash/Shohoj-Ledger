"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Database,
  Cpu,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Zap,
  HardDrive,
  Clock,
  Terminal,
  Layers,
  Sparkles,
  Info,
  Radio,
} from "lucide-react";
import styles from "./systemHealth.module.css";

interface SystemHealthData {
  health: {
    status: string;
    timestamp: string;
    uptimeSeconds: number;
    nodeVersion: string;
    platform: string;
    cpuModel: string;
    cpuCores: number;
    loadAverage: string[];
    memUsagePercent: number;
    heapUsedMB: number;
    heapTotalMB: number;
    totalMemGB: string;
    freeMemGB: string;
    dbLatencyMs: number;
    dbStatus: string;
  };
  services: Array<{
    id: string;
    name: string;
    category: string;
    status: string;
    latency: string;
    uptime: string;
    description: string;
  }>;
  recentEvents: Array<{
    id: string;
    timestamp: string;
    level: string;
    source: string;
    message: string;
  }>;
  metrics: {
    totalCompanies: number;
    totalUsers: number;
    totalSupportTickets: number;
    lastBackupDate: string | null;
  };
}

export default function SystemHealthPage() {
  const [data, setData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/system/health");
      if (res.status === 401) {
        window.location.href = "/super-admin/login";
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch system health telemetry");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to load telemetry", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    // Auto-refresh telemetry every 30 seconds
    const timer = setInterval(fetchHealth, 30000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const isHealthy = data?.health?.status === "HEALTHY";

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
            <span className={styles.liveBadgeText}>
              {isHealthy ? "All Core Subsystems 100% Operational" : "Telemetry Warning Detected"}
            </span>
          </div>
          <h1 className={styles.pageTitle}>
            <Activity size={26} style={{ color: "#22d3ee" }} />
            System Health &amp; Infrastructure Telemetry
          </h1>
          <p className={styles.pageSubtitle}>
            Real-time multi-tenant telemetry HUD: observe database latency, hardware memory pressure, V8 heap allocation, and background service daemons.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={fetchHealth}
            disabled={loading}
            className={styles.refreshBtn}
            title="Refresh Telemetry"
          >
            <RefreshCw size={15} className={loading ? styles.spinning : ""} />
            <span>{loading ? "Sampling..." : "Run Diagnostics"}</span>
          </button>
        </div>
      </section>

      {/* 2. Telemetry HUD Ribbon */}
      {data && (
        <section className={styles.hudRibbon}>
          <div className={styles.hudItem}>
            <div className={styles.hudIconBox}>
              <Cpu size={18} />
            </div>
            <div className={styles.hudItemText}>
              <span className={styles.hudItemLabel}>Processor Model</span>
              <span className={styles.hudItemValue} title={data.health.cpuModel}>
                {data.health.cpuCores} Cores ({data.health.cpuModel.slice(0, 20)}...)
              </span>
            </div>
          </div>

          <div className={styles.hudItem}>
            <div className={styles.hudIconBox}>
              <Terminal size={18} />
            </div>
            <div className={styles.hudItemText}>
              <span className={styles.hudItemLabel}>Runtime Environment</span>
              <span className={styles.hudItemValue}>
                Node.js {data.health.nodeVersion}
              </span>
            </div>
          </div>

          <div className={styles.hudItem}>
            <div className={styles.hudIconBox}>
              <Server size={18} />
            </div>
            <div className={styles.hudItemText}>
              <span className={styles.hudItemLabel}>Platform OS</span>
              <span className={styles.hudItemValue}>
                {data.health.platform}
              </span>
            </div>
          </div>

          <div className={styles.hudItem}>
            <div className={styles.hudIconBox}>
              <Zap size={18} />
            </div>
            <div className={styles.hudItemText}>
              <span className={styles.hudItemLabel}>Load Average (1m, 5m, 15m)</span>
              <span className={styles.hudItemValue}>
                {data.health.loadAverage.join(" / ")}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* 3. KPI Metric Cards Grid */}
      <section className={styles.kpiGrid}>
        {/* Database Latency */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div className={styles.kpiIconBox} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
              <Database size={24} />
            </div>
            <span className={styles.kpiBadge} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
              PostgreSQL
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Database Ping Latency</span>
            <span className={styles.kpiValue} style={{ color: "#34d399" }}>
              {data ? `${data.health.dbLatencyMs} ms` : "--"}
            </span>
          </div>
        </div>

        {/* System Memory Load */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div className={styles.kpiIconBox} style={{ background: "rgba(6, 182, 212, 0.15)", color: "#06b6d4" }}>
              <HardDrive size={24} />
            </div>
            <span className={styles.kpiBadge} style={{ background: "rgba(6, 182, 212, 0.15)", color: "#22d3ee" }}>
              {data ? `${data.health.freeMemGB} GB Free` : "RAM"}
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>System Memory Usage</span>
            <span className={styles.kpiValue} style={{ color: "#22d3ee" }}>
              {data ? `${data.health.memUsagePercent}%` : "--"}
            </span>
            {data && (
              <div className={styles.memoryProgressBarWrapper}>
                <div
                  className={styles.memoryProgressBar}
                  style={{
                    width: `${data.health.memUsagePercent}%`,
                    background:
                      data.health.memUsagePercent > 85
                        ? "#ef4444"
                        : data.health.memUsagePercent > 70
                        ? "#f59e0b"
                        : "#22d3ee",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* V8 Heap Memory */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div className={styles.kpiIconBox} style={{ background: "rgba(168, 85, 247, 0.15)", color: "#a855f7" }}>
              <Cpu size={24} />
            </div>
            <span className={styles.kpiBadge} style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc" }}>
              V8 Engine
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Process Heap Allocated</span>
            <span className={styles.kpiValue} style={{ color: "#c084fc" }}>
              {data ? `${data.health.heapUsedMB} MB` : "--"}
            </span>
          </div>
        </div>

        {/* Infrastructure Uptime */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div className={styles.kpiIconBox} style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}>
              <Clock size={24} />
            </div>
            <span className={styles.kpiBadge} style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}>
              100% SLA
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Process Uptime</span>
            <span className={styles.kpiValue} style={{ color: "#60a5fa", fontSize: "22px" }}>
              {data ? formatUptime(data.health.uptimeSeconds) : "--"}
            </span>
          </div>
        </div>
      </section>

      {/* 4. Subsystems Health Matrix Table */}
      <section className={styles.mainCard}>
        <div className={styles.cardHeaderRow}>
          <div className={styles.cardTitleGroup}>
            <h2 className={styles.cardTitle}>
              <ShieldCheck size={20} style={{ color: "#22d3ee" }} />
              <span>Core Subsystems &amp; Services Matrix</span>
            </h2>
            <p className={styles.cardSubtitle}>
              Continuous automated liveness probes and diagnostics across all platform components.
            </p>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.servicesTable}>
            <thead>
              <tr>
                <th>Subsystem / Service</th>
                <th>Category</th>
                <th>Liveness Status</th>
                <th>Latency</th>
                <th>Uptime SLA</th>
                <th>Diagnostic Summary</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px" }}>
                    <RefreshCw size={24} className={styles.spinning} style={{ color: "#22d3ee", margin: "0 auto 10px" }} />
                    <span style={{ color: "#94a3b8" }}>Running live subsystem diagnostic probes...</span>
                  </td>
                </tr>
              ) : (
                data?.services.map((srv) => (
                  <tr key={srv.id} className={styles.serviceRow}>
                    <td>
                      <div className={styles.serviceNameCell}>
                        <div className={styles.serviceIconBox}>
                          <Radio size={18} />
                        </div>
                        <div className={styles.serviceInfoText}>
                          <span className={styles.serviceName}>{srv.name}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={styles.serviceCategory}>{srv.category}</span>
                    </td>

                    <td>
                      <span
                        className={`${styles.statusPill} ${
                          srv.status === "OPERATIONAL"
                            ? styles.statusOperational
                            : srv.status === "WARNING"
                            ? styles.statusWarning
                            : styles.statusDegraded
                        }`}
                      >
                        <div className={styles.statusDot} />
                        <span>{srv.status}</span>
                      </span>
                    </td>

                    <td>
                      <span className={styles.latencyTag}>{srv.latency}</span>
                    </td>

                    <td>
                      <span className={styles.uptimeBadge}>{srv.uptime}</span>
                    </td>

                    <td>
                      <span className={styles.serviceDesc}>{srv.description}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Recent System Events & Diagnostic Stream */}
      {data && data.recentEvents.length > 0 && (
        <section className={styles.mainCard}>
          <div className={styles.cardHeaderRow}>
            <div className={styles.cardTitleGroup}>
              <h2 className={styles.cardTitle}>
                <Info size={18} style={{ color: "#22d3ee" }} />
                <span>Recent Diagnostics &amp; System Event Stream</span>
              </h2>
              <p className={styles.cardSubtitle}>
                Real-time security sentinels, garbage collection events, and background queue alerts.
              </p>
            </div>
          </div>

          <div className={styles.eventList}>
            {data.recentEvents.map((ev) => (
              <div key={ev.id} className={styles.eventItem}>
                <div className={styles.eventLeft}>
                  <span
                    className={styles.eventBadge}
                    style={{
                      background:
                        ev.level === "SUCCESS"
                          ? "rgba(16, 185, 129, 0.15)"
                          : ev.level === "WARNING"
                          ? "rgba(245, 158, 11, 0.15)"
                          : "rgba(6, 182, 212, 0.15)",
                      color:
                        ev.level === "SUCCESS"
                          ? "#34d399"
                          : ev.level === "WARNING"
                          ? "#fbbf24"
                          : "#22d3ee",
                      border: `1px solid ${
                        ev.level === "SUCCESS"
                          ? "rgba(16, 185, 129, 0.3)"
                          : ev.level === "WARNING"
                          ? "rgba(245, 158, 11, 0.3)"
                          : "rgba(6, 182, 212, 0.3)"
                      }`,
                    }}
                  >
                    {ev.level}
                  </span>
                  <div className={styles.eventTextGroup}>
                    <span className={styles.eventSource}>{ev.source}</span>
                    <span className={styles.eventMessage}>{ev.message}</span>
                  </div>
                </div>

                <span className={styles.eventTime}>
                  {new Date(ev.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
