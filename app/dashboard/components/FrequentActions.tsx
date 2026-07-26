"use client";

import React from "react";
import Link from "next/link";

const actions = [
  { label: "New Invoice", icon: "receipt_long", href: "/dashboard/finance/income/create", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" },
  { label: "Record Payment", icon: "payments", href: "/dashboard/finance/income/create", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
  { label: "Add Expense", icon: "money_off", href: "/dashboard/finance/expenses/create", color: "text-red-600 bg-red-50 dark:bg-red-900/20" },
  { label: "Add Lead", icon: "person_add", href: "/dashboard/crm/leads/create", color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20" },
  { label: "Settle Advance", icon: "handshake", href: "/dashboard/finance/settlements", color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20" },
  { label: "Stock In", icon: "inventory_2", href: "/dashboard/inventory/goods-receipt", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" },
];

export function FrequentActions() {
  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">Frequent Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action, idx) => (
          <Link href={action.href} key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all group">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${action.color}`}>
              <span className="material-symbols-outlined text-2xl">{action.icon}</span>
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
