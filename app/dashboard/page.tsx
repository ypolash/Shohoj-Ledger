"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowDownRight, ArrowUpRight, DollarSign, Wallet, PiggyBank, CalendarIcon, Users, CheckCircle, Activity, ChevronRight, MoreHorizontal } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler
);

type TransactionData = {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: { name: string } | string | null;
  amount: number;
  date: string;
  subtitle: string | null;
};

type MonthlyData = {
  label: string;
  revenue: number;
  expense: number;
  netCash: number;
};

type OverviewData = {
  reserveBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  outstandingLoans: number;
  activeAdvances: number;
  monthlyData: MonthlyData[];
  recentTransactions: TransactionData[];
};

export default function DashboardIndex() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await fetch("/api/overview");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val));
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#0f172a',
        bodyColor: '#334155',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        boxPadding: 4,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 12 } }
      },
      y: {
        grid: { color: '#f1f5f9', borderDash: [4, 4] },
        ticks: { color: '#64748b', font: { size: 12 }, maxTicksLimit: 5 },
        border: { display: false }
      }
    }
  };

  const revExpData = {
    labels: data?.monthlyData.map(d => d.label) || [],
    datasets: [
      {
        label: 'Revenue',
        data: data?.monthlyData.map(d => d.revenue) || [],
        backgroundColor: '#5B7CFA',
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
      {
        label: 'Expenses',
        data: data?.monthlyData.map(d => d.expense) || [],
        backgroundColor: '#f87171',
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      }
    ]
  };

  const cashFlowData = {
    labels: data?.monthlyData.map(d => d.label) || [],
    datasets: [
      {
        label: 'Net Cash',
        data: data?.monthlyData.map(d => d.netCash) || [],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Loading metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Top Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Income Card */}
        <Card className="border-none shadow-sm bg-white overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Income</p>
                <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(data.totalIncome)}</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-emerald-500 flex items-center font-medium">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                12%
              </span>
              <span className="text-slate-400 ml-2">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Card */}
        <Card className="border-none shadow-sm bg-white overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Expenses</p>
                <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(data.totalExpenses)}</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-red-500 flex items-center font-medium">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                8%
              </span>
              <span className="text-slate-400 ml-2">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Reserve Balance Card */}
        <Card className="border-none shadow-sm bg-white overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Reserve Balance</p>
                <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(data.reserveBalance)}</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <PiggyBank className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-emerald-500 flex items-center font-medium">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                Safe
              </span>
              <span className="text-slate-400 ml-2">Active balance</span>
            </div>
          </CardContent>
        </Card>

        {/* Due Balance Card */}
        <Card className="border-none shadow-sm bg-white overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Due/Advances</p>
                <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(data.activeAdvances)}</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CalendarIcon className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-amber-500 flex items-center font-medium">
                Pending
              </span>
              <span className="text-slate-400 ml-2">To be recovered</span>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Second Row: Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Net Cash Flow", value: formatCurrency(data.netCashFlow), icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50" },
          { title: "Active Loans", value: formatCurrency(data.outstandingLoans), icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50" },
          { title: "Staff Present", value: "8/10", icon: Users, color: "text-cyan-600", bg: "bg-cyan-50" },
          { title: "Pending Tasks", value: "14", icon: CheckCircle, color: "text-orange-600", bg: "bg-orange-50" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white hover:shadow-md transition-shadow cursor-default">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">{stat.title}</p>
                <h4 className="text-lg font-bold text-slate-800">{stat.value}</h4>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Income vs Expense Bar Chart */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-2 border-b border-slate-100 mb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-800">Income vs Expense</CardTitle>
              <CardDescription className="text-xs text-slate-500">Monthly breakdown for the year</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs font-medium border-slate-200">
              This Year
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <Bar data={revExpData} options={chartOptions as any} />
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow Line Chart */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-2 border-b border-slate-100 mb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-800">Cash Flow</CardTitle>
              <CardDescription className="text-xs text-slate-500">Net positive balance growth</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs font-medium border-slate-200">
              6 Months
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <Line data={cashFlowData} options={chartOptions as any} />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Recent Transactions Table */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-800">Recent Transactions</CardTitle>
              <CardDescription className="text-sm text-slate-500 mt-1">Latest financial activities across the company.</CardDescription>
            </div>
            <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-sm font-medium" asChild>
              <Link href="/dashboard/income">View All <ChevronRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>
        </CardHeader>
        <div className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className="text-xs uppercase text-slate-500 font-semibold tracking-wider h-10 px-6">Transaction</TableHead>
                <TableHead className="text-xs uppercase text-slate-500 font-semibold tracking-wider h-10">Date</TableHead>
                <TableHead className="text-xs uppercase text-slate-500 font-semibold tracking-wider h-10">Status</TableHead>
                <TableHead className="text-xs uppercase text-slate-500 font-semibold tracking-wider h-10 text-right px-6">Amount</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentTransactions.length > 0 ? (
                data.recentTransactions.map((tx) => (
                  <TableRow key={tx.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors group">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'INCOME' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                          {tx.type === 'INCOME' ? (
                            <ArrowDownRight className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <ArrowUpRight className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {typeof tx.category === 'object' && tx.category !== null ? tx.category.name : (tx.category || 'Uncategorized')}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{tx.subtitle || 'No description'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium rounded-full px-2.5 shadow-none">
                        Completed
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-semibold px-6 ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    No recent transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

    </div>
  );
}
