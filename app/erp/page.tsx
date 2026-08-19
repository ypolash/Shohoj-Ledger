"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

// Import widgets
import { KPICards } from "./components/KPICards";
import { BusinessCharts } from "./components/BusinessCharts";
import { QuickActions } from "./components/QuickActions";
import { RecentActivity } from "./components/RecentActivity";


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
  recentTransactions: any[];
  totalEmployees?: number;
  attendanceToday?: number;
  inventoryValue?: number;
  activeProjects?: number;
  recentTasks?: any[];
  recentActivities?: any[];
  notifications?: any[];
  calendarEvents?: any[];
};

export default function DashboardIndex() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("Owner"); // Default to Owner

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

  const roles = [
    "Owner",
    "CEO",
    "Accountant",
    "HR",
    "Sales",
    "Inventory",
    "Project Manager"
  ];

  if (loading || !data) {
    return (
      <PageContainer>
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading dashboard...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <PageHeader 
          title={`Enterprise Dashboard (${role})`}
          description="A premium, structured overview tailored to your role."
        />
      </div>

      <QuickActions role={role} />

      <KPICards data={data} role={role} />

      <BusinessCharts data={data} role={role} />

      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '24px', 
        marginBottom: '24px',
        alignItems: 'stretch'
      }}>
        <RecentActivity role={role} data={data} />
      </div>

    </PageContainer>
  );
}
