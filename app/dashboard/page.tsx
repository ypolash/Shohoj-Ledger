"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";

// Import new Accounting V2 widgets
import { BusinessSnapshot } from "./components/BusinessSnapshot";
import { FrequentActions } from "./components/FrequentActions";
import { PendingTasks } from "./components/PendingTasks";
import { FinancialHealth } from "./components/FinancialHealth";
import { RecentFinancialActivity } from "./components/RecentFinancialActivity";

type MonthlyData = {
  label: string;
  revenue: number;
  expense: number;
  netCash: number;
};

type OverviewData = {
  reserveBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  outstandingLoans: number;
  activeAdvances: number;
  monthlyData: MonthlyData[];
  recentTransactions: any[];
};

export default function DashboardIndex() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("Accountant");

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await fetch("/api/overview");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  const roles = ["Accountant", "Business Owner", "Admin", "Sales"];

  if (loading || !data) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-slate-500 animate-pulse flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-4xl">hourglass_empty</span>
            <span>Loading Financial Data...</span>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header & Role Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Daily Operations Command Center</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time accounting snapshot and pending actions.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="material-symbols-outlined text-slate-400">shield_person</span>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role:</label>
          <select 
            value={role} 
            onChange={(e) => setRole(e.target.value)}
            className="bg-transparent text-sm font-medium text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* 1. Business Snapshot */}
      {(role === "Accountant" || role === "Business Owner" || role === "Admin") && (
        <BusinessSnapshot data={data} />
      )}

      {/* 2. Frequent Actions */}
      <FrequentActions />

      {/* 3 & 4. Grid for Pending Tasks & Financial Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
        {/* Pending Tasks (Takes up 5 columns on large screens) */}
        <div className="lg:col-span-5 flex flex-col h-full">
          <PendingTasks />
        </div>
        
        {/* Financial Health (Takes up 7 columns on large screens) */}
        {(role === "Business Owner" || role === "Admin" || role === "Accountant") && (
          <div className="lg:col-span-7 flex flex-col h-full">
            <FinancialHealth data={data} />
          </div>
        )}
      </div>

      {/* 5. Recent Financial Activity (Audit Trail) */}
      {(role === "Accountant" || role === "Business Owner" || role === "Admin") && (
        <RecentFinancialActivity data={data} />
      )}
      
    </PageContainer>
  );
}
