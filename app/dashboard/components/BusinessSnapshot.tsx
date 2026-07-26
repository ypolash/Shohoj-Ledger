"use client";

import React from "react";

const formatCurrency = (val: number | string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val || 0));
};

export function BusinessSnapshot({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <span className="material-symbols-outlined">account_balance_wallet</span>
          </div>
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cash in Hand</span>
        </div>
        <span className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(data.reserveBalance)}</span>
        <span className="text-xs text-slate-500 mt-2">Available Liquidity</span>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <span className="material-symbols-outlined">payments</span>
          </div>
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total AR (Due)</span>
        </div>
        <span className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(data.activeAdvances)}</span>
        <span className="text-xs text-slate-500 mt-2">Money Owed to Us</span>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
            <span className="material-symbols-outlined">credit_card</span>
          </div>
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total AP (Owe)</span>
        </div>
        <span className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(data.outstandingLoans)}</span>
        <span className="text-xs text-slate-500 mt-2">Money We Owe</span>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <span className="material-symbols-outlined">monitoring</span>
          </div>
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Today's Move</span>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <span className="text-sm text-emerald-600 font-medium block">+{formatCurrency(data.totalIncome)}</span>
            <span className="text-sm text-red-600 font-medium block">-{formatCurrency(data.totalExpenses)}</span>
          </div>
          <span className={`text-lg font-bold ${data.netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {data.netCashFlow >= 0 ? '+' : ''}{formatCurrency(data.netCashFlow)}
          </span>
        </div>
      </div>
    </div>
  );
}
