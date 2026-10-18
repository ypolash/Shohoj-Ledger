"use client";

import { useState, useEffect, useCallback } from "react";
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
      if (!res.ok) {
        console.warn(`Dashboard overview fetch returned status ${res.status}`);
        return;
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("Dashboard overview returned non-JSON response");
        return;
      }
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

  // Live local clock and date state
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const displayDate = currentTime;

  const timeString = displayDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const dayName = displayDate.toLocaleDateString("en-US", { weekday: "long" });
  const dateFormatted = displayDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const hour = displayDate.getHours();
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
                {timeGreeting}, {userName}!
                <span className={styles.roleBadge}>{role} Workspace</span>
              </h1>
              <p className={styles.headerSubtitle}>
                Real-time operational intelligence and enterprise ledger telemetry.
              </p>
            </div>

            <div className={styles.headerDateTimeGroup}>
              <div className={styles.clockBadge} title="Live Local Time">
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#38bdf8" }}>
                  schedule
                </span>
                <span>{timeString}</span>
              </div>

              <div className={styles.dateBadge} title="Current Date">
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#60a5fa" }}>
                  calendar_today
                </span>
                <span className={styles.dayText}>{dayName},</span>
                <span className={styles.dateText}>{dateFormatted}</span>
              </div>
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
