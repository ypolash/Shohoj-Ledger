"use client";

import React, { useState } from "react";
import Link from "next/link";

export function CRMFAB({ onAddLead }: { onAddLead?: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 md:hidden">
      
      {/* Expanded Menu */}
      <div className={`flex flex-col gap-3 mb-4 transition-all duration-300 ${open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        
        <button 
          onClick={() => { setOpen(false); if(onAddLead) onAddLead(); }}
          className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 pr-4 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">person_add</span>
          </div>
          <span className="text-sm font-semibold">New Lead</span>
        </button>

        <Link href="/dashboard/crm/customers/new" onClick={() => setOpen(false)} className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 pr-4 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">domain_add</span>
          </div>
          <span className="text-sm font-semibold">New Customer</span>
        </Link>

        <Link href="/dashboard/finance/income" onClick={() => setOpen(false)} className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 pr-4 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
          </div>
          <span className="text-sm font-semibold">Create Invoice</span>
        </Link>

        <Link href="/dashboard/finance/income" onClick={() => setOpen(false)} className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 pr-4 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">payments</span>
          </div>
          <span className="text-sm font-semibold">Receive Payment</span>
        </Link>

      </div>

      {/* Main Toggle Button */}
      <button 
        onClick={() => setOpen(!open)}
        className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-indigo-700 transition-transform active:scale-95"
      >
        <span className="material-symbols-outlined text-3xl transition-transform duration-300" style={{ transform: open ? 'rotate(45deg)' : 'rotate(0)' }}>
          add
        </span>
      </button>

      {/* Backdrop */}
      {open && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[-1]" 
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
