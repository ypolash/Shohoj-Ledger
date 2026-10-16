"use client";

import React, { useState, useMemo } from 'react';
import styles from '../../attendance/horizontalCalendar.module.css';

interface EmployeeFine {
  id: string;
  employeeId: string;
  amount: number | string;
  reason: string;
  date: string;
  status: 'PENDING' | 'DEDUCTED' | 'CANCELLED' | 'CONSIDERATION_REQUESTED' | 'WAIVED';
  createdAt?: string;
  appealReason?: string | null;
  employee?: {
    firstName: string;
    lastName: string;
    employeeId?: string;
    designation?: string;
  };
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId?: string;
  designation?: string;
  department?: string;
  departmentRef?: { name: string };
  designationRef?: { name: string };
}

interface HorizontalFinesCalendarViewProps {
  fines: EmployeeFine[];
  employees: Employee[];
  weeklyHolidays?: string[];
  onAddFine: (employeeId: string, date: string) => void;
  onEditFine?: (fine: EmployeeFine) => void;
  onStatusChange?: (fineId: string, newStatus: string) => void;
  onDeleteFine?: (fineId: string) => void;
  onReviewConsideration?: (fine: EmployeeFine) => void;
}

export function HorizontalFinesCalendarView({
  fines,
  employees,
  weeklyHolidays = ['Friday', 'Saturday'],
  onAddFine,
  onEditFine,
  onStatusChange,
  onDeleteFine,
  onReviewConsideration
}: HorizontalFinesCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewSpan, setViewSpan] = useState<'MONTH' | '14_DAYS' | '7_DAYS'>('MONTH');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFineForDetail, setSelectedFineForDetail] = useState<EmployeeFine | null>(null);

  const timezone = 'Asia/Dhaka';

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
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleJumpToday = () => {
    setCurrentDate(new Date());
  };

  const monthTitle = useMemo(() => {
    return currentDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: timezone
    });
  }, [currentDate]);

  // Compute date columns
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
  }, [currentDate, viewSpan, todayKey, weeklyHolidays]);

  // Index fines by composite key `${employeeId}_${dateKey}`
  const finesLookup = useMemo(() => {
    const map = new Map<string, EmployeeFine[]>();

    fines.forEach(f => {
      let fDateKey = '';
      if (f.date && typeof f.date === 'string') {
        fDateKey = f.date.slice(0, 10);
      }
      if (fDateKey && f.employeeId) {
        const key = `${f.employeeId}_${fDateKey}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(f);
      }
    });

    return map;
  }, [fines]);

  // Filter employees
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

  // Employee monthly totals across the calendar span
  const employeeMonthlyTotals = useMemo(() => {
    const statsMap = new Map<string, { totalCount: number; totalAmount: number; pendingCount: number; deductedCount: number; cancelledCount: number }>();

    employees.forEach(emp => {
      let totalCount = 0;
      let totalAmount = 0;
      let pendingCount = 0;
      let deductedCount = 0;
      let cancelledCount = 0;

      calendarDates.forEach(cd => {
        const finesList = finesLookup.get(`${emp.id}_${cd.dateKey}`) || [];
        finesList.forEach(f => {
          totalCount++;
          const amt = Number(f.amount) || 0;
          totalAmount += amt;
          if (f.status === 'PENDING') pendingCount++;
          else if (f.status === 'DEDUCTED') deductedCount++;
          else if (f.status === 'CANCELLED') cancelledCount++;
        });
      });

      statsMap.set(emp.id, { totalCount, totalAmount, pendingCount, deductedCount, cancelledCount });
    });

    return statsMap;
  }, [employees, calendarDates, finesLookup]);

  // Daily totals across all employees
  const dailyTotals = useMemo(() => {
    return calendarDates.map(cd => {
      let count = 0;
      let totalAmount = 0;

      employees.forEach(emp => {
        const finesList = finesLookup.get(`${emp.id}_${cd.dateKey}`) || [];
        finesList.forEach(f => {
          count++;
          totalAmount += Number(f.amount) || 0;
        });
      });

      return {
        dateKey: cd.dateKey,
        count,
        totalAmount
      };
    });
  }, [calendarDates, employees, finesLookup]);

  // Period overall KPIs
  const periodKpi = useMemo(() => {
    let totalCount = 0;
    let totalAmount = 0;
    let pendingCount = 0;
    let pendingAmount = 0;
    let deductedCount = 0;
    let deductedAmount = 0;
    let cancelledCount = 0;

    calendarDates.forEach(cd => {
      employees.forEach(emp => {
        const list = finesLookup.get(`${emp.id}_${cd.dateKey}`) || [];
        list.forEach(f => {
          const amt = Number(f.amount) || 0;
          totalCount++;
          totalAmount += amt;
          if (f.status === 'PENDING') {
            pendingCount++;
            pendingAmount += amt;
          } else if (f.status === 'DEDUCTED') {
            deductedCount++;
            deductedAmount += amt;
          } else if (f.status === 'CANCELLED') {
            cancelledCount++;
          }
        });
      });
    });

    return {
      totalCount,
      totalAmount,
      pendingCount,
      pendingAmount,
      deductedCount,
      deductedAmount,
      cancelledCount
    };
  }, [calendarDates, employees, finesLookup]);

  const getInitials = (first: string, last: string) => {
    return `${(first?.[0] || '').toUpperCase()}${(last?.[0] || '').toUpperCase()}`;
  };

  return (
    <div className={styles.calendarContainer}>
      {/* 1. Header & Controls Toolbar */}
      <div className={styles.calendarToolbar}>
        <div className={styles.calendarNavGroup}>
          <h2 className={styles.calendarMonthTitle}>
            <span className="material-symbols-outlined" style={{ color: '#f43f5e' }}>
              calendar_month
            </span>
            <span>{monthTitle} Fines Schedule</span>
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
              title="Jump to Today"
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

        {/* Search Input */}
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
            placeholder="Search staff in schedule..."
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
        <div className={styles.legendList}>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#ef4444' }} />
            <span>Pending ({periodKpi.pendingCount} • ৳{periodKpi.pendingAmount.toLocaleString()})</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#10b981' }} />
            <span>Deducted ({periodKpi.deductedCount} • ৳{periodKpi.deductedAmount.toLocaleString()})</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#64748b' }} />
            <span>Waived ({periodKpi.cancelledCount})</span>
          </div>
        </div>

        <div className={styles.kpiPillsRow}>
          <div className={styles.kpiPill}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#f43f5e' }}>
              payments
            </span>
            <span>Total Fines: <strong>৳{periodKpi.totalAmount.toLocaleString()}</strong> ({periodKpi.totalCount})</span>
          </div>
          <div className={styles.kpiPill}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#60a5fa' }}>
              group
            </span>
            <span>Staff Count: <strong>{employees.length}</strong></span>
          </div>
        </div>
      </div>

      {/* 3. The Horizontal Matrix Grid */}
      <div className={styles.matrixCard}>
        <div className={styles.matrixScrollWrapper}>
          <table className={styles.matrixTable}>
            <thead>
              <tr>
                <th className={styles.headerEmployeeCol}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#f43f5e' }}>
                      badge
                    </span>
                    <span>Staff Member ({filteredEmployees.length})</span>
                  </div>
                </th>

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

                <th className={styles.headerSummaryCol}>
                  <span>Period Penalties</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.map(emp => {
                const stats = employeeMonthlyTotals.get(emp.id) || { totalCount: 0, totalAmount: 0, pendingCount: 0, deductedCount: 0, cancelledCount: 0 };
                const designation = emp.designation || emp.designationRef?.name || emp.department || 'Staff';

                return (
                  <tr key={emp.id} className={styles.matrixRow}>
                    <td className={styles.stickyEmpCell}>
                      <div className={styles.empCellProfile}>
                        <div
                          className={styles.empMiniAvatar}
                          style={{ background: 'linear-gradient(135deg, #f43f5e, #be123c)' }}
                        >
                          {getInitials(emp.firstName, emp.lastName)}
                        </div>
                        <div className={styles.empCellInfo}>
                          <div className={styles.empCellName} title={`${emp.firstName} ${emp.lastName}`}>
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className={styles.empCellSub}>
                            <span className={styles.empMiniBadge} style={{ color: '#f43f5e', background: 'rgba(244, 63, 94, 0.15)' }}>
                              {emp.employeeId || 'EMP'}
                            </span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {designation}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {calendarDates.map(cd => {
                      const finesList = finesLookup.get(`${emp.id}_${cd.dateKey}`) || [];
                      const hasFines = finesList.length > 0;

                      let cellStatusClass = styles.cellStatusEmpty;
                      let badgeLetter = '·';
                      let subText = '';
                      let cellTitle = `${emp.firstName} • ${cd.dateKey}: No disciplinary penalty`;

                      if (hasFines) {
                        const totalDayAmt = finesList.reduce((s, f) => s + (Number(f.amount) || 0), 0);
                        const hasPending = finesList.some(f => f.status === 'PENDING');
                        const hasDeducted = finesList.some(f => f.status === 'DEDUCTED');

                        if (hasPending) {
                          cellStatusClass = styles.cellStatusA; // red badge
                        } else if (hasDeducted) {
                          cellStatusClass = styles.cellStatusP; // green badge
                        } else {
                          cellStatusClass = styles.cellStatusOff; // waived/cancelled
                        }

                        badgeLetter = `৳${totalDayAmt > 999 ? `${Math.round(totalDayAmt / 1000)}k` : totalDayAmt}`;
                        subText = finesList.length > 1 ? `${finesList.length}x` : finesList[0]?.reason?.slice(0, 7) || 'Fine';
                        cellTitle = `${emp.firstName} • ${finesList.length} penalty: ৳${totalDayAmt.toLocaleString()} (${finesList.map(f => f.reason).join(', ')})`;
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
                              if (hasFines) {
                                setSelectedFineForDetail(finesList[0]);
                              } else {
                                onAddFine(emp.id, cd.dateKey);
                              }
                            }}
                            className={`${styles.cellBadgeBtn} ${cellStatusClass}`}
                            title={cellTitle}
                          >
                            <span className={styles.cellBadgeLetter} style={{ fontSize: hasFines ? '10px' : '12px' }}>
                              {badgeLetter}
                            </span>
                            {subText && <span className={styles.cellSubText}>{subText}</span>}
                          </button>
                        </td>
                      );
                    })}

                    <td className={styles.stickySummaryCell}>
                      <div className={styles.summaryRowContent}>
                        <div className={styles.summaryStatsGroup}>
                          <span
                            className={styles.statBadgeMini}
                            style={{
                              background: stats.totalCount > 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                              color: stats.totalCount > 0 ? '#f43f5e' : 'var(--text-muted)'
                            }}
                            title="Total penalties count"
                          >
                            {stats.totalCount} Fines
                          </span>
                        </div>

                        <span
                          className={styles.rateBadge}
                          style={{
                            background: stats.totalAmount > 0 ? 'rgba(239, 68, 68, 0.18)' : 'rgba(16, 185, 129, 0.15)',
                            color: stats.totalAmount > 0 ? '#ef4444' : '#10b981'
                          }}
                          title={`Total penalty amount: ৳${stats.totalAmount.toLocaleString()}`}
                        >
                          ৳{stats.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot>
              <tr className={styles.totalsRow}>
                <td className={styles.totalsEmpCell}>
                  <span>Daily Disciplinary Total</span>
                </td>

                {dailyTotals.map(dt => {
                  const hasAmt = dt.totalAmount > 0;
                  return (
                    <td
                      key={dt.dateKey}
                      className={styles.totalsDayCell}
                      title={`${dt.dateKey}: ৳${dt.totalAmount.toLocaleString()} (${dt.count} penalties)`}
                    >
                      <span style={{ color: hasAmt ? '#ef4444' : 'var(--text-muted)' }}>
                        {hasAmt ? `৳${dt.totalAmount > 999 ? `${Math.round(dt.totalAmount / 1000)}k` : dt.totalAmount}` : '-'}
                      </span>
                    </td>
                  );
                })}

                <td className={styles.totalsSummaryCell} style={{ color: '#f43f5e' }}>
                  <span>৳{periodKpi.totalAmount.toLocaleString()} Total</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 4. Fine Quick Detail Popover */}
      {selectedFineForDetail && (
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
          onClick={() => setSelectedFineForDetail(null)}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: '#f43f5e', fontSize: '22px' }}>
                  gavel
                </span>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-main, #f8fafc)' }}>
                  Disciplinary Penalty Record
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFineForDetail(null)}
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
                  {selectedFineForDetail.employee
                    ? `${selectedFineForDetail.employee.firstName} ${selectedFineForDetail.employee.lastName}`
                    : 'Staff'}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Fine Date:</span>
                <strong style={{ color: 'var(--text-main, #f8fafc)' }}>
                  {selectedFineForDetail.date ? selectedFineForDetail.date.slice(0, 10) : '--'}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Penalty Amount:</span>
                <strong style={{ color: '#ef4444', fontSize: '15px' }}>
                  ৳{Number(selectedFineForDetail.amount).toLocaleString()}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Status:</span>
                <span style={{
                  fontWeight: 700,
                  color: selectedFineForDetail.status === 'DEDUCTED' ? '#10b981' : selectedFineForDetail.status === 'PENDING' ? '#f59e0b' : selectedFineForDetail.status === 'CONSIDERATION_REQUESTED' ? '#818cf8' : '#64748b'
                }}>
                  {selectedFineForDetail.status === 'CONSIDERATION_REQUESTED' ? 'Consideration Requested' : selectedFineForDetail.status}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Violation Reason:</span>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  color: 'var(--text-main, #f8fafc)',
                  fontSize: '12px',
                  lineHeight: 1.4
                }}>
                  {selectedFineForDetail.reason || 'No violation notes specified'}
                </div>
              </div>

              {selectedFineForDetail.appealReason && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                  <span style={{ color: '#818cf8', fontSize: '11px', fontWeight: 700 }}>Employee Request Message:</span>
                  <div style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    borderLeft: '3px solid #6366f1',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    color: '#c7d2fe',
                    fontSize: '12px',
                    fontStyle: 'italic',
                    lineHeight: 1.4
                  }}>
                    &ldquo;{selectedFineForDetail.appealReason}&rdquo;
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              {selectedFineForDetail.status === 'CONSIDERATION_REQUESTED' && onReviewConsideration && (
                <button
                  type="button"
                  onClick={() => {
                    const f = selectedFineForDetail;
                    setSelectedFineForDetail(null);
                    onReviewConsideration(f);
                  }}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(99, 102, 241, 0.45)',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#818cf8',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>rate_review</span>
                  Review Request
                </button>
              )}
              {selectedFineForDetail.status === 'PENDING' && onStatusChange && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const id = selectedFineForDetail.id;
                      setSelectedFineForDetail(null);
                      onStatusChange(id, 'DEDUCTED');
                    }}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#10b981',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>check_circle</span>
                    Mark Deducted
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const id = selectedFineForDetail.id;
                      setSelectedFineForDetail(null);
                      onStatusChange(id, 'CANCELLED');
                    }}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(100, 116, 139, 0.3)',
                      background: 'rgba(100, 116, 139, 0.1)',
                      color: '#94a3b8',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>block</span>
                    Waive / Cancel
                  </button>
                </>
              )}

              {onEditFine && (
                <button
                  type="button"
                  onClick={() => {
                    const f = selectedFineForDetail;
                    setSelectedFineForDetail(null);
                    onEditFine(f);
                  }}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(37, 99, 235, 0.3)',
                    background: 'rgba(37, 99, 235, 0.1)',
                    color: '#60a5fa',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>edit</span>
                  Edit
                </button>
              )}

              {onDeleteFine && (
                <button
                  type="button"
                  onClick={() => {
                    const id = selectedFineForDetail.id;
                    setSelectedFineForDetail(null);
                    onDeleteFine(id);
                  }}
                  style={{
                    padding: '7px 12px',
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
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>delete</span>
                  Delete
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedFineForDetail(null)}
                style={{
                  padding: '7px 12px',
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
