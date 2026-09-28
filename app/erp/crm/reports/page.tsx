"use client";

import React, { useState } from 'react';
import styles from '../crm.module.css';

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
    <div className={styles.container}>
      {/* 1. Executive Minimalist Header */}
      <header className={styles.headerCard}>
        <div className={styles.headerTitleGroup}>
          <h1 className={styles.pageTitle}>
            CRM Analytics &amp; Reports
            <span className={styles.titleBadge}>Live Analytics</span>
          </h1>
        </div>

        <div className={styles.headerActions}>
          <DateRangePicker />
        </div>
      </header>

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
    </div>
  );
}
