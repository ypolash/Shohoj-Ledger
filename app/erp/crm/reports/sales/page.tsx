"use client";

import React from 'react';
import styles from '../../crm.module.css';

// Modular Components
import { RevenueChart } from "../components/RevenueChart";
import { ConversionChart } from "../components/ConversionChart";
import { SalesFunnelChart } from "../components/SalesFunnelChart";
import { ReportFilters } from "../components/ReportFilters";
import { DateRangePicker } from "../components/DateRangePicker";
import { ExportToolbar } from "../components/ExportToolbar";

export default function CRMSalesAnalyticsPage() {
  return (
    <div className={styles.container}>
      {/* 1. Executive Minimalist Header */}
      <header className={styles.headerCard}>
        <div className={styles.headerTitleGroup}>
          <h1 className={styles.pageTitle}>
            Sales Analytics
            <span className={styles.titleBadge}>Revenue Trends</span>
          </h1>
        </div>

        <div className={styles.headerActions}>
          <DateRangePicker />
          <ExportToolbar />
        </div>
      </header>

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
    </div>
  );
}
