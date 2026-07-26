"use client";

import React from "react";
import Link from "next/link";

export function SalesPipelinePreview({ metrics, isLoading }: { metrics: any, isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm h-full animate-pulse">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  const pipeline = [
    { stage: "New", count: metrics?.newLeads || 0, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    { stage: "Contacted", count: 2, color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" }, // Mock intermediate stage
    { stage: "Qualified", count: metrics?.qualifiedLeads || 0, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
    { stage: "Proposal", count: 1, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" }, // Mock intermediate stage
    { stage: "Negotiation", count: 0, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" }, // Mock intermediate stage
    { stage: "Won", count: metrics?.wonLeads || 0, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  ];

  const total = pipeline.reduce((acc, curr) => acc + curr.count, 0) || 1; // Prevent div by 0

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm h-full flex flex-col">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-500">filter_alt</span>
          Sales Pipeline
        </h2>
        <Link href="/dashboard/crm/opportunities" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
          View Board &rarr;
        </Link>
      </div>
      
      <div className="p-5 flex-1 flex flex-col justify-center gap-3">
        {pipeline.map((stage, idx) => {
          const percentage = Math.max(5, (stage.count / total) * 100);
          return (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-24 text-sm font-medium text-slate-600 dark:text-slate-400 text-right">
                {stage.stage}
              </div>
              <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-800 rounded-r overflow-hidden flex items-center">
                <div 
                  className={`h-full ${stage.color} flex items-center justify-end pr-2 transition-all duration-500`} 
                  style={{ width: `${percentage}%` }}
                >
                  <span className="font-bold text-xs">{stage.count > 0 ? stage.count : ''}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
