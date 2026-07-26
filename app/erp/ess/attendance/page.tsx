"use client";

import React, { useState, useEffect } from 'react';
import styles from "../../income/page.module.css";
import { fetchMyAttendanceHistory, fetchMyAttendanceSummary } from './actions';

export default function EssAttendancePage() {
  const [history, setHistory] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [histData, sumData] = await Promise.all([
        fetchMyAttendanceHistory(),
        fetchMyAttendanceSummary()
      ]);
      setHistory(histData);
      setSummary(sumData);
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
