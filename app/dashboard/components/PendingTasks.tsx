"use client";

import React from "react";
import Link from "next/link";

export function PendingTasks() {
  const tasks = [
    { title: "Pending Approvals", count: 3, icon: "fact_check", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20", href: "/dashboard/staff-management/leave" },
    { title: "Due Invoices", count: 5, icon: "receipt", color: "text-red-600 bg-red-50 dark:bg-red-900/20", href: "/dashboard/finance/income" },
    { title: "Unsettled Advances", count: 2, icon: "account_balance_wallet", color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20", href: "/dashboard/finance/settlements" },
    { title: "Low Stock Alerts", count: 1, icon: "inventory", color: "text-rose-600 bg-rose-50 dark:bg-rose-900/20", href: "/dashboard/inventory/stock" },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-red-500">notification_important</span>
          Today's Work
        </h2>
        <span className="text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md">Action Required</span>
      </div>
      <div className="flex flex-col gap-3">
        {tasks.map((task, idx) => (
          <Link href={task.href} key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded flex items-center justify-center ${task.color}`}>
                <span className="material-symbols-outlined text-lg">{task.icon}</span>
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{task.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center">
                {task.count}
              </span>
              <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">chevron_right</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
