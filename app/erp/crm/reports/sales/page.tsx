"use client";

import React from 'react';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

// Modular Components
import { RevenueChart } from "../components/RevenueChart";
import { ConversionChart } from "../components/ConversionChart";
import { SalesFunnelChart } from "../components/SalesFunnelChart";
import { ReportFilters } from "../components/ReportFilters";
import { DateRangePicker } from "../components/DateRangePicker";
import { ExportToolbar } from "../components/ExportToolbar";

export default function CRMSalesAnalyticsPage() {
  return (
    <PageContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <PageHeader 
          title="Sales Analytics" 
          description="Detailed analysis of win rates, funnel conversions, and revenue."
        />
        <div style={{ display: 'flex', gap: '12px' }}>
          <DateRangePicker />
          <ExportToolbar />
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <ReportFilters />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <RevenueChart />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div>
            <SalesFunnelChart />
          </div>
          <div>
            <ConversionChart />
          </div>
        </div>

      </div>
    </PageContainer>
  );
}
