"use client";

import React, { useState, useMemo, useEffect } from 'react';
import styles from '../../attendance/horizontalCalendar.module.css';

interface EmployeeFine {
  id: string;
  employeeId: string;
  amount: number | string;
  reason: string;
  date: string;
  status: 'PENDING' | 'DEDUCTED' | 'CANCELLED';
}

interface HorizontalFinesDateStripProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onClearDate: () => void;
  fines: EmployeeFine[];
  weeklyHolidays?: string[];
}

export function HorizontalFinesDateStrip({
  selectedDate,
  onSelectDate,
  onClearDate,
  fines,
  weeklyHolidays = ['Friday', 'Saturday']
}: HorizontalFinesDateStripProps) {
  const [anchorDate, setAnchorDate] = useState<Date>(() => {
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      const [y, m, d] = selectedDate.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  });

  useEffect(() => {
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      const [y, m, d] = selectedDate.split('-').map(Number);
      setAnchorDate(new Date(y, m - 1, d));
    }
  }, [selectedDate]);

  const todayKey = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Dhaka',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date());
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  }, []);

  // Pre-index fines by date string YYYY-MM-DD
  const finesByDate = useMemo(() => {
    const map = new Map<string, EmployeeFine[]>();
    fines.forEach(f => {
      let key = '';
      if (f.date && typeof f.date === 'string') {
        key = f.date.slice(0, 10);
      }
      if (key) {
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(f);
      }
    });
    return map;
  }, [fines]);

  // Generate 15-day window centered on anchorDate (-7 to +7 days)
  const stripDates = useMemo(() => {
    const dates = [];
    for (let offset = -7; offset <= 7; offset++) {
      const cur = new Date(anchorDate);
      cur.setDate(anchorDate.getDate() + offset);

      let dateKey = '';
      try {
        dateKey = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Dhaka',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(cur);
      } catch {
        dateKey = cur.toISOString().slice(0, 10);
      }

      const dayName = cur.toLocaleDateString('en-US', { weekday: 'short' });
      const fullDayName = cur.toLocaleDateString('en-US', { weekday: 'long' });
      const monthName = cur.toLocaleDateString('en-US', { month: 'short' });
      const dayNum = cur.getDate();

      const isToday = dateKey === todayKey;
      const isSelected = dateKey === selectedDate;
      const isWeekend = weeklyHolidays.includes(fullDayName);

      const dayFines = finesByDate.get(dateKey) || [];
      const hasPending = dayFines.some(f => f.status === 'PENDING');
      const hasDeducted = dayFines.some(f => f.status === 'DEDUCTED');
      const hasCancelled = dayFines.some(f => f.status === 'CANCELLED');
      const totalAmount = dayFines.reduce((s, f) => s + (Number(f.amount) || 0), 0);

      dates.push({
        dateKey,
        dayName,
        monthName,
        dayNum,
        isToday,
        isSelected,
        isWeekend,
        totalCount: dayFines.length,
        totalAmount,
        hasPending,
        hasDeducted,
        hasCancelled
      });
    }
    return dates;
  }, [anchorDate, todayKey, selectedDate, weeklyHolidays, finesByDate]);

  const handlePrevWeek = () => {
    setAnchorDate(prev => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setAnchorDate(prev => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 7);
      return next;
    });
  };

  const handleJumpToday = () => {
    const today = new Date();
    setAnchorDate(today);
    onSelectDate(todayKey);
  };

  return (
    <div className={styles.dateStripWrapper}>
      {/* Header */}
      <div className={styles.dateStripHeader}>
        <div className={styles.dateStripTitleGroup}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#f43f5e' }}>
            calendar_view_week
          </span>
          <span>Disciplinary Calendar Date Ribbon</span>
          {selectedDate && (
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#f43f5e',
              background: 'rgba(244, 63, 94, 0.15)',
              padding: '2px 8px',
              borderRadius: '6px',
              textTransform: 'none'
            }}>
              Filtered: {selectedDate}
            </span>
          )}
        </div>

        <div className={styles.dateStripNavActions}>
          <button
            type="button"
            onClick={handlePrevWeek}
            className={styles.stripNavBtn}
            title="Previous 7 days"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span>
          </button>

          <button
            type="button"
            onClick={handleJumpToday}
            className={styles.stripTodayBtn}
          >
            Jump to Today
          </button>

          <button
            type="button"
            onClick={handleNextWeek}
            className={styles.stripNavBtn}
            title="Next 7 days"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
          </button>

          {selectedDate && (
            <button
              type="button"
              onClick={onClearDate}
              className={styles.stripTodayBtn}
              style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              title="Clear date filter"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Date Ribbon Track (Scrollbar hidden) */}
      <div
        className={styles.dateStripTrack}
        onWheel={(e) => {
          if (e.deltaY !== 0) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
      >
        {stripDates.map(item => (
          <div
            key={item.dateKey}
            onClick={() => onSelectDate(item.dateKey)}
            className={`${styles.dateStripCard} ${item.isSelected ? styles.dateStripCardActive : ''} ${item.isWeekend ? styles.dateStripCardWeekend : ''}`}
            title={`${item.dateKey} (${item.dayName}) • ${item.totalCount} Fine${item.totalCount === 1 ? '' : 's'} (৳${item.totalAmount.toLocaleString()})`}
          >
            {item.isToday && <span className={styles.stripTodayBadge}>Today</span>}
            <span className={styles.stripDayName}>{item.dayName}</span>
            <span className={styles.stripDayNum}>{item.dayNum}</span>
            <span className={styles.stripMonthName}>{item.monthName}</span>

            {/* Fines Indicator Dots */}
            <div className={styles.stripDotsRow}>
              {item.hasPending && (
                <span className={`${styles.stripDot} ${styles.stripDotAbsent}`} title="Pending fine" />
              )}
              {item.hasDeducted && (
                <span className={`${styles.stripDot} ${styles.stripDotPresent}`} title="Deducted fine" />
              )}
              {item.hasCancelled && (
                <span className={`${styles.stripDot} ${styles.stripDotHalfDay}`} title="Waived/Cancelled fine" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
