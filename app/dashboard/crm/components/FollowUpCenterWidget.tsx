"use client";

import React from "react";
import Link from "next/link";

export function FollowUpCenterWidget() {
  
  const followUps = [
    { id: 1, type: 'call', name: 'Rahim Trading', time: 'Overdue', status: 'overdue' },
    { id: 2, type: 'meeting', name: 'Karim Enterprise', time: '2:00 PM', status: 'today' },
    { id: 3, type: 'call', name: 'Global Ltd', time: '4:30 PM', status: 'today' },
    { id: 4, type: 'meeting', name: 'Desh Builders', time: 'Tomorrow', status: 'upcoming' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm h-full flex flex-col">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-500">schedule</span>
          Follow-up Center
        </h2>
        <Link href="/dashboard/crm/activities" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
          View All &rarr;
        </Link>
      </div>
      
      <div className="p-5 flex-1 flex flex-col gap-3">
        {followUps.map(item => (
          <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                item.type === 'call' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                : 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
              }`}>
                <span className="material-symbols-outlined text-[20px]">
                  {item.type === 'call' ? 'call' : 'groups'}
                </span>
              </div>
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</div>
                <div className={`text-xs font-medium flex items-center gap-1 ${
                  item.status === 'overdue' ? 'text-red-600 dark:text-red-400' : 'text-slate-500'
                }`}>
                  <span className="material-symbols-outlined text-[12px]">
                    {item.status === 'overdue' ? 'warning' : 'schedule'}
                  </span>
                  {item.time}
                </div>
              </div>
            </div>
            
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-900/50">
                <span className="material-symbols-outlined text-[16px]">check</span>
              </button>
            </div>
          </div>
        ))}

        {followUps.length === 0 && (
          <div className="text-center text-slate-500 my-auto py-8">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">done_all</span>
            <p>You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}
