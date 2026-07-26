"use client";

import React from 'react';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

// Modular Components
import { ActivityFeed } from "../components/ActivityFeed";
import { TaskSchedule } from "../components/TaskSchedule";
import { MeetingSchedule } from "../components/MeetingSchedule";
import { DateRangePicker } from "../components/DateRangePicker";

export default function CRMActivitiesPage() {
  return (
    <PageContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <PageHeader 
          title="Activity Center" 
          description="Log, track, and manage all CRM interactions and tasks."
        />
        <DateRangePicker />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        <div style={{ gridColumn: 'span 2' }}>
          <ActivityFeed />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <TaskSchedule />
          <MeetingSchedule />
        </div>

      </div>
    </PageContainer>
  );
}
