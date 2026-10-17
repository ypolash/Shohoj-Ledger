"use client";

import React, { useState, useMemo, useEffect } from "react";
import styles from "../../attendance/horizontalCalendar.module.css";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  createdAt?: string;
  status?: string;
  priority?: string;
  assignedToEmployeeId?: string | null;
}

interface HorizontalTasksDateStripProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onClearDate: () => void;
  tasks: Task[];
  timezone?: string;
  weeklyHolidays?: string[];
}

export function HorizontalTasksDateStrip({
  selectedDate,
  onSelectDate,
  onClearDate,
  tasks,
  timezone = "Asia/Dhaka",
  weeklyHolidays = ["Friday", "Saturday"],
}: HorizontalTasksDateStripProps) {
  // Center anchor date (defaults to selectedDate or today)
  const [anchorDate, setAnchorDate] = useState<Date>(() => {
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      const [y, m, d] = selectedDate.split("-").map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  });

  // Keep anchor aligned if selectedDate changes externally
  useEffect(() => {
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      const [y, m, d] = selectedDate.split("-").map(Number);
      setAnchorDate(new Date(y, m - 1, d));
    }
  }, [selectedDate]);

  // Today key
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
  }, [timezone]);

  // Pre-index tasks by dateKey
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((t) => {
      let key = "";
      if (t.dueDate && typeof t.dueDate === "string") {
        key = t.dueDate.slice(0, 10);
      } else if (t.createdAt && typeof t.createdAt === "string") {
        key = t.createdAt.slice(0, 10);
      }
      if (key) {
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(t);
      }
    });
    return map;
  }, [tasks]);

  // Generate 15-day window centered on anchorDate (-7 days to +7 days)
  const stripDates = useMemo(() => {
    const dates = [];
    for (let offset = -7; offset <= 7; offset++) {
      const cur = new Date(anchorDate);
      cur.setDate(anchorDate.getDate() + offset);

      let dateKey = "";
      try {
        dateKey = new Intl.DateTimeFormat("en-CA", {
          timeZone: timezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(cur);
      } catch {
        dateKey = cur.toISOString().slice(0, 10);
      }

      const dayName = cur.toLocaleDateString("en-US", { weekday: "short", timeZone: timezone });
      const fullDayName = cur.toLocaleDateString("en-US", { weekday: "long", timeZone: timezone });
      const monthName = cur.toLocaleDateString("en-US", { month: "short", timeZone: timezone });
      const dayNum = cur.getDate();

      const isToday = dateKey === todayKey;
      const isSelected = dateKey === selectedDate;
      const isWeekend = weeklyHolidays.includes(fullDayName);

      const dayTasks = tasksByDate.get(dateKey) || [];
      const hasCompleted = dayTasks.some((t) => (t.status || "").toLowerCase() === "completed");
      const hasInProgress = dayTasks.some((t) => (t.status || "").toLowerCase() === "in progress");
      const hasPending = dayTasks.some((t) => (t.status || "").toLowerCase() === "pending" || (t.status || "").toLowerCase() === "to do");
      const hasBlocked = dayTasks.some((t) => (t.status || "").toLowerCase() === "blocked");

      dates.push({
        dateKey,
        dayName,
        monthName,
        dayNum,
        isToday,
        isSelected,
        isWeekend,
        totalCount: dayTasks.length,
        hasCompleted,
        hasInProgress,
        hasPending,
        hasBlocked,
      });
    }
    return dates;
  }, [anchorDate, timezone, todayKey, selectedDate, weeklyHolidays, tasksByDate]);

  const handlePrevWeek = () => {
    setAnchorDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setAnchorDate((prev) => {
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
          <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--primary, #3b82f6)" }}>
            calendar_view_week
          </span>
          <span>Horizontal Calendar Date Ribbon</span>
          {selectedDate && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#60a5fa",
                background: "rgba(37, 99, 235, 0.15)",
                padding: "2px 8px",
                borderRadius: "6px",
                textTransform: "none",
              }}
            >
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
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              chevron_left
            </span>
          </button>

          <button type="button" onClick={handleJumpToday} className={styles.stripTodayBtn}>
            Jump to Today
          </button>

          <button
            type="button"
            onClick={handleNextWeek}
            className={styles.stripNavBtn}
            title="Shift forward 7 days"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              chevron_right
            </span>
          </button>

          {selectedDate && (
            <button
              type="button"
              onClick={onClearDate}
              className={styles.stripTodayBtn}
              style={{ color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.3)" }}
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
        {stripDates.map((item) => (
          <div
            key={item.dateKey}
            onClick={() => onSelectDate(item.dateKey)}
            className={`${styles.dateStripCard} ${item.isSelected ? styles.dateStripCardActive : ""} ${
              item.isWeekend ? styles.dateStripCardWeekend : ""
            }`}
            title={`${item.dateKey} (${item.dayName}) • ${item.totalCount} Tasks`}
          >
            {item.isToday && <span className={styles.stripTodayBadge}>Today</span>}
            <span className={styles.stripDayName}>{item.dayName}</span>
            <span className={styles.stripDayNum}>{item.dayNum}</span>
            <span className={styles.stripMonthName}>{item.monthName}</span>

            {/* Status Dot Indicators */}
            <div className={styles.stripDotsRow}>
              {item.hasCompleted && (
                <span
                  className={styles.stripDot}
                  style={{ backgroundColor: "#10b981" }}
                  title="Completed tasks"
                />
              )}
              {item.hasInProgress && (
                <span
                  className={styles.stripDot}
                  style={{ backgroundColor: "#a855f7" }}
                  title="In-progress tasks"
                />
              )}
              {item.hasPending && (
                <span
                  className={styles.stripDot}
                  style={{ backgroundColor: "#f59e0b" }}
                  title="Pending tasks"
                />
              )}
              {item.hasBlocked && (
                <span
                  className={styles.stripDot}
                  style={{ backgroundColor: "#ef4444" }}
                  title="Blocked tasks"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
