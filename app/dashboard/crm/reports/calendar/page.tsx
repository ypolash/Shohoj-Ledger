"use client";

import React from 'react';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

// Modular Components
import { CalendarView } from "../components/CalendarView";
import { MeetingSchedule } from "../components/MeetingSchedule";
import { ReminderPanel } from "../components/ReminderPanel";

export default function CRMCalendarPage() {
  return (
    <PageContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <PageHeader 
          title="CRM Calendar" 
          description="Schedule meetings, view deadlines, and track quotation expiries."
        />
        <button style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          New Event
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        <div style={{ gridColumn: 'span 2' }}>
          <CalendarView />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <ReminderPanel />
          <MeetingSchedule />
        </div>

      </div>
    </PageContainer>
  );
}
