"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from "../../../income/page.module.css";

type Employee = {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  designation: string;
  department: string | null;
  status: string;
};

type Attendance = {
  id: string;
  employeeId: string;
  date: string;
  checkInTime: string | null;
  checkInLocation: string | null;
  checkOutTime: string | null;
  checkOutLocation: string | null;
  status: string;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  overtimeMinutes: number;
  reviewStatus: string | null;
  punishmentReason: string | null;
  punishmentAmount: number | null;
};

export default function EmployeeAttendancePage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.employeeId as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null);

  // Filters State
  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (employeeId) {
      fetchData();
    }
  }, [employeeId]);

  const fetchData = async () => {
    try {
      // Fetch this specific employee (from the list of all for simplicity)
      const empRes = await fetch('/api/employees');
      if (empRes.ok) {
        const data = await empRes.json();
        const emp = data.find((e: any) => e.id === employeeId);
        if (emp) setEmployee(emp);
      }

      // Fetch their attendance records
      const attRes = await fetch(`/api/attendance?employeeId=${employeeId}`);
      if (attRes.ok) {
        const attData = await attRes.json();
        setAttendances(Array.isArray(attData) ? attData : []);
      }
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (f: string, l: string) => `${f ? f[0] : ''}${l ? l[0] : ''}`.toUpperCase();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const formatDay = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '--:--';
    return new Date(timeStr).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit'
    });
  };
  
  const formatCurrency = (val: number | string | null) => {
    if (!val) return '৳0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val));
  };

  const getWorkingHours = (checkIn: string | null, checkOut: string | null) => {
    if (!checkIn || !checkOut) return '0h 0m';
    const diffMs = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    if (diffMs < 0) return '0h 0m';
    const hrs = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    return `${hrs}h ${mins}m`;
  };

  // Filter Logic
  const filteredAttendances = attendances.filter(att => {
    const d = new Date(att.date);
    const matchesMonth = filterMonth === "ALL" || (d.getMonth() + 1).toString() === filterMonth;
    const matchesYear = filterYear === "ALL" || d.getFullYear().toString() === filterYear;
    const matchesStatus = filterStatus === "ALL" || att.status === filterStatus;
    
    return matchesMonth && matchesYear && matchesStatus;
  });

  // Calculate Metrics from FILTERED data (usually metrics are for the selected month)
  let presentDays = 0;
  let lateDays = 0;
  let absentDays = 0;
  let leaveDays = 0;
  let totalWorkingHoursMs = 0;
  let totalPunishment = 0;

  filteredAttendances.forEach(att => {
    if (att.status === 'PRESENT') presentDays++;
    else if (att.status === 'LATE') lateDays++;
    else if (att.status === 'ABSENT') absentDays++;
    else if (att.status === 'ON_LEAVE') leaveDays++;
    else if (att.status === 'OFF_DAY_WORK') presentDays++;
    
    if (att.checkInTime && att.checkOutTime) {
      const diffMs = new Date(att.checkOutTime).getTime() - new Date(att.checkInTime).getTime();
      if (diffMs > 0) totalWorkingHoursMs += diffMs;
    }
    
    if (att.punishmentAmount) {
      totalPunishment += Number(att.punishmentAmount);
    }
  });

  const totalHrs = Math.floor(totalWorkingHoursMs / 3600000);
  const totalMins = Math.floor((totalWorkingHoursMs % 3600000) / 60000);

  // Sort by date descending
  filteredAttendances.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredAttendances.length / itemsPerPage));
  const paginatedAttendances = filteredAttendances.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadgeClass = (status: string) => {
    if (status === 'PRESENT' || status === 'OFF_DAY_WORK') return styles['badge-paid'];
    if (status === 'LATE' || status === 'ON_LEAVE' || status === 'HALF_DAY') return styles['badge-partial'];
    if (status === 'ABSENT' || status === 'OUTSIDE_OFFICE') return styles['badge-unpaid'];
    return '';
  };

  if (isLoading) {
    return <div className="animate-fade-in container" style={{ padding: '40px', textAlign: 'center' }}>Loading profile...</div>;
  }

  if (!employee) {
    return (
      <div className="animate-fade-in container" style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Employee not found</h2>
        <Link href="/dashboard/staff-management/attendance">
          <button className="btn btn-primary" style={{ marginTop: '16px' }}>Back to Directory</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in container" style={{ maxWidth: '1400px' }}>
      
      {/* Header Profile Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: "var(--spacing-6)" }}>
        <button onClick={() => router.push('/dashboard/staff-management/attendance')} className="btn btn-secondary" style={{ padding: '8px', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        
        <div style={{ 
          width: '64px', height: '64px', borderRadius: '50%', 
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '24px', fontWeight: 'bold', color: '#fff',
          flexShrink: 0
        }}>
          {getInitials(employee.firstName, employee.lastName)}
        </div>
        
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '24px' }}>{employee.firstName} {employee.lastName}</h1>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            <span>{employee.employeeId}</span>
            <span>•</span>
            <span style={{ color: 'var(--primary)' }}>{employee.designation} {employee.department && `(${employee.department})`}</span>
            <span>•</span>
            <span className={`${styles.badge} ${
              employee.status === 'ACTIVE' ? styles['badge-paid'] : styles['badge-unpaid']
            }`}>{employee.status}</span>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        
        {/* Top Section Metrics */}
        <div className={styles.metricsGrid}>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Present Days</div>
            <div className={styles.metricValue} style={{ color: 'var(--success)' }}>{presentDays}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Late Days</div>
            <div className={styles.metricValue} style={{ color: 'var(--warning)' }}>{lateDays}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Absent Days</div>
            <div className={styles.metricValue} style={{ color: 'var(--danger)' }}>{absentDays}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Leave Days</div>
            <div className={styles.metricValue} style={{ color: 'var(--primary)' }}>{leaveDays}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Total Working Hours</div>
            <div className={styles.metricValue} style={{ fontSize: '20px' }}>{totalHrs}h {totalMins}m</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Total Punishment</div>
            <div className={styles.metricValue} style={{ color: 'var(--danger)' }}>{formatCurrency(totalPunishment)}</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          
          {/* Filters Section */}
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup}>
              <label className="label">Month</label>
              <select className="input" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
                <option value="ALL">All Months</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Year</label>
              <select className="input" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                <option value="ALL">All Years</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Status</label>
              <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="PRESENT">Present</option>
                <option value="LATE">Late</option>
                <option value="ABSENT">Absent</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="WEEKLY_OFF">Weekly Off</option>
              </select>
            </div>
            <div style={{ flex: 1 }}></div>
            <div className={styles.filterGroup} style={{ flex: 'none', paddingBottom: '2px' }}>
              <button className="btn btn-secondary" onClick={() => window.print()}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                Export
              </button>
            </div>
          </div>

          {/* Table */}
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Working Hrs</th>
                  <th>Late Min</th>
                  <th>Early Min</th>
                  <th>OT Min</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Punishment (৳)</th>
                  <th>Review Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAttendances.length > 0 ? (
                  paginatedAttendances.map((att) => (
                    <tr 
                      key={att.id} 
                      className={styles.clickableRow}
                      onClick={() => setSelectedRecord(att)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 500 }}>{formatDate(att.date)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{formatDay(att.date)}</td>
                      <td>{formatTime(att.checkInTime)}</td>
                      <td>{formatTime(att.checkOutTime)}</td>
                      <td style={{ color: 'var(--primary)' }}>{getWorkingHours(att.checkInTime, att.checkOutTime)}</td>
                      <td style={{ color: att.lateMinutes > 0 ? 'var(--warning)' : 'inherit' }}>{att.lateMinutes}</td>
                      <td style={{ color: att.earlyLeaveMinutes > 0 ? 'var(--warning)' : 'inherit' }}>{att.earlyLeaveMinutes}</td>
                      <td style={{ color: att.overtimeMinutes > 0 ? 'var(--success)' : 'inherit' }}>{att.overtimeMinutes}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`${styles.badge} ${getStatusBadgeClass(att.status)}`}>
                          {att.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', color: att.punishmentAmount && att.punishmentAmount > 0 ? 'var(--danger)' : 'inherit' }}>
                        {formatCurrency(att.punishmentAmount || 0)}
                      </td>
                      <td>
                        {att.reviewStatus === 'TEMPORARY_REVIEW' ? (
                          <span style={{ fontSize: '12px', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>warning</span> Review
                          </span>
                        ) : '-'}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => setSelectedRecord(att)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px', borderColor: 'var(--border)' }}>Details</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={12} style={{ textAlign: "center", padding: "var(--spacing-6)" }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5 }}>calendar_month</span>
                        <p>No attendance records found for the selected period.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAttendances.length)} of {filteredAttendances.length} entries
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn btn-secondary" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  Previous
                </button>
                <button 
                  className="btn btn-secondary" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details Drawer */}
      {selectedRecord && (
        <div className={styles.modalOverlay} onClick={() => setSelectedRecord(null)} style={{ justifyContent: 'flex-end', padding: 0 }}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ height: '100%', width: '100%', maxWidth: '500px', borderRadius: 0, overflowY: 'auto' }}>
            <div className={styles.modalHeader} style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 10, padding: 'var(--spacing-4)', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ margin: 0 }}>Attendance Record</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{formatDate(selectedRecord.date)} • {formatDay(selectedRecord.date)}</div>
              </div>
              <button onClick={() => setSelectedRecord(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div style={{ padding: 'var(--spacing-6)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ color: selectedRecord.status === 'PRESENT' ? '#10b981' : selectedRecord.status === 'LATE' ? '#f59e0b' : '#ef4444' }}>
                      {selectedRecord.status === 'PRESENT' ? 'check_circle' : selectedRecord.status === 'LATE' ? 'schedule' : 'cancel'}
                    </span>
                    {selectedRecord.status.replace(/_/g, ' ')}
                  </h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Working Hours</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--primary)' }}>
                    {getWorkingHours(selectedRecord.checkInTime, selectedRecord.checkOutTime)}
                  </div>
                </div>
              </div>

              {/* Check In/Out Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: 'var(--surface-light)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>login</span> Check In
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>{formatTime(selectedRecord.checkInTime)}</div>
                  <div style={{ fontSize: '12px', color: 'var(--primary)', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', marginTop: '2px' }}>location_on</span>
                    {selectedRecord.checkInLocation || 'No location recorded'}
                  </div>
                </div>
                
                <div style={{ background: 'var(--surface-light)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>logout</span> Check Out
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>{formatTime(selectedRecord.checkOutTime)}</div>
                  <div style={{ fontSize: '12px', color: 'var(--primary)', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', marginTop: '2px' }}>location_on</span>
                    {selectedRecord.checkOutLocation || 'No location recorded'}
                  </div>
                </div>
              </div>

              {/* Time Metrics */}
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 16px 0' }}>Time Tracking</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Late Arrival</span>
                  <span style={{ color: selectedRecord.lateMinutes > 0 ? 'var(--warning)' : 'inherit' }}>{selectedRecord.lateMinutes} mins</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Early Leave</span>
                  <span style={{ color: selectedRecord.earlyLeaveMinutes > 0 ? 'var(--warning)' : 'inherit' }}>{selectedRecord.earlyLeaveMinutes} mins</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '8px 0' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Overtime</span>
                  <span style={{ color: selectedRecord.overtimeMinutes > 0 ? 'var(--success)' : 'inherit' }}>{selectedRecord.overtimeMinutes} mins</span>
                </div>
              </div>

              {/* Disciplinary */}
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '32px' }}>
                <h4 style={{ margin: '0 0 16px 0', color: 'var(--danger)' }}>Disciplinary Actions</h4>
                
                {selectedRecord.reviewStatus === 'TEMPORARY_REVIEW' && (
                  <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', marginBottom: '12px', display: 'flex', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ color: '#f59e0b', fontSize: '20px' }}>warning</span>
                    <div>
                      <div style={{ color: '#fcd34d', fontWeight: 'bold', fontSize: '13px' }}>Temporary Review Active</div>
                      <div style={{ color: '#fbbf24', fontSize: '12px', marginTop: '4px' }}>Awaiting manager approval for rule violation (e.g. absent, late, or off-site check-in). No deduction applied yet.</div>
                    </div>
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Reason</span>
                  <span>{selectedRecord.punishmentReason || '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '8px 0' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Deduction Applied</span>
                  <span style={{ color: 'var(--danger)', fontWeight: 500 }}>{formatCurrency(selectedRecord.punishmentAmount || 0)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }}>Edit Record</button>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedRecord(null)}>Close</button>
              </div>
              
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
