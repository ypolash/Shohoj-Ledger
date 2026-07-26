"use client";

import React from "react";

const formatCurrency = (val: number | string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val || 0));
};

export function TodaysMovementBar({ data }: { data: any }) {
  if (!data || !data.kpis) return null;

  // As the backend API provides lifetime aggregates on the dashboard endpoint,
  // we render the aggregate movement, but style it for immediate operational insight.
  const income = data.kpis.revenue || 0;
  const expense = data.kpis.expenses || 0;
  const net = income - expense;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 mb-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex-1 flex flex-col md:flex-row items-center gap-6 w-full">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider whitespace-nowrap">
          Movement Ledger
        </h2>
        
        <div className="flex-1 w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg p-4 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase font-semibold">Income Recorded</span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(income)}</span>
          </div>
          
          <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-4 hidden sm:block"></div>
          
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase font-semibold">Expense Recorded</span>
            <span className="text-xl font-bold text-red-600 dark:text-red-400">-{formatCurrency(expense)}</span>
          </div>

          <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-4 hidden sm:block"></div>
          
          <div className="flex flex-col text-right">
            <span className="text-xs text-slate-500 uppercase font-semibold">Net Movement</span>
            <span className={`text-xl font-bold ${net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {net >= 0 ? '+' : ''}{formatCurrency(net)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
