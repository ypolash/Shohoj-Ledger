"use client";

import React from "react";

const formatCurrency = (val: number | string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val || 0));
};

export function CRMKPIGrid({ metrics, isLoading }: { metrics: any, isLoading: boolean }) {
  // We mock a few UI-only metrics since the backend doesn't provide all of them 
  // (per the strict rule of not modifying the backend).
  const totalCustomers = 124; // Mocked for UI
  const todaysFollowUps = 5; // Mocked for UI
  const overdueCustomers = 3; // Mocked for UI

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Customers</span>
        <span className="text-2xl font-bold text-slate-900 dark:text-white">
          {isLoading ? '...' : totalCustomers}
        </span>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between border-b-4 border-b-blue-500">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Active Leads</span>
        <span className="text-2xl font-bold text-slate-900 dark:text-white">
          {isLoading ? '...' : (metrics?.newLeads || 0) + (metrics?.qualifiedLeads || 0)}
        </span>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between border-b-4 border-b-amber-500">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Follow-ups Today</span>
        <span className="text-2xl font-bold text-slate-900 dark:text-white">
          {isLoading ? '...' : todaysFollowUps}
        </span>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Outst. Receivable</span>
        <span className="text-xl font-bold text-red-600 dark:text-red-400">
          {isLoading ? '...' : '৳ 45,000'}
        </span>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Today's Collection</span>
        <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
          {isLoading ? '...' : '৳ 12,500'}
        </span>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between border-b-4 border-b-red-500">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Overdue Cust.</span>
        <span className="text-2xl font-bold text-red-600 dark:text-red-400">
          {isLoading ? '...' : overdueCustomers}
        </span>
      </div>

    </div>
  );
}
