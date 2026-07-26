"use client";

import React, { useState } from 'react';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

// Modular Components
import { CRMReportCards } from "./components/CRMReportCards";
import { SalesFunnelChart } from "./components/SalesFunnelChart";
import { RevenueChart } from "./components/RevenueChart";
import { ActivityTimeline } from "./components/ActivityTimeline";
import { TopCustomers } from "./components/TopCustomers";
import { ReminderPanel } from "./components/ReminderPanel";
import { DateRangePicker } from "./components/DateRangePicker";

export default function CRMReportsDashboardPage() {
  const [loading] = useState(false);

  return (
    <PageContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <PageHeader 
          title="CRM Dashboard" 
          description="Executive overview of pipeline, revenue, and activities."
        />
        <DateRangePicker />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* KPI Cards */}
        <CRMReportCards />

        {/* Top Visualizations */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <RevenueChart />
          </div>
          <div>
            <ReminderPanel />
          </div>
        </div>

        {/* Secondary Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div>
            <SalesFunnelChart />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <TopCustomers />
          </div>
        </div>

        {/* Bottom Row */}
        <div>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Recent Activities</h3>
          <ActivityTimeline />
        </div>

      </div>
    </PageContainer>
  );
}
