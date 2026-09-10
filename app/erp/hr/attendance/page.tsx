"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import styles from './attendance.module.css';

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  isLate?: boolean;
  lateMinutes?: number;
  checkInTime?: string;
  checkOutTime?: string;
  checkIn?: string;
  checkOut?: string;
  employeeId: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId?: string;
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
};

const EMPTY_NETWORK_FORM = {
  name: '',
  ssid: '',
  bssid: '',
  ipAddress: '',
  isActive: true,
};

const formatDisplayTime = (val?: string | null) => {
  if (!val || val === '—') return '—';
  if (/^\d{1,2}:\d{2}(\s?[AP]M)?$/i.test(val.trim())) return val;
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * ERP HR — Redesigned Attendance & Daily Shift Telemetry Hub
 * Enterprise attendance tracking with live operational metrics, multi-dimensional filters,
 * detailed check-in/out timestamps, CSV export, network geofencing status, and attendance recording modal.
 */
export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filterEmpId, setFilterEmpId] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Just now');

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
      const [attRes, empRes] = await Promise.all([
        fetch(filterEmpId ? `/api/attendance?employeeId=${filterEmpId}` : '/api/attendance').catch(() => null),
        fetch('/api/employees').catch(() => null),
      ]);

      if (attRes && attRes.ok) {
        const attData = await attRes.json();
        setRecords(Array.isArray(attData) ? attData : []);
      }
      if (empRes && empRes.ok) {
        const empData = await empRes.json();
        setEmployees(Array.isArray(empData) ? empData : []);
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
    loadData();
    loadNetworks();
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
    return Object.fromEntries(employees.map(e => [e.id, e]));
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
      const matchesDate = !filterDate || (r.date && r.date.slice(0, 10) === filterDate);
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      return matchesEmp && matchesDate && matchesStatus;
    });
  }, [records, filterEmpId, filterDate, statusFilter]);

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
        setSuccessMsg(data.message || `Attendance late durations recalculated! ${data.updatedCount ?? 0} record(s) updated.`);
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

  // CSV Export
  const handleExportCSV = () => {
    if (records.length === 0) return;
    const headers = ['Employee Name', 'Employee ID', 'Date', 'Status', 'Check In', 'Check Out', 'Late (Minutes)'];
    const rows = filteredRecords.map(r => {
      const emp = empMap[r.employeeId];
      return [
        emp ? `${emp.firstName} ${emp.lastName}` : 'Staff',
        emp?.employeeId || '',
        r.date ? new Date(r.date).toLocaleDateString() : '',
        r.status,
        formatDisplayTime(r.checkIn || r.checkInTime),
        formatDisplayTime(r.checkOut || r.checkOutTime),
        r.lateMinutes || 0,
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
          <div className={styles.liveBadgeRow}>
            <div className={styles.livePulseDot} />
            <span className={styles.liveBadgeText}>Live Attendance Tracking • Real-time Telemetry</span>
          </div>
          <h1 className={styles.pageTitle}>
            Attendance Tracking & Shifts
            <span className={styles.titleBadge}>{records.length} Logs</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Monitor daily clock-in compliance, track late arrivals, log working hours, and manage shift schedules.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            onClick={handleExportCSV}
            className={styles.secondaryBtn}
            disabled={records.length === 0}
            title="Download CSV Log"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
            Export CSV
          </button>

          <button
            onClick={() => loadData(true)}
            className={styles.secondaryBtn}
            disabled={isSyncing}
            title="Refresh Attendance Logs"
          >
            <span
              className={`material-symbols-outlined ${isSyncing ? styles.spinning : ''}`}
              style={{ fontSize: '18px' }}
            >
              refresh
            </span>
            <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>

          <button
            onClick={handleRecalculateLate}
            className={styles.secondaryBtn}
            disabled={isRecalculating}
            title="Recalculate Late Durations for past 60 days"
          >
            <span
              className={`material-symbols-outlined ${isRecalculating ? styles.spinning : ''}`}
              style={{ fontSize: '18px', color: '#f59e0b' }}
            >
              schedule
            </span>
            <span>{isRecalculating ? 'Calculating...' : 'Recalculate Late'}</span>
          </button>

          <button
            onClick={() => {
              setNetworkError('');
              setNetworkSuccess('');
              setShowNetworkModal(true);
            }}
            className={styles.secondaryBtn}
            title="Configure Allowed Office Wi-Fi / Networks"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '18px', color: isNetworkConfigured ? '#059669' : '#d97706' }}
            >
              {isNetworkConfigured ? 'wifi_lock' : 'wifi_off'}
            </span>
            <span>Network Settings</span>
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
            className={styles.primaryBtn}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            Record Attendance
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

      {/* 2. Office Network Geofence Warning / Status Box */}
      {!isLoadingNetworks && (
        !isNetworkConfigured ? (
          <div className={`${styles.networkBanner} ${styles.networkBannerWarning}`}>
            <div className={styles.networkBannerContent}>
              <div className={`${styles.networkBannerIconBox} ${styles.networkIconWarning}`}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>wifi_off</span>
              </div>
              <div className={styles.networkBannerTextGroup}>
                <div className={styles.networkBannerTitleRow}>
                  <h3 className={styles.networkBannerTitle}>Office Network Not Configured — Staff App Check-in Disabled</h3>
                  <span className={`${styles.networkStatusPill} ${styles.pillWarning}`}>Action Required</span>
                </div>
                <p className={styles.networkBannerDesc}>
                  No authorized office Wi-Fi network or IP address has been saved. The staff mobile app restricts check-in and check-out to registered office networks only. Employees will be <strong>blocked from clocking in or out</strong> via the mobile app until at least one authorized office network is saved.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setNetworkError('');
                setNetworkSuccess('');
                setShowNetworkModal(true);
              }}
              className={styles.networkBtnWarning}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>settings_ethernet</span>
              Configure Network Settings
            </button>
          </div>
        ) : (
          <div className={`${styles.networkBanner} ${styles.networkBannerSuccess}`}>
            <div className={styles.networkBannerContent}>
              <div className={`${styles.networkBannerIconBox} ${styles.networkIconSuccess}`}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>wifi_lock</span>
              </div>
              <div className={styles.networkBannerTextGroup}>
                <div className={styles.networkBannerTitleRow}>
                  <h3 className={styles.networkBannerTitle}>Office Network Protection Active — Staff Mobile Clock-in Protected</h3>
                  <span className={`${styles.networkStatusPill} ${styles.pillSuccess}`}>
                    {activeNetworks.length} Active {activeNetworks.length === 1 ? 'Network' : 'Networks'}
                  </span>
                </div>
                <p className={styles.networkBannerDesc}>
                  Staff mobile check-in and check-out is strictly restricted to saved networks ({activeNetworks.map(n => n.name || n.ssid || n.ipAddress).join(', ')}). Devices outside authorized office networks are prevented from recording mobile attendance.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setNetworkError('');
                setNetworkSuccess('');
                setShowNetworkModal(true);
              }}
              className={styles.networkBtnSuccess}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>tune</span>
              Network Settings
            </button>
          </div>
        )
      )}

      {/* 3. Operational Workforce KPI Cards */}
      <section className={styles.kpiGrid}>
        {/* Attendance Rate */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>how_to_reg</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${styles.trendPositive}`}>
              Today
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Attendance Rate</span>
            <div className={styles.kpiValue}>
              {isLoading ? <div className={styles.skeleton} style={{ height: '30px', width: '60px' }} /> : `${attendanceRate}%`}
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span>{todayPresent} of {totalEmps} Staff Present</span>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>Active</span>
          </div>
        </div>

        {/* Present on Time */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>check_circle</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${styles.trendPositive}`}>
              On Time
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Present On Time</span>
            <div className={styles.kpiValue}>
              {isLoading ? <div className={styles.skeleton} style={{ height: '30px', width: '50px' }} /> : presentCount}
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span>All Logged Attendances</span>
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Punctual</span>
          </div>
        </div>

        {/* Late Arrivals */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>schedule</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${lateCount > 0 ? styles.trendWarning : styles.trendPositive}`}>
              {lateCount > 0 ? 'Delayed' : 'Clear'}
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Late Clock-ins</span>
            <div className={styles.kpiValue}>
              {isLoading ? <div className={styles.skeleton} style={{ height: '30px', width: '50px' }} /> : lateCount}
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span>Recorded Tardy Minutes</span>
            <span>{lateCount} Incidents</span>
          </div>
        </div>

        {/* Absences / Exceptions */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>person_off</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${absentCount > 0 ? styles.trendDanger : styles.trendNeutral}`}>
              Exceptions
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Absences & Leaves</span>
            <div className={styles.kpiValue}>
              {isLoading ? <div className={styles.skeleton} style={{ height: '30px', width: '50px' }} /> : absentCount + halfDayCount}
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span>{absentCount} Absent · {halfDayCount} Half Day</span>
            <Link href="/erp/hr/leaves" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Leaves →
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Filter & Controls Bar */}
      <section className={styles.controlsCard}>
        <div className={styles.controlsTopRow}>
          {/* Employee Select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
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

          {/* Date Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-muted)' }}>calendar_today</span>
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className={styles.selectDropdown}
            />
          </div>

          {(filterEmpId || filterDate || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setFilterEmpId('');
                setFilterDate('');
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

        <div className={styles.controlsBottomRow}>
          {/* Status Tabs */}
          <div className={styles.statusTabsList}>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`${styles.statusTabBtn} ${statusFilter === 'ALL' ? styles.statusTabBtnActive : ''}`}
            >
              All Logs
              <span style={{ opacity: 0.7 }}>({records.length})</span>
            </button>

            <button
              onClick={() => setStatusFilter('PRESENT')}
              className={`${styles.statusTabBtn} ${statusFilter === 'PRESENT' ? styles.statusTabBtnActive : ''}`}
            >
              Present
              <span style={{ opacity: 0.7 }}>({presentCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('LATE')}
              className={`${styles.statusTabBtn} ${statusFilter === 'LATE' ? styles.statusTabBtnActive : ''}`}
            >
              Late
              <span style={{ opacity: 0.7 }}>({lateCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('ABSENT')}
              className={`${styles.statusTabBtn} ${statusFilter === 'ABSENT' ? styles.statusTabBtnActive : ''}`}
            >
              Absent
              <span style={{ opacity: 0.7 }}>({absentCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('HALF_DAY')}
              className={`${styles.statusTabBtn} ${statusFilter === 'HALF_DAY' ? styles.statusTabBtnActive : ''}`}
            >
              Half Day
              <span style={{ opacity: 0.7 }}>({halfDayCount})</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. Attendance Table / Empty State */}
      {isLoading ? (
        <div className={styles.tableCard} style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={styles.skeleton} style={{ height: '52px', borderRadius: '12px' }} />
            ))}
          </div>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className={styles.emptyStateBox}>
          <div className={styles.emptyStateIcon}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
              {filterEmpId || filterDate || statusFilter !== 'ALL' ? 'search_off' : 'fact_check'}
            </span>
          </div>

          {filterEmpId || filterDate || statusFilter !== 'ALL' ? (
            <>
              <h3 className={styles.emptyStateTitle}>No Matching Attendance Records</h3>
              <p className={styles.emptyStateDesc}>
                No attendance logs found matching your filter selection. Try adjusting the date or clearing filters.
              </p>
              <button
                onClick={() => {
                  setFilterEmpId('');
                  setFilterDate('');
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
        <div className={styles.tableCard}>
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.dataTable}>
              <thead>
                <tr className={styles.tableHeaderRow}>
                  <th className={styles.tableHeaderCell}>Staff Personnel</th>
                  <th className={styles.tableHeaderCell}>Log Date</th>
                  <th className={styles.tableHeaderCell}>Check In</th>
                  <th className={styles.tableHeaderCell}>Check Out</th>
                  <th className={styles.tableHeaderCell}>Late Duration</th>
                  <th className={styles.tableHeaderCell}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.slice(0, 100).map(r => {
                  const emp = empMap[r.employeeId];
                  const fullName = emp ? `${emp.firstName} ${emp.lastName}` : 'Staff Personnel';
                  const initials = emp
                    ? `${emp.firstName[0] || ''}${emp.lastName[0] || ''}`.toUpperCase()
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontWeight: 500 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--text-muted)' }}>calendar_today</span>
                          <span>{r.date ? new Date(r.date).toLocaleDateString() : '—'}</span>
                        </div>
                      </td>

                      <td className={styles.tableCell}>
                        <span className={styles.timeBadge}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--success)' }}>login</span>
                          {formatDisplayTime(checkIn)}
                        </span>
                      </td>

                      <td className={styles.tableCell}>
                        <span className={styles.timeBadge}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--primary)' }}>logout</span>
                          {formatDisplayTime(checkOut)}
                        </span>
                      </td>

                      <td className={styles.tableCell}>
                        {r.lateMinutes && r.lateMinutes > 0 ? (
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                            +{r.lateMinutes} min late
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>0 min</span>
                        )}
                      </td>

                      <td className={styles.tableCell}>
                        <span className={`${styles.statusChip} ${getStatusClass(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
                  <label className={styles.formLabel}>Check In Time</label>
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

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Late Minutes</label>
                <input
                  type="number"
                  min="0"
                  value={form.lateMinutes}
                  onChange={e => handleForm('lateMinutes', e.target.value)}
                  placeholder="0"
                  className={styles.formInput}
                />
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
    </div>
  );
}
