"use client";

import React, { useState, useMemo, useEffect } from 'react';
import styles from '../horizontalCalendar.module.css';

interface HorizontalDateStripProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onClearDate: () => void;
  records: any[];
  timezone?: string;
  weeklyHolidays?: string[];
}

export function HorizontalDateStrip({
  selectedDate,
  onSelectDate,
  onClearDate,
  records,
  timezone = 'Asia/Dhaka',
  weeklyHolidays = ['Friday', 'Saturday']
}: HorizontalDateStripProps) {
  // Center anchor date (defaults to today)
  const [anchorDate, setAnchorDate] = useState<Date>(() => {
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      const [y, m, d] = selectedDate.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  });

  // Keep anchor aligned if selectedDate changes externally
  useEffect(() => {
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      const [y, m, d] = selectedDate.split('-').map(Number);
      setAnchorDate(new Date(y, m - 1, d));
    }
  }, [selectedDate]);

  // Today key
  const todayKey = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date());
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  }, [timezone]);

  // Pre-index records by dateKey for ultra fast lookups
  const recordsByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    records.forEach(r => {
      let key = '';
      if (r.date && typeof r.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(r.date)) {
        key = r.date.slice(0, 10);
      } else if (r.date || r.checkInTime) {
        const d = new Date(r.date || r.checkInTime);
        if (!isNaN(d.getTime())) {
          try {
            key = new Intl.DateTimeFormat('en-CA', {
              timeZone: timezone,
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }).format(d);
          } catch {
            key = d.toISOString().slice(0, 10);
          }
        }
      }
      if (key) {
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(r);
      }
    });
    return map;
  }, [records, timezone]);

  // Generate 15-day window centered on anchorDate (-7 days to +7 days)
  const stripDates = useMemo(() => {
    const dates = [];
    for (let offset = -7; offset <= 7; offset++) {
      const cur = new Date(anchorDate);
      cur.setDate(anchorDate.getDate() + offset);

      let dateKey = '';
      try {
        dateKey = new Intl.DateTimeFormat('en-CA', {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(cur);
      } catch {
        dateKey = cur.toISOString().slice(0, 10);
      }

      const dayName = cur.toLocaleDateString('en-US', { weekday: 'short', timeZone: timezone });
      const fullDayName = cur.toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone });
      const monthName = cur.toLocaleDateString('en-US', { month: 'short', timeZone: timezone });
      const dayNum = cur.getDate();

      const isToday = dateKey === todayKey;
      const isSelected = dateKey === selectedDate;
      const isWeekend = weeklyHolidays.includes(fullDayName);

      const dayRecords = recordsByDate.get(dateKey) || [];
      const hasPresent = dayRecords.some(r => r.status === 'PRESENT' && (!r.lateMinutes || r.lateMinutes === 0));
      const hasLate = dayRecords.some(r => r.status === 'LATE' || (r.lateMinutes && r.lateMinutes > 0));
      const hasAbsent = dayRecords.some(r => r.status === 'ABSENT');
      const hasHalfDay = dayRecords.some(r => r.status === 'HALF_DAY');

      dates.push({
        dateKey,
        dayName,
        monthName,
        dayNum,
        isToday,
        isSelected,
        isWeekend,
        totalCount: dayRecords.length,
        hasPresent,
        hasLate,
        hasAbsent,
        hasHalfDay
      });
    }
    return dates;
  }, [anchorDate, timezone, todayKey, selectedDate, weeklyHolidays, recordsByDate]);

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
      {/* Header with Title & Navigation Controls */}
      <div className={styles.dateStripHeader}>
        <div className={styles.dateStripTitleGroup}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary, #3b82f6)' }}>
            calendar_view_week
          </span>
          <span>Horizontal Calendar Date Ribbon</span>
          {selectedDate && (
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#60a5fa',
              background: 'rgba(37, 99, 235, 0.15)',
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
            title="Shift back 7 days"
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
            title="Shift forward 7 days"
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

      {/* Horizontal Scrollable Date Ribbon */}
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
            title={`${item.dateKey} (${item.dayName}) • ${item.totalCount} Logs`}
          >
            {item.isToday && <span className={styles.stripTodayBadge}>Today</span>}
            <span className={styles.stripDayName}>{item.dayName}</span>
            <span className={styles.stripDayNum}>{item.dayNum}</span>
            <span className={styles.stripMonthName}>{item.monthName}</span>

            {/* Attendance Status Dot Indicators */}
            <div className={styles.stripDotsRow}>
              {item.hasPresent && <span className={`${styles.stripDot} ${styles.stripDotPresent}`} title="Present records" />}
              {item.hasLate && <span className={`${styles.stripDot} ${styles.stripDotLate}`} title="Late records" />}
              {item.hasAbsent && <span className={`${styles.stripDot} ${styles.stripDotAbsent}`} title="Absent records" />}
              {item.hasHalfDay && <span className={`${styles.stripDot} ${styles.stripDotHalfDay}`} title="Half Day records" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
