"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from "../../income/page.module.css";

type Employee = {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  department: string | null;
  designation: string;
  status: string;
};

type Attendance = {
  id: string;
  employeeId: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string;
};

export default function AttendanceDirectoryPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [todayAttendances, setTodayAttendances] = useState<Record<string, Attendance>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [empRes, attRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/attendance')
      ]);
      
      let empData = [];
      let attData = [];
      
      if (empRes.ok) empData = await empRes.json();
      if (attRes.ok) attData = await attRes.json();
      
      setEmployees(Array.isArray(empData) ? empData : []);
      
      // Filter attendances for today
      const today = new Date().toISOString().split('T')[0];
      const todayAtt: Record<string, Attendance> = {};
      
      if (Array.isArray(attData)) {
        attData.forEach(att => {
          const attDate = new Date(att.date).toISOString().split('T')[0];
          if (attDate === today) {
            todayAtt[att.employeeId] = att;
          }
        });
      }
      
      setTodayAttendances(todayAtt);
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (f: string, l: string) => `${f ? f[0] : ''}${l ? l[0] : ''}`.toUpperCase();

  // Derived Metrics
  const totalEmployees = employees.length;
  let presentToday = 0;
  let lateToday = 0;
  let absentToday = 0;
  let leaveToday = 0;

  employees.forEach(emp => {
    const att = todayAttendances[emp.id];
    if (!att) {
      absentToday++;
    } else {
      if (att.status === 'PRESENT') presentToday++;
      else if (att.status === 'LATE') lateToday++;
      else if (att.status === 'ON_LEAVE') leaveToday++;
      else if (att.status === 'ABSENT') absentToday++;
      else presentToday++; // fallback
    }
  });

  // Filter & Sort Logic
  const allDepartments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

  let filteredEmployees = employees.filter(e => {
    const searchString = `${e.firstName} ${e.lastName} ${e.employeeId}`.toLowerCase();
    const matchesSearch = searchString.includes(searchQuery.toLowerCase());
    const matchesDept = filterDepartment === "ALL" || e.department === filterDepartment;
    
    // Status filter logic
    const att = todayAttendances[e.id];
    const todayStatus = att ? att.status : 'ABSENT';
    const matchesStatus = filterStatus === "ALL" || todayStatus === filterStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / itemsPerPage));
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadgeClass = (status: string) => {
    if (status === 'PRESENT') return styles['badge-paid'];
    if (status === 'LATE') return styles['badge-partial'];
    if (status === 'ABSENT') return styles['badge-unpaid'];
    if (status === 'ON_LEAVE') return styles['badge-partial'];
    return '';
  };

  return (
    <div className="animate-fade-in container" style={{ maxWidth: '1400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <div>
          <h1 style={{ margin: 0 }}>Employee Directory</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>Select an employee to view detailed attendance history.</p>
        </div>
      </div>

      <div className={styles.container}>
        
        {/* Top Section Metrics */}
        <div className={styles.metricsGrid}>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Total Employees</div>
            <div className={styles.metricValue} style={{ color: 'var(--text)' }}>{totalEmployees}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Present Today</div>
            <div className={styles.metricValue} style={{ color: 'var(--success)' }}>{presentToday}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Late Today</div>
            <div className={styles.metricValue} style={{ color: 'var(--warning)' }}>{lateToday}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Absent Today</div>
            <div className={styles.metricValue} style={{ color: 'var(--danger)' }}>{absentToday}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Leave Today</div>
            <div className={styles.metricValue} style={{ color: 'var(--primary)' }}>{leaveToday}</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          
          {/* Filters Section */}
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup} style={{ flex: 1.5 }}>
              <label className="label">Search Employee</label>
              <input 
                type="text" 
                className="input" 
                placeholder="Name or ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Department</label>
              <select className="input" value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}>
                <option value="ALL">All Departments</option>
                {allDepartments.map((dept: any) => <option key={dept} value={dept}>{dept}</option>)}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Today's Status</label>
              <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="PRESENT">Present</option>
                <option value="LATE">Late</option>
                <option value="ABSENT">Absent</option>
                <option value="ON_LEAVE">On Leave</option>
              </select>
            </div>
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
                  <th style={{ width: '40px' }}>Avatar</th>
                  <th>Employee Name</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Current Shift</th>
                  <th>Employment Status</th>
                  <th style={{ textAlign: 'center' }}>Today's Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center' }}>Loading...</td></tr>
                ) : paginatedEmployees.length > 0 ? (
                  paginatedEmployees.map((emp) => {
                    const att = todayAttendances[emp.id];
                    const todayStatus = att ? att.status : 'ABSENT';
                    
                    return (
                      <tr 
                        key={emp.id} 
                        className={styles.clickableRow}
                        onClick={() => router.push(`/dashboard/staff-management/attendance/${emp.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <div style={{ 
                            width: '32px', height: '32px', borderRadius: '50%', 
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', fontWeight: 'bold', color: '#fff'
                          }}>
                            {getInitials(emp.firstName, emp.lastName)}
                          </div>
                        </td>
                        <td style={{ fontWeight: 500 }}>{emp.firstName} {emp.lastName}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{emp.employeeId}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{emp.department || '-'}</td>
                        <td>{emp.designation}</td>
                        <td>09:00 AM - 06:00 PM</td>
                        <td>{emp.status}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`${styles.badge} ${getStatusBadgeClass(todayStatus)}`}>
                            {todayStatus.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <Link href={`/dashboard/staff-management/attendance/${emp.id}`}>
                              <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '12px', borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                                View Attendance
                              </button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "var(--spacing-6)" }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5 }}>how_to_reg</span>
                        <p>No employees found matching your criteria.</p>
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
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} entries
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
    </div>
  );
}
