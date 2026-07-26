"use client";

import React, { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";

import { GlobalSearchInput } from "./components/GlobalSearchInput";
import { StickyCRMQuickActionBar } from "./components/StickyCRMQuickActionBar";
import { CRMKPIGrid } from "./components/CRMKPIGrid";
import { SalesPipelinePreview } from "./components/SalesPipelinePreview";
import { FollowUpCenterWidget } from "./components/FollowUpCenterWidget";
import { FastLeadDrawer } from "./components/FastLeadDrawer";
import { CRMFAB } from "./components/CRMFAB";

export default function CRMDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leadDrawerOpen, setLeadDrawerOpen] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/crm/dashboard`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      {/* 1. Global Search */}
      <GlobalSearchInput />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400">group</span>
          CRM & Sales
        </h1>
        <p className="text-sm text-slate-500 mt-1">High-velocity lead and customer management.</p>
      </div>

      {/* 2. Sticky Quick Action Bar */}
      <StickyCRMQuickActionBar onAddLead={() => setLeadDrawerOpen(true)} />

      {/* 3. KPI Grid */}
      <CRMKPIGrid metrics={data?.metrics} isLoading={isLoading} />

      {/* 4. Main Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SalesPipelinePreview metrics={data?.metrics} isLoading={isLoading} />
        <FollowUpCenterWidget />
      </div>

      {/* 5. Placeholder for Recent Customers / Timeline Feed */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 text-center text-slate-500">
        <span className="material-symbols-outlined text-4xl mb-3 opacity-50">recent_actors</span>
        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-1">Recent Activity</h3>
        <p className="text-sm">Customer activity feed will appear here as transactions occur.</p>
      </div>

      <FastLeadDrawer 
        isOpen={leadDrawerOpen} 
        onClose={() => setLeadDrawerOpen(false)}
        onSuccess={() => {
          setLeadDrawerOpen(false);
          fetchStats(); // Refresh dashboard stats
        }}
      />

      <CRMFAB onAddLead={() => setLeadDrawerOpen(true)} />
    </PageContainer>
  );
}
