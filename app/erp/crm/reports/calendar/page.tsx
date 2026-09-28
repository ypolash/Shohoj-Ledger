"use client";

import React from 'react';
import styles from '../../crm.module.css';

// Modular Components
import { CalendarView } from "../components/CalendarView";
import { MeetingSchedule } from "../components/MeetingSchedule";
import { ReminderPanel } from "../components/ReminderPanel";

export default function CRMCalendarPage() {
  return (
    <div className={styles.container}>
      {/* 1. Executive Minimalist Header */}
      <header className={styles.headerCard}>
        <div className={styles.headerTitleGroup}>
          <h1 className={styles.pageTitle}>
            CRM Calendar
            <span className={styles.titleBadge}>Schedule</span>
          </h1>
        </div>

        <div className={styles.headerActions}>
          <button 
            className={`${styles.headerIconBtn} ${styles.headerIconBtnPrimary}`}
            title="New Calendar Event"
            aria-label="New Calendar Event"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div style={{ gridColumn: 'span 2' }}>
          <CalendarView />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <ReminderPanel />
          <MeetingSchedule />
        </div>
      </div>
    </div>
  );
}
