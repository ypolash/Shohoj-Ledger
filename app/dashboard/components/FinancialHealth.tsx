"use client";

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function FinancialHealth({ data }: { data: any }) {
  if (!data) return null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: '#94a3b8' }
      },
      y: {
        grid: { color: '#f1f5f9', borderDash: [4, 4] },
        ticks: { font: { size: 11 }, color: '#94a3b8', maxTicksLimit: 5 }
      }
    }
  };

  const cashFlowData = {
    labels: data.monthlyData?.map((d: any) => d.label) || [],
    datasets: [
      {
        label: 'Net Cash Flow',
        data: data.monthlyData?.map((d: any) => d.netCash) || [],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        borderWidth: 2,
      }
    ]
  };

  const profitMargin = ((data.totalIncome - data.totalExpenses) / (data.totalIncome || 1)) * 100;
  
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-500">ssid_chart</span>
          Financial Health
        </h2>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded text-xs font-semibold border border-emerald-100 dark:border-emerald-800/30">
            <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
            Margin: {profitMargin.toFixed(1)}%
          </div>
        </div>
      </div>
      
      <div className="flex-1 min-h-[220px] relative">
        <Line data={cashFlowData} options={chartOptions as any} />
      </div>
    </div>
  );
}
