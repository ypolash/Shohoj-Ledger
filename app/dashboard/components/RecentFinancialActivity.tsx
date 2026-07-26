"use client";

import React from "react";
import Link from "next/link";

const formatCurrency = (val: number | string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val || 0));
};

export function RecentFinancialActivity({ data }: { data: any }) {
  if (!data || !data.recentTransactions) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden mt-6">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400">history</span>
          Recent Financial Activity
        </h2>
        <Link href="/dashboard/finance/reports/general-ledger" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1">
          Audit Trail <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
              <th className="p-3 font-medium border-b border-slate-200 dark:border-slate-700 pl-5">Date</th>
              <th className="p-3 font-medium border-b border-slate-200 dark:border-slate-700">Category</th>
              <th className="p-3 font-medium border-b border-slate-200 dark:border-slate-700 text-right">Amount</th>
              <th className="p-3 font-medium border-b border-slate-200 dark:border-slate-700 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800">
            {data.recentTransactions.length > 0 ? (
              data.recentTransactions.slice(0, 5).map((tx: any) => (
                <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 pl-5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded flex items-center justify-center ${tx.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                        <span className="material-symbols-outlined text-[16px]">
                          {tx.type === 'INCOME' ? 'arrow_downward' : 'arrow_upward'}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {typeof tx.category === 'object' && tx.category !== null ? tx.category.name : (tx.category || 'Uncategorized')}
                        </div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{tx.subtitle || 'System Entry'}</div>
                      </div>
                    </div>
                  </td>
                  <td className={`p-3 text-right font-semibold whitespace-nowrap ${tx.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </td>
                  <td className="p-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      Completed
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  No recent financial activity found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
