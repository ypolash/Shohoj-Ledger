"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { 
  exportFinancialReportToCSV, 
  exportFinancialReportToPDF,
  formatCurrency 
} from "@/lib/reports/financeReportExport";

type PeriodType = "monthly" | "weekly" | "yearly" | "custom";

export default function ComprehensiveFinanceReportPage() {
  const [period, setPeriod] = useState<PeriodType>("monthly");
  
  // Date State
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1); // 1-12
  const [weekOffset, setWeekOffset] = useState<number>(0);
  
  // Custom Date Range
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const todayStr = now.toISOString().split("T")[0];
  const [customStartDate, setCustomStartDate] = useState<string>(firstDayOfMonth);
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);

  // Data & Loading State
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Ledger Filter & Search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("period", period);

      if (period === "monthly") {
        params.set("year", selectedYear.toString());
        params.set("month", selectedMonth.toString());
      } else if (period === "weekly") {
        params.set("weekOffset", weekOffset.toString());
      } else if (period === "yearly") {
        params.set("year", selectedYear.toString());
      } else if (period === "custom") {
        params.set("startDate", customStartDate);
        params.set("endDate", customEndDate);
      }

      const res = await fetch(`/api/finance/reports/comprehensive?${params.toString()}`);
      const json = await res.json();

      if (json.success && json.report) {
        setReportData(json.report);
      } else {
        setError(json.error || "Failed to load financial report");
      }
    } catch (err: any) {
      console.error("Failed to fetch report:", err);
      setError("An unexpected network error occurred while generating report.");
    } finally {
      setIsLoading(false);
    }
  }, [period, selectedYear, selectedMonth, weekOffset, customStartDate, customEndDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const handleThisMonth = () => {
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth() + 1);
  };

  // Custom Preset range helpers
  const setPresetRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setCustomStartDate(start.toISOString().split("T")[0]);
    setCustomEndDate(end.toISOString().split("T")[0]);
  };

  const setQuarterPreset = (quarter: number) => {
    const yr = selectedYear;
    const startMonth = (quarter - 1) * 3;
    const start = new Date(yr, startMonth, 1);
    const end = new Date(yr, startMonth + 3, 0);
    setCustomStartDate(start.toISOString().split("T")[0]);
    setCustomEndDate(end.toISOString().split("T")[0]);
  };

  const setYTDPreset = () => {
    const start = new Date(now.getFullYear(), 0, 1);
    setCustomStartDate(start.toISOString().split("T")[0]);
    setCustomEndDate(now.toISOString().split("T")[0]);
  };

  // Filtered transactions for table
  const filteredTransactions = useMemo(() => {
    if (!reportData?.transactions) return [];
    return reportData.transactions.filter((tx: any) => {
      const matchesType = typeFilter === "ALL" || tx.type === typeFilter;
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term ||
        tx.description?.toLowerCase().includes(term) ||
        tx.category?.toLowerCase().includes(term) ||
        tx.paymentMethod?.toLowerCase().includes(term) ||
        tx.reference?.toLowerCase().includes(term);
      return matchesType && matchesSearch;
    });
  }, [reportData, typeFilter, searchTerm]);

  const currency = reportData?.currency || "BDT";
  const summary = reportData?.summary || {
    totalIncome: 0,
    totalIncomeReceived: 0,
    accountsReceivable: 0,
    totalDirectExpense: 0,
    totalPayroll: 0,
    totalSettlements: 0,
    totalAllExpenses: 0,
    netProfit: 0,
    profitMargin: "0.0",
    totalCashIn: 0,
    totalCashOut: 0,
    netCashFlow: 0
  };

  const months = [
    { num: 1, name: "January" },
    { num: 2, name: "February" },
    { num: 3, name: "March" },
    { num: 4, name: "April" },
    { num: 5, name: "May" },
    { num: 6, name: "June" },
    { num: 7, name: "July" },
    { num: 8, name: "August" },
    { num: 9, name: "September" },
    { num: 10, name: "October" },
    { num: 11, name: "November" },
    { num: 12, name: "December" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", padding: "20px 24px" }}>
      {/* Minimalist Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link 
              href="/erp/finance/reports" 
              style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--text-muted)", textDecoration: "none" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>arrow_back</span>
              Reports
            </Link>
            <span style={{ color: "var(--border-main)", fontSize: "12px" }}>/</span>
            <span style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 600 }}>Financial Statement</span>
          </div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "var(--text-main)", letterSpacing: "-0.01em" }}>
            Financial Statement & Reports
          </h1>
          <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
            Real-time monthly, weekly, yearly, and custom financial telemetry.
          </p>
        </div>

        {/* Minimalist Action Buttons */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => exportFinancialReportToCSV(reportData)}
            disabled={isLoading || !reportData}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "8px",
              background: "var(--surface-card)",
              border: "1px solid var(--border-main)",
              color: "var(--text-main)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#10b981" }}>table_chart</span>
            CSV Export
          </button>

          <button
            onClick={() => exportFinancialReportToPDF(reportData)}
            disabled={isLoading || !reportData}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "8px",
              background: "var(--surface-card)",
              border: "1px solid var(--border-main)",
              color: "var(--text-main)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#ef4444" }}>picture_as_pdf</span>
            PDF Export
          </button>

          <button
            onClick={() => window.print()}
            disabled={isLoading || !reportData}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "8px",
              background: "var(--surface-card)",
              border: "1px solid var(--border-main)",
              color: "var(--text-main)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>print</span>
            Print
          </button>

          <button
            onClick={fetchReport}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              border: "none",
              color: "#fff",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* ====================================================================
          MINIMALIST PERIOD CONTROL BAR (HR TAB STYLE)
          ==================================================================== */}
      <div 
        style={{
          background: "var(--surface-card)",
          borderRadius: "14px",
          border: "1px solid var(--border-main)",
          padding: "10px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          {/* HR-Style Pill Navigation */}
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {[
              { id: "monthly", label: "Monthly Report", icon: "calendar_month" },
              { id: "weekly", label: "Weekly Report", icon: "date_range" },
              { id: "yearly", label: "Yearly Report", icon: "event_note" },
              { id: "custom", label: "Custom Date Range", icon: "tune" },
            ].map((tab) => {
              const isActive = period === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setPeriod(tab.id as PeriodType)}
                  style={{
                    fontSize: "12px",
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? "#ffffff" : "var(--text-secondary)",
                    background: isActive ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "transparent",
                    border: "none",
                    borderRadius: "8px",
                    padding: "6px 12px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.15s ease",
                    boxShadow: isActive ? "0 2px 8px rgba(37, 99, 235, 0.3)" : "none"
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "15px", color: isActive ? "#ffffff" : "var(--text-muted)" }}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Active Period Label */}
          {reportData?.periodLabel && (
            <div style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--primary)",
              background: "rgba(37, 99, 235, 0.08)",
              border: "1px solid rgba(37, 99, 235, 0.2)",
              padding: "4px 10px",
              borderRadius: "8px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>schedule</span>
              {reportData.periodLabel}
            </div>
          )}
        </div>

        {/* Minimalist Sub-Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", paddingTop: "8px", borderTop: "1px solid var(--border-light)" }}>
          {period === "monthly" && (
            <>
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  onClick={handlePrevMonth}
                  style={{ padding: "5px 10px", borderRadius: "6px", background: "var(--surface-hover)", border: "1px solid var(--border-main)", color: "var(--text-main)", cursor: "pointer", fontSize: "11px", fontWeight: 500 }}
                >
                  &larr; Prev
                </button>
                <button
                  onClick={handleThisMonth}
                  style={{ padding: "5px 10px", borderRadius: "6px", background: "var(--surface-hover)", border: "1px solid var(--border-main)", color: "var(--primary)", cursor: "pointer", fontSize: "11px", fontWeight: 600 }}
                >
                  This Month
                </button>
                <button
                  onClick={handleNextMonth}
                  style={{ padding: "5px 10px", borderRadius: "6px", background: "var(--surface-hover)", border: "1px solid var(--border-main)", color: "var(--text-main)", cursor: "pointer", fontSize: "11px", fontWeight: 500 }}
                >
                  Next &rarr;
                </button>
              </div>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                style={{ padding: "5px 10px", borderRadius: "6px", background: "var(--surface-main)", border: "1px solid var(--border-main)", color: "var(--text-main)", fontSize: "12px", fontWeight: 500 }}
              >
                {months.map(m => (
                  <option key={m.num} value={m.num}>{m.name}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{ padding: "5px 10px", borderRadius: "6px", background: "var(--surface-main)", border: "1px solid var(--border-main)", color: "var(--text-main)", fontSize: "12px", fontWeight: 500 }}
              >
                {[2024, 2025, 2026, 2027, 2028].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </>
          )}

          {period === "weekly" && (
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <button
                onClick={() => setWeekOffset(prev => prev - 1)}
                style={{ padding: "5px 10px", borderRadius: "6px", background: "var(--surface-hover)", border: "1px solid var(--border-main)", color: "var(--text-main)", cursor: "pointer", fontSize: "11px", fontWeight: 500 }}
              >
                &larr; Prev Week
              </button>
              <button
                onClick={() => setWeekOffset(0)}
                style={{ padding: "5px 10px", borderRadius: "6px", background: "var(--surface-hover)", border: "1px solid var(--border-main)", color: "var(--primary)", cursor: "pointer", fontSize: "11px", fontWeight: 600 }}
              >
                Current Week
              </button>
              <button
                onClick={() => setWeekOffset(prev => prev + 1)}
                style={{ padding: "5px 10px", borderRadius: "6px", background: "var(--surface-hover)", border: "1px solid var(--border-main)", color: "var(--text-main)", cursor: "pointer", fontSize: "11px", fontWeight: 500 }}
              >
                Next Week &rarr;
              </button>
            </div>
          )}

          {period === "yearly" && (
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <button
                onClick={() => setSelectedYear(prev => prev - 1)}
                style={{ padding: "5px 10px", borderRadius: "6px", background: "var(--surface-hover)", border: "1px solid var(--border-main)", color: "var(--text-main)", cursor: "pointer", fontSize: "11px", fontWeight: 500 }}
              >
                &larr; Prev Year
              </button>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{ padding: "5px 10px", borderRadius: "6px", background: "var(--surface-main)", border: "1px solid var(--border-main)", color: "var(--text-main)", fontSize: "12px", fontWeight: 500 }}
              >
                {[2023, 2024, 2025, 2026, 2027, 2028].map(y => (
                  <option key={y} value={y}>Fiscal Year {y}</option>
                ))}
              </select>
              <button
                onClick={() => setSelectedYear(prev => prev + 1)}
                style={{ padding: "5px 10px", borderRadius: "6px", background: "var(--surface-hover)", border: "1px solid var(--border-main)", color: "var(--text-main)", cursor: "pointer", fontSize: "11px", fontWeight: 500 }}
              >
                Next Year &rarr;
              </button>
            </div>
          )}

          {period === "custom" && (
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  style={{ padding: "4px 8px", borderRadius: "6px", background: "var(--surface-main)", border: "1px solid var(--border-main)", color: "var(--text-main)", fontSize: "11px" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>To:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  style={{ padding: "4px 8px", borderRadius: "6px", background: "var(--surface-main)", border: "1px solid var(--border-main)", color: "var(--text-main)", fontSize: "11px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "4px", alignItems: "center", marginLeft: "6px" }}>
                <button
                  type="button"
                  onClick={() => setPresetRange(7)}
                  style={{ padding: "3px 8px", borderRadius: "5px", background: "var(--surface-hover)", border: "1px solid var(--border-light)", color: "var(--text-muted)", fontSize: "11px", cursor: "pointer" }}
                >
                  7D
                </button>
                <button
                  type="button"
                  onClick={() => setPresetRange(30)}
                  style={{ padding: "3px 8px", borderRadius: "5px", background: "var(--surface-hover)", border: "1px solid var(--border-light)", color: "var(--text-muted)", fontSize: "11px", cursor: "pointer" }}
                >
                  30D
                </button>
                <button
                  type="button"
                  onClick={() => setQuarterPreset(1)}
                  style={{ padding: "3px 8px", borderRadius: "5px", background: "var(--surface-hover)", border: "1px solid var(--border-light)", color: "var(--text-muted)", fontSize: "11px", cursor: "pointer" }}
                >
                  Q1
                </button>
                <button
                  type="button"
                  onClick={() => setQuarterPreset(2)}
                  style={{ padding: "3px 8px", borderRadius: "5px", background: "var(--surface-hover)", border: "1px solid var(--border-light)", color: "var(--text-muted)", fontSize: "11px", cursor: "pointer" }}
                >
                  Q2
                </button>
                <button
                  type="button"
                  onClick={() => setQuarterPreset(3)}
                  style={{ padding: "3px 8px", borderRadius: "5px", background: "var(--surface-hover)", border: "1px solid var(--border-light)", color: "var(--text-muted)", fontSize: "11px", cursor: "pointer" }}
                >
                  Q3
                </button>
                <button
                  type="button"
                  onClick={() => setQuarterPreset(4)}
                  style={{ padding: "3px 8px", borderRadius: "5px", background: "var(--surface-hover)", border: "1px solid var(--border-light)", color: "var(--text-muted)", fontSize: "11px", cursor: "pointer" }}
                >
                  Q4
                </button>
                <button
                  type="button"
                  onClick={setYTDPreset}
                  style={{ padding: "3px 8px", borderRadius: "5px", background: "rgba(37, 99, 235, 0.1)", border: "1px solid rgba(37, 99, 235, 0.3)", color: "var(--primary)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                >
                  YTD
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.25)", color: "#f87171", fontSize: "13px" }}>
          ⚠️ {error}
        </div>
      )}

      {/* ====================================================================
          MINIMALIST EXECUTIVE KPI CARDS (HR TAB DESIGN)
          ==================================================================== */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
        {/* Gross Revenue */}
        <div className="glass-card" style={{ padding: "16px 20px", borderRadius: "14px", border: "1px solid var(--border-main)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
              Gross Revenue
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#10b981" }}>payments</span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>
            {isLoading ? "···" : formatCurrency(summary.totalIncome, currency)}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Collected: <span style={{ color: "var(--text-main)", fontWeight: 500 }}>{formatCurrency(summary.totalIncomeReceived, currency)}</span>
            {summary.accountsReceivable > 0 && (
              <> • Due: <span style={{ color: "#f59e0b" }}>{formatCurrency(summary.accountsReceivable, currency)}</span></>
            )}
          </div>
        </div>

        {/* Total Expenses */}
        <div className="glass-card" style={{ padding: "16px 20px", borderRadius: "14px", border: "1px solid var(--border-main)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
              Total Expenses
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#ef4444" }}>trending_down</span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>
            {isLoading ? "···" : formatCurrency(summary.totalAllExpenses, currency)}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Direct: <span style={{ color: "var(--text-main)", fontWeight: 500 }}>{formatCurrency(summary.totalDirectExpense, currency)}</span> • Payroll: <span style={{ color: "var(--text-main)", fontWeight: 500 }}>{formatCurrency(summary.totalPayroll, currency)}</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="glass-card" style={{ padding: "16px 20px", borderRadius: "14px", border: "1px solid var(--border-main)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
              Net Operating Profit
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: "18px", color: summary.netProfit >= 0 ? "#10b981" : "#ef4444" }}>
              {summary.netProfit >= 0 ? "trending_up" : "error"}
            </span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: summary.netProfit >= 0 ? "var(--text-main)" : "#ef4444", marginBottom: "4px" }}>
            {isLoading ? "···" : formatCurrency(summary.netProfit, currency)}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Margin: <span style={{ color: summary.netProfit >= 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>{summary.profitMargin}%</span> • Status: <span style={{ color: summary.netProfit >= 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>{summary.netProfit >= 0 ? "Profitable" : "Deficit"}</span>
          </div>
        </div>

        {/* Cash Flow */}
        <div className="glass-card" style={{ padding: "16px 20px", borderRadius: "14px", border: "1px solid var(--border-main)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
              Net Cash Flow
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#818cf8" }}>account_balance</span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>
            {isLoading ? "···" : formatCurrency(summary.netCashFlow, currency)}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Cash In: <span style={{ color: "var(--text-main)", fontWeight: 500 }}>{formatCurrency(summary.totalCashIn, currency)}</span> • Out: <span style={{ color: "var(--text-main)", fontWeight: 500 }}>{formatCurrency(summary.totalCashOut, currency)}</span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          MINIMALIST CATEGORY BREAKDOWNS (2 COLUMNS)
          ==================================================================== */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "16px" }}>
        {/* Revenue Streams */}
        <div className="glass-card" style={{ padding: "20px", borderRadius: "14px", border: "1px solid var(--border-main)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "var(--text-main)" }}>
              Revenue Streams
            </h3>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {reportData?.incomeByCategory?.length || 0} Categories
            </span>
          </div>

          {(reportData?.incomeByCategory || []).length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: "12px" }}>
              No income entries recorded for this period.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {reportData.incomeByCategory.map((item: any, idx: number) => (
                <div key={idx}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px" }}>
                    <span style={{ color: "var(--text-main)", fontWeight: 500 }}>{item.category}</span>
                    <span style={{ color: "var(--text-main)", fontWeight: 600 }}>
                      {formatCurrency(item.total, currency)} <span style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 400 }}>({item.percentage}%)</span>
                    </span>
                  </div>
                  <div style={{ width: "100%", height: "4px", background: "var(--surface-hover)", borderRadius: "2px", overflow: "hidden" }}>
                    <div 
                      style={{ 
                        width: `${Math.min(100, parseFloat(item.percentage))}%`, 
                        height: "100%", 
                        background: "var(--primary)",
                        borderRadius: "2px"
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expense Outflows */}
        <div className="glass-card" style={{ padding: "20px", borderRadius: "14px", border: "1px solid var(--border-main)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "var(--text-main)" }}>
              Expense Outflows
            </h3>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {reportData?.expensesByCategory?.length || 0} Categories
            </span>
          </div>

          {(reportData?.expensesByCategory || []).length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: "12px" }}>
              No expenses recorded for this period.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {reportData.expensesByCategory.map((item: any, idx: number) => (
                <div key={idx}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px" }}>
                    <span style={{ color: "var(--text-main)", fontWeight: 500 }}>{item.category}</span>
                    <span style={{ color: "var(--text-main)", fontWeight: 600 }}>
                      {formatCurrency(item.total, currency)} <span style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 400 }}>({item.percentage}%)</span>
                    </span>
                  </div>
                  <div style={{ width: "100%", height: "4px", background: "var(--surface-hover)", borderRadius: "2px", overflow: "hidden" }}>
                    <div 
                      style={{ 
                        width: `${Math.min(100, parseFloat(item.percentage))}%`, 
                        height: "100%", 
                        background: "#ef4444",
                        borderRadius: "2px"
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
          MINIMALIST TRANSACTION LEDGER (MATCHING HR TABLE STYLE)
          ==================================================================== */}
      <div className="glass-card" style={{ padding: "20px", borderRadius: "14px", border: "1px solid var(--border-main)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "var(--text-main)" }}>
              Ledger Transactions
            </h3>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {filteredTransactions.length} recorded items in this timeframe
            </span>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            {/* Search Input */}
            <div style={{ position: "relative" }}>
              <span className="material-symbols-outlined" style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "16px" }}>search</span>
              <input
                type="text"
                placeholder="Search ledger..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: "6px 10px 6px 30px", borderRadius: "6px", background: "var(--surface-main)", border: "1px solid var(--border-main)", color: "var(--text-main)", fontSize: "12px", width: "180px" }}
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ padding: "6px 10px", borderRadius: "6px", background: "var(--surface-main)", border: "1px solid var(--border-main)", color: "var(--text-main)", fontSize: "12px", fontWeight: 500 }}
            >
              <option value="ALL">All Types</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expenses</option>
              <option value="PAYROLL">Payroll</option>
              <option value="SETTLEMENT">Settlements</option>
              <option value="ADVANCE">Advances</option>
            </select>
          </div>
        </div>

        {/* Minimalist Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-main)", textAlign: "left", color: "var(--text-muted)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <th style={{ padding: "10px 8px" }}>Date</th>
                <th style={{ padding: "10px 8px" }}>Type</th>
                <th style={{ padding: "10px 8px" }}>Category</th>
                <th style={{ padding: "10px 8px" }}>Details / Payee</th>
                <th style={{ padding: "10px 8px" }}>Method</th>
                <th style={{ padding: "10px 8px", textAlign: "right" }}>Amount</th>
                <th style={{ padding: "10px 8px", textAlign: "center" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: "13px" }}>
                    No transactions found for this period.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx: any, idx: number) => {
                  const isIncome = tx.type === "INCOME";
                  return (
                    <tr 
                      key={tx.id || idx}
                      style={{ 
                        borderBottom: "1px solid var(--border-light)"
                      }}
                    >
                      <td style={{ padding: "10px 8px", color: "var(--text-muted)", fontSize: "12px", whiteSpace: "nowrap" }}>
                        {new Date(tx.date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        <span style={{
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontWeight: 600,
                          background: isIncome ? "rgba(16, 185, 129, 0.12)" : tx.type === "PAYROLL" ? "rgba(99, 102, 241, 0.12)" : "rgba(239, 68, 68, 0.12)",
                          color: isIncome ? "#10b981" : tx.type === "PAYROLL" ? "#818cf8" : "#ef4444"
                        }}>
                          {tx.type}
                        </span>
                      </td>
                      <td style={{ padding: "10px 8px", fontWeight: 500, color: "var(--text-main)" }}>
                        {tx.category}
                      </td>
                      <td style={{ padding: "10px 8px", color: "var(--text-secondary)" }}>
                        {tx.description}
                        {tx.reference && (
                          <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)" }}>
                            Ref: {tx.reference}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "10px 8px", color: "var(--text-muted)", fontSize: "12px" }}>
                        {tx.paymentMethod}
                      </td>
                      <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 600, color: isIncome ? "#10b981" : "#ef4444" }}>
                        {isIncome ? "+" : "-"}{formatCurrency(tx.amount, currency)}
                      </td>
                      <td style={{ padding: "10px 8px", textAlign: "center" }}>
                        <span style={{
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontWeight: 500,
                          background: "var(--surface-hover)",
                          color: "var(--text-muted)"
                        }}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
