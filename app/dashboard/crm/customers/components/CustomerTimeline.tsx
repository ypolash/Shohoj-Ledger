"use client";

import React from 'react';

export function CustomerTimeline() {
  const activities = [
    { id: 1, type: 'PAYMENT', title: 'Payment Received', date: new Date().toISOString(), value: 'BDT 25,000', detail: 'Cash Payment' },
    { id: 2, type: 'INVOICE', title: 'Invoice #INV-2026-001 Generated', date: new Date(Date.now() - 3600000).toISOString(), value: 'BDT 50,000' },
    { id: 3, type: 'MEETING', title: 'Product Demo', date: new Date(Date.now() - 86400000).toISOString(), detail: 'On-site meeting at their office' },
    { id: 4, type: 'CALL', title: 'Initial Follow-up', date: new Date(Date.now() - 86400000 * 2).toISOString(), detail: 'Discussed Q3 requirements' },
    { id: 5, type: 'CREATED', title: 'Customer Registered', date: new Date(Date.now() - 86400000 * 5).toISOString() },
  ];

  return (
    <div className="flex flex-col gap-5 py-4">
      {activities.map((act, index) => {
        let icon = 'history';
        let colorClass = 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700';

        if (act.type === 'CREATED') { icon = 'person_add'; colorClass = 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800/50 dark:text-emerald-400'; }
        if (act.type === 'INVOICE') { icon = 'receipt_long'; colorClass = 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800/50 dark:text-amber-400'; }
        if (act.type === 'PAYMENT') { icon = 'payments'; colorClass = 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-400'; }
        if (act.type === 'CALL') { icon = 'call'; colorClass = 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800/50 dark:text-indigo-400'; }
        if (act.type === 'MEETING') { icon = 'event'; colorClass = 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800/50 dark:text-purple-400'; }

        return (
          <div key={act.id} className="flex gap-4 relative group">
            {index !== activities.length - 1 && (
              <div className="absolute left-[19px] top-10 bottom-[-20px] w-[2px] bg-slate-200 dark:bg-slate-700 z-0" />
            )}
            
            <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 border shadow-sm ${colorClass}`}>
              <span className="material-symbols-outlined text-[18px]">
                {icon}
              </span>
            </div>
            
            <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{act.title}</span>
                <span className="text-xs font-medium text-slate-400">{new Date(act.date).toLocaleDateString()} {new Date(act.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              {act.detail && <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{act.detail}</div>}
              {act.value && <div className={`mt-2 text-sm font-bold ${act.type === 'PAYMENT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>{act.type === 'PAYMENT' ? '+' : ''}{act.value}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
