"use client";

import React from 'react';
import styles from '../../crm.module.css';

// Modular Components
import { ActivityFeed } from "../components/ActivityFeed";
import { TaskSchedule } from "../components/TaskSchedule";
import { MeetingSchedule } from "../components/MeetingSchedule";
import { DateRangePicker } from "../components/DateRangePicker";

export default function CRMActivitiesPage() {
  return (
    <div className={styles.container}>
      {/* 1. Executive Minimalist Header */}
      <header className={styles.headerCard}>
        <div className={styles.headerTitleGroup}>
          <h1 className={styles.pageTitle}>
            CRM Activity Center
            <span className={styles.titleBadge}>Interactions</span>
          </h1>
        </div>

        <div className={styles.headerActions}>
          <DateRangePicker />
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div style={{ gridColumn: 'span 2' }}>
          <ActivityFeed />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <TaskSchedule />
          <MeetingSchedule />
        </div>
      </div>
    </div>
  );
}
