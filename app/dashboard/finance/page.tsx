"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";

// Import new Finance V2 components
import { LiquidityGrid } from "./components/LiquidityGrid";
import { TodaysMovementBar } from "./components/TodaysMovementBar";
import { RecentFinanceTable } from "./components/RecentFinanceTable";
import { FastEntryDrawer } from "./components/FastEntryDrawer";

export default function FinanceDashboardPage() {
  const [financeData, setFinanceData] = useState<any>(null);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<"INCOME" | "EXPENSE">("EXPENSE");

  const fetchDashboardData = useCallback(async () => {
    try {
      const [financeRes, overviewRes] = await Promise.all([
        fetch("/api/finance/dashboard"),
        fetch("/api/overview") // used for recent transactions since finance API lacks it
      ]);
      const financeJson = await financeRes.json();
      const overviewJson = await overviewRes.json();
      setFinanceData(financeJson);
      setOverviewData(overviewJson);
    } catch (err) {
      console.error("Error fetching finance data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Keyboard shortcut listener for fast entry (Ctrl+E for Expense, Ctrl+I for Income)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        openDrawer("EXPENSE");
      }
      if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        openDrawer("INCOME");
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openDrawer = (type: "INCOME" | "EXPENSE") => {
    setDrawerType(type);
    setDrawerOpen(true);
  };

  const handleTransactionSuccess = () => {
    // Silently refresh data to update KPIs and recent table without full page reload
    fetchDashboardData();
  };

  if (loading || !financeData) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-slate-500 animate-pulse flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-4xl">hourglass_empty</span>
            <span>Calculating Ledger Balances...</span>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      
      {/* Header & Fast Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400">account_balance</span>
            Finance Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">Real-time liquidity and ledger movement.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => openDrawer("INCOME")}
            className="flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 px-4 py-2 rounded-lg font-semibold transition-colors border border-emerald-200 dark:border-emerald-800/50 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Record Income
            <span className="text-[10px] bg-emerald-200 dark:bg-emerald-800 px-1 rounded ml-1 hidden md:inline">Ctrl+I</span>
          </button>
          
          <button 
            onClick={() => openDrawer("EXPENSE")}
            className="flex items-center gap-2 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 px-4 py-2 rounded-lg font-semibold transition-colors border border-red-200 dark:border-red-800/50 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">remove</span>
            Record Expense
            <span className="text-[10px] bg-red-200 dark:bg-red-800 px-1 rounded ml-1 hidden md:inline">Ctrl+E</span>
          </button>
        </div>
      </div>

      {/* 1. Liquidity Grid */}
      <LiquidityGrid data={financeData} />

      {/* 2. Today's Movement */}
      <TodaysMovementBar data={financeData} />

      {/* 3. Recent Transactions Table */}
      <RecentFinanceTable transactions={overviewData?.recentTransactions || []} />

      {/* Fast Entry Sliding Drawer */}
      <FastEntryDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        type={drawerType}
        onSuccess={handleTransactionSuccess}
      />
      
    </PageContainer>
  );
}
