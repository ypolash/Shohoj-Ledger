"use client";

import React, { useState, useMemo } from 'react';
import styles from '../horizontalCalendar.module.css';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId?: string;
  designation?: string;
  department?: string;
  designationRef?: { name: string };
  departmentRef?: { name: string };
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  isLate?: boolean;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  checkInTime?: string;
  checkOutTime?: string;
  checkIn?: string;
  checkOut?: string;
  employeeId: string;
  punishmentAmount?: number | string | null;
  punishmentReason?: string | null;
  reviewStatus?: string | null;
  employee?: Employee | null;
  employeeName?: string | null;
}

interface HorizontalCalendarViewProps {
  records: AttendanceRecord[];
  employees: Employee[];
  officeTiming: {
    shiftStart: string;
    shiftEnd: string;
    gracePeriod: number;
    timezone: string;
  };
  punishmentRules?: any[];
  weeklyHolidays?: string[];
  onAddRecord: (employeeId: string, date: string) => void;
  onViewRecord?: (record: AttendanceRecord) => void;
  onConsiderLate?: (record: AttendanceRecord) => void;
  onAutoCheckout?: (record: AttendanceRecord, mode: 'MANUAL' | 'HALF_DAY') => void;
  onDeleteRecord?: (record: AttendanceRecord) => void;
}

export function HorizontalCalendarView({
  records,
  employees,
  officeTiming,
  punishmentRules = [],
  weeklyHolidays = ['Friday', 'Saturday'],
  onAddRecord,
  onViewRecord,
  onConsiderLate,
  onAutoCheckout,
  onDeleteRecord
}: HorizontalCalendarViewProps) {
  // Calendar month state (defaults to current date)
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewSpan, setViewSpan] = useState<'MONTH' | '14_DAYS' | '7_DAYS'>('MONTH');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<AttendanceRecord | null>(null);

  const timezone = officeTiming?.timezone || 'Asia/Dhaka';

  // Format todayKey
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

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleJumpToday = () => {
    setCurrentDate(new Date());
  };

  // Month display title
  const monthTitle = useMemo(() => {
    return currentDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: timezone
    });
  }, [currentDate, timezone]);

  // Compute date columns for the selected span
  const calendarDates = useMemo(() => {
    const dates = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (viewSpan === 'MONTH') {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day, 12, 0, 0);
        let dateKey = '';
        try {
          dateKey = new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).format(d);
        } catch {
          dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }

        const dayName = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: timezone });
        const fullDayName = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone });
        const isToday = dateKey === todayKey;
        const isWeekend = weeklyHolidays.includes(fullDayName);

        dates.push({
          date: d,
          dateKey,
          dayNum: day,
          dayName,
          fullDayName,
          isToday,
          isWeekend
        });
      }
    } else if (viewSpan === '14_DAYS') {
      // 14 days centered around current date
      for (let i = -6; i <= 7; i++) {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + i);

        let dateKey = '';
        try {
          dateKey = new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).format(d);
        } catch {
          dateKey = d.toISOString().slice(0, 10);
        }

        const dayName = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: timezone });
        const fullDayName = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone });
        const isToday = dateKey === todayKey;
        const isWeekend = weeklyHolidays.includes(fullDayName);

        dates.push({
          date: d,
          dateKey,
          dayNum: d.getDate(),
          dayName,
          fullDayName,
          isToday,
          isWeekend
        });
      }
    } else {
      // 7 days window
      for (let i = -3; i <= 3; i++) {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + i);

        let dateKey = '';
        try {
          dateKey = new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).format(d);
        } catch {
          dateKey = d.toISOString().slice(0, 10);
        }

        const dayName = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: timezone });
        const fullDayName = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone });
        const isToday = dateKey === todayKey;
        const isWeekend = weeklyHolidays.includes(fullDayName);

        dates.push({
          date: d,
          dateKey,
          dayNum: d.getDate(),
          dayName,
          fullDayName,
          isToday,
          isWeekend
        });
      }
    }

    return dates;
  }, [currentDate, viewSpan, timezone, todayKey, weeklyHolidays]);

  // Index records by composite key `${employeeId}_${dateKey}`
  const recordsLookup = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();

    records.forEach(r => {
      let rDateKey = '';
      if (r.date && typeof r.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(r.date)) {
        rDateKey = r.date.slice(0, 10);
      } else if (r.date || r.checkInTime) {
        const dateVal = (r.date || r.checkInTime) as string;
        const d = new Date(dateVal);
        if (!isNaN(d.getTime())) {
          try {
            rDateKey = new Intl.DateTimeFormat('en-CA', {
              timeZone: timezone,
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }).format(d);
          } catch {
            rDateKey = d.toISOString().slice(0, 10);
          }
        }
      }

      if (rDateKey && r.employeeId) {
        map.set(`${r.employeeId}_${rDateKey}`, r);
      }
    });

    return map;
  }, [records, timezone]);

  // Filter employees by search query
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const q = searchQuery.toLowerCase().trim();
    return employees.filter(e => {
      const name = `${e.firstName} ${e.lastName}`.toLowerCase();
      const code = (e.employeeId || '').toLowerCase();
      const desig = (e.designation || e.designationRef?.name || '').toLowerCase();
      const dept = (e.department || e.departmentRef?.name || '').toLowerCase();
      return name.includes(q) || code.includes(q) || desig.includes(q) || dept.includes(q);
    });
  }, [employees, searchQuery]);

  // Calculate monthly stats per employee across the visible date columns
  const employeeMonthlyStats = useMemo(() => {
    const statsMap = new Map<string, { present: number; late: number; absent: number; halfDay: number; rate: number }>();

    employees.forEach(emp => {
      let present = 0;
      let late = 0;
      let absent = 0;
      let halfDay = 0;
      let totalWorkDays = 0;

      calendarDates.forEach(cd => {
        if (!cd.isWeekend) {
          totalWorkDays++;
        }
        const rec = recordsLookup.get(`${emp.id}_${cd.dateKey}`);
        if (rec) {
          if (rec.status === 'PRESENT') {
            if (rec.lateMinutes && rec.lateMinutes > 0) {
              late++;
            } else {
              present++;
            }
          } else if (rec.status === 'LATE') {
            late++;
          } else if (rec.status === 'ABSENT') {
            absent++;
          } else if (rec.status === 'HALF_DAY') {
            halfDay++;
          }
        }
      });

      const attended = present + late + halfDay;
      const rate = totalWorkDays > 0 ? Math.min(100, Math.round((attended / totalWorkDays) * 100)) : 100;

      statsMap.set(emp.id, { present, late, absent, halfDay, rate });
    });

    return statsMap;
  }, [employees, calendarDates, recordsLookup]);

  // Calculate daily totals across all employees for each column
  const dailyTotals = useMemo(() => {
    return calendarDates.map(cd => {
      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;

      employees.forEach(emp => {
        const rec = recordsLookup.get(`${emp.id}_${cd.dateKey}`);
        if (rec) {
          if (rec.status === 'PRESENT' && (!rec.lateMinutes || rec.lateMinutes === 0)) {
            presentCount++;
          } else if (rec.status === 'LATE' || (rec.lateMinutes && rec.lateMinutes > 0)) {
            lateCount++;
          } else if (rec.status === 'ABSENT') {
            absentCount++;
          }
        }
      });

      const totalActive = presentCount + lateCount;
      return {
        dateKey: cd.dateKey,
        presentCount,
        lateCount,
        absentCount,
        totalActive,
        totalStaff: employees.length
      };
    });
  }, [calendarDates, employees, recordsLookup]);

  // Overall period KPI summary
  const periodKpi = useMemo(() => {
    let totalPresent = 0;
    let totalLate = 0;
    let totalAbsent = 0;
    let totalHalfDay = 0;

    employeeMonthlyStats.forEach(stat => {
      totalPresent += stat.present;
      totalLate += stat.late;
      totalAbsent += stat.absent;
      totalHalfDay += stat.halfDay;
    });

    const totalLogs = totalPresent + totalLate + totalAbsent + totalHalfDay;
    const overallRate = (totalPresent + totalLate + totalHalfDay + totalAbsent) > 0
      ? Math.round(((totalPresent + totalLate + totalHalfDay) / (totalLogs)) * 100)
      : 100;

    return {
      totalPresent,
      totalLate,
      totalAbsent,
      totalHalfDay,
      totalLogs,
      overallRate
    };
  }, [employeeMonthlyStats]);

  // Helper for initials
  const getInitials = (first: string, last: string) => {
    return `${(first?.[0] || '').toUpperCase()}${(last?.[0] || '').toUpperCase()}`;
  };

  // Helper for format time
  const formatTimeStr = (timeVal?: string | null) => {
    if (!timeVal) return '';
    try {
      const d = new Date(timeVal);
      if (isNaN(d.getTime())) return timeVal;
      return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(d);
    } catch {
      return timeVal;
    }
  };

  return (
    <div className={styles.calendarContainer}>
      {/* 1. Calendar Header & Controls Toolbar */}
      <div className={styles.calendarToolbar}>
        {/* Navigation & Month Title */}
        <div className={styles.calendarNavGroup}>
          <h2 className={styles.calendarMonthTitle}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary, #3b82f6)' }}>
              calendar_month
            </span>
            <span>{monthTitle}</span>
          </h2>

          <div className={styles.calendarNavBtns}>
            <button
              type="button"
              onClick={handlePrevMonth}
              className={styles.navArrowBtn}
              title="Previous Month"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
            </button>

            <button
              type="button"
              onClick={handleJumpToday}
              className={styles.navTodayBtn}
              title="Jump to Current Month / Today"
            >
              Today
            </button>

            <button
              type="button"
              onClick={handleNextMonth}
              className={styles.navArrowBtn}
              title="Next Month"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
            </button>
          </div>

          {/* Span Switcher: Month, 14 Days, 7 Days */}
          <div className={styles.calendarSpanControls}>
            <button
              type="button"
              onClick={() => setViewSpan('MONTH')}
              className={`${styles.spanBtn} ${viewSpan === 'MONTH' ? styles.spanBtnActive : ''}`}
            >
              Full Month
            </button>
            <button
              type="button"
              onClick={() => setViewSpan('14_DAYS')}
              className={`${styles.spanBtn} ${viewSpan === '14_DAYS' ? styles.spanBtnActive : ''}`}
            >
              2 Weeks
            </button>
            <button
              type="button"
              onClick={() => setViewSpan('7_DAYS')}
              className={`${styles.spanBtn} ${viewSpan === '7_DAYS' ? styles.spanBtnActive : ''}`}
            >
              1 Week
            </button>
          </div>
        </div>

        {/* Right side: Search Input */}
        <div style={{ position: 'relative' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '16px',
              color: 'var(--text-muted, #94a3b8)',
              pointerEvents: 'none'
            }}
          >
            search
          </span>
          <input
            type="text"
            placeholder="Search staff in sheet..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={styles.calendarSearchInput}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #94a3b8)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Legend & Period KPI Bar */}
      <div className={styles.calendarSubBar}>
        {/* Status Legend */}
        <div className={styles.legendList}>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#10b981' }} />
            <span>P: Present ({periodKpi.totalPresent})</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#f59e0b' }} />
            <span>L: Late ({periodKpi.totalLate})</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#ef4444' }} />
            <span>A: Absent ({periodKpi.totalAbsent})</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#c084fc' }} />
            <span>H: Half Day ({periodKpi.totalHalfDay})</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#475569' }} />
            <span>OFF: Weekend</span>
          </div>
        </div>

        {/* KPI Pills */}
        <div className={styles.kpiPillsRow}>
          <div className={styles.kpiPill}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#10b981' }}>
              insights
            </span>
            <span>Monthly Rate: <strong>{periodKpi.overallRate}%</strong></span>
          </div>
          <div className={styles.kpiPill}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#60a5fa' }}>
              group
            </span>
            <span>Staff Count: <strong>{employees.length}</strong></span>
          </div>
          <div className={styles.kpiPill}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#f59e0b' }}>
              calendar_today
            </span>
            <span>Days Shown: <strong>{calendarDates.length}</strong></span>
          </div>
        </div>
      </div>

      {/* 3. The Horizontal Matrix Grid */}
      <div className={styles.matrixCard}>
        <div className={styles.matrixScrollWrapper}>
          <table className={styles.matrixTable}>
            <thead>
              <tr>
                {/* Sticky Left: Employee Column Header */}
                <th className={styles.headerEmployeeCol}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary, #3b82f6)' }}>
                      badge
                    </span>
                    <span>Staff Member ({filteredEmployees.length})</span>
                  </div>
                </th>

                {/* Horizontal Date Columns */}
                {calendarDates.map(cd => (
                  <th
                    key={cd.dateKey}
                    className={`${styles.headerDateCol} ${cd.isToday ? styles.headerDateColToday : ''} ${cd.isWeekend ? styles.headerDateColWeekend : ''}`}
                    title={`${cd.dateKey} (${cd.fullDayName}) ${cd.isToday ? '• TODAY' : ''}`}
                  >
                    <div className={styles.dateColDayName}>{cd.dayName.slice(0, 2)}</div>
                    <div className={styles.dateColDayNum}>{cd.dayNum}</div>
                  </th>
                ))}

                {/* Sticky Right: Summary Column Header */}
                <th className={styles.headerSummaryCol}>
                  <span>Period Summary</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.map(emp => {
                const stats = employeeMonthlyStats.get(emp.id) || { present: 0, late: 0, absent: 0, halfDay: 0, rate: 100 };
                const designation = emp.designation || emp.designationRef?.name || emp.department || 'Staff';

                return (
                  <tr key={emp.id} className={styles.matrixRow}>
                    {/* Sticky Left: Employee Info Cell */}
                    <td className={styles.stickyEmpCell}>
                      <div className={styles.empCellProfile}>
                        <div className={styles.empMiniAvatar}>
                          {getInitials(emp.firstName, emp.lastName)}
                        </div>
                        <div className={styles.empCellInfo}>
                          <div className={styles.empCellName} title={`${emp.firstName} ${emp.lastName}`}>
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className={styles.empCellSub}>
                            <span className={styles.empMiniBadge}>{emp.employeeId || 'EMP'}</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {designation}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Horizontal Date Cells */}
                    {calendarDates.map(cd => {
                      const rec = recordsLookup.get(`${emp.id}_${cd.dateKey}`);

                      let cellStatusClass = styles.cellStatusEmpty;
                      let badgeLetter = '·';
                      let subText = '';
                      let cellTitle = `${emp.firstName} ${emp.lastName} • ${cd.dateKey} (${cd.dayName}): Not logged`;

                      if (rec) {
                        const inTime = formatTimeStr(rec.checkIn || rec.checkInTime);
                        const isLateArrival = rec.status === 'LATE' || (rec.lateMinutes && rec.lateMinutes > 0);

                        if (rec.status === 'PRESENT') {
                          if (isLateArrival) {
                            cellStatusClass = styles.cellStatusL;
                            badgeLetter = 'L';
                            subText = `+${rec.lateMinutes}m`;
                            cellTitle = `${emp.firstName} • Late In at ${inTime || '--:--'} (+${rec.lateMinutes}m)`;
                          } else {
                            cellStatusClass = styles.cellStatusP;
                            badgeLetter = 'P';
                            subText = inTime.slice(0, 5) || 'OK';
                            cellTitle = `${emp.firstName} • Present On-Time at ${inTime || '--:--'}`;
                          }
                        } else if (rec.status === 'LATE') {
                          cellStatusClass = styles.cellStatusL;
                          badgeLetter = 'L';
                          subText = rec.lateMinutes ? `+${rec.lateMinutes}m` : 'Late';
                          cellTitle = `${emp.firstName} • Late Arrival (+${rec.lateMinutes || 0}m)`;
                        } else if (rec.status === 'ABSENT') {
                          cellStatusClass = styles.cellStatusA;
                          badgeLetter = 'A';
                          cellTitle = `${emp.firstName} • Absent Logged`;
                        } else if (rec.status === 'HALF_DAY') {
                          cellStatusClass = styles.cellStatusH;
                          badgeLetter = 'H';
                          subText = 'Half';
                          cellTitle = `${emp.firstName} • Half Day Approved`;
                        }
                      } else if (cd.isWeekend) {
                        cellStatusClass = styles.cellStatusOff;
                        badgeLetter = 'OFF';
                        cellTitle = `${cd.fullDayName} • Weekend / Holiday`;
                      }

                      return (
                        <td
                          key={cd.dateKey}
                          className={`${styles.matrixDayCell} ${cd.isToday ? styles.matrixDayCellToday : ''} ${cd.isWeekend ? styles.matrixDayCellWeekend : ''}`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (rec) {
                                setSelectedRecordForDetail(rec);
                              } else {
                                onAddRecord(emp.id, cd.dateKey);
                              }
                            }}
                            className={`${styles.cellBadgeBtn} ${cellStatusClass}`}
                            title={cellTitle}
                          >
                            <span className={styles.cellBadgeLetter}>{badgeLetter}</span>
                            {subText && <span className={styles.cellSubText}>{subText}</span>}
                          </button>
                        </td>
                      );
                    })}

                    {/* Sticky Right: Employee Summary Cell */}
                    <td className={styles.stickySummaryCell}>
                      <div className={styles.summaryRowContent}>
                        <div className={styles.summaryStatsGroup}>
                          <span className={`${styles.statBadgeMini} ${styles.statBadgeP}`} title="Present count">
                            {stats.present}P
                          </span>
                          <span className={`${styles.statBadgeMini} ${styles.statBadgeL}`} title="Late count">
                            {stats.late}L
                          </span>
                          <span className={`${styles.statBadgeMini} ${styles.statBadgeA}`} title="Absent count">
                            {stats.absent}A
                          </span>
                        </div>

                        {/* Rate Badge */}
                        <span
                          className={`${styles.rateBadge} ${
                            stats.rate >= 85 ? styles.rateHigh : stats.rate >= 70 ? styles.rateMid : styles.rateLow
                          }`}
                          title={`Overall attendance rate: ${stats.rate}%`}
                        >
                          {stats.rate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Bottom Row: Daily Attendance Totals */}
            <tfoot>
              <tr className={styles.totalsRow}>
                <td className={styles.totalsEmpCell}>
                  <span>Daily Attendance Ratio</span>
                </td>

                {dailyTotals.map(dt => {
                  const percent = dt.totalStaff > 0 ? Math.round((dt.totalActive / dt.totalStaff) * 100) : 0;
                  const color = percent >= 80 ? '#10b981' : percent > 0 ? '#f59e0b' : 'var(--text-muted, #64748b)';

                  return (
                    <td
                      key={dt.dateKey}
                      className={styles.totalsDayCell}
                      title={`${dt.dateKey}: ${dt.totalActive}/${dt.totalStaff} staff present (${percent}%)`}
                    >
                      <span style={{ color }}>
                        {dt.totalActive}/{dt.totalStaff}
                      </span>
                    </td>
                  );
                })}

                <td className={styles.totalsSummaryCell}>
                  <span>{periodKpi.overallRate}% Team Avg</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 4. Quick Record Detail Modal / Drawer Popover */}
      {selectedRecordForDetail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setSelectedRecordForDetail(null)}
        >
          <div
            style={{
              background: 'var(--surface-card, #0f172a)',
              border: '1px solid var(--border-main, rgba(255, 255, 255, 0.12))',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '440px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary, #3b82f6)', fontSize: '22px' }}>
                  fact_check
                </span>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-main, #f8fafc)' }}>
                  Attendance Log Telemetry
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecordForDetail(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted, #94a3b8)',
                  cursor: 'pointer'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>

            {/* Content Details */}
            <div style={{
              background: 'var(--surface-hover, #1e293b)',
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Staff Member:</span>
                <strong style={{ color: 'var(--text-main, #f8fafc)' }}>
                  {selectedRecordForDetail.employee
                    ? `${selectedRecordForDetail.employee.firstName} ${selectedRecordForDetail.employee.lastName}`
                    : selectedRecordForDetail.employeeName || 'Staff'}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Log Date:</span>
                <strong style={{ color: 'var(--text-main, #f8fafc)' }}>
                  {selectedRecordForDetail.date ? selectedRecordForDetail.date.slice(0, 10) : '--'}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Status:</span>
                <span style={{
                  fontWeight: 700,
                  color: selectedRecordForDetail.status === 'PRESENT' ? '#10b981' : selectedRecordForDetail.status === 'LATE' ? '#f59e0b' : '#ef4444'
                }}>
                  {selectedRecordForDetail.status}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Check In Time:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-main, #f8fafc)' }}>
                  {formatTimeStr(selectedRecordForDetail.checkIn || selectedRecordForDetail.checkInTime) || '--:--'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Check Out Time:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-main, #f8fafc)' }}>
                  {formatTimeStr(selectedRecordForDetail.checkOut || selectedRecordForDetail.checkOutTime) || '--:--'}
                </span>
              </div>

              {Number(selectedRecordForDetail.lateMinutes) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b' }}>
                  <span>Late Arrival:</span>
                  <strong>+{selectedRecordForDetail.lateMinutes} minutes</strong>
                </div>
              )}

              {Number(selectedRecordForDetail.earlyLeaveMinutes) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ea580c' }}>
                  <span>Early Leave:</span>
                  <strong>+{selectedRecordForDetail.earlyLeaveMinutes} minutes</strong>
                </div>
              )}

              {selectedRecordForDetail.punishmentAmount && Number(selectedRecordForDetail.punishmentAmount) > 0 ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                  <span>Penalty / Fine:</span>
                  <strong>৳{selectedRecordForDetail.punishmentAmount}</strong>
                </div>
              ) : null}

              {selectedRecordForDetail.punishmentReason && (
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #94a3b8)', marginTop: '4px' }}>
                  Note: {selectedRecordForDetail.punishmentReason}
                </div>
              )}
            </div>

            {/* Quick Actions Footer */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              {onConsiderLate && (selectedRecordForDetail.lateMinutes || selectedRecordForDetail.status === 'LATE') && (
                <button
                  type="button"
                  onClick={() => {
                    const rec = selectedRecordForDetail;
                    setSelectedRecordForDetail(null);
                    onConsiderLate(rec);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    background: 'rgba(245, 158, 11, 0.1)',
                    color: '#f59e0b',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule_send</span>
                  Waive / Consider Late
                </button>
              )}

              {onAutoCheckout && !selectedRecordForDetail.checkOut && !selectedRecordForDetail.checkOutTime && (
                <button
                  type="button"
                  onClick={() => {
                    const rec = selectedRecordForDetail;
                    setSelectedRecordForDetail(null);
                    onAutoCheckout(rec, 'MANUAL');
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(37, 99, 235, 0.4)',
                    background: 'rgba(37, 99, 235, 0.15)',
                    color: '#60a5fa',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>logout</span>
                  Clock Out
                </button>
              )}

              {onDeleteRecord && (
                <button
                  type="button"
                  onClick={() => {
                    const rec = selectedRecordForDetail;
                    setSelectedRecordForDetail(null);
                    onDeleteRecord(rec);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                  Delete
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedRecordForDetail(null)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-main, rgba(255, 255, 255, 0.1))',
                  background: 'var(--surface-hover, #1e293b)',
                  color: 'var(--text-main, #f8fafc)',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
