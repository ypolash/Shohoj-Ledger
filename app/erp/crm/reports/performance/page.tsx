"use client";

import React from 'react';
import styles from '../../crm.module.css';

// Modular Components
import { SalesLeaderboard } from "../components/SalesLeaderboard";
import { PerformanceTable } from "../components/PerformanceTable";
import { ReportFilters } from "../components/ReportFilters";
import { DateRangePicker } from "../components/DateRangePicker";

export default function CRMPerformanceAnalyticsPage() {
  return (
    <div className={styles.container}>
      {/* 1. Executive Minimalist Header */}
      <header className={styles.headerCard}>
        <div className={styles.headerTitleGroup}>
          <h1 className={styles.pageTitle}>
            Team Performance Analytics
            <span className={styles.titleBadge}>Sales Leaderboard</span>
          </h1>
        </div>

        <div className={styles.headerActions}>
          <DateRangePicker />
        </div>
      </header>

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
    </div>
  );
}
