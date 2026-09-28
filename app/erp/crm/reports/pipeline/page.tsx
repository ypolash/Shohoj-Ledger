"use client";

import React from 'react';
import styles from '../../crm.module.css';

// Modular Components
import { PipelineChart } from "../components/PipelineChart";
import { ForecastChart } from "../components/ForecastChart";
import { CRMReportCards } from "../components/CRMReportCards";
import { ReportFilters } from "../components/ReportFilters";
import { DateRangePicker } from "../components/DateRangePicker";

export default function CRMPipelineAnalyticsPage() {
  const pipelineKPIs = [
    { title: 'Open Deals', value: '142', trend: '+5', trendUp: true, icon: 'folder_open', color: 'var(--primary)' },
    { title: 'Pipeline Value', value: '৳ 45.2M', trend: '-2%', trendUp: false, icon: 'monetization_on', color: 'var(--info)' },
    { title: 'Weighted Value', value: '৳ 12.8M', trend: '+4%', trendUp: true, icon: 'balance', color: 'var(--success)' },
    { title: 'Avg Deal Size', value: '৳ 318K', trend: '+1%', trendUp: true, icon: 'aspect_ratio', color: 'var(--warning)' }
  ];

  return (
    <div className={styles.container}>
      {/* 1. Executive Minimalist Header */}
      <header className={styles.headerCard}>
        <div className={styles.headerTitleGroup}>
          <h1 className={styles.pageTitle}>
            Pipeline &amp; Forecast Analytics
            <span className={styles.titleBadge}>Projections</span>
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
        <CRMReportCards kpis={pipelineKPIs} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div>
            <PipelineChart />
          </div>
          <div>
            <ForecastChart />
          </div>
        </div>
      </div>
    </div>
  );
}
