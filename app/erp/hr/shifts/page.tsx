"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import {
  Calendar,
  Clock,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  Trash2,
  Edit2,
  X,
  Layers,
  CalendarDays
} from 'lucide-react';

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  designation: string;
  department?: string;
  workShiftId?: string;
  workShift?: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    gracePeriod: number;
    nightShift?: boolean;
  };
}

interface WorkShift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  gracePeriod: number;
  breakTime?: number;
  nightShift?: boolean;
  isActive: boolean;
  _count?: {
    employees: number;
    rosters: number;
  };
}

interface AttendanceRoster {
  id: string;
  employeeId: string;
  date: string;
  workShiftId?: string;
  startTime?: string;
  endTime?: string;
  gracePeriod?: number;
  note?: string;
  status: string;
  workShift?: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    gracePeriod: number;
    nightShift?: boolean;
  };
}

export default function ShiftsAndDutyRosterPage() {
  const [activeTab, setActiveTab] = useState<'roster' | 'shifts'>('roster');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rosters, setRosters] = useState<AttendanceRoster[]>([]);
  const [shifts, setShifts] = useState<WorkShift[]>([]);

  // Filters & Date Range
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  
  // Date Window (Defaults to 7-day window starting today)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [daysCount, setDaysCount] = useState(7);

  // Modals state
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Override Form State
  const [overrideForm, setOverrideForm] = useState({
    employeeIds: [] as string[],
    date: new Date().toISOString().split('T')[0],
    endDate: '',
    isDateRange: false,
    dutyType: 'PREDEFINED' as 'PREDEFINED' | 'CUSTOM',
    workShiftId: '',
    startTime: '09:30',
    endTime: '18:00',
    gracePeriod: 15,
    note: '',
  });

  // Shift Form State
  const [shiftForm, setShiftForm] = useState({
    id: '',
    name: '',
    startTime: '09:00',
    endTime: '17:00',
    gracePeriod: 15,
    breakTime: 60,
    nightShift: false,
    isActive: true,
  });

  // Calculate dates array for the current window
  const dateColumns = useMemo(() => {
    const dates: { dateStr: string; label: string; dayName: string; isToday: boolean; isWeekend: boolean }[] = [];
    const base = new Date(startDate);
    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < daysCount; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const isWeekend = dayName === 'Fri' || dayName === 'Sat';

      dates.push({
        dateStr,
        label,
        dayName,
        isToday: dateStr === todayStr,
        isWeekend
      });
    }
    return dates;
  }, [startDate, daysCount]);

  const endDate = useMemo(() => {
    if (dateColumns.length === 0) return startDate;
    return dateColumns[dateColumns.length - 1].dateStr;
  }, [dateColumns, startDate]);

  // Fetch Duty Roster & Employees
  const fetchRosterData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/hr/duty-roster?startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch duty roster');

      setEmployees(data.employees || []);
      setRosters(data.rosters || []);
      setShifts(data.shifts || []);
      if (data.shifts && data.shifts.length > 0 && !overrideForm.workShiftId) {
        setOverrideForm(prev => ({ ...prev, workShiftId: data.shifts[0].id }));
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Fetch Work Shifts
  const fetchShifts = useCallback(async () => {
    try {
      const res = await fetch('/api/hr/shifts');
      const data = await res.json();
      if (res.ok && data.shifts) {
        setShifts(data.shifts);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchRosterData();
    fetchShifts();
  }, [fetchRosterData, fetchShifts]);

  // List of unique departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach(e => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set);
  }, [employees]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const name = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      const code = (emp.employeeId || '').toLowerCase();
      const desig = (emp.designation || '').toLowerCase();
      const q = searchQuery.toLowerCase();

      const matchesSearch = !q || name.includes(q) || code.includes(q) || desig.includes(q);
      const matchesDept = selectedDepartment === 'ALL' || emp.department === selectedDepartment;
      return matchesSearch && matchesDept;
    });
  }, [employees, searchQuery, selectedDepartment]);

  // Map of roster overrides: key = `${employeeId}_${dateStr}`
  const rosterMap = useMemo(() => {
    const map = new Map<string, AttendanceRoster>();
    rosters.forEach(r => {
      const dStr = new Date(r.date).toISOString().split('T')[0];
      map.set(`${r.employeeId}_${dStr}`, r);
    });
    return map;
  }, [rosters]);

  // Handle open override modal for specific cell or general
  const handleOpenOverrideModal = (employeeId?: string, dateStr?: string) => {
    setOverrideForm(prev => ({
      ...prev,
      employeeIds: employeeId ? [employeeId] : (prev.employeeIds.length > 0 ? prev.employeeIds : (employees[0] ? [employees[0].id] : [])),
      date: dateStr || prev.date || startDate,
      endDate: '',
      isDateRange: false,
      dutyType: prev.dutyType || 'PREDEFINED',
      workShiftId: shifts[0]?.id || '',
      startTime: prev.startTime || '09:30',
      endTime: prev.endTime || '18:00',
      gracePeriod: 15,
      note: ''
    }));
    setIsOverrideModalOpen(true);
  };

  // Submit Duty Override
  const handleSubmitOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: any = {
        employeeIds: overrideForm.employeeIds,
        startDate: overrideForm.date,
        note: overrideForm.note,
      };

      if (overrideForm.isDateRange && overrideForm.endDate) {
        payload.endDate = overrideForm.endDate;
      }

      if (overrideForm.dutyType === 'PREDEFINED') {
        payload.workShiftId = overrideForm.workShiftId;
      } else {
        payload.startTime = overrideForm.startTime;
        payload.endTime = overrideForm.endTime;
        payload.gracePeriod = overrideForm.gracePeriod;
      }

      const res = await fetch('/api/hr/duty-roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save duty override');

      setSuccessMsg(data.message || 'Duty schedule updated successfully');
      setTimeout(() => setSuccessMsg(null), 4000);
      setIsOverrideModalOpen(false);
      fetchRosterData();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Delete / Revert an Override
  const handleRevertOverride = async (employeeId: string, dateStr: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Revert this duty time back to the employee’s standard shift?')) return;

    try {
      const res = await fetch(`/api/hr/duty-roster?employeeId=${employeeId}&date=${dateStr}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revert');

      fetchRosterData();
    } catch (err: any) {
      alert(err.message || 'Error reverting duty schedule');
    }
  };

  // Shift CRUD
  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = !!shiftForm.id;
      const res = await fetch('/api/hr/shifts', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shiftForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save shift');

      setIsShiftModalOpen(false);
      fetchShifts();
      fetchRosterData();
    } catch (err: any) {
      alert(err.message || 'Error saving shift');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteShift = async (id: string) => {
    if (!confirm('Are you sure you want to delete this standard work shift?')) return;
    try {
      const res = await fetch(`/api/hr/shifts?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to delete shift');
      }
      fetchShifts();
    } catch (err: any) {
      alert(err.message || 'Error deleting shift');
    }
  };

  // Navigate Date Windows
  const handleNavigateDate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setStartDate(new Date().toISOString().split('T')[0]);
      return;
    }
    const curr = new Date(startDate);
    const delta = direction === 'next' ? daysCount : -daysCount;
    curr.setDate(curr.getDate() + delta);
    setStartDate(curr.toISOString().split('T')[0]);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Employee Duty & Shift Management"
        description="Schedule, adjust, and override daily duty hours for employees with automatic attendance calculation sync."
      />

      {/* Top Banner Alert */}
      {successMsg && (
        <div style={{
          padding: '12px 18px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '10px',
          color: '#10b981',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div style={{
          padding: '12px 18px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '10px',
          color: '#ef4444',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px',
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* View Tabs */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '20px'
      }}>
        {/* Tab Buttons */}
        <div style={{
          display: 'inline-flex',
          background: 'var(--surface-card)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-main)',
          gap: '4px'
        }}>
          <button
            onClick={() => setActiveTab('roster')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: activeTab === 'roster' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'roster' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.15s ease',
              boxShadow: activeTab === 'roster' ? '0 2px 8px var(--primary-glow)' : 'none'
            }}
          >
            <CalendarDays size={16} />
            <span>Duty Schedule & Overrides</span>
          </button>

          <button
            onClick={() => setActiveTab('shifts')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: activeTab === 'shifts' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'shifts' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.15s ease',
              boxShadow: activeTab === 'shifts' ? '0 2px 8px var(--primary-glow)' : 'none'
            }}
          >
            <Layers size={16} />
            <span>Standard Work Shifts ({shifts.length})</span>
          </button>
        </div>

        {/* Primary Action Button */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {activeTab === 'roster' ? (
            <button
              onClick={() => handleOpenOverrideModal()}
              style={{
                padding: '9px 18px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)'
              }}
            >
              <Plus size={16} />
              <span>Change / Assign Duty Time</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setShiftForm({
                  id: '',
                  name: '',
                  startTime: '09:00',
                  endTime: '17:00',
                  gracePeriod: 15,
                  breakTime: 60,
                  nightShift: false,
                  isActive: true,
                });
                setIsShiftModalOpen(true);
              }}
              style={{
                padding: '9px 18px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)'
              }}
            >
              <Plus size={16} />
              <span>Add New Work Shift</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: DUTY ROSTER & SCHEDULE */}
      {activeTab === 'roster' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Controls Bar: Date navigation, Search, Department */}
          <div className="glass-card" style={{
            padding: '16px 20px',
            borderRadius: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-main)'
          }}>
            {/* Date Window Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'var(--surface-hover)',
                borderRadius: '8px',
                border: '1px solid var(--border-main)',
                overflow: 'hidden'
              }}>
                <button
                  onClick={() => handleNavigateDate('prev')}
                  style={{
                    padding: '8px 10px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Previous Window"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => handleNavigateDate('today')}
                  style={{
                    padding: '6px 12px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderLeft: '1px solid var(--border-main)',
                    borderRight: '1px solid var(--border-main)'
                  }}
                >
                  Today
                </button>
                <button
                  onClick={() => handleNavigateDate('next')}
                  style={{
                    padding: '8px 10px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Next Window"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Window start picker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-main)',
                    background: 'var(--surface-hover)',
                    color: 'var(--text-main)',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                />
              </div>

              {/* Window length selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {[7, 14, 30].map(cnt => (
                  <button
                    key={cnt}
                    onClick={() => setDaysCount(cnt)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-main)',
                      background: daysCount === cnt ? 'var(--primary)' : 'var(--surface-hover)',
                      color: daysCount === cnt ? '#ffffff' : 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {cnt} Days
                  </button>
                ))}
              </div>
            </div>

            {/* Search & Department Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', minWidth: '220px' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 12px 7px 32px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-main)',
                    background: 'var(--surface-hover)',
                    color: 'var(--text-main)',
                    fontSize: '12px'
                  }}
                />
              </div>

              {departments.length > 0 && (
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-main)',
                    background: 'var(--surface-hover)',
                    color: 'var(--text-main)',
                    fontSize: '12px'
                  }}
                >
                  <option value="ALL">All Departments</option>
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Roster Matrix Table */}
          <div className="glass-card" style={{
            borderRadius: '14px',
            overflow: 'hidden',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-main)',
          }}>
            {/* Table Header / Legend */}
            <div style={{
              padding: '12px 20px',
              borderBottom: '1px solid var(--border-main)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              background: 'var(--surface-hover)'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="var(--primary)" />
                <span>Duty Roster Matrix ({dateColumns[0]?.label} – {dateColumns[dateColumns.length - 1]?.label})</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Standard Shift</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 6px rgba(245, 158, 11, 0.6)' }} />
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Custom Duty Time (Override)</span>
                </div>
              </div>
            </div>

            {/* Matrix View */}
            <div style={{ overflowX: 'auto', maxHeight: '650px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: `${300 + dateColumns.length * 130}px` }}>
                <thead>
                  <tr style={{ background: 'var(--surface-main)', borderBottom: '1px solid var(--border-main)', position: 'sticky', top: 0, zIndex: 10 }}>
                    <th style={{
                      padding: '12px 16px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      position: 'sticky',
                      left: 0,
                      background: 'var(--surface-main)',
                      zIndex: 11,
                      minWidth: '220px',
                      boxShadow: '2px 0 6px rgba(0,0,0,0.1)'
                    }}>
                      Staff Member
                    </th>
                    {dateColumns.map(col => (
                      <th
                        key={col.dateStr}
                        style={{
                          padding: '10px 8px',
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: 700,
                          minWidth: '120px',
                          borderLeft: '1px solid var(--border-main)',
                          background: col.isToday
                            ? 'rgba(37, 99, 235, 0.12)'
                            : col.isWeekend
                            ? 'rgba(255, 255, 255, 0.02)'
                            : 'transparent',
                          color: col.isToday ? 'var(--primary)' : 'var(--text-main)'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: col.isToday ? 'var(--primary)' : 'var(--text-muted)' }}>
                            {col.dayName}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: col.isToday ? 800 : 600 }}>
                            {col.label}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={dateColumns.length + 1} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        Loading staff duty schedules...
                      </td>
                    </tr>
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={dateColumns.length + 1} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No employees found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map(emp => {
                      const defaultShift = emp.workShift;
                      const defaultStart = defaultShift?.startTime || '09:30';
                      const defaultEnd = defaultShift?.endTime || '18:00';
                      const defaultShiftName = defaultShift?.name || 'Default';

                      return (
                        <tr
                          key={emp.id}
                          style={{
                            borderBottom: '1px solid var(--border-main)',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          {/* Staff Header Column */}
                          <td style={{
                            padding: '12px 16px',
                            position: 'sticky',
                            left: 0,
                            background: 'var(--surface-card)',
                            zIndex: 5,
                            boxShadow: '2px 0 6px rgba(0,0,0,0.1)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(37,99,235,0.05))',
                                border: '1px solid rgba(37,99,235,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '13px',
                                color: 'var(--primary)'
                              }}>
                                {emp.firstName.charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                                  {emp.firstName} {emp.lastName}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                  <span>{emp.employeeId}</span>
                                  {emp.designation && <span>• {emp.designation}</span>}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Day Duty Columns */}
                          {dateColumns.map(col => {
                            const rosterKey = `${emp.id}_${col.dateStr}`;
                            const roster = rosterMap.get(rosterKey);
                            const hasOverride = !!roster;

                            // Resolve effective times for this day
                            const effectiveStart = roster?.startTime || roster?.workShift?.startTime || defaultStart;
                            const effectiveEnd = roster?.endTime || roster?.workShift?.endTime || defaultEnd;
                            const isNight = roster?.workShift?.nightShift || defaultShift?.nightShift;
                            const shiftTitle = roster?.workShift?.name || (roster?.startTime ? 'Custom Hours' : defaultShiftName);

                            return (
                              <td
                                key={col.dateStr}
                                onClick={() => handleOpenOverrideModal(emp.id, col.dateStr)}
                                style={{
                                  padding: '8px',
                                  textAlign: 'center',
                                  borderLeft: '1px solid var(--border-main)',
                                  background: hasOverride
                                    ? 'rgba(245, 158, 11, 0.08)'
                                    : col.isToday
                                    ? 'rgba(37, 99, 235, 0.04)'
                                    : 'transparent',
                                  cursor: 'pointer',
                                  position: 'relative'
                                }}
                                title={hasOverride ? `Override: ${roster?.note || 'Custom Schedule'} (Click to edit)` : 'Click to change duty time'}
                              >
                                <div style={{
                                  padding: '6px 8px',
                                  borderRadius: '8px',
                                  background: hasOverride ? 'rgba(245, 158, 11, 0.15)' : 'var(--surface-hover)',
                                  border: hasOverride ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-main)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '2px',
                                  position: 'relative',
                                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                                }}>
                                  {/* Override Badge */}
                                  {hasOverride && (
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      width: '100%',
                                      marginBottom: '2px'
                                    }}>
                                      <span style={{
                                        fontSize: '9px',
                                        fontWeight: 800,
                                        color: '#f59e0b',
                                        letterSpacing: '0.04em',
                                        textTransform: 'uppercase'
                                      }}>
                                        OVERRIDE
                                      </span>
                                      <button
                                        onClick={(e) => handleRevertOverride(emp.id, col.dateStr, e)}
                                        style={{
                                          background: 'transparent',
                                          border: 'none',
                                          color: 'var(--text-muted)',
                                          cursor: 'pointer',
                                          padding: 0,
                                          display: 'flex',
                                          alignItems: 'center'
                                        }}
                                        title="Revert to standard shift"
                                      >
                                        <RotateCcw size={11} />
                                      </button>
                                    </div>
                                  )}

                                  {/* Duty Hours */}
                                  <div style={{
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    color: hasOverride ? '#f59e0b' : 'var(--text-main)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    <span>{effectiveStart}</span>
                                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>-</span>
                                    <span>{effectiveEnd}</span>
                                  </div>

                                  {/* Shift Name / Note */}
                                  <div style={{
                                    fontSize: '10px',
                                    color: 'var(--text-muted)',
                                    maxWidth: '100px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {roster?.note ? roster.note : shiftTitle}
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STANDARD WORK SHIFTS MANAGEMENT */}
      {activeTab === 'shifts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {shifts.map(shift => (
              <div
                key={shift.id}
                className="glass-card"
                style={{
                  padding: '20px',
                  borderRadius: '14px',
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-main)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {shift.name}
                    </h3>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {shift.nightShift ? '🌙 Night Shift' : '☀️ Day Shift'} • Grace Period: {shift.gracePeriod} mins
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => {
                        setShiftForm({
                          id: shift.id,
                          name: shift.name,
                          startTime: shift.startTime,
                          endTime: shift.endTime,
                          gracePeriod: shift.gracePeriod || 0,
                          breakTime: shift.breakTime || 0,
                          nightShift: !!shift.nightShift,
                          isActive: shift.isActive,
                        });
                        setIsShiftModalOpen(true);
                      }}
                      style={{
                        padding: '6px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-main)',
                        background: 'var(--surface-hover)',
                        color: 'var(--text-main)',
                        cursor: 'pointer'
                      }}
                      title="Edit Shift"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteShift(shift.id)}
                      style={{
                        padding: '6px',
                        borderRadius: '6px',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        cursor: 'pointer'
                      }}
                      title="Delete Shift"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Times badge */}
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'var(--surface-hover)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Start Time</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>{shift.startTime}</div>
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>→</div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>End Time</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>{shift.endTime}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: DUTY TIME CHANGE / OVERRIDE MODAL */}
      {isOverrideModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-main)',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(37, 99, 235, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)'
                }}>
                  <Clock size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
                    Change Duty Time
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                    Assign custom hours or a different shift for selected date(s).
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOverrideModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitOverride} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Employee Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Select Staff Member(s) *
                </label>
                <select
                  multiple
                  value={overrideForm.employeeIds}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setOverrideForm(prev => ({ ...prev, employeeIds: selected }));
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-main)',
                    background: 'var(--surface-hover)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    minHeight: '90px'
                  }}
                  required
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeId}) {emp.department ? `[${emp.department}]` : ''}
                    </option>
                  ))}
                </select>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Hold Ctrl / Cmd to select multiple employees</span>
                  <button
                    type="button"
                    onClick={() => setOverrideForm(prev => ({ ...prev, employeeIds: employees.map(e => e.id) }))}
                    style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                  >
                    Select All Staff
                  </button>
                </div>
              </div>

              {/* Date Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Duty Date(s) *
                  </label>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={overrideForm.isDateRange}
                      onChange={(e) => setOverrideForm(prev => ({ ...prev, isDateRange: e.target.checked }))}
                    />
                    <span>Date Range (Multiple Days)</span>
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: overrideForm.isDateRange ? '1fr 1fr' : '1fr', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{overrideForm.isDateRange ? 'Start Date' : 'Date'}</span>
                    <input
                      type="date"
                      value={overrideForm.date}
                      onChange={(e) => setOverrideForm(prev => ({ ...prev, date: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-main)',
                        background: 'var(--surface-hover)',
                        color: 'var(--text-main)',
                        fontSize: '13px'
                      }}
                      required
                    />
                  </div>
                  {overrideForm.isDateRange && (
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>End Date</span>
                      <input
                        type="date"
                        value={overrideForm.endDate}
                        min={overrideForm.date}
                        onChange={(e) => setOverrideForm(prev => ({ ...prev, endDate: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-main)',
                          background: 'var(--surface-hover)',
                          color: 'var(--text-main)',
                          fontSize: '13px'
                        }}
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Duty Time Specification Mode */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Duty Time Specification *
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  background: 'var(--surface-hover)',
                  padding: '4px',
                  borderRadius: '10px'
                }}>
                  <button
                    type="button"
                    onClick={() => setOverrideForm(prev => ({ ...prev, dutyType: 'PREDEFINED' }))}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: 'none',
                      background: overrideForm.dutyType === 'PREDEFINED' ? 'var(--primary)' : 'transparent',
                      color: overrideForm.dutyType === 'PREDEFINED' ? '#ffffff' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Select Company Shift
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverrideForm(prev => ({ ...prev, dutyType: 'CUSTOM' }))}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: 'none',
                      background: overrideForm.dutyType === 'CUSTOM' ? 'var(--primary)' : 'transparent',
                      color: overrideForm.dutyType === 'CUSTOM' ? '#ffffff' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Enter Custom Duty Hours
                  </button>
                </div>
              </div>

              {/* Pre-defined Shift Option */}
              {overrideForm.dutyType === 'PREDEFINED' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Choose Shift
                  </label>
                  <select
                    value={overrideForm.workShiftId}
                    onChange={(e) => setOverrideForm(prev => ({ ...prev, workShiftId: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-main)',
                      background: 'var(--surface-hover)',
                      color: 'var(--text-main)',
                      fontSize: '13px'
                    }}
                    required
                  >
                    {shifts.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.startTime} – {s.endTime}) {s.nightShift ? '• Night' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom Duty Hours Option */}
              {overrideForm.dutyType === 'CUSTOM' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={overrideForm.startTime}
                      onChange={(e) => setOverrideForm(prev => ({ ...prev, startTime: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-main)',
                        background: 'var(--surface-hover)',
                        color: 'var(--text-main)',
                        fontSize: '13px'
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      End Time *
                    </label>
                    <input
                      type="time"
                      value={overrideForm.endTime}
                      onChange={(e) => setOverrideForm(prev => ({ ...prev, endTime: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-main)',
                        background: 'var(--surface-hover)',
                        color: 'var(--text-main)',
                        fontSize: '13px'
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Grace (Mins)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={overrideForm.gracePeriod}
                      onChange={(e) => setOverrideForm(prev => ({ ...prev, gracePeriod: Number(e.target.value) }))}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-main)',
                        background: 'var(--surface-hover)',
                        color: 'var(--text-main)',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Note / Reason */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Reason / Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Afternoon shoot coverage, Special project shift"
                  value={overrideForm.note}
                  onChange={(e) => setOverrideForm(prev => ({ ...prev, note: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-main)',
                    background: 'var(--surface-hover)',
                    color: 'var(--text-main)',
                    fontSize: '13px'
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsOverrideModalOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-main)',
                    background: 'var(--surface-hover)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || overrideForm.employeeIds.length === 0}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--primary)',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px var(--primary-glow)'
                  }}
                >
                  {saving ? 'Saving...' : 'Apply Duty Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: WORK SHIFT CREATE / EDIT MODAL */}
      {isShiftModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-main)',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '500px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
                {shiftForm.id ? 'Edit Standard Shift' : 'Create Standard Shift'}
              </h3>
              <button
                onClick={() => setIsShiftModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveShift} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Shift Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Morning Shift, Night Shift"
                  value={shiftForm.name}
                  onChange={(e) => setShiftForm(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-main)',
                    background: 'var(--surface-hover)',
                    color: 'var(--text-main)',
                    fontSize: '13px'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, startTime: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-main)',
                      background: 'var(--surface-hover)',
                      color: 'var(--text-main)',
                      fontSize: '13px'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, endTime: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-main)',
                      background: 'var(--surface-hover)',
                      color: 'var(--text-main)',
                      fontSize: '13px'
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Grace Period (Minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={shiftForm.gracePeriod}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, gracePeriod: Number(e.target.value) }))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-main)',
                      background: 'var(--surface-hover)',
                      color: 'var(--text-main)',
                      fontSize: '13px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Break Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={shiftForm.breakTime}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, breakTime: Number(e.target.value) }))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-main)',
                      background: 'var(--surface-hover)',
                      color: 'var(--text-main)',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={shiftForm.nightShift}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, nightShift: e.target.checked }))}
                  />
                  <span>Is Night Shift (Crosses Midnight)</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsShiftModalOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-main)',
                    background: 'var(--surface-hover)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !shiftForm.name}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--primary)',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {saving ? 'Saving...' : 'Save Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
