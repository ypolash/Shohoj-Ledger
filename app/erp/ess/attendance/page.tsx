"use client";

import React, { useState, useEffect } from 'react';
import styles from "../../income/page.module.css";
import { fetchMyAttendanceHistory, fetchMyAttendanceSummary, fetchMyDutySchedule } from './actions';

export default function EssAttendancePage() {
  const [history, setHistory] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [dutySchedule, setDutySchedule] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [histData, sumData, dutyData] = await Promise.all([
        fetchMyAttendanceHistory(),
        fetchMyAttendanceSummary(),
        fetchMyDutySchedule()
      ]);
      setHistory(histData);
      setSummary(sumData);
      setDutySchedule(dutyData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === 'PRESENT') return styles['badge-paid'];
    if (status === 'LATE') return styles['badge-partial'];
    if (status === 'ABSENT') return styles['badge-unpaid'];
    if (status === 'HALF_DAY') return styles['badge-partial'];
    return '';
  };

  if (isLoading) return <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>Loading attendance...</div>;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Duty Schedule Card */}
      <div className="glass-card" style={{
        padding: '20px 24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
        border: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: dutySchedule?.isCustom ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: dutySchedule?.isCustom ? 'var(--success)' : 'var(--primary)',
            fontSize: '22px'
          }}>
            <span className="material-symbols-outlined">schedule</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: dutySchedule?.isCustom ? 'var(--success)' : 'var(--text-muted)' }}>
                {dutySchedule?.isCustom ? '★ Assigned Custom Duty' : 'Office Standard Shift'}
              </span>
              {dutySchedule?.nightShift && (
                <span style={{ fontSize: '11px', background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', padding: '2px 8px', borderRadius: '12px' }}>
                  Night Shift
                </span>
              )}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
              {dutySchedule?.startTime ? `${dutySchedule.startTime} — ${dutySchedule.endTime}` : '09:30 — 18:00'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Grace Period</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--warning)' }}>
              +{dutySchedule?.gracePeriod ?? 15} mins
            </div>
          </div>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Break Allowance</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)' }}>
              {dutySchedule?.breakTime ?? 60} mins
            </div>
          </div>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
          <div className={styles.metricTitle}>Days Present (This Month)</div>
          <div className={styles.metricValue} style={{ color: 'var(--success)' }}>{summary?.present || 0}</div>
        </div>
        <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
          <div className={styles.metricTitle}>Days Late</div>
          <div className={styles.metricValue} style={{ color: 'var(--warning)' }}>{summary?.late || 0}</div>
        </div>
        <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
          <div className={styles.metricTitle}>Days Absent</div>
          <div className={styles.metricValue} style={{ color: 'var(--danger)' }}>{summary?.absent || 0}</div>
        </div>
        <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
          <div className={styles.metricTitle}>Half Days</div>
          <div className={styles.metricValue} style={{ color: 'var(--primary)' }}>{summary?.halfDay || 0}</div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 'var(--spacing-6)' }}>
        <h2 style={{ margin: '0 0 var(--spacing-6) 0' }}>Recent Attendance History</h2>
        
        {history.length > 0 ? (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Working Hours</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map(record => (
                  <tr key={record.id}>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td>{record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-'}</td>
                    <td>{record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'}</td>
                    <td>{record.totalWorkingMinutes ? `${(record.totalWorkingMinutes / 60).toFixed(1)} hrs` : '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`${styles.badge} ${getStatusBadgeClass(record.status)}`}>
                        {record.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
            No attendance records found.
          </div>
        )}
      </div>
    </div>
  );
}
