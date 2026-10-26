"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import styles from './attendance.module.css';
import { HorizontalCalendarView } from './components/HorizontalCalendarView';
import { HorizontalDateStrip } from './components/HorizontalDateStrip';
import { isRegularStaff } from '@/lib/staff/staffFilter';

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

interface AllowedNetwork {
  id: string;
  name: string;
  ssid?: string | null;
  bssid?: string | null;
  ipAddress?: string | null;
  isActive: boolean;
  createdAt: string;
}

const EMPTY_FORM = {
  employeeId: '',
  date: new Date().toISOString().slice(0, 10),
  status: 'PRESENT',
  checkIn: '',
  checkOut: '',
  lateMinutes: '0',
  earlyLeaveMinutes: '0',
};

const EMPTY_NETWORK_FORM = {
  name: '',
  ssid: '',
  bssid: '',
  ipAddress: '',
  isActive: true,
};

interface DateAttendanceGroup {
  dateKey: string;
  formattedDate: string;
  fullDayLabel: string;
  isToday: boolean;
  isYesterday: boolean;
  records: AttendanceRecord[];
  totalCount: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  halfDayCount: number;
  earlyLeaveCount: number;
}

const getDateKey = (r: AttendanceRecord, tz: string = 'Asia/Dhaka') => {
  if (r.date) {
    if (typeof r.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(r.date)) {
      return r.date.slice(0, 10);
    }
    const d = new Date(r.date);
    if (!isNaN(d.getTime())) {
      try {
        return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
      } catch {
        return d.toISOString().slice(0, 10);
      }
    }
  }
  if (r.checkInTime) {
    const d = new Date(r.checkInTime);
    if (!isNaN(d.getTime())) {
      try {
        return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
      } catch {
        return d.toISOString().slice(0, 10);
      }
    }
  }
  return 'Unknown Date';
};

const formatDisplayTime = (val?: string | null | Date, tz: string = 'Asia/Dhaka') => {
  if (!val || val === '—') return '—';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '—';
    try {
      return val.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: tz });
    } catch {
      return val.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    }
  }
  const strVal = String(val);
  const trimmed = strVal.trim();
  if (/^\d{1,2}:\d{2}(\s?[AP]M)?$/i.test(trimmed)) {
    const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*([AP]M)?$/i);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = match[2];
      const mer = match[3]?.toUpperCase();
      if (!mer) {
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
      }
    }
    return trimmed;
  }
  const d = new Date(trimmed);
  if (isNaN(d.getTime())) return trimmed;
  try {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: tz });
  } catch {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }
};

const formatDisplayDate = (val?: string | null, tz: string = 'Asia/Dhaka') => {
  if (!val) return '—';
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
    const dateOnly = val.slice(0, 10);
    const [y, m, d] = dateOnly.split('-');
    return `${d}/${m}/${y}`;
  }
  const dateObj = new Date(val);
  if (isNaN(dateObj.getTime())) return val;
  try {
    return dateObj.toLocaleDateString('en-GB', { timeZone: tz });
  } catch {
    return dateObj.toLocaleDateString('en-GB');
  }
};

/**
 * ERP HR — Redesigned Attendance & Daily Shift Telemetry Hub
 * Enterprise attendance tracking with live operational metrics, multi-dimensional filters,
 * date-wise grouped view, detailed check-in/out timestamps, CSV export, network geofencing status, and attendance recording modal.
 */
export default function AttendancePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filterEmpId, setFilterEmpId] = useState('');
  const [filterDate, setFilterDate] = useState(() => {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  });
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'DATE_WISE' | 'HORIZONTAL_CALENDAR'>('DATE_WISE');
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({});
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM'>('TODAY');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Just now');
  const [officeTiming, setOfficeTiming] = useState({
    shiftStart: '09:30',
    shiftEnd: '18:00',
    gracePeriod: 15,
    timezone: 'Asia/Dhaka',
  });

  // Network Geofencing state
  const [networks, setNetworks] = useState<AllowedNetwork[]>([]);
  const [isLoadingNetworks, setIsLoadingNetworks] = useState(true);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [networkForm, setNetworkForm] = useState(EMPTY_NETWORK_FORM);
  const [networkSubmitting, setNetworkSubmitting] = useState(false);
  const [networkError, setNetworkError] = useState('');
  const [networkSuccess, setNetworkSuccess] = useState('');
  const [networkActionLoading, setNetworkActionLoading] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [attendanceToDelete, setAttendanceToDelete] = useState<AttendanceRecord | null>(null);
  const [deletingAttendanceId, setDeletingAttendanceId] = useState<string | null>(null);

  // Late consideration modal state
  const [considerModalOpen, setConsiderModalOpen] = useState(false);
  const [recordToConsider, setRecordToConsider] = useState<AttendanceRecord | null>(null);
  const [considerRawLateMinutes, setConsiderRawLateMinutes] = useState(0);
  const [considerWaiveMinutes, setConsiderWaiveMinutes] = useState('0');
  const [considerRemainingMinutes, setConsiderRemainingMinutes] = useState('0');
  const [considerFineAmount, setConsiderFineAmount] = useState('0');
  const [considerReason, setConsiderReason] = useState('Staff forgot to press check-in on time');
  const [considerSubmitting, setConsiderSubmitting] = useState(false);
  const [punishmentRules, setPunishmentRules] = useState<any[]>([]);

  // Approve Absent to Present modal state
  const [approveAbsentModalOpen, setApproveAbsentModalOpen] = useState(false);
  const [recordToApproveAbsent, setRecordToApproveAbsent] = useState<AttendanceRecord | null>(null);
  const [approveCheckInTime, setApproveCheckInTime] = useState('09:30');
  const [approveCheckOutTime, setApproveCheckOutTime] = useState('18:30');
  const [approveWaiveFine, setApproveWaiveFine] = useState(true);
  const [approveCustomFine, setApproveCustomFine] = useState('0');
  const [approveReason, setApproveReason] = useState('Staff attended office on time (Check-in omitted)');
  const [approveSubmitting, setApproveSubmitting] = useState(false);
  const [approvingAbsentId, setApprovingAbsentId] = useState<string | null>(null);

  // Check-out modal state (Manual Out & Half Day Out)
  const [autoCheckoutRecord, setAutoCheckoutRecord] = useState<AttendanceRecord | null>(null);
  const [checkoutMode, setCheckoutMode] = useState<'MANUAL' | 'HALF_DAY'>('MANUAL');
  const [autoCheckoutTimeInput, setAutoCheckoutTimeInput] = useState<string>('18:00');
  const [halfDayReason, setHalfDayReason] = useState<string>('Medical / Health Emergency (Staff fell ill)');
  const [customReasonNote, setCustomReasonNote] = useState<string>('');
  const [autoCheckoutSubmitting, setAutoCheckoutSubmitting] = useState(false);
  const [autoCheckoutLoadingId, setAutoCheckoutLoadingId] = useState<string | null>(null);

  const handleOpenAutoCheckoutModal = (rec: AttendanceRecord, defaultMode: 'MANUAL' | 'HALF_DAY' = 'MANUAL') => {
    setAutoCheckoutRecord(rec);
    setCheckoutMode(defaultMode);
    setHalfDayReason('Medical / Health Emergency (Staff fell ill)');
    setCustomReasonNote('');

    if (defaultMode === 'HALF_DAY') {
      try {
        const nowTz = new Intl.DateTimeFormat('en-GB', {
          timeZone: officeTiming.timezone || 'Asia/Dhaka',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).format(new Date());
        setAutoCheckoutTimeInput(nowTz);
      } catch {
        const now = new Date();
        setAutoCheckoutTimeInput(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      }
    } else {
      setAutoCheckoutTimeInput(officeTiming.shiftEnd || '18:00');
    }
  };

  const handleConfirmAutoCheckoutDirect = async (rec: AttendanceRecord) => {
    const timeToApply = officeTiming.shiftEnd || '18:00';
    setAutoCheckoutLoadingId(rec.id);
    try {
      const res = await fetch('/api/attendance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rec.id,
          action: 'MANUAL_CHECKOUT',
          checkoutType: 'MANUAL',
          checkOutTime: timeToApply,
        })
      });
      const d = await res.json();
      if (!res.ok) {
        alert(d.error || 'Failed to check out');
        return;
      }
      if (d.attendance) {
        setRecords(prev => prev.map(a => a.id === d.attendance.id ? { ...a, ...d.attendance } : a));
      }
      setSuccessMsg('Employee manual check-out saved successfully at shift end!');
      await loadData(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      alert('Network error while processing check out');
    } finally {
      setAutoCheckoutLoadingId(null);
    }
  };

  const handleConfirmAutoCheckout = async () => {
    if (!autoCheckoutRecord) return;
    const timeToApply = autoCheckoutTimeInput || officeTiming.shiftEnd || '18:00';
    setAutoCheckoutSubmitting(true);
    setAutoCheckoutLoadingId(autoCheckoutRecord.id);

    const isHalfDay = checkoutMode === 'HALF_DAY';
    const reasonText = isHalfDay
      ? (customReasonNote ? `${halfDayReason}: ${customReasonNote}` : `Emergency departure: ${halfDayReason} (HR Approved)`)
      : undefined;

    try {
      const res = await fetch('/api/attendance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: autoCheckoutRecord.id,
          action: isHalfDay ? 'HALF_DAY_OUT' : 'MANUAL_CHECKOUT',
          checkoutType: checkoutMode,
          checkOutTime: timeToApply,
          reason: reasonText,
        })
      });
      const d = await res.json();
      if (!res.ok) {
        alert(d.error || 'Failed to process check out');
        return;
      }
      if (d.attendance) {
        setRecords(prev => prev.map(a => a.id === d.attendance.id ? { ...a, ...d.attendance } : a));
      }
      setSuccessMsg(isHalfDay
        ? 'Emergency Half Day leave permit approved & staff clocked out!'
        : 'Employee manual check-out recorded successfully!'
      );
      setAutoCheckoutRecord(null);
      await loadData(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      alert('Network error while processing check out');
    } finally {
      setAutoCheckoutSubmitting(false);
      setAutoCheckoutLoadingId(null);
    }
  };

  const calculateRawLateMinutes = useCallback((
    rec: AttendanceRecord,
    timing: { shiftStart: string; gracePeriod: number; timezone: string }
  ): number => {
    const checkIn = rec.checkIn || rec.checkInTime;
    if (!checkIn) return rec.lateMinutes || 0;

    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timing.timezone || 'Asia/Dhaka',
        hourCycle: 'h23',
        hour12: false,
        hour: 'numeric',
        minute: 'numeric',
      });
      const parts = formatter.formatToParts(new Date(checkIn));
      let hour = 0;
      let min = 0;
      for (const p of parts) {
        if (p.type === 'hour') hour = parseInt(p.value, 10) || 0;
        if (p.type === 'minute') min = parseInt(p.value, 10) || 0;
      }
      if (hour === 24) hour = 0;

      const checkInMin = hour * 60 + min;

      const shiftParts = (timing.shiftStart || '09:00').split(':');
      const shiftHour = parseInt(shiftParts[0], 10) || 9;
      const shiftMin = parseInt(shiftParts[1], 10) || 0;
      const shiftStartMin = shiftHour * 60 + shiftMin;

      const threshold = shiftStartMin + (Number(timing.gracePeriod) || 0);
      if (checkInMin > threshold) {
        return checkInMin - threshold;
      }
      return 0;
    } catch {
      return rec.lateMinutes || 0;
    }
  }, []);

  const getRecordLateFine = useCallback((r: AttendanceRecord, rules: any[]): number => {
    // If the record was explicitly reviewed or waived by HR
    if (r.reviewStatus === 'CONSIDERED' || r.reviewStatus === 'WAIVED') {
      return Number(r.punishmentAmount || 0);
    }
    // If an explicit non-zero punishment amount was already set
    if (r.punishmentAmount !== undefined && r.punishmentAmount !== null && Number(r.punishmentAmount) > 0) {
      return Number(r.punishmentAmount);
    }
    // Otherwise calculate dynamically from configured active penalty slabs
    const lateMin = r.lateMinutes || 0;
    if (lateMin > 0 && Array.isArray(rules) && rules.length > 0) {
      const matched = rules.find((rule: any) =>
        rule.active !== false &&
        (rule.type === 'LATE' || rule.type === 'LATE_IN') &&
        lateMin >= (Number(rule.fromMinutes) || 0) &&
        lateMin <= (Number(rule.toMinutes) || 999999)
      );
      if (matched) return Number(matched.amount) || 0;
    }
    return 0;
  }, []);

  const getRecordAbsentFine = useCallback((r: AttendanceRecord, rules: any[]): number => {
    // If the record was explicitly reviewed or waived by HR
    if (r.reviewStatus === 'CONSIDERED' || r.reviewStatus === 'WAIVED') {
      return Number(r.punishmentAmount || 0);
    }
    // If an explicit non-zero punishment amount was already set
    if (r.punishmentAmount !== undefined && r.punishmentAmount !== null && Number(r.punishmentAmount) > 0) {
      return Number(r.punishmentAmount);
    }
    // Otherwise calculate dynamically from configured active penalty slabs
    if (Array.isArray(rules) && rules.length > 0) {
      const matched = rules.find((rule: any) =>
        rule.active !== false &&
        rule.type === 'ABSENT'
      );
      if (matched) return Number(matched.amount) || 0;
    }
    return 0;
  }, []);

  const handleOpenConsiderModal = (rec: AttendanceRecord) => {
    setRecordToConsider(rec);
    const rawLate = calculateRawLateMinutes(rec, officeTiming);
    const effectiveRaw = rawLate > 0 ? rawLate : (rec.lateMinutes || 0);
    setConsiderRawLateMinutes(effectiveRaw);

    // If existing record was already considered, parse previous consideration
    const match = rec.punishmentReason?.match(/HR Considered (\d+)\s*min/i);
    if (match && match[1]) {
      const prevConsidered = parseInt(match[1], 10);
      setConsiderWaiveMinutes(String(prevConsidered));
      setConsiderRemainingMinutes(String(Math.max(0, effectiveRaw - prevConsidered)));
    } else if (rec.reviewStatus === 'CONSIDERED') {
      if (effectiveRaw > (rec.lateMinutes || 0)) {
        const prevConsidered = effectiveRaw - (rec.lateMinutes || 0);
        setConsiderWaiveMinutes(String(prevConsidered));
        setConsiderRemainingMinutes(String(rec.lateMinutes || 0));
      } else {
        setConsiderWaiveMinutes(String(effectiveRaw));
        setConsiderRemainingMinutes('0');
      }
    } else {
      // By default for new consideration, default to waiving 100%
      setConsiderWaiveMinutes(String(effectiveRaw));
      setConsiderRemainingMinutes('0');
    }

    setConsiderFineAmount(String(Number(rec.punishmentAmount || 0)));
    setConsiderReason(
      rec.punishmentReason
        ? rec.punishmentReason.replace(/^HR Considered \d+ min:\s*/i, '')
        : 'Staff forgot to press check-in on time'
    );
    setConsiderModalOpen(true);
  };

  const handleWaiveMinutesChange = (valStr: string) => {
    setConsiderWaiveMinutes(valStr);
    const waiveNum = parseInt(valStr, 10);
    if (!isNaN(waiveNum)) {
      const rem = Math.max(0, considerRawLateMinutes - waiveNum);
      setConsiderRemainingMinutes(String(rem));
    }
  };

  const handleRemainingMinutesChange = (valStr: string) => {
    setConsiderRemainingMinutes(valStr);
    const remNum = parseInt(valStr, 10);
    if (!isNaN(remNum)) {
      const waive = Math.max(0, considerRawLateMinutes - remNum);
      setConsiderWaiveMinutes(String(waive));
    }
  };

  const handleConfirmConsiderLate = async () => {
    if (!recordToConsider) return;
    setConsiderSubmitting(true);
    try {
      const considered = Number(considerWaiveMinutes) || 0;
      const remaining = Number(considerRemainingMinutes) || 0;
      const fine = Number(considerFineAmount) || 0;

      const baseReason = considerReason.trim() || 'Staff forgot to press check-in on time';
      const reasonText = considered > 0
        ? `HR Considered ${considered} min: ${baseReason}`
        : baseReason;

      const res = await fetch('/api/attendance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: recordToConsider.id,
          action: 'CONSIDER_LATE',
          lateMinutes: remaining,
          consideredMinutes: considered,
          originalLateMinutes: considerRawLateMinutes,
          punishmentAmount: fine,
          reason: reasonText,
        })
      });
      const d = await res.json();
      if (!res.ok) {
        alert(d.error || 'Failed to save late consideration');
        return;
      }
      if (d.attendance) {
        setRecords(prev => prev.map(a => a.id === d.attendance.id ? { ...a, ...d.attendance } : a));
      }
      setSuccessMsg(`HR considered ${considered} min. Effective late: +${remaining} min late saved!`);
      setConsiderModalOpen(false);
      setRecordToConsider(null);
      await loadData(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      alert('Network error while updating attendance');
    } finally {
      setConsiderSubmitting(false);
    }
  };

  const handleRevertConsiderLate = async (rec: AttendanceRecord) => {
    if (!confirm('Revert HR consideration and recalculate arrival status based on recorded clock-in time?')) return;
    try {
      const res = await fetch('/api/attendance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rec.id,
          action: 'REVERT_CONSIDERATION',
        })
      });
      const d = await res.json();
      if (!res.ok) {
        alert(d.error || 'Failed to revert consideration');
        return;
      }
      setSuccessMsg('Reverted HR consideration back to original system log.');
      await loadData(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      alert('Network error reverting consideration');
    }
  };

  const handleOpenApproveAbsentModal = (rec: AttendanceRecord) => {
    setRecordToApproveAbsent(rec);
    const shiftStart = officeTiming?.shiftStartTime || '09:30';
    const shiftEnd = officeTiming?.shiftEndTime || '18:30';
    setApproveCheckInTime(shiftStart);
    setApproveCheckOutTime(shiftEnd);
    setApproveWaiveFine(true);
    const absentFine = getRecordAbsentFine(rec, punishmentRules);
    setApproveCustomFine(String(absentFine || 0));
    setApproveReason('Staff was present on duty (Check-in omitted)');
    setApproveAbsentModalOpen(true);
  };

  const handleConfirmApproveAbsent = async () => {
    if (!recordToApproveAbsent) return;
    setApproveSubmitting(true);
    setApprovingAbsentId(recordToApproveAbsent.id);
    try {
      const res = await fetch('/api/attendance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: recordToApproveAbsent.id,
          action: 'APPROVE_ABSENT_TO_PRESENT',
          checkInTime: approveCheckInTime,
          checkOutTime: approveCheckOutTime,
          waiveFine: approveWaiveFine,
          customFineAmount: approveWaiveFine ? 0 : Number(approveCustomFine),
          reason: approveReason.trim() || 'Staff was present on duty (Check-in omitted)'
        })
      });
      const d = await res.json();
      if (!res.ok) {
        alert(d.error || 'Failed to approve attendance');
        return;
      }
      const empName = recordToApproveAbsent.employee
        ? `${recordToApproveAbsent.employee.firstName} ${recordToApproveAbsent.employee.lastName}`
        : 'Staff';
      setSuccessMsg(`${empName} marked as Present! Absence penalty considered & waived.`);
      setApproveAbsentModalOpen(false);
      setRecordToApproveAbsent(null);
      await loadData(false);
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch {
      alert('Network error while approving attendance');
    } finally {
      setApproveSubmitting(false);
      setApprovingAbsentId(null);
    }
  };

  const toggleDateCollapse = (dateKey: string) => {
    setCollapsedDates(prev => ({
      ...prev,
      [dateKey]: !prev[dateKey]
    }));
  };

  const collapseAllDates = () => {
    const all: Record<string, boolean> = {};
    dateGroups.forEach(g => {
      all[g.dateKey] = true;
    });
    setCollapsedDates(all);
  };

  const expandAllDates = () => {
    setCollapsedDates({});
  };

  const handleConfirmDeleteAttendance = async () => {
    if (!attendanceToDelete) return;
    setDeletingAttendanceId(attendanceToDelete.id);
    try {
      const res = await fetch(`/api/attendance?id=${attendanceToDelete.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setRecords(prev => prev.filter(a => a.id !== attendanceToDelete.id));
        setAttendanceToDelete(null);
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || 'Failed to delete attendance record');
      }
    } catch (err: any) {
      alert('Network error deleting attendance: ' + err.message);
    } finally {
      setDeletingAttendanceId(null);
    }
  };

  const loadNetworks = useCallback(async () => {
    setIsLoadingNetworks(true);
    try {
      const res = await fetch('/api/attendance/networks', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setNetworks(Array.isArray(data.data) ? data.data : []);
      }
    } catch (e) {
      console.error('Failed to load allowed networks:', e);
    } finally {
      setIsLoadingNetworks(false);
    }
  }, []);

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setIsSyncing(true);
    else setIsLoading(true);

    try {
      const [attRes, empRes, hrRes] = await Promise.all([
        fetch(filterEmpId ? `/api/attendance?employeeId=${filterEmpId}` : '/api/attendance', { cache: 'no-store' }).catch(() => null),
        fetch('/api/employees', { cache: 'no-store' }).catch(() => null),
        fetch('/api/hr/settings', { cache: 'no-store' }).catch(() => null),
      ]);

      if (attRes && attRes.ok) {
        const attData = await attRes.json().catch(() => null);
        if (attData && Array.isArray(attData)) {
          setRecords(attData.filter((r: any) => isRegularStaff(r.employee)));
        }
      }
      if (empRes && empRes.ok) {
        const empData = await empRes.json().catch(() => null);
        if (empData && Array.isArray(empData)) {
          setEmployees(empData.filter((e: any) => isRegularStaff(e)));
        }
      }
      if (hrRes && hrRes.ok) {
        const hrData = await hrRes.json().catch(() => null);
        if (hrData) {
          const raw = hrData.data || hrData;
          const tz = raw.companySetting?.timezone;
          setOfficeTiming({
            shiftStart: raw.attendanceConfig?.shiftStart || raw.companySetting?.shiftStartTime || '09:30',
            shiftEnd: raw.attendanceConfig?.shiftEnd || raw.companySetting?.shiftEndTime || '18:00',
            gracePeriod: raw.attendanceConfig?.gracePeriod ?? raw.companySetting?.gracePeriodMinutes ?? 15,
            timezone: (!tz || tz === 'UTC' || tz === 'UTC / GMT') ? 'Asia/Dhaka' : tz,
          });
          if (Array.isArray(raw.punishmentSettings)) {
            setPunishmentRules(raw.punishmentSettings);
          }
        }
      }

      if (isManual) {
        await loadNetworks();
      }

      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.error('Failed to load attendance records:', e);
    } finally {
      setIsLoading(false);
      if (isManual) setIsSyncing(false);
    }
  }, [filterEmpId, loadNetworks]);

  useEffect(() => {
    setIsMounted(true);
    loadData();
    loadNetworks();

    const onRefetch = () => loadData(true);
    window.addEventListener('attendance-refetch', onRefetch);
    return () => window.removeEventListener('attendance-refetch', onRefetch);
  }, [loadData, loadNetworks]);

  // Handle register network
  const handleCreateNetwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!networkForm.name && !networkForm.ssid && !networkForm.ipAddress) {
      setNetworkError('Please specify at least a Network Name, SSID, or IP Address.');
      return;
    }
    setNetworkSubmitting(true);
    setNetworkError('');
    try {
      const res = await fetch('/api/attendance/networks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(networkForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setNetworkError(data.message || 'Failed to register office network');
        return;
      }
      setNetworkSuccess('Office network registered and authorized successfully!');
      setNetworkForm(EMPTY_NETWORK_FORM);
      await loadNetworks();
      setTimeout(() => setNetworkSuccess(''), 4000);
    } catch {
      setNetworkError('Network communication failure. Please try again.');
    } finally {
      setNetworkSubmitting(false);
    }
  };

  // Handle delete network
  const handleDeleteNetwork = async (id: string) => {
    if (!confirm('Are you sure you want to remove this authorized office network? Staff will no longer be able to check in via this network.')) return;
    setNetworkActionLoading(id);
    try {
      const res = await fetch(`/api/attendance/networks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadNetworks();
      } else {
        const d = await res.json();
        alert(d.message || 'Failed to delete network');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while deleting');
    } finally {
      setNetworkActionLoading(null);
    }
  };

  const activeNetworks = useMemo(() => {
    return networks.filter(n => n.isActive !== false);
  }, [networks]);
  const isNetworkConfigured = activeNetworks.length > 0;

  const empMap = useMemo(() => {
    const map: Record<string, Employee> = {};
    employees.forEach(e => {
      if (e.id) map[e.id] = e;
      if (e.employeeId) map[e.employeeId] = e;
    });
    return map;
  }, [employees]);

  // Derived metrics
  const todayRecords = useMemo(() => {
    const today = new Date();
    const todayLocalStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todayUtcStr = today.toISOString().slice(0, 10);
    return records.filter(r => {
      if (!r.date && !r.checkInTime) return false;
      const dStr = (r.date || r.checkInTime || '').slice(0, 10);
      return dStr === todayLocalStr || dStr === todayUtcStr;
    });
  }, [records]);

  const presentCount = records.filter(r => r.status === 'PRESENT').length;
  const lateCount = records.filter(r => r.status === 'LATE' || (r.lateMinutes && r.lateMinutes > 0)).length;
  const absentCount = records.filter(r => r.status === 'ABSENT').length;
  const halfDayCount = records.filter(r => r.status === 'HALF_DAY').length;

  const totalEmps = employees.length;
  const todayPresent = todayRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
  const attendanceRate = totalEmps > 0 ? Math.round((todayPresent / totalEmps) * 100) : 100;

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesEmp = !filterEmpId || r.employeeId === filterEmpId;
      const rDateKey = getDateKey(r, officeTiming.timezone);

      let matchesDate = true;
      if (filterDate) {
        matchesDate = rDateKey === filterDate;
      } else if (datePreset === 'TODAY') {
        const today = new Date();
        const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: officeTiming.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(today);
        matchesDate = rDateKey === todayStr;
      } else if (datePreset === 'YESTERDAY') {
        const yest = new Date();
        yest.setDate(yest.getDate() - 1);
        const yestStr = new Intl.DateTimeFormat('en-CA', { timeZone: officeTiming.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(yest);
        matchesDate = rDateKey === yestStr;
      } else if (datePreset === 'THIS_WEEK') {
        const today = new Date();
        const rDate = new Date(rDateKey);
        const diffDays = (today.getTime() - rDate.getTime()) / (1000 * 3600 * 24);
        matchesDate = diffDays >= 0 && diffDays <= 7;
      } else if (datePreset === 'THIS_MONTH') {
        const today = new Date();
        const currentMonthPrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        matchesDate = rDateKey.startsWith(currentMonthPrefix);
      }

      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      return matchesEmp && matchesDate && matchesStatus;
    });
  }, [records, filterEmpId, filterDate, datePreset, statusFilter, officeTiming.timezone]);

  // Date-wise groups for hierarchical date view
  const dateGroups = useMemo<DateAttendanceGroup[]>(() => {
    const groupsMap = new Map<string, AttendanceRecord[]>();

    // Sort filtered records chronologically descending first
    const sorted = [...filteredRecords].sort((a, b) => {
      const timeA = new Date(a.date || a.checkInTime || 0).getTime();
      const timeB = new Date(b.date || b.checkInTime || 0).getTime();
      return timeB - timeA;
    });

    sorted.forEach(r => {
      const key = getDateKey(r, officeTiming.timezone);
      if (!groupsMap.has(key)) {
        groupsMap.set(key, []);
      }
      groupsMap.get(key)!.push(r);
    });

    const today = new Date();
    let todayKey = '';
    let yesterdayKey = '';
    try {
      todayKey = new Intl.DateTimeFormat('en-CA', { timeZone: officeTiming.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(today);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterdayKey = new Intl.DateTimeFormat('en-CA', { timeZone: officeTiming.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(yesterday);
    } catch {
      todayKey = today.toISOString().slice(0, 10);
    }

    return Array.from(groupsMap.entries()).map(([dateKey, recs]) => {
      const isToday = dateKey === todayKey;
      const isYesterday = dateKey === yesterdayKey;

      let fullDayLabel = dateKey;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        const [y, m, d] = dateKey.split('-').map(Number);
        const parsed = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
        try {
          fullDayLabel = parsed.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC'
          });
        } catch {
          fullDayLabel = `${d}/${m}/${y}`;
        }
      }

      const presentCount = recs.filter(r => r.status === 'PRESENT' && (!r.lateMinutes || r.lateMinutes === 0)).length;
      const lateCount = recs.filter(r => r.status === 'LATE' || (r.lateMinutes && r.lateMinutes > 0)).length;
      const absentCount = recs.filter(r => r.status === 'ABSENT').length;
      const halfDayCount = recs.filter(r => r.status === 'HALF_DAY').length;
      const earlyLeaveCount = recs.filter(r => r.earlyLeaveMinutes && r.earlyLeaveMinutes > 0).length;

      return {
        dateKey,
        formattedDate: formatDisplayDate(dateKey, officeTiming.timezone),
        fullDayLabel,
        isToday,
        isYesterday,
        records: recs,
        totalCount: recs.length,
        presentCount,
        lateCount,
        absentCount,
        halfDayCount,
        earlyLeaveCount,
      };
    });
  }, [filteredRecords, officeTiming.timezone]);

  // Form submission
  const handleForm = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: form.employeeId,
          date: form.date,
          status: form.status,
          checkIn: form.checkIn || undefined,
          checkOut: form.checkOut || undefined,
          lateMinutes: Number(form.lateMinutes) || 0,
          earlyLeaveMinutes: Number(form.earlyLeaveMinutes) || 0,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || 'Failed to record attendance');
        return;
      }

      setSuccessMsg('Attendance recorded successfully!');
      setShowModal(false);
      setForm(EMPTY_FORM);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      setError('Network communication error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecalculateLate = async () => {
    setIsRecalculating(true);
    setError('');
    try {
      const res = await fetch('/api/attendance/recalculate', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || `Attendance late and early leave durations recalculated! ${data.updatedCount ?? 0} record(s) updated.`);
        await loadData(false);
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setError(data.error || 'Failed to recalculate attendance');
      }
    } catch {
      setError('Network communication error while recalculating');
    } finally {
      setIsRecalculating(false);
    }
  };

  const [isEvaluatingAbsent, setIsEvaluatingAbsent] = useState(false);
  const handleEvaluateAbsent = async () => {
    setIsEvaluatingAbsent(true);
    setError('');
    try {
      const res = await fetch('/api/hr/attendance/evaluate-absent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: filterDate || undefined })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Absence Audit Complete: ${data.absentCount} absent staff marked with ৳${data.totalPenalties} in fines/penalties.`);
        await loadData(true);
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setError(data.error || 'Failed to evaluate absent staff');
      }
    } catch {
      setError('Network communication error while evaluating absences');
    } finally {
      setIsEvaluatingAbsent(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (records.length === 0) return;
    const headers = ['Employee Name', 'Employee ID', 'Date', 'Status', 'Check In', 'Check Out', 'Late (Minutes)', 'Early Leave (Minutes)', 'Penalty Amount'];
    const rows = filteredRecords.map(r => {
      const emp = empMap[r.employeeId];
      return [
        emp ? `${emp.firstName} ${emp.lastName}` : 'Staff',
        emp?.employeeId || '',
        r.date ? formatDisplayDate(r.date, officeTiming.timezone) : '',
        r.status,
        formatDisplayTime(r.checkIn || r.checkInTime, officeTiming.timezone),
        formatDisplayTime(r.checkOut || r.checkOutTime, officeTiming.timezone),
        r.lateMinutes || 0,
        r.earlyLeaveMinutes || 0,
        r.status === 'ABSENT' ? getRecordAbsentFine(r, punishmentRules) : getRecordLateFine(r, punishmentRules),
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendance_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return styles.statusPresent;
      case 'LATE':
        return styles.statusLate;
      case 'ABSENT':
        return styles.statusAbsent;
      case 'HALF_DAY':
        return styles.statusHalfDay;
      default:
        return styles.statusOffDay;
    }
  };

  return (
    <div className={styles.container}>
      {/* 1. Executive Header */}
      <header className={styles.headerCard}>
        <div className={styles.headerTitleGroup}>
          <h1 className={styles.pageTitle}>
            Attendance Tracking &amp; Shifts
            <span className={styles.titleBadge} suppressHydrationWarning>{records.length} Logs</span>
          </h1>
        </div>

        <div className={styles.headerActions}>
          <button
            onClick={handleExportCSV}
            className={styles.headerIconBtn}
            disabled={!isMounted || records.length === 0}
            title="Export CSV Log"
            aria-label="Export CSV Log"
            suppressHydrationWarning
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>download</span>
          </button>

          <button
            onClick={() => loadData(true)}
            className={styles.headerIconBtn}
            disabled={isSyncing}
            title="Refresh Attendance Logs"
            aria-label="Refresh Attendance Logs"
          >
            <span
              className={`material-symbols-outlined ${isSyncing ? styles.spinning : ''}`}
              style={{ fontSize: '20px' }}
            >
              refresh
            </span>
          </button>

          <button
            onClick={handleEvaluateAbsent}
            className={styles.headerIconBtn}
            disabled={isEvaluatingAbsent}
            title="Scan & Evaluate Absences and Penalties for Today / Selected Date"
            aria-label="Evaluate Absences & Penalties"
          >
            <span
              className={`material-symbols-outlined ${isEvaluatingAbsent ? styles.spinning : ''}`}
              style={{ fontSize: '20px', color: '#ef4444' }}
            >
              person_off
            </span>
          </button>

          <button
            onClick={handleRecalculateLate}
            className={styles.headerIconBtn}
            disabled={isRecalculating}
            title="Recalculate Late Durations (past 60 days)"
            aria-label="Recalculate Late Durations"
          >
            <span
              className={`material-symbols-outlined ${isRecalculating ? styles.spinning : ''}`}
              style={{ fontSize: '20px', color: '#f59e0b' }}
            >
              schedule
            </span>
          </button>

          <button
            onClick={() => {
              setNetworkError('');
              setNetworkSuccess('');
              setShowNetworkModal(true);
            }}
            className={`${styles.headerIconBtn} ${!isNetworkConfigured ? styles.wifiUnconfiguredBtn : ''}`}
            title={
              isNetworkConfigured
                ? "Office Network Protected — Click to configure Wi-Fi / IP"
                : "⚠️ Action Required: Office Network Not Configured (Click to set up Wi-Fi / IP)"
            }
            aria-label="Configure Allowed Office Wi-Fi / Networks"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '20px', color: isNetworkConfigured ? '#059669' : '#f59e0b' }}
            >
              {isNetworkConfigured ? 'wifi_lock' : 'wifi_off'}
            </span>
          </button>

          <button
            onClick={() => {
              setForm({
                ...EMPTY_FORM,
                employeeId: employees[0]?.id || '',
              });
              setError('');
              setShowModal(true);
            }}
            className={`${styles.headerIconBtn} ${styles.headerIconBtnPrimary}`}
            title="Record Attendance"
            aria-label="Record Attendance"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
          </button>
        </div>
      </header>

      {/* Success Alert Banner */}
      {successMsg && (
        <div className={`${styles.alertBox} ${styles.alertSuccess}`}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}


      {/* 3. Filter & Controls Bar */}
      <section className={styles.controlsCard}>
        <div className={styles.controlsTopRow}>
          {/* Employee Select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-muted)' }}>person</span>
            <select
              value={filterEmpId}
              onChange={e => setFilterEmpId(e.target.value)}
              className={styles.selectDropdown}
              style={{ flex: 1 }}
            >
              <option value="">All Personnel ({employees.length} Staff)</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} ({e.employeeId || 'ID'})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Date Presets */}
          <div className={styles.datePresetList}>
            <button
              type="button"
              onClick={() => { setDatePreset('ALL'); setFilterDate(''); }}
              className={`${styles.datePresetBtn} ${datePreset === 'ALL' && !filterDate ? styles.datePresetBtnActive : ''}`}
            >
              All Dates
            </button>
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: officeTiming.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(today);
                setFilterDate(todayStr);
                setDatePreset('TODAY');
              }}
              className={`${styles.datePresetBtn} ${datePreset === 'TODAY' ? styles.datePresetBtnActive : ''}`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yestStr = new Intl.DateTimeFormat('en-CA', { timeZone: officeTiming.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(yesterday);
                setFilterDate(yestStr);
                setDatePreset('YESTERDAY');
              }}
              className={`${styles.datePresetBtn} ${datePreset === 'YESTERDAY' ? styles.datePresetBtnActive : ''}`}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => { setFilterDate(''); setDatePreset('THIS_WEEK'); }}
              className={`${styles.datePresetBtn} ${datePreset === 'THIS_WEEK' ? styles.datePresetBtnActive : ''}`}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => { setFilterDate(''); setDatePreset('THIS_MONTH'); }}
              className={`${styles.datePresetBtn} ${datePreset === 'THIS_MONTH' ? styles.datePresetBtnActive : ''}`}
            >
              This Month
            </button>
          </div>

          {/* Date Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-muted)' }}>calendar_today</span>
            <input
              type="date"
              value={filterDate}
              onChange={e => {
                setFilterDate(e.target.value);
                setDatePreset('CUSTOM' as any);
              }}
              className={styles.selectDropdown}
            />
          </div>

          {(filterEmpId || filterDate || statusFilter !== 'ALL' || datePreset !== 'ALL') && (
            <button
              onClick={() => {
                setFilterEmpId('');
                setFilterDate('');
                setDatePreset('ALL');
                setStatusFilter('ALL');
              }}
              className={styles.secondaryBtn}
              style={{ padding: '8px 12px', fontSize: '12px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>filter_alt_off</span>
              Reset
            </button>
          )}
        </div>

        {/* Horizontal Calendar Date Ribbon Strip */}
        <HorizontalDateStrip
          selectedDate={filterDate}
          onSelectDate={(dateKey) => {
            setFilterDate(dateKey);
            setDatePreset('CUSTOM' as any);
          }}
          onClearDate={() => {
            setFilterDate('');
            setDatePreset('ALL');
          }}
          records={records}
          timezone={officeTiming.timezone}
        />

        <div className={styles.controlsBottomRow}>
          {/* Status Tabs - Square Boxes with Icons and Hover Tooltips */}
          <div className={styles.statusTabsList} role="tablist" aria-label="Filter attendance by status">
            {[
              {
                id: 'ALL',
                label: 'All Logs',
                icon: 'checklist',
                count: records.length,
                colorKey: 'all',
              },
              {
                id: 'PRESENT',
                label: 'Present',
                icon: 'check_circle',
                count: presentCount,
                colorKey: 'present',
              },
              {
                id: 'LATE',
                label: 'Late',
                icon: 'schedule',
                count: lateCount,
                colorKey: 'late',
              },
              {
                id: 'ABSENT',
                label: 'Absent',
                icon: 'person_off',
                count: absentCount,
                colorKey: 'absent',
              },
              {
                id: 'HALF_DAY',
                label: 'Half Day',
                icon: 'timelapse',
                count: halfDayCount,
                colorKey: 'halfDay',
              },
            ].map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <div key={tab.id} className={styles.statusSquareWrapper}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`${styles.statusSquareBtn} ${isActive ? styles.statusSquareBtnActive : ''} ${styles[`statusSquare_${tab.colorKey}`]}`}
                    title={`${tab.label} (${tab.count})`}
                    aria-label={`${tab.label} (${tab.count})`}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      {tab.icon}
                    </span>
                    <span className={styles.statusSquareCount}>{tab.count}</span>
                  </button>
                  <span className={styles.statusSquareTooltip}>
                    {tab.label} ({tab.count})
                  </span>
                </div>
              );
            })}
          </div>

          {/* View Mode Toggle - Icon Only View */}
          <div className={styles.viewModeSwitcher} role="group" aria-label="Attendance view mode">
            <button
              type="button"
              onClick={() => setViewMode('DATE_WISE')}
              className={`${styles.viewModeBtn} ${viewMode === 'DATE_WISE' ? styles.viewModeBtnActive : ''}`}
              title="Date-wise View"
              aria-label="Date-wise View"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>calendar_view_day</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('HORIZONTAL_CALENDAR')}
              className={`${styles.viewModeBtn} ${viewMode === 'HORIZONTAL_CALENDAR' ? styles.viewModeBtnActive : ''}`}
              title="Horizontal Calendar"
              aria-label="Horizontal Calendar"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>calendar_month</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. Attendance Data View / Empty State */}
      {isLoading ? (
        <div className={styles.tableCard} style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={styles.skeleton} style={{ height: '52px', borderRadius: '12px' }} />
            ))}
          </div>
        </div>
      ) : viewMode === 'HORIZONTAL_CALENDAR' ? (
        <HorizontalCalendarView
          records={records}
          employees={employees}
          officeTiming={officeTiming}
          punishmentRules={punishmentRules}
          onAddRecord={(empId, dateKey) => {
            setForm({
              ...EMPTY_FORM,
              employeeId: empId,
              date: dateKey,
            });
            setError('');
            setShowModal(true);
          }}
          onConsiderLate={handleOpenConsiderModal}
          onApproveAbsent={handleOpenApproveAbsentModal}
          onAutoCheckout={handleOpenAutoCheckoutModal}
          onDeleteRecord={setAttendanceToDelete}
        />
      ) : filteredRecords.length === 0 ? (
        <div className={styles.emptyStateBox}>
          <div className={styles.emptyStateIcon}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
              {filterEmpId || filterDate || statusFilter !== 'ALL' || datePreset !== 'ALL' ? 'search_off' : 'fact_check'}
            </span>
          </div>

          {filterEmpId || filterDate || statusFilter !== 'ALL' || datePreset !== 'ALL' ? (
            <>
              <h3 className={styles.emptyStateTitle}>No Matching Attendance Records</h3>
              <p className={styles.emptyStateDesc}>
                No attendance logs found matching your filter selection. Try adjusting the date or clearing filters.
              </p>
              <button
                onClick={() => {
                  setFilterEmpId('');
                  setFilterDate('');
                  setDatePreset('ALL');
                  setStatusFilter('ALL');
                }}
                className={styles.secondaryBtn}
                style={{ marginTop: '6px' }}
              >
                Clear All Filters
              </button>
            </>
          ) : (
            <>
              <h3 className={styles.emptyStateTitle}>No Attendance Records Logged</h3>
              <p className={styles.emptyStateDesc}>
                There are currently no attendance entries recorded. Clock in staff members or log daily shifts to begin tracking attendance telemetry.
              </p>
              <button
                onClick={() => {
                  setForm({
                    ...EMPTY_FORM,
                    employeeId: employees[0]?.id || '',
                  });
                  setError('');
                  setShowModal(true);
                }}
                className={styles.primaryBtn}
                style={{ marginTop: '8px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                Record First Attendance
              </button>
            </>
          )}
        </div>
      ) : (
        /* Date-wise Grouped View */
        <div className={styles.dateGroupsContainer}>
          {/* Action & Count Summary Bar */}
          <div className={styles.dateGroupControlBar}>
            <div className={styles.dateGroupCountLabel}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>event_note</span>
              <span>Showing {dateGroups.length} Date {dateGroups.length === 1 ? 'Group' : 'Groups'} ({filteredRecords.length} Attendance Logs)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={expandAllDates}
                className={styles.collapseToggleAllBtn}
                title="Expand all date cards"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>unfold_more</span>
                Expand All
              </button>
              <button
                type="button"
                onClick={collapseAllDates}
                className={styles.collapseToggleAllBtn}
                title="Collapse all date cards"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>unfold_less</span>
                Collapse All
              </button>
            </div>
          </div>

          {/* Date Group Cards */}
          {dateGroups.map(group => {
            const isCollapsed = !!collapsedDates[group.dateKey];

            return (
              <div key={group.dateKey} className={styles.dateGroupCard}>
                {/* Date Group Header */}
                <div
                  className={`${styles.dateGroupHeader} ${isCollapsed ? styles.dateGroupHeaderCollapsed : ''}`}
                  onClick={() => toggleDateCollapse(group.dateKey)}
                >
                  <div className={styles.dateGroupLeft}>
                    <div className={styles.dateGroupIconBox}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>calendar_month</span>
                    </div>
                    <div className={styles.dateGroupTitleCol}>
                      <div className={styles.dateGroupTitleRow}>
                        <h3 className={styles.dateGroupTitle}>{group.fullDayLabel}</h3>
                        {group.isToday && <span className={styles.dateBadgeToday}>Today</span>}
                        {group.isYesterday && <span className={styles.dateBadgeYesterday}>Yesterday</span>}
                      </div>
                      <div className={styles.dateFormattedSub}>
                        <span>{group.formattedDate}</span>
                        <span>•</span>
                        <span>{group.totalCount} Staff {group.totalCount === 1 ? 'Log' : 'Logs'}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.dateGroupRight}>
                    <div className={styles.dateMetricsRow}>
                      {group.presentCount > 0 && (
                        <span className={`${styles.datePill} ${styles.datePillPresent}`}>
                          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>check_circle</span>
                          {group.presentCount} On Time
                        </span>
                      )}

                      {group.lateCount > 0 && (
                        <span className={`${styles.datePill} ${styles.datePillLate}`}>
                          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>schedule</span>
                          {group.lateCount} Late
                        </span>
                      )}

                      {group.earlyLeaveCount > 0 && (
                        <span className={`${styles.datePill} ${styles.datePillEarly}`}>
                          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>logout</span>
                          {group.earlyLeaveCount} Early
                        </span>
                      )}

                      {group.absentCount > 0 && (
                        <span className={`${styles.datePill} ${styles.datePillAbsent}`}>
                          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>person_off</span>
                          {group.absentCount} Absent
                        </span>
                      )}
                    </div>

                    <div className={styles.dateChevronBtn} title={isCollapsed ? 'Expand date group' : 'Collapse date group'}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                        {isCollapsed ? 'expand_more' : 'expand_less'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Table for this Date Group */}
                {!isCollapsed && (
                  <div style={{ overflowX: 'auto' }}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr className={styles.tableHeaderRow}>
                          <th className={styles.tableHeaderCell}>Staff Personnel</th>
                          <th className={styles.tableHeaderCell}>Check In</th>
                          <th className={styles.tableHeaderCell}>Check Out</th>
                          <th className={styles.tableHeaderCell}>Late Duration</th>
                          <th className={styles.tableHeaderCell}>Late Fines</th>
                          <th className={styles.tableHeaderCell}>Early Leave Time</th>
                          <th className={styles.tableHeaderCell}>Status</th>
                          <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.records.map(r => {
                          const emp = empMap[r.employeeId] || r.employee;
                          const fullName = emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : (r.employeeName || 'Staff Personnel');
                          const initials = emp && (emp.firstName || emp.lastName)
                            ? `${(emp.firstName || '')[0] || ''}${(emp.lastName || '')[0] || ''}`.toUpperCase()
                            : 'ST';

                          const checkIn = r.checkIn || r.checkInTime || '—';
                          const checkOut = r.checkOut || r.checkOutTime || '—';

                          return (
                            <tr key={r.id} className={styles.tableRow}>
                              <td className={styles.tableCell}>
                                <div className={styles.employeeProfileGroup}>
                                  <div className={styles.empAvatar}>{initials}</div>
                                  <div>
                                    <div className={styles.empName}>{fullName}</div>
                                    {emp?.employeeId && (
                                      <span className={styles.empIdBadge}>{emp.employeeId}</span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className={styles.tableCell}>
                                {r.status === 'ABSENT' ? (
                                  <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>Unattended</span>
                                ) : (
                                  <span className={styles.timeBadge}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--success)' }}>login</span>
                                    {formatDisplayTime(checkIn, officeTiming.timezone)}
                                  </span>
                                )}
                              </td>

                              <td className={styles.tableCell}>
                                {r.status === 'ABSENT' ? (
                                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
                                ) : (
                                  <span className={styles.timeBadge}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--primary)' }}>logout</span>
                                    {formatDisplayTime(checkOut, officeTiming.timezone)}
                                  </span>
                                )}
                              </td>

                              <td className={styles.tableCell}>
                                {r.status === 'ABSENT' ? (
                                  <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>Unattended</span>
                                ) : r.reviewStatus === 'CONSIDERED' ? (
                                  <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '3px' }}>
                                    {r.lateMinutes && r.lateMinutes > 0 ? (
                                      <span style={{
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        color: 'var(--warning, #f59e0b)',
                                        background: 'rgba(245, 158, 11, 0.1)',
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                        width: 'fit-content'
                                      }}>
                                        +{r.lateMinutes} min late
                                      </span>
                                    ) : (
                                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>0 min (On Time)</span>
                                    )}
                                    <span style={{
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      color: '#059669',
                                      background: 'rgba(16, 185, 129, 0.12)',
                                      border: '1px solid rgba(16, 185, 129, 0.3)',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      width: 'fit-content'
                                    }}>
                                      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>verified</span>
                                      HR Considered {(() => {
                                        const match = r.punishmentReason?.match(/HR Considered (\d+)\s*min/i);
                                        if (match && match[1]) return `(${match[1]} min)`;
                                        const raw = calculateRawLateMinutes(r, officeTiming);
                                        if (raw > (r.lateMinutes || 0)) return `(${raw - (r.lateMinutes || 0)} min)`;
                                        return r.lateMinutes === 0 ? '(Waived)' : '';
                                      })()}
                                    </span>
                                    {r.punishmentReason && (
                                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.punishmentReason}>
                                        {r.punishmentReason.replace(/^HR Considered \d+ min:\s*/i, '')}
                                      </span>
                                    )}
                                  </div>
                                ) : r.lateMinutes && r.lateMinutes > 0 ? (
                                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                                    +{r.lateMinutes} min late
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>0 min (On Time)</span>
                                )}
                              </td>

                              <td className={styles.tableCell}>
                                {r.status === 'ABSENT' ? (
                                  (() => {
                                    const absentFine = getRecordAbsentFine(r, punishmentRules);
                                    return absentFine > 0 ? (
                                      <span style={{
                                        fontSize: '11.5px',
                                        fontWeight: 700,
                                        color: '#ef4444',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.25)',
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}>
                                        ৳{absentFine.toLocaleString()}
                                      </span>
                                    ) : (
                                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
                                    );
                                  })()
                                ) : r.reviewStatus === 'CONSIDERED' ? (
                                  r.punishmentAmount && Number(r.punishmentAmount) > 0 ? (
                                    <span style={{
                                      fontSize: '11.5px',
                                      fontWeight: 700,
                                      color: '#ef4444',
                                      background: 'rgba(239, 68, 68, 0.1)',
                                      border: '1px solid rgba(239, 68, 68, 0.25)',
                                      padding: '2px 8px',
                                      borderRadius: '6px'
                                    }}>
                                      ৳{Number(r.punishmentAmount).toLocaleString()}
                                    </span>
                                  ) : (
                                    <span style={{
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      color: '#059669',
                                      background: 'rgba(16, 185, 129, 0.1)',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px'
                                    }}>
                                      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>verified</span>
                                      Waived
                                    </span>
                                  )
                                ) : r.lateMinutes && r.lateMinutes > 0 ? (
                                  (() => {
                                    const fine = getRecordLateFine(r, punishmentRules);
                                    return fine > 0 ? (
                                      <span style={{
                                        fontSize: '11.5px',
                                        fontWeight: 700,
                                        color: '#ef4444',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.25)',
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}>
                                        ৳{fine.toLocaleString()}
                                      </span>
                                    ) : (
                                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>৳0</span>
                                    );
                                  })()
                                ) : (
                                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
                                )}
                              </td>

                              <td className={styles.tableCell}>
                                {r.status === 'ABSENT' ? (
                                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
                                ) : r.earlyLeaveMinutes && r.earlyLeaveMinutes > 0 ? (
                                  <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#ea580c', background: 'rgba(234, 88, 12, 0.1)', padding: '2px 8px', borderRadius: '6px', width: 'fit-content' }}>
                                      -{r.earlyLeaveMinutes} min early
                                    </span>
                                    {checkOut !== '—' && (
                                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                        Left at {formatDisplayTime(checkOut, officeTiming.timezone)}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>0 min</span>
                                )}
                              </td>

                              <td className={styles.tableCell}>
                                <span className={`${styles.statusChip} ${getStatusClass(r.status)}`}>
                                  {r.status}
                                </span>
                              </td>

                              <td className={styles.tableCell} style={{ textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                                  {/* Approve Absent to Present Action Button */}
                                  {r.status === 'ABSENT' ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenApproveAbsentModal(r);
                                      }}
                                      disabled={approvingAbsentId === r.id}
                                      title="Approve as Present & Waive Absence Penalty Fine"
                                      style={{
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(16, 185, 129, 0.55)',
                                        background: 'rgba(16, 185, 129, 0.18)',
                                        color: '#10b981',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        fontWeight: 700,
                                        fontSize: '11.5px',
                                        transition: 'all 0.15s ease',
                                        boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)'
                                      }}
                                    >
                                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                                        {approvingAbsentId === r.id ? 'hourglass_empty' : 'how_to_reg'}
                                      </span>
                                      <span>Approve Present</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (e.shiftKey) {
                                          handleConfirmAutoCheckoutDirect(r);
                                        } else {
                                          handleOpenAutoCheckoutModal(r, 'MANUAL');
                                        }
                                      }}
                                      disabled={autoCheckoutLoadingId === r.id}
                                      title={
                                        checkOut === '—'
                                          ? "Manual Out (Click to set time, or Shift+Click for instant shift end)"
                                          : `Manual Out (Currently checked out at ${formatDisplayTime(checkOut, officeTiming.timezone)})`
                                      }
                                      style={{
                                        padding: '6px',
                                        borderRadius: '8px',
                                        border: checkOut === '—'
                                          ? '1px solid rgba(16, 185, 129, 0.45)'
                                          : '1px solid rgba(16, 185, 129, 0.2)',
                                        background: checkOut === '—'
                                          ? 'rgba(16, 185, 129, 0.15)'
                                          : 'rgba(16, 185, 129, 0.05)',
                                        color: checkOut === '—' ? '#10b981' : '#059669',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.15s ease',
                                        boxShadow: checkOut === '—' ? '0 0 8px rgba(16, 185, 129, 0.25)' : 'none'
                                      }}
                                    >
                                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                                        {autoCheckoutLoadingId === r.id ? 'hourglass_empty' : 'logout'}
                                      </span>
                                    </button>
                                  )}

                                  {/* Half Day Out (Emergency Permit) Button */}
                                  {r.status !== 'ABSENT' && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenAutoCheckoutModal(r, 'HALF_DAY');
                                      }}
                                      disabled={autoCheckoutLoadingId === r.id}
                                      title={
                                        r.status === 'HALF_DAY'
                                          ? `Permitted Half Day (Departed at ${formatDisplayTime(checkOut, officeTiming.timezone)})`
                                          : "Half Day Out (Emergency Leave Permit - Waive Early Penalty)"
                                      }
                                      style={{
                                        padding: '6px',
                                        borderRadius: '8px',
                                        border: r.status === 'HALF_DAY'
                                          ? '1px solid rgba(245, 158, 11, 0.6)'
                                          : '1px solid rgba(245, 158, 11, 0.35)',
                                        background: r.status === 'HALF_DAY'
                                          ? 'rgba(245, 158, 11, 0.22)'
                                          : 'rgba(245, 158, 11, 0.08)',
                                        color: '#f59e0b',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.15s ease',
                                        boxShadow: r.status === 'HALF_DAY' ? '0 0 8px rgba(245, 158, 11, 0.25)' : 'none'
                                      }}
                                    >
                                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                                        emergency
                                      </span>
                                    </button>
                                  )}

                                  {r.reviewStatus === 'CONSIDERED' ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRevertConsiderLate(r);
                                      }}
                                      title="Revert HR consideration to original clock-in log"
                                      style={{
                                        padding: '6px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                        background: 'rgba(16, 185, 129, 0.08)',
                                        color: '#059669',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.15s ease'
                                      }}
                                    >
                                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>undo</span>
                                    </button>
                                  ) : r.status !== 'ABSENT' ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenConsiderModal(r);
                                      }}
                                      title={r.lateMinutes && r.lateMinutes > 0 ? "Consider / Waive Late Arrival (Forgot check-in)" : "Adjust / Consider Late Arrival"}
                                      style={{
                                        padding: '6px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(245, 158, 11, 0.3)',
                                        background: 'rgba(245, 158, 11, 0.08)',
                                        color: '#f59e0b',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.15s ease'
                                      }}
                                    >
                                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule_send</span>
                                    </button>
                                  ) : null}

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAttendanceToDelete(r);
                                    }}
                                    disabled={deletingAttendanceId === r.id}
                                    title="Delete attendance record"
                                    style={{
                                      padding: '6px',
                                      borderRadius: '8px',
                                      border: '1px solid rgba(239, 68, 68, 0.2)',
                                      background: 'rgba(239, 68, 68, 0.08)',
                                      color: '#ef4444',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                                      {deletingAttendanceId === r.id ? 'hourglass_empty' : 'delete'}
                                    </span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* 5. Record Attendance Modal */}
      {showModal && (
        <div
          className={styles.modalBackdrop}
          onClick={e => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Record Daily Attendance</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                title="Close"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>close</span>
              </button>
            </div>

            {error && (
              <div className={`${styles.alertBox} ${styles.alertDanger}`}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Staff Member *</label>
                <select
                  value={form.employeeId}
                  onChange={e => handleForm('employeeId', e.target.value)}
                  required
                  className={styles.formInput}
                >
                  <option value="">Select Employee...</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} ({e.employeeId || 'ID'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => handleForm('date', e.target.value)}
                    required
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Attendance Status</label>
                  <select
                    value={form.status}
                    onChange={e => handleForm('status', e.target.value)}
                    className={styles.formInput}
                  >
                    <option value="PRESENT">Present</option>
                    <option value="LATE">Late</option>
                    <option value="HALF_DAY">Half Day</option>
                    <option value="ABSENT">Absent</option>
                    <option value="WEEKLY_OFF">Weekly Off</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Check In Time
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px', fontWeight: 400 }}>(Office: {officeTiming.shiftStart})</span>
                  </label>
                  <input
                    type="time"
                    value={form.checkIn}
                    onChange={e => handleForm('checkIn', e.target.value)}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Check Out Time</label>
                  <input
                    type="time"
                    value={form.checkOut}
                    onChange={e => handleForm('checkOut', e.target.value)}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Late Minutes
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px', fontWeight: 400 }}>(Auto-calculated if 0)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.lateMinutes}
                    onChange={e => handleForm('lateMinutes', e.target.value)}
                    placeholder="0"
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Early Leave Minutes</label>
                  <input
                    type="number"
                    min="0"
                    value={form.earlyLeaveMinutes}
                    onChange={e => handleForm('earlyLeaveMinutes', e.target.value)}
                    placeholder="0"
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={styles.secondaryBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={styles.primaryBtn}
                >
                  {submitting ? 'Recording...' : 'Save Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Office Network & Wi-Fi Settings Modal */}
      {showNetworkModal && (
        <div
          className={styles.modalBackdrop}
          onClick={e => {
            if (e.target === e.currentTarget) setShowNetworkModal(false);
          }}
        >
          <div className={styles.networkModalBox}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  className={styles.networkBannerIconBox}
                  style={{
                    background: isNetworkConfigured ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                    color: isNetworkConfigured ? '#059669' : '#d97706',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                    {isNetworkConfigured ? 'wifi_lock' : 'wifi_off'}
                  </span>
                </div>
                <div>
                  <h2 className={styles.modalTitle}>Office Network & Wi-Fi Settings</h2>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Only staff connected to these authorized office networks can clock in and out on the mobile app.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNetworkModal(false)}
                className={styles.networkModalCloseBtn}
                title="Close"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>

            {networkSuccess && (
              <div className={`${styles.alertBox} ${styles.alertSuccess}`}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                <span>{networkSuccess}</span>
              </div>
            )}

            {networkError && (
              <div className={`${styles.alertBox} ${styles.alertDanger}`}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
                <span>{networkError}</span>
              </div>
            )}

            {/* List of Registered Networks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Saved Office Networks ({networks.length})
                </h4>
                <span style={{ fontSize: '12px', color: isNetworkConfigured ? '#059669' : '#d97706', fontWeight: 600 }}>
                  {isNetworkConfigured ? '✓ Staff Clock-In Allowed' : '⚠ Staff App Blocked'}
                </span>
              </div>

              {networks.length === 0 ? (
                <div style={{ padding: '24px', borderRadius: '14px', background: 'var(--surface-hover)', border: '1px dashed var(--border-main)', textAlign: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#d97706', display: 'block', marginBottom: '8px' }}>
                    wifi_off
                  </span>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>No office networks registered yet</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '440px', margin: '4px auto 0' }}>
                    The staff mobile app strictly enforces network validation. Register your office Wi-Fi network below so employees can successfully clock in and out.
                  </div>
                </div>
              ) : (
                <div className={styles.networkCardList}>
                  {networks.map(net => (
                    <div key={net.id} className={styles.networkListItem}>
                      <div className={styles.networkDetailsGroup}>
                        <div className={styles.networkItemName}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: net.isActive ? '#059669' : '#94a3b8' }}>
                            {net.isActive ? 'wifi' : 'wifi_off'}
                          </span>
                          <span>{net.name}</span>
                          <span className={`${styles.networkStatusPill} ${net.isActive ? styles.pillSuccess : styles.pillWarning}`}>
                            {net.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                        <div className={styles.networkParamsRow}>
                          {net.ssid && (
                            <span>SSID: <span className={styles.networkParamTag}>{net.ssid}</span></span>
                          )}
                          {net.ipAddress && (
                            <span>IP: <span className={styles.networkParamTag}>{net.ipAddress}</span></span>
                          )}
                          {net.bssid && (
                            <span>BSSID: <span className={styles.networkParamTag}>{net.bssid}</span></span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteNetwork(net.id)}
                        disabled={networkActionLoading === net.id}
                        className={styles.networkDeleteBtn}
                        title="Delete this network"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                          {networkActionLoading === net.id ? 'hourglass_empty' : 'delete'}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Register New Network Form */}
            <form onSubmit={handleCreateNetwork} className={styles.addNetworkSection}>
              <h4 className={styles.addNetworkTitle}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#059669' }}>add_circle</span>
                Register New Office Network
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Network Label / Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Head Office Wi-Fi (Primary)"
                    value={networkForm.name}
                    onChange={e => setNetworkForm(f => ({ ...f, name: e.target.value }))}
                    required
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Wi-Fi SSID (Network Name)</label>
                  <input
                    type="text"
                    placeholder="e.g. Shohoj-Office-5G"
                    value={networkForm.ssid}
                    onChange={e => setNetworkForm(f => ({ ...f, ssid: e.target.value }))}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className={styles.formLabel}>Allowed Public IP</label>
                    <button
                      type="button"
                      onClick={() => setNetworkForm(f => ({ ...f, ipAddress: 'auto' }))}
                      className={styles.autoDetectBtn}
                      title="Auto-detect IP from current server connection"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>my_location</span>
                      Auto-detect My IP
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. 103.205.71.12 or 'auto'"
                    value={networkForm.ipAddress}
                    onChange={e => setNetworkForm(f => ({ ...f, ipAddress: e.target.value }))}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Router BSSID / MAC (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 00:1A:2B:3C:4D:5E"
                    value={networkForm.bssid}
                    onChange={e => setNetworkForm(f => ({ ...f, bssid: e.target.value }))}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="submit"
                  disabled={networkSubmitting}
                  className={styles.primaryBtn}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    {networkSubmitting ? 'hourglass_empty' : 'save'}
                  </span>
                  {networkSubmitting ? 'Saving...' : 'Save & Authorize Office Network'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Record Delete Confirmation Modal */}
      {attendanceToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setAttendanceToDelete(null)}
        >
          <div
            style={{
              background: 'var(--surface-card)',
              borderRadius: '20px',
              border: '1px solid var(--border-main)',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>delete_forever</span>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-main)' }}>
                  Delete Attendance Record
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  This action permanently removes the log entry.
                </p>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Are you sure you want to delete the attendance record for <strong>{empMap[attendanceToDelete.employeeId]?.firstName || 'Staff'}</strong> on <strong>{formatDisplayDate(attendanceToDelete.date, officeTiming.timezone)}</strong>?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setAttendanceToDelete(null)}
                disabled={deletingAttendanceId === attendanceToDelete.id}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-main)',
                  background: 'var(--surface-bg)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAttendance}
                disabled={deletingAttendanceId === attendanceToDelete.id}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {deletingAttendanceId === attendanceToDelete.id ? 'Deleting...' : 'Delete Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* HR Manual Late Consideration Modal */}
      {considerModalOpen && recordToConsider && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => {
            if (!considerSubmitting) {
              setConsiderModalOpen(false);
              setRecordToConsider(null);
            }
          }}
        >
          <div
            style={{
              background: 'var(--surface-card, #1e293b)',
              borderRadius: '20px',
              border: '1px solid var(--border-main, rgba(255, 255, 255, 0.1))',
              maxWidth: '520px',
              width: '100%',
              padding: '26px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>schedule_send</span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main, #fff)' }}>
                    HR Late Consideration
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
                    Manually forgive or adjust late minutes when staff forgot to check in.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setConsiderModalOpen(false); setRecordToConsider(null); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted, #94a3b8)',
                  cursor: 'pointer',
                  display: 'flex'
                }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Employee Info Card */}
            <div style={{
              background: 'var(--surface-input, rgba(0, 0, 0, 0.2))',
              borderRadius: '12px',
              border: '1px solid var(--border-main, rgba(255, 255, 255, 0.08))',
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main, #fff)' }}>
                  {empMap[recordToConsider.employeeId]?.firstName} {empMap[recordToConsider.employeeId]?.lastName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                  ID: <span style={{ fontFamily: 'monospace', color: 'var(--primary, #3b82f6)' }}>{empMap[recordToConsider.employeeId]?.employeeId || 'Staff'}</span> · {formatDisplayDate(recordToConsider.date, officeTiming.timezone)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>Clocked in:</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main, #fff)' }}>
                  {formatDisplayTime(recordToConsider.checkIn || recordToConsider.checkInTime, officeTiming.timezone)}
                </div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#f59e0b',
                  marginTop: '2px'
                }}>
                  Arrival Delay: +{considerRawLateMinutes} min late
                </div>
              </div>
            </div>

            {/* Delay & Consideration Breakdown */}
            <div style={{
              background: 'rgba(245, 158, 11, 0.06)',
              borderRadius: '12px',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary, #cbd5e1)', fontWeight: 600 }}>
                  Recorded Delay vs Shift Start ({officeTiming.shiftStart}):
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b' }}>
                  +{considerRawLateMinutes} min
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setConsiderWaiveMinutes(String(considerRawLateMinutes));
                    setConsiderRemainingMinutes('0');
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '9px',
                    border: considerRemainingMinutes === '0' ? '2px solid #10b981' : '1px solid var(--border-main, rgba(255, 255, 255, 0.1))',
                    background: considerRemainingMinutes === '0' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                    color: considerRemainingMinutes === '0' ? '#10b981' : 'var(--text-secondary, #cbd5e1)',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified</span>
                  Waive 100% (0 min late)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const defaultWaive = Math.min(20, considerRawLateMinutes);
                    setConsiderWaiveMinutes(String(defaultWaive));
                    setConsiderRemainingMinutes(String(Math.max(0, considerRawLateMinutes - defaultWaive)));
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '9px',
                    border: considerRemainingMinutes !== '0' ? '2px solid #f59e0b' : '1px solid var(--border-main, rgba(255, 255, 255, 0.1))',
                    background: considerRemainingMinutes !== '0' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                    color: considerRemainingMinutes !== '0' ? '#f59e0b' : 'var(--text-secondary, #cbd5e1)',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>timelapse</span>
                  Partial Consideration
                </button>
              </div>

              {/* Two Interactive Linked Inputs: Considered Minutes & Remaining Late */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#10b981', marginBottom: '4px' }}>
                    Minutes HR Considers (Forgives):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={considerRawLateMinutes}
                    value={considerWaiveMinutes}
                    onChange={e => handleWaiveMinutesChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      background: 'var(--surface-input, rgba(0, 0, 0, 0.25))',
                      color: 'var(--text-main, #fff)',
                      fontSize: '13px',
                      outline: 'none',
                      fontWeight: 700
                    }}
                  />
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px', display: 'block' }}>
                    Excused delay (e.g. 20 min)
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#f59e0b', marginBottom: '4px' }}>
                    Remaining Late Shown on Table:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={considerRawLateMinutes}
                    value={considerRemainingMinutes}
                    onChange={e => handleRemainingMinutesChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      background: 'var(--surface-input, rgba(0, 0, 0, 0.25))',
                      color: 'var(--text-main, #fff)',
                      fontSize: '13px',
                      outline: 'none',
                      fontWeight: 700
                    }}
                  />
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px', display: 'block' }}>
                    Final late duration (e.g. 18 min)
                  </span>
                </div>
              </div>

              {/* Late Fine Amount Field */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)', marginBottom: '4px' }}>
                  Late Fine Amount (৳):
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    min="0"
                    value={considerFineAmount}
                    onChange={e => setConsiderFineAmount(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-main, rgba(255, 255, 255, 0.15))',
                      background: 'var(--surface-input, rgba(0, 0, 0, 0.2))',
                      color: 'var(--text-main, #fff)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setConsiderFineAmount('0')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#10b981',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Waive Fine (৳0)
                  </button>
                </div>
              </div>

              {/* Live Preview Pill */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.25)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '11.5px',
                color: 'var(--text-secondary, #cbd5e1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '6px'
              }}>
                <span>Total Delay: <strong>{considerRawLateMinutes} min</strong></span>
                <span style={{ color: '#10b981' }}>HR Considered: <strong>-{considerWaiveMinutes || 0} min</strong></span>
                <span style={{ color: Number(considerRemainingMinutes) > 0 ? '#f59e0b' : '#10b981' }}>
                  Table Late: <strong>{Number(considerRemainingMinutes) > 0 ? `+${considerRemainingMinutes} min late` : '0 min (On Time)'}</strong>
                </span>
                <span style={{ color: Number(considerFineAmount) > 0 ? '#ef4444' : '#10b981' }}>
                  Fine: <strong>{Number(considerFineAmount) > 0 ? `৳${considerFineAmount}` : 'Waived'}</strong>
                </span>
              </div>
            </div>

            {/* Common Reason Quick Suggestions */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
                HR Consideration Reason / Note:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                {[
                  'Staff forgot to press check-in on time',
                  'Office biometric / Wi-Fi network delay',
                  'Client meeting / Official outdoor duty',
                  'Approved transit / personal emergency'
                ].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setConsiderReason(r)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: considerReason === r ? 'var(--primary, #3b82f6)' : 'var(--border-main, rgba(255, 255, 255, 0.1))',
                      background: considerReason === r ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                      color: considerReason === r ? 'var(--primary, #3b82f6)' : 'var(--text-muted, #94a3b8)',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <textarea
                rows={2}
                value={considerReason}
                onChange={e => setConsiderReason(e.target.value)}
                placeholder="Enter justification note for record and payroll audit..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-main, rgba(255, 255, 255, 0.15))',
                  background: 'var(--surface-input, rgba(0, 0, 0, 0.2))',
                  color: 'var(--text-main, #fff)',
                  fontSize: '13px',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Note info banner */}
            <div style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '12px',
              color: 'var(--text-secondary, #cbd5e1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#3b82f6' }}>info</span>
              <span>This manual consideration is locked against automatic recalculation and waives all late salary deductions in payroll.</span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => { setConsiderModalOpen(false); setRecordToConsider(null); }}
                disabled={considerSubmitting}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-main, rgba(255, 255, 255, 0.15))',
                  background: 'transparent',
                  color: 'var(--text-main, #fff)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmConsiderLate}
                disabled={considerSubmitting}
                style={{
                  padding: '9px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#059669',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: considerSubmitting ? 0.7 : 1
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>verified</span>
                {considerSubmitting ? 'Saving...' : 'Apply Consideration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Approve Absent to Present Modal */}
      {approveAbsentModalOpen && recordToApproveAbsent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => {
            if (!approveSubmitting) {
              setApproveAbsentModalOpen(false);
              setRecordToApproveAbsent(null);
            }
          }}
        >
          <div
            style={{
              background: 'var(--surface-card, #1e293b)',
              borderRadius: '20px',
              border: '1px solid var(--border-main, rgba(255, 255, 255, 0.12))',
              maxWidth: '540px',
              width: '100%',
              padding: '26px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.18)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>how_to_reg</span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main, #fff)' }}>
                    Approve Attendance (Absent → Present)
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
                    Verify employee presence and consider/waive absence penalties &amp; disciplinary fines.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setApproveAbsentModalOpen(false); setRecordToApproveAbsent(null); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted, #94a3b8)',
                  cursor: 'pointer',
                  display: 'flex'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>

            {/* Employee Card & Absence Penalty Overview */}
            {(() => {
              const emp = recordToApproveAbsent.employee;
              const empName = emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : 'Staff Member';
              const empCode = emp?.employeeId || recordToApproveAbsent.employeeId.slice(0, 8);
              const absentFine = getRecordAbsentFine(recordToApproveAbsent, punishmentRules);
              const attDateStr = formatDisplayDate(recordToApproveAbsent.date, officeTiming.timezone);

              return (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#f87171',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '13px'
                    }}>
                      {empName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main, #fff)' }}>
                        {empName} <span style={{ fontSize: '11px', color: '#94a3b8' }}>#{empCode}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>calendar_today</span>
                        {attDateStr}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                      Current Fine / Penalty
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#ef4444' }}>
                      ৳{absentFine.toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Check-In / Check-Out Times */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)', display: 'block', marginBottom: '6px' }}>
                  Check-In Time
                </label>
                <input
                  type="time"
                  value={approveCheckInTime}
                  onChange={e => setApproveCheckInTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(0, 0, 0, 0.25)',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)', display: 'block', marginBottom: '6px' }}>
                  Check-Out Time
                </label>
                <input
                  type="time"
                  value={approveCheckOutTime}
                  onChange={e => setApproveCheckOutTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(0, 0, 0, 0.25)',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>

            {/* Fine Consideration / Waiver Toggle */}
            <div style={{
              background: approveWaiveFine ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
              border: approveWaiveFine ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={approveWaiveFine}
                  onChange={e => setApproveWaiveFine(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#10b981', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '13px', fontWeight: 700, color: approveWaiveFine ? '#10b981' : 'var(--text-main, #fff)' }}>
                  Waive &amp; Consider Absence Fine (100% Consideration — ৳0.00)
                </span>
              </label>
              <div style={{ fontSize: '11.5px', color: '#94a3b8', paddingLeft: '26px' }}>
                When checked, any disciplinary fine logged for this absence is cancelled/waived, and active payroll deduction is restored.
              </div>

              {!approveWaiveFine && (
                <div style={{ paddingLeft: '26px', marginTop: '6px' }}>
                  <label style={{ fontSize: '11px', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                    Custom Fine Amount (BDT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={approveCustomFine}
                    onChange={e => setApproveCustomFine(e.target.value)}
                    style={{
                      width: '140px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Approval Reason & Quick Templates */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)', display: 'block', marginBottom: '6px' }}>
                HR Consideration Note / Reason *
              </label>
              <input
                type="text"
                value={approveReason}
                onChange={e => setApproveReason(e.target.value)}
                placeholder="Reason for approving presence..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(0, 0, 0, 0.25)',
                  color: '#fff',
                  fontSize: '13px'
                }}
              />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', alignSelf: 'center' }}>Presets:</span>
                {[
                  'Staff attended office on time (Check-in omitted)',
                  'On-site client duty / Outdoor assignment',
                  'Biometric scanner technical glitch',
                  'Authorized work from office'
                ].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setApproveReason(preset)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-secondary, #cbd5e1)',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    {preset.split(' (')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => { setApproveAbsentModalOpen(false); setRecordToApproveAbsent(null); }}
                disabled={approveSubmitting}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-main, rgba(255, 255, 255, 0.15))',
                  background: 'transparent',
                  color: 'var(--text-main, #fff)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmApproveAbsent}
                disabled={approveSubmitting}
                style={{
                  padding: '9px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#059669',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                  opacity: approveSubmitting ? 0.7 : 1
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {approveSubmitting ? 'hourglass_empty' : 'how_to_reg'}
                </span>
                {approveSubmitting ? 'Approving...' : 'Approve as Present & Waive Fine'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto Check-Out Modal */}
      {autoCheckoutRecord && (
        <div
          className={styles.modalOverlay}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => {
            if (!autoCheckoutSubmitting) {
              setAutoCheckoutRecord(null);
            }
          }}
        >
          <div
            className={styles.modalContent}
            style={{
              background: 'var(--surface-card, #1e293b)',
              borderRadius: '20px',
              border: '1px solid var(--border-main, rgba(255, 255, 255, 0.12))',
              maxWidth: '520px',
              width: '92%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: checkoutMode === 'HALF_DAY' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: checkoutMode === 'HALF_DAY' ? '#f59e0b' : '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                    {checkoutMode === 'HALF_DAY' ? 'emergency' : 'logout'}
                  </span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main, #fff)' }}>
                    {checkoutMode === 'HALF_DAY' ? 'Emergency Half Day Out' : 'Manual Shift Out'}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
                    {checkoutMode === 'HALF_DAY'
                      ? 'Grant HR emergency leave permit and clock out staff with excused half-day status.'
                      : 'Clock out employee and finalize shift working hours.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!autoCheckoutSubmitting) {
                    setAutoCheckoutRecord(null);
                  }
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted, #94a3b8)',
                  cursor: 'pointer',
                  display: 'flex'
                }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid var(--border-main, rgba(255, 255, 255, 0.08))'
            }}>
              <button
                type="button"
                onClick={() => {
                  setCheckoutMode('MANUAL');
                  setAutoCheckoutTimeInput(officeTiming.shiftEnd || '18:00');
                }}
                style={{
                  padding: '9px 12px',
                  borderRadius: '9px',
                  border: checkoutMode === 'MANUAL' ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid transparent',
                  background: checkoutMode === 'MANUAL' ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
                  color: checkoutMode === 'MANUAL' ? '#10b981' : 'var(--text-muted, #94a3b8)',
                  fontWeight: checkoutMode === 'MANUAL' ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
                Manual Out
              </button>

              <button
                type="button"
                onClick={() => {
                  setCheckoutMode('HALF_DAY');
                  try {
                    const nowTz = new Intl.DateTimeFormat('en-GB', {
                      timeZone: officeTiming.timezone || 'Asia/Dhaka',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    }).format(new Date());
                    setAutoCheckoutTimeInput(nowTz);
                  } catch {
                    const now = new Date();
                    setAutoCheckoutTimeInput(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
                  }
                }}
                style={{
                  padding: '9px 12px',
                  borderRadius: '9px',
                  border: checkoutMode === 'HALF_DAY' ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid transparent',
                  background: checkoutMode === 'HALF_DAY' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                  color: checkoutMode === 'HALF_DAY' ? '#f59e0b' : 'var(--text-muted, #94a3b8)',
                  fontWeight: checkoutMode === 'HALF_DAY' ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>emergency</span>
                Half Day Out (Permit)
              </button>
            </div>

            {/* Employee Info Card */}
            <div style={{
              background: 'var(--surface-input, rgba(0, 0, 0, 0.2))',
              borderRadius: '12px',
              border: '1px solid var(--border-main, rgba(255, 255, 255, 0.08))',
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main, #fff)' }}>
                  {empMap[autoCheckoutRecord.employeeId]?.firstName} {empMap[autoCheckoutRecord.employeeId]?.lastName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                  ID: <span style={{ fontFamily: 'monospace', color: 'var(--primary, #3b82f6)' }}>
                    {empMap[autoCheckoutRecord.employeeId]?.employeeId || 'Staff'}
                  </span> · {formatDisplayDate(autoCheckoutRecord.date, officeTiming.timezone)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>Clocked in:</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main, #fff)' }}>
                  {formatDisplayTime(autoCheckoutRecord.checkIn || autoCheckoutRecord.checkInTime, officeTiming.timezone)}
                </div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: checkoutMode === 'HALF_DAY' ? '#f59e0b' : '#10b981',
                  marginTop: '2px'
                }}>
                  Shift: {officeTiming.shiftStart} - {officeTiming.shiftEnd}
                </div>
              </div>
            </div>

            {/* Half Day Emergency Permit Fields */}
            {checkoutMode === 'HALF_DAY' && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.06)',
                borderRadius: '12px',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#f59e0b', marginBottom: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified_user</span>
                    Emergency Permit Reason:
                  </label>
                  <select
                    value={halfDayReason}
                    onChange={e => setHalfDayReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      background: 'var(--surface-input, rgba(0, 0, 0, 0.35))',
                      color: 'var(--text-main, #fff)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  >
                    <option value="Medical / Health Emergency (Staff fell ill)" style={{ background: '#1e293b', color: '#fff' }}>Medical / Health Emergency (Staff fell ill)</option>
                    <option value="Personal / Family Urgent Matter" style={{ background: '#1e293b', color: '#fff' }}>Personal / Family Urgent Matter</option>
                    <option value="Official External Assignment / Duty" style={{ background: '#1e293b', color: '#fff' }}>Official External Assignment / Duty</option>
                    <option value="Urgent Transport / Severe Weather Constraint" style={{ background: '#1e293b', color: '#fff' }}>Urgent Transport / Severe Weather Constraint</option>
                    <option value="Other Emergency (HR Discretion)" style={{ background: '#1e293b', color: '#fff' }}>Other Emergency (HR Discretion)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-muted, #94a3b8)', marginBottom: '4px' }}>
                    HR Remarks / Note (Optional):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Doctor appointment verified, permitted by HR manager"
                    value={customReasonNote}
                    onChange={e => setCustomReasonNote(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-main, rgba(255, 255, 255, 0.15))',
                      background: 'var(--surface-input, rgba(0, 0, 0, 0.25))',
                      color: 'var(--text-main, #fff)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Check-Out / Departure Time Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '8px' }}>
                {checkoutMode === 'HALF_DAY' ? 'Emergency Departure Time:' : 'Select Check-Out Time:'}
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                {checkoutMode === 'MANUAL' && (
                  <button
                    type="button"
                    onClick={() => setAutoCheckoutTimeInput(officeTiming.shiftEnd || '18:00')}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: autoCheckoutTimeInput === (officeTiming.shiftEnd || '18:00')
                        ? '2px solid #10b981'
                        : '1px solid var(--border-main, rgba(255, 255, 255, 0.1))',
                      background: autoCheckoutTimeInput === (officeTiming.shiftEnd || '18:00')
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'transparent',
                      color: autoCheckoutTimeInput === (officeTiming.shiftEnd || '18:00')
                        ? '#10b981'
                        : 'var(--text-secondary, #cbd5e1)',
                      fontWeight: 700,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule</span>
                    Shift End ({officeTiming.shiftEnd || '18:00'})
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    try {
                      const nowTz = new Intl.DateTimeFormat('en-GB', {
                        timeZone: officeTiming.timezone || 'Asia/Dhaka',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      }).format(new Date());
                      setAutoCheckoutTimeInput(nowTz);
                    } catch {
                      const now = new Date();
                      setAutoCheckoutTimeInput(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
                    }
                  }}
                  style={{
                    flex: checkoutMode === 'HALF_DAY' ? 1 : undefined,
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: checkoutMode === 'HALF_DAY'
                      ? '1px solid rgba(245, 158, 11, 0.4)'
                      : '1px solid var(--border-main, rgba(255, 255, 255, 0.1))',
                    background: checkoutMode === 'HALF_DAY'
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'transparent',
                    color: checkoutMode === 'HALF_DAY' ? '#f59e0b' : 'var(--text-secondary, #cbd5e1)',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>update</span>
                  Current Time (Now)
                </button>
              </div>

              {/* Custom time field */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-muted, #94a3b8)', marginBottom: '4px' }}>
                  Departure Time (HH:MM):
                </label>
                <input
                  type="time"
                  value={autoCheckoutTimeInput}
                  onChange={e => setAutoCheckoutTimeInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-main, rgba(255, 255, 255, 0.15))',
                    background: 'var(--surface-input, rgba(0, 0, 0, 0.2))',
                    color: 'var(--text-main, #fff)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Info banner */}
            <div style={{
              background: checkoutMode === 'HALF_DAY' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)',
              border: checkoutMode === 'HALF_DAY' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '10px',
              padding: '11px 14px',
              fontSize: '12px',
              color: 'var(--text-secondary, #cbd5e1)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: '20px',
                  color: checkoutMode === 'HALF_DAY' ? '#f59e0b' : '#10b981',
                  flexShrink: 0,
                  marginTop: '1px'
                }}
              >
                {checkoutMode === 'HALF_DAY' ? 'verified_user' : 'check_circle'}
              </span>
              <span>
                {checkoutMode === 'HALF_DAY' ? (
                  <>
                    Staff will be clocked out at <strong>{formatDisplayTime(autoCheckoutTimeInput, officeTiming.timezone)}</strong> with status stamped as <strong>HALF_DAY</strong>. HR approval waives early leave penalties while crediting total logged hours for payroll.
                  </>
                ) : (
                  <>
                    Manual check-out will stamp <strong>{formatDisplayTime(autoCheckoutTimeInput, officeTiming.timezone)}</strong>, calculate total working hours, and close the shift record.
                  </>
                )}
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  if (!autoCheckoutSubmitting) {
                    setAutoCheckoutRecord(null);
                  }
                }}
                disabled={autoCheckoutSubmitting}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-main, rgba(255, 255, 255, 0.15))',
                  background: 'transparent',
                  color: 'var(--text-main, #fff)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleConfirmAutoCheckout()}
                disabled={autoCheckoutSubmitting}
                style={{
                  padding: '9px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: checkoutMode === 'HALF_DAY'
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                    : '#10b981',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: autoCheckoutSubmitting ? 0.7 : 1,
                  boxShadow: checkoutMode === 'HALF_DAY'
                    ? '0 2px 10px rgba(245, 158, 11, 0.35)'
                    : '0 2px 10px rgba(16, 185, 129, 0.3)'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {autoCheckoutSubmitting
                    ? 'hourglass_empty'
                    : checkoutMode === 'HALF_DAY'
                      ? 'verified'
                      : 'logout'}
                </span>
                {autoCheckoutSubmitting
                  ? (checkoutMode === 'HALF_DAY' ? 'Granting Permit...' : 'Checking Out...')
                  : (checkoutMode === 'HALF_DAY' ? 'Grant HR Permit & Clock Out (Half Day)' : 'Confirm Manual Out')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
