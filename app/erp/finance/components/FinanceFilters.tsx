"use client";

import React from 'react';
import styles from './FinanceFilters.module.css';

interface FinanceFiltersProps {
  period: string;
  onPeriodChange: (period: string) => void;
  year: number;
  onYearChange: (year: number) => void;
  month: string;
  onMonthChange: (month: string) => void;
  account: string;
  onAccountChange: (account: string) => void;
  availableYears?: number[];
  periodLabel?: string;
}

const MONTHS = [
  { value: "ALL", label: "All Months (Full Year)" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const PERIOD_TABS = [
  {
    id: 'this_month',
    label: 'This Month',
    shortLabel: 'Month',
    icon: 'calendar_month',
    colorKey: 'this_month',
  },
  {
    id: 'last_month',
    label: 'Last Month',
    shortLabel: 'Last',
    icon: 'history',
    colorKey: 'last_month',
  },
  {
    id: 'this_quarter',
    label: 'This Quarter',
    shortLabel: 'Quarter',
    icon: 'pie_chart',
    colorKey: 'this_quarter',
  },
  {
    id: 'this_year',
    label: 'Full Year',
    shortLabel: 'Year',
    icon: 'date_range',
    colorKey: 'this_year',
  },
  {
    id: 'all',
    label: 'All Time',
    shortLabel: 'All',
    icon: 'all_inclusive',
    colorKey: 'all',
  },
];

export function FinanceFilters({
  period,
  onPeriodChange,
  year,
  onYearChange,
  month,
  onMonthChange,
  account,
  onAccountChange,
  availableYears = [2026, 2025],
  periodLabel
}: FinanceFiltersProps) {
  const currentYear = new Date().getFullYear();
  const yearsList = availableYears.length > 0 ? availableYears : [currentYear];

  const handlePeriodSelect = (p: string) => {
    onPeriodChange(p);
    if (p !== 'custom') {
      onMonthChange("ALL");
    }
  };

  const handleMonthSelect = (m: string) => {
    onMonthChange(m);
    if (m !== "ALL") {
      onPeriodChange("custom");
    } else {
      onPeriodChange("this_year");
    }
  };

  return (
    <div className={`glass-card ${styles.container}`}>
      <div className={styles.leftGroup}>
        <div className={styles.periodTitle}>
          <span className={`material-symbols-outlined ${styles.periodTitleIcon}`}>calendar_month</span>
          Period View:
        </div>

        {/* Quick Period Buttons - Square Icon View */}
        <div className={styles.periodTabsList} role="tablist" aria-label="Filter ledger by period">
          {PERIOD_TABS.map((tab) => {
            const isActive = period === tab.id && month === 'ALL';
            return (
              <div key={tab.id} className={styles.squareWrapper}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handlePeriodSelect(tab.id)}
                  className={`${styles.squareBtn} ${isActive ? styles.squareBtnActive : ''} ${styles[`square_${tab.colorKey}`]}`}
                  title={tab.label}
                  aria-label={tab.label}
                >
                  <span className={`material-symbols-outlined ${styles.squareIcon}`}>
                    {tab.icon}
                  </span>
                  <span className={styles.squareLabel}>{tab.shortLabel}</span>
                </button>
                <span className={styles.squareTooltip}>
                  {tab.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Dropdown Filters with Icons */}
        <div className={styles.dropdownGroup}>
          {/* Specific Month Select */}
          <div className={styles.selectWrapper}>
            <span className={`material-symbols-outlined ${styles.selectIcon}`}>calendar_today</span>
            <span className={styles.selectLabel}>Month:</span>
            <select 
              value={month}
              onChange={(e) => handleMonthSelect(e.target.value)}
              className={styles.selectField}
              aria-label="Filter by month"
            >
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Year Select */}
          <div className={styles.selectWrapper}>
            <span className={`material-symbols-outlined ${styles.selectIcon}`}>event</span>
            <span className={styles.selectLabel}>Year:</span>
            <select 
              value={year}
              onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
              className={styles.selectField}
              aria-label="Filter by year"
            >
              {yearsList.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Account Filter */}
          <div className={styles.selectWrapper}>
            <span className={`material-symbols-outlined ${styles.selectIcon}`}>account_balance</span>
            <span className={styles.selectLabel}>Account:</span>
            <select 
              value={account}
              onChange={(e) => onAccountChange(e.target.value)}
              className={styles.selectField}
              aria-label="Filter by account"
            >
              <option value="ALL">All Accounts</option>
              <option value="BANK">Bank Accounts</option>
              <option value="CASH">Cash in Hand</option>
              <option value="BKASH">bKash / MFS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Indicator Badge */}
      {periodLabel && (
        <div className={styles.activeBadge}>
          <span className={`material-symbols-outlined ${styles.badgeIcon}`}>visibility</span>
          Showing: {periodLabel}
        </div>
      )}
    </div>
  );
}
