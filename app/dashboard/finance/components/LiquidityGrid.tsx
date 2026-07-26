"use client";

import React from "react";

const formatCurrency = (val: number | string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val || 0));
};

export function LiquidityGrid({ data }: { data: any }) {
  if (!data || !data.kpis) return null;
  const { kpis } = data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* Cash In Hand */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Cash In Hand</span>
          <div className="w-8 h-8 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-lg">payments</span>
          </div>
        </div>
        <span className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(kpis.cash)}</span>
        <div className="text-xs text-slate-500 mt-2">Physical Drawer Balance</div>
      </div>

      {/* Bank Balance */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Bank Balance</span>
          <div className="w-8 h-8 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-lg">account_balance</span>
          </div>
        </div>
        <span className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(kpis.bank)}</span>
        <div className="text-xs text-slate-500 mt-2">All Bank Accounts</div>
      </div>

      {/* Mobile Banking (Mock mapped to bank for now per UI plan) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Mobile Banking</span>
          <div className="w-8 h-8 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-lg">phone_iphone</span>
          </div>
        </div>
        <span className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(0)}</span>
        <div className="text-xs text-slate-500 mt-2">bKash, Nagad, etc.</div>
      </div>

      {/* Reserve Balance */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Reserve Balance</span>
          <div className="w-8 h-8 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-lg">savings</span>
          </div>
        </div>
        <span className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(kpis.reserve)}</span>
        <div className="text-xs text-slate-500 mt-2">Locked Capital Reserve</div>
      </div>

    </div>
  );
}
