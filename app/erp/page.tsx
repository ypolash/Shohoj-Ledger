"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import styles from "./dashboard.module.css";

// Import modular dashboard widgets
import { KPICards } from "./components/KPICards";
import { BusinessCharts } from "./components/BusinessCharts";
import { QuickActions } from "./components/QuickActions";
import { RecentTables } from "./components/RecentTables";

type MonthlyData = {
  label: string;
  revenue: number;
  expense: number;
  netCash: number;
};

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type OverviewData = {
  currentUser?: CurrentUser;
  businessType?: string;
  reserveBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  outstandingLoans: number;
  activeAdvances: number;
  monthlyData: MonthlyData[];
  recentTransactions: any[];
  totalEmployees?: number;
  attendanceToday?: number;
  inventoryValue?: number;
  activeProjects?: number;
};

export default function DashboardIndex() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOverview = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/overview");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch dashboard overview:", err);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Current formatted date and greeting
  const today = new Date();
  const dateString = today.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  const hour = today.getHours();
  const timeGreeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Role assigned to the currently authenticated user
  const role = data?.currentUser?.role || "Owner";
  const userName = data?.currentUser?.name || "Executive";
  const isPrivileged = ["Owner", "CEO", "Admin", "Super Admin"].some(r => (role || '').split(',').map((x: string) => x.trim()).includes(r));

  if (loading && !data) {
    return (
      <PageContainer>
        <div
          style={{
            padding: "80px 20px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            color: "#94a3b8"
          }}
        >
          <span
            className="material-symbols-outlined spinning"
            style={{ fontSize: "36px", color: "#3b82f6" }}
          >
            sync
          </span>
          <span style={{ fontSize: "15px", fontWeight: 500 }}>
            Loading Enterprise Dashboard...
          </span>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className={styles.dashboardWrapper}>
        {/* Top Executive Header */}
        <div className={styles.topHeader}>
          <div className={styles.headerTopRow}>
            <div className={styles.headerTitleGroup}>
              <div className={styles.headerGreetingRow}>
                <div className={styles.statusPulseDot} />
                <span className={styles.greetingText}>
                  System Active • Live Sync
                </span>
              </div>
              <h1 className={styles.headerTitle}>
                Enterprise Dashboard
                <span className={styles.roleBadge}>{role} Workspace</span>
              </h1>
              <p style={{ fontSize: "13px", color: "var(--text-muted, #94a3b8)", margin: 0 }}>
                {timeGreeting}, <strong>{userName}</strong>! Operational and financial telemetry tailored to your <strong>{role}</strong> role.
              </p>
            </div>

            <div className={styles.headerActions}>
              <div className={styles.headerDateBadge}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#60a5fa" }}>
                  calendar_today
                </span>
                <span>{dateString}</span>
              </div>

              {isPrivileged && (
                <Link
                  href="/erp/settings/command-center"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(59, 130, 246, 0.15)",
                    color: "#60a5fa",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                    padding: "8px 14px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "all 0.2s ease"
                  }}
                  title="Configure user roles & passwords"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                    shield_person
                  </span>
                  <span>Command Center</span>
                </Link>
              )}

              <button
                className={styles.refreshBtn}
                onClick={() => fetchOverview(true)}
                disabled={refreshing}
                title="Refresh Live Metrics"
              >
                <span
                  className={`material-symbols-outlined ${refreshing ? styles.spinning : ""}`}
                  style={{ fontSize: "18px" }}
                >
                  refresh
                </span>
                <span>{refreshing ? "Syncing..." : "Sync"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Command Bar */}
        <QuickActions role={role} />

        {/* KPI Metrics Strip */}
        <KPICards data={data} role={role} />

        {/* Financial & Operational Analytics Charts */}
        <BusinessCharts data={data} role={role} />

        {/* Recent Transactions Ledger Table */}
        <RecentTables data={data} role={role} />
      </div>
    </PageContainer>
  );
}
