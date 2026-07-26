"use client";

import React from "react";
import Link from "next/link";

export function StickyCRMQuickActionBar({
  onAddLead
}: {
  onAddLead?: () => void
}) {
  return (
    <div className="sticky top-[70px] z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-y border-slate-200 dark:border-slate-800 py-3 mb-6 shadow-sm -mx-4 px-4 md:-mx-8 md:px-8 flex items-center gap-3 overflow-x-auto hide-scrollbar">
      <div className="font-semibold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap mr-2">
        Quick Actions
      </div>
      
      <button 
        onClick={onAddLead}
        className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
      >
        <span className="material-symbols-outlined text-[18px]">person_add</span>
        Add Lead
      </button>

      <button className="flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap">
        <span className="material-symbols-outlined text-[18px]">domain_add</span>
        Add Customer
      </button>

      <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block"></div>

      <Link href="/dashboard/crm/quotations/new" className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap">
        <span className="material-symbols-outlined text-[18px]">request_quote</span>
        Quotation
      </Link>

      <Link href="/dashboard/finance/income" className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap">
        <span className="material-symbols-outlined text-[18px]">receipt_long</span>
        Invoice
      </Link>

      <Link href="/dashboard/finance/income" className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap">
        <span className="material-symbols-outlined text-[18px]">payments</span>
        Payment
      </Link>

      <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block"></div>

      <button className="flex items-center gap-2 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap">
        <span className="material-symbols-outlined text-[18px]">add_call</span>
        Log Call
      </button>
    </div>
  );
}
