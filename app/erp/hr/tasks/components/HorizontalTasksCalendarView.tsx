"use client";

import React, { useState, useMemo } from "react";
import styles from "../../attendance/horizontalCalendar.module.css";

interface TaskChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  assignedToEmployeeId: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  createdAt: string;
  checklist?: any;
  employee?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    designation?: string;
    department?: string;
  } | null;
}

interface Employee {
  id: string;
  employeeId?: string;
  firstName: string;
  lastName: string;
  designation?: string;
  department?: string;
  departmentRef?: { name: string };
  designationRef?: { name: string };
}

interface HorizontalTasksCalendarViewProps {
  tasks: Task[];
  employees: Employee[];
  weeklyHolidays?: string[];
  onAssignTask: (employeeId: string, dueDate: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: string) => void;
  onToggleChecklistItem: (task: Task, itemId: string) => void;
}

function parseChecklistData(raw: any): any {
  if (!raw) return null;
  let parsed = raw;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return null;
    }
  }
  return parsed;
}

function extractChecklistItems(raw: any): TaskChecklistItem[] {
  const checklist = parseChecklistData(raw);
  if (!checklist) return [];
  if (Array.isArray(checklist)) return checklist;
  if (Array.isArray(checklist.items)) return checklist.items;
  if (Array.isArray(checklist.todos)) return checklist.todos;
  return [];
}

export function HorizontalTasksCalendarView({
  tasks,
  employees,
  weeklyHolidays = ["Friday", "Saturday"],
  onAssignTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onToggleChecklistItem,
}: HorizontalTasksCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewSpan, setViewSpan] = useState<"MONTH" | "14_DAYS" | "7_DAYS">("MONTH");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);

  const timezone = "Asia/Dhaka";

  const todayKey = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleJumpToday = () => {
    setCurrentDate(new Date());
  };

  const monthTitle = useMemo(() => {
    return currentDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: timezone,
    });
  }, [currentDate]);

  // Compute date columns based on viewSpan
  const calendarDates = useMemo(() => {
    const dates = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (viewSpan === "MONTH") {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day, 12, 0, 0);
        let dateKey = "";
        try {
          dateKey = new Intl.DateTimeFormat("en-CA", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(d);
        } catch {
          dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        }

        const dayName = d.toLocaleDateString("en-US", { weekday: "short", timeZone: timezone });
        const fullDayName = d.toLocaleDateString("en-US", { weekday: "long", timeZone: timezone });
        const isToday = dateKey === todayKey;
        const isWeekend = weeklyHolidays.includes(fullDayName);

        dates.push({
          date: d,
          dateKey,
          dayNum: d.getDate(),
          dayName,
          fullDayName,
          isToday,
          isWeekend,
        });
      }
    } else if (viewSpan === "14_DAYS") {
      for (let i = -7; i < 7; i++) {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + i);

        let dateKey = "";
        try {
          dateKey = new Intl.DateTimeFormat("en-CA", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(d);
        } catch {
          dateKey = d.toISOString().slice(0, 10);
        }

        const dayName = d.toLocaleDateString("en-US", { weekday: "short", timeZone: timezone });
        const fullDayName = d.toLocaleDateString("en-US", { weekday: "long", timeZone: timezone });
        const isToday = dateKey === todayKey;
        const isWeekend = weeklyHolidays.includes(fullDayName);

        dates.push({
          date: d,
          dateKey,
          dayNum: d.getDate(),
          dayName,
          fullDayName,
          isToday,
          isWeekend,
        });
      }
    } else {
      // 7_DAYS
      for (let i = -3; i <= 3; i++) {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + i);

        let dateKey = "";
        try {
          dateKey = new Intl.DateTimeFormat("en-CA", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(d);
        } catch {
          dateKey = d.toISOString().slice(0, 10);
        }

        const dayName = d.toLocaleDateString("en-US", { weekday: "short", timeZone: timezone });
        const fullDayName = d.toLocaleDateString("en-US", { weekday: "long", timeZone: timezone });
        const isToday = dateKey === todayKey;
        const isWeekend = weeklyHolidays.includes(fullDayName);

        dates.push({
          date: d,
          dateKey,
          dayNum: d.getDate(),
          dayName,
          fullDayName,
          isToday,
          isWeekend,
        });
      }
    }

    return dates;
  }, [currentDate, viewSpan, todayKey, weeklyHolidays]);

  // Index tasks by composite keys: both `id_dateKey` and `employeeCode_dateKey`
  const tasksLookup = useMemo(() => {
    const map = new Map<string, Task[]>();

    const append = (key: string, task: Task) => {
      if (!map.has(key)) map.set(key, []);
      const list = map.get(key)!;
      if (!list.some((t) => t.id === task.id)) {
        list.push(task);
      }
    };

    tasks.forEach((t) => {
      let tDateKey = "";
      if (t.dueDate && typeof t.dueDate === "string") {
        tDateKey = t.dueDate.slice(0, 10);
      } else if (t.createdAt && typeof t.createdAt === "string") {
        tDateKey = t.createdAt.slice(0, 10);
      }

      if (!tDateKey) return;

      if (t.assignedToEmployeeId) {
        append(`${t.assignedToEmployeeId}_${tDateKey}`, t);
      }
      if (t.employee?.id) {
        append(`${t.employee.id}_${tDateKey}`, t);
      }
      if (t.employee?.employeeId) {
        append(`${t.employee.employeeId}_${tDateKey}`, t);
      }
    });

    return map;
  }, [tasks]);

  // Filter employees for the matrix
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const q = searchQuery.toLowerCase().trim();
    return employees.filter((e) => {
      const name = `${e.firstName} ${e.lastName}`.toLowerCase();
      const code = (e.employeeId || "").toLowerCase();
      const desig = (e.designation || e.designationRef?.name || "").toLowerCase();
      const dept = (e.department || e.departmentRef?.name || "").toLowerCase();
      return name.includes(q) || code.includes(q) || desig.includes(q) || dept.includes(q);
    });
  }, [employees, searchQuery]);

  // Employee period totals across the active calendar span
  const employeeMonthlyTotals = useMemo(() => {
    const statsMap = new Map<
      string,
      {
        total: number;
        completed: number;
        inProgress: number;
        pending: number;
        blocked: number;
      }
    >();

    employees.forEach((emp) => {
      let total = 0;
      let completed = 0;
      let inProgress = 0;
      let pending = 0;
      let blocked = 0;

      const seenIds = new Set<string>();

      calendarDates.forEach((cd) => {
        const list1 = tasksLookup.get(`${emp.id}_${cd.dateKey}`) || [];
        const list2 = emp.employeeId ? tasksLookup.get(`${emp.employeeId}_${cd.dateKey}`) || [] : [];
        const combined = [...list1];
        list2.forEach((t) => {
          if (!combined.some((item) => item.id === t.id)) combined.push(t);
        });

        combined.forEach((t) => {
          if (seenIds.has(t.id)) return;
          seenIds.add(t.id);
          total++;
          const s = (t.status || "").toLowerCase();
          if (s === "completed") completed++;
          else if (s === "in progress") inProgress++;
          else if (s === "blocked") blocked++;
          else pending++;
        });
      });

      statsMap.set(emp.id, { total, completed, inProgress, pending, blocked });
    });

    return statsMap;
  }, [employees, calendarDates, tasksLookup]);

  // Daily totals across all employees for the footer
  const dailyTotals = useMemo(() => {
    return calendarDates.map((cd) => {
      const seenIds = new Set<string>();
      let count = 0;
      let completedCount = 0;

      employees.forEach((emp) => {
        const list1 = tasksLookup.get(`${emp.id}_${cd.dateKey}`) || [];
        const list2 = emp.employeeId ? tasksLookup.get(`${emp.employeeId}_${cd.dateKey}`) || [] : [];
        const combined = [...list1];
        list2.forEach((t) => {
          if (!combined.some((item) => item.id === t.id)) combined.push(t);
        });

        combined.forEach((t) => {
          if (!seenIds.has(t.id)) {
            seenIds.add(t.id);
            count++;
            if ((t.status || "").toLowerCase() === "completed") {
              completedCount++;
            }
          }
        });
      });

      return {
        dateKey: cd.dateKey,
        count,
        completedCount,
      };
    });
  }, [calendarDates, employees, tasksLookup]);

  // Overall Period KPI across all employees
  const periodKpi = useMemo(() => {
    let total = 0;
    let completed = 0;
    let inProgress = 0;
    let pending = 0;
    let blocked = 0;

    const seenIds = new Set<string>();

    employees.forEach((emp) => {
      calendarDates.forEach((cd) => {
        const list1 = tasksLookup.get(`${emp.id}_${cd.dateKey}`) || [];
        const list2 = emp.employeeId ? tasksLookup.get(`${emp.employeeId}_${cd.dateKey}`) || [] : [];
        const combined = [...list1];
        list2.forEach((t) => {
          if (!combined.some((item) => item.id === t.id)) combined.push(t);
        });

        combined.forEach((t) => {
          if (seenIds.has(t.id)) return;
          seenIds.add(t.id);
          total++;
          const s = (t.status || "").toLowerCase();
          if (s === "completed") completed++;
          else if (s === "in progress") inProgress++;
          else if (s === "blocked") blocked++;
          else pending++;
        });
      });
    });

    return { total, completed, inProgress, pending, blocked };
  }, [employees, calendarDates, tasksLookup]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${(firstName || "")[0] || ""}${(lastName || "")[0] || ""}`.toUpperCase() || "ST";
  };

  const getPriorityColor = (priority: string) => {
    const p = (priority || "").toLowerCase();
    if (p === "urgent") return "#ef4444";
    if (p === "high") return "#f97316";
    if (p === "low") return "#10b981";
    return "#3b82f6";
  };

  return (
    <div className={styles.calendarContainer}>
      {/* 1. Header Toolbar */}
      <div className={styles.calendarToolbar}>
        <div className={styles.calendarNavGroup}>
          <div className={styles.calendarMonthTitle}>
            <span className="material-symbols-outlined" style={{ color: "#3b82f6", fontSize: "22px" }}>
              calendar_month
            </span>
            <span>{monthTitle}</span>
          </div>

          <div className={styles.calendarNavBtns}>
            <button
              type="button"
              onClick={handlePrevMonth}
              className={styles.navArrowBtn}
              title="Previous Month"
              aria-label="Previous Month"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                chevron_left
              </span>
            </button>
            <button type="button" onClick={handleJumpToday} className={styles.navTodayBtn}>
              Today
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className={styles.navArrowBtn}
              title="Next Month"
              aria-label="Next Month"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                chevron_right
              </span>
            </button>
          </div>

          {/* Span Switcher */}
          <div className={styles.calendarSpanControls}>
            <button
              type="button"
              onClick={() => setViewSpan("MONTH")}
              className={`${styles.spanBtn} ${viewSpan === "MONTH" ? styles.spanBtnActive : ""}`}
            >
              Full Month
            </button>
            <button
              type="button"
              onClick={() => setViewSpan("14_DAYS")}
              className={`${styles.spanBtn} ${viewSpan === "14_DAYS" ? styles.spanBtnActive : ""}`}
            >
              2 Weeks
            </button>
            <button
              type="button"
              onClick={() => setViewSpan("7_DAYS")}
              className={`${styles.spanBtn} ${viewSpan === "7_DAYS" ? styles.spanBtnActive : ""}`}
            >
              1 Week
            </button>
          </div>
        </div>

        {/* Staff Filter Search */}
        <div style={{ position: "relative" }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "16px",
              color: "var(--text-muted, #94a3b8)",
              pointerEvents: "none",
            }}
          >
            search
          </span>
          <input
            type="text"
            placeholder="Search staff in schedule..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.calendarSearchInput}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "var(--text-muted, #94a3b8)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                close
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Legend & Period KPI Bar */}
      <div className={styles.calendarSubBar}>
        <div className={styles.legendList}>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: "#10b981" }} />
            <span>Completed ({periodKpi.completed})</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: "#a855f7" }} />
            <span>In Progress ({periodKpi.inProgress})</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: "#f59e0b" }} />
            <span>Pending ({periodKpi.pending})</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: "#ef4444" }} />
            <span>Blocked ({periodKpi.blocked})</span>
          </div>
        </div>

        <div className={styles.periodKpiGroup}>
          <div className={styles.kpiPill}>
            <span>Total Assigned:</span>
            <strong style={{ color: "var(--text-main)" }}>{periodKpi.total}</strong>
          </div>
          <div className={styles.kpiPill}>
            <span>Completion Rate:</span>
            <strong style={{ color: "#10b981" }}>
              {periodKpi.total > 0 ? `${Math.round((periodKpi.completed / periodKpi.total) * 100)}%` : "0%"}
            </strong>
          </div>
        </div>
      </div>

      {/* 3. Matrix Table Card */}
      <div className={styles.matrixCard}>
        <div className={styles.matrixScrollWrapper}>
          <table className={styles.matrixTable}>
            <thead>
              <tr>
                <th className={styles.headerEmployeeCol}>
                  <span>Assigned Employee</span>
                </th>

                {calendarDates.map((cd) => (
                  <th
                    key={cd.dateKey}
                    className={`${styles.headerDateCol} ${cd.isToday ? styles.headerDateColToday : ""} ${
                      cd.isWeekend ? styles.headerDateColWeekend : ""
                    }`}
                  >
                    <div className={styles.dateColDayName}>{cd.dayName}</div>
                    <div className={styles.dateColDayNum}>{cd.dayNum}</div>
                  </th>
                ))}

                <th className={styles.headerSummaryCol}>
                  <span>Period Progress</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.map((emp) => {
                const stats = employeeMonthlyTotals.get(emp.id) || {
                  total: 0,
                  completed: 0,
                  inProgress: 0,
                  pending: 0,
                  blocked: 0,
                };
                const designation = emp.designation || emp.designationRef?.name || emp.department || "Staff";
                const completionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

                return (
                  <tr key={emp.id} className={styles.matrixRow}>
                    <td className={styles.stickyEmpCell}>
                      <div className={styles.empCellProfile}>
                        <div
                          className={styles.empMiniAvatar}
                          style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
                        >
                          {getInitials(emp.firstName, emp.lastName)}
                        </div>
                        <div className={styles.empCellInfo}>
                          <div className={styles.empCellName} title={`${emp.firstName} ${emp.lastName}`}>
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className={styles.empCellSub}>
                            <span
                              className={styles.empMiniBadge}
                              style={{ color: "#60a5fa", background: "rgba(37, 99, 235, 0.15)" }}
                            >
                              {emp.employeeId || "EMP"}
                            </span>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {designation}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {calendarDates.map((cd) => {
                      const list1 = tasksLookup.get(`${emp.id}_${cd.dateKey}`) || [];
                      const list2 = emp.employeeId ? tasksLookup.get(`${emp.employeeId}_${cd.dateKey}`) || [] : [];
                      const dayTasks = [...list1];
                      list2.forEach((t) => {
                        if (!dayTasks.some((item) => item.id === t.id)) dayTasks.push(t);
                      });

                      const hasTasks = dayTasks.length > 0;

                      let cellStatusClass = styles.cellStatusEmpty;
                      let badgeLetter = "·";
                      let subText = "";
                      let cellTitle = `${emp.firstName} • ${cd.dateKey}: Click to assign task`;

                      if (hasTasks) {
                        const hasCompleted = dayTasks.every((t) => (t.status || "").toLowerCase() === "completed");
                        const hasBlocked = dayTasks.some((t) => (t.status || "").toLowerCase() === "blocked");
                        const hasInProgress = dayTasks.some((t) => (t.status || "").toLowerCase() === "in progress");

                        if (hasBlocked) {
                          cellStatusClass = styles.cellStatusA; // red badge
                        } else if (hasCompleted) {
                          cellStatusClass = styles.cellStatusP; // green badge
                        } else if (hasInProgress) {
                          cellStatusClass = styles.cellStatusH; // purple badge
                        } else {
                          cellStatusClass = styles.cellStatusL; // amber badge
                        }

                        badgeLetter = dayTasks.length > 1 ? `${dayTasks.length}T` : "TASK";
                        subText =
                          dayTasks.length > 1
                            ? `${dayTasks.filter((t) => (t.status || "").toLowerCase() === "completed").length}/${
                                dayTasks.length
                              }`
                            : (dayTasks[0]?.priority || "Med").slice(0, 3).toUpperCase();
                        cellTitle = `${emp.firstName} • ${dayTasks.length} task(s): ${dayTasks
                          .map((t) => `"${t.title}" (${t.status})`)
                          .join(", ")}`;
                      } else if (cd.isWeekend) {
                        cellStatusClass = styles.cellStatusOff;
                        badgeLetter = "OFF";
                        cellTitle = `${cd.fullDayName} • Weekend / Holiday`;
                      }

                      return (
                        <td
                          key={cd.dateKey}
                          className={`${styles.matrixDayCell} ${cd.isToday ? styles.matrixDayCellToday : ""} ${
                            cd.isWeekend ? styles.matrixDayCellWeekend : ""
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (hasTasks) {
                                setSelectedTaskForDetail(dayTasks[0]);
                              } else {
                                onAssignTask(emp.employeeId || emp.id, cd.dateKey);
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

                    {/* Sticky Employee Summary Cell */}
                    <td className={styles.stickySummaryCell}>
                      <div className={styles.summaryRowContent}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-main)" }}>
                            {stats.completed}/{stats.total}
                          </span>
                          <span
                            className={styles.statBadgeMini}
                            style={{
                              color: completionPct >= 80 ? "#10b981" : completionPct >= 40 ? "#3b82f6" : "#f59e0b",
                              background:
                                completionPct >= 80
                                  ? "rgba(16, 185, 129, 0.12)"
                                  : completionPct >= 40
                                  ? "rgba(59, 130, 246, 0.12)"
                                  : "rgba(245, 158, 11, 0.12)",
                            }}
                          >
                            {completionPct}%
                          </span>
                        </div>
                        <div
                          style={{
                            width: "100%",
                            height: "5px",
                            background: "var(--surface-hover, rgba(255, 255, 255, 0.08))",
                            borderRadius: "9999px",
                            overflow: "hidden",
                            marginTop: "4px",
                          }}
                        >
                          <div
                            style={{
                              width: `${completionPct}%`,
                              height: "100%",
                              background:
                                completionPct >= 80 ? "#10b981" : completionPct >= 40 ? "#3b82f6" : "#f59e0b",
                              borderRadius: "9999px",
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Daily Totals Footer */}
            <tfoot>
              <tr className={styles.totalsRow}>
                <td className={styles.totalsEmpCell}>
                  <span>Daily Task Load</span>
                </td>

                {dailyTotals.map((dt) => {
                  const hasTasks = dt.count > 0;
                  return (
                    <td
                      key={dt.dateKey}
                      className={styles.totalsDayCell}
                      title={`${dt.dateKey}: ${dt.count} tasks (${dt.completedCount} completed)`}
                    >
                      <span
                        style={{
                          color: hasTasks
                            ? dt.completedCount === dt.count
                              ? "#10b981"
                              : "#3b82f6"
                            : "var(--text-muted)",
                          fontWeight: hasTasks ? 700 : 400,
                        }}
                      >
                        {hasTasks ? `${dt.completedCount}/${dt.count}` : "-"}
                      </span>
                    </td>
                  );
                })}

                <td className={styles.totalsSummaryCell} style={{ color: "#3b82f6" }}>
                  <span>{periodKpi.total} Total Tasks</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 4. Task Quick Detail Popover */}
      {selectedTaskForDetail && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1100,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setSelectedTaskForDetail(null)}
        >
          <div
            style={{
              background: "var(--surface-card, #0f172a)",
              border: "1px solid var(--border-main, rgba(255, 255, 255, 0.12))",
              borderRadius: "16px",
              padding: "24px",
              width: "100%",
              maxWidth: "480px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "rgba(59, 130, 246, 0.15)",
                    color: "#3b82f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                    task_alt
                  </span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text-main, #f8fafc)" }}>
                    {selectedTaskForDetail.title}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: "4px",
                        color: getPriorityColor(selectedTaskForDetail.priority),
                        background: "rgba(255, 255, 255, 0.08)",
                      }}
                    >
                      {selectedTaskForDetail.priority}
                    </span>
                    <span style={{ fontSize: "11.5px", color: "var(--text-muted, #94a3b8)" }}>
                      Due: {selectedTaskForDetail.dueDate ? selectedTaskForDetail.dueDate.slice(0, 10) : "No deadline"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTaskForDetail(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted, #94a3b8)",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  borderRadius: "6px",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  close
                </span>
              </button>
            </div>

            {/* Description */}
            {selectedTaskForDetail.description && (
              <div
                style={{
                  background: "var(--surface-hover, rgba(255, 255, 255, 0.04))",
                  padding: "12px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  color: "var(--text-main, #e2e8f0)",
                  lineHeight: 1.5,
                  maxHeight: "120px",
                  overflowY: "auto",
                }}
              >
                {selectedTaskForDetail.description}
              </div>
            )}

            {/* Checklist items */}
            {(() => {
              const items = extractChecklistItems(selectedTaskForDetail.checklist);
              if (items.length === 0) return null;
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted, #94a3b8)" }}>
                    Checklist To-Dos ({items.filter((i) => i.completed).length}/{items.length}):
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      maxHeight: "160px",
                      overflowY: "auto",
                    }}
                  >
                    {items.map((item) => (
                      <label
                        key={item.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "12.5px",
                          color: item.completed ? "var(--text-muted, #94a3b8)" : "var(--text-main, #f8fafc)",
                          textDecoration: item.completed ? "line-through" : "none",
                          cursor: "pointer",
                          padding: "4px 6px",
                          borderRadius: "6px",
                          background: item.completed ? "transparent" : "rgba(255, 255, 255, 0.02)",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => onToggleChecklistItem(selectedTaskForDetail, item.id)}
                        />
                        <span>{item.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Inline Status Selector */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderRadius: "10px",
                background: "var(--surface-hover, rgba(255, 255, 255, 0.04))",
                border: "1px solid var(--border-main, rgba(255, 255, 255, 0.08))",
              }}
            >
              <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-muted, #94a3b8)" }}>
                Update Status:
              </span>
              <select
                value={selectedTaskForDetail.status}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  onStatusChange(selectedTaskForDetail.id, newStatus);
                  setSelectedTaskForDetail((prev) => (prev ? { ...prev, status: newStatus } : null));
                }}
                style={{
                  background: "var(--surface-card, #0f172a)",
                  color: "var(--text-main, #f8fafc)",
                  border: "1px solid var(--border-main, rgba(255, 255, 255, 0.15))",
                  borderRadius: "8px",
                  padding: "5px 10px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "4px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  const t = selectedTaskForDetail;
                  setSelectedTaskForDetail(null);
                  onDeleteTask(t);
                }}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => {
                  const t = selectedTaskForDetail;
                  setSelectedTaskForDetail(null);
                  onEditTask(t);
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: "var(--primary, #3b82f6)",
                  color: "#ffffff",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Edit Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
