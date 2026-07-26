"use client";

import React from 'react';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

// Modular Components
import { SalesLeaderboard } from "../components/SalesLeaderboard";
import { PerformanceTable } from "../components/PerformanceTable";
import { ReportFilters } from "../components/ReportFilters";
import { DateRangePicker } from "../components/DateRangePicker";

export default function CRMPerformanceAnalyticsPage() {
  return (
    <PageContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <PageHeader 
          title="Team Performance" 
          description="Track salesperson metrics, activity volume, and leaderboards."
        />
        <DateRangePicker />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <ReportFilters />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div style={{ gridColumn: 'span 1' }}>
            <SalesLeaderboard />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <PerformanceTable />
          </div>
        </div>

      </div>
    </PageContainer>
  );
}
