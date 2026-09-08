"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './employees.module.css';

interface Employee {
  id: string;
  employeeId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  designation?: string;
  department?: string;
  basicSalary?: number | string;
  status?: string;
  joinDate?: string;
  departmentRef?: { name: string };
  designationRef?: { name: string };
}

interface Department {
  id: string;
  name: string;
}

interface Designation {
  id: string;
  name: string;
}

/**
 * ERP HR — Redesigned Employee Directory & Workforce Hub
 * Enterprise directory with live metrics, multi-dimensional filters,
 * dual Table/Card view modes, CSV roster export, and empty state CTA.
 */
export default function EmployeesPage() {
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedDesig, setSelectedDesig] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');

  const loadAll = useCallback(async (isManual = false) => {
    if (isManual) setIsSyncing(true);
    else setIsLoading(true);

    try {
      const [empRes, deptRes, desigRes] = await Promise.all([
        fetch('/api/employees').catch(() => null),
        fetch('/api/departments').catch(() => null),
        fetch('/api/designations').catch(() => null),
      ]);

      if (empRes && empRes.ok) {
        const empData = await empRes.json();
        setEmployees(Array.isArray(empData) ? empData : []);
      }
      if (deptRes && deptRes.ok) {
        const deptData = await deptRes.json();
        setDepartments(Array.isArray(deptData) ? deptData : []);
      }
      if (desigRes && desigRes.ok) {
        const desigData = await desigRes.json();
        setDesignations(Array.isArray(desigData) ? desigData : []);
      }

      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.error('Failed to load employee directory:', e);
    } finally {
      setIsLoading(false);
      if (isManual) setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Format currency helper
  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  // Derived KPI calculations
  const totalCount = employees.length;
  const activeCount = employees.filter(e => (e.status || 'ACTIVE') === 'ACTIVE').length;
  const onLeaveCount = employees.filter(e => e.status === 'ON_LEAVE').length;
  const terminatedCount = employees.filter(e => e.status === 'TERMINATED').length;

  const totalMonthlyPayroll = useMemo(() => {
    return employees.reduce((sum, emp) => sum + (Number(emp.basicSalary) || 0), 0);
  }, [employees]);

  const avgSalary = totalCount > 0 ? Math.round(totalMonthlyPayroll / totalCount) : 0;

  // Department coverage
  const representedDepts = useMemo(() => {
    const set = new Set(
      employees.map(e => e.departmentRef?.name || e.department).filter(Boolean)
    );
    return set.size;
  }, [employees]);

  // Multi-dimensional filtering
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      // Search
      const searchTarget = `${emp.firstName} ${emp.lastName} ${emp.email} ${emp.employeeId || ''} ${emp.department || ''} ${emp.designation || ''}`.toLowerCase();
      const matchesSearch = !search || searchTarget.includes(search.toLowerCase());

      // Department filter
      const deptName = emp.departmentRef?.name || emp.department || '';
      const matchesDept = selectedDept === 'ALL' || deptName === selectedDept;

      // Designation filter
      const desigName = emp.designationRef?.name || emp.designation || '';
      const matchesDesig = selectedDesig === 'ALL' || desigName === selectedDesig;

      // Status filter
      const empStatus = emp.status || 'ACTIVE';
      const matchesStatus = statusFilter === 'ALL' || empStatus === statusFilter;

      return matchesSearch && matchesDept && matchesDesig && matchesStatus;
    });
  }, [employees, search, selectedDept, selectedDesig, statusFilter]);

  // CSV Export
  const handleExportCSV = () => {
    if (employees.length === 0) return;
    const headers = [
      'Employee ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Department',
      'Designation',
      'Basic Salary',
      'Status',
      'Join Date',
    ];
    const rows = filteredEmployees.map(e => [
      e.employeeId || '',
      e.firstName || '',
      e.lastName || '',
      e.email || '',
      e.phone || '',
      e.departmentRef?.name || e.department || '',
      e.designationRef?.name || e.designation || '',
      e.basicSalary || '',
      e.status || 'ACTIVE',
      e.joinDate ? new Date(e.joinDate).toLocaleDateString() : '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `employee_roster_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRowClick = (emp: Employee) => {
    router.push(`/erp/hr/employees/${emp.id}`);
  };

  const getStatusClass = (status?: string) => {
    switch (status) {
      case 'ON_LEAVE':
        return styles.statusLeave;
      case 'TERMINATED':
        return styles.statusTerminated;
      default:
        return styles.statusActive;
    }
  };

  return (
    <div className={styles.container}>
      {/* 1. Executive Header */}
      <header className={styles.headerCard}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.liveBadgeRow}>
            <div className={styles.livePulseDot} />
            <span className={styles.liveBadgeText}>Live Directory • Master Roster</span>
          </div>
          <h1 className={styles.pageTitle}>
            Employee Directory & Workforce
            <span className={styles.titleBadge}>{totalCount} Registered</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Manage staff profiles, departmental allocations, job designations, and salary compensation.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            onClick={handleExportCSV}
            className={styles.secondaryBtn}
            disabled={employees.length === 0}
            title="Download CSV Roster"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
            Export CSV
          </button>

          <button
            onClick={() => loadAll(true)}
            className={styles.secondaryBtn}
            disabled={isSyncing}
            title="Refresh Employee Data"
          >
            <span
              className={`material-symbols-outlined ${isSyncing ? styles.spinning : ''}`}
              style={{ fontSize: '18px' }}
            >
              refresh
            </span>
            <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>

          <Link href="/erp/hr/employees/new" className={styles.primaryBtn}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
            Add Employee
          </Link>
        </div>
      </header>

      {/* 2. Workforce KPI Metric Cards */}
      <section className={styles.kpiGrid}>
        {/* Total Workforce */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>badge</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${styles.trendPositive}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>group</span>
              {totalCount > 0 ? `${Math.round((activeCount / totalCount) * 100)}% Active` : '0%'}
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Total Personnel</span>
            <div className={styles.kpiValue}>
              {isLoading ? <div className={styles.skeleton} style={{ height: '30px', width: '50px' }} /> : totalCount}
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span>Active Staff: {activeCount}</span>
            <span>Inactive: {totalCount - activeCount}</span>
          </div>
        </div>

        {/* Active Staff */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>how_to_reg</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${styles.trendPositive}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>verified</span>
              Operational
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Active Workforce</span>
            <div className={styles.kpiValue}>
              {isLoading ? <div className={styles.skeleton} style={{ height: '30px', width: '50px' }} /> : activeCount}
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span>On Leave: {onLeaveCount}</span>
            <span>Terminated: {terminatedCount}</span>
          </div>
        </div>

        {/* Department Spread */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>corporate_fare</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${styles.trendNeutral}`}>
              {departments.length} Available
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Department Spread</span>
            <div className={styles.kpiValue}>
              {isLoading ? (
                <div className={styles.skeleton} style={{ height: '30px', width: '50px' }} />
              ) : (
                `${representedDepts} / ${departments.length || 5}`
              )}
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span>Divisions Represented</span>
            <Link href="/erp/hr/departments" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Depts →
            </Link>
          </div>
        </div>

        {/* Monthly Payroll Base */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>account_balance_wallet</span>
            </div>
            <span className={`${styles.kpiTrendBadge} ${styles.trendPositive}`}>
              Monthly
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Base Payroll Liability</span>
            <div className={styles.kpiValue} style={{ fontSize: '20px' }}>
              {isLoading ? (
                <div className={styles.skeleton} style={{ height: '30px', width: '100px' }} />
              ) : (
                formatCurrency(totalMonthlyPayroll)
              )}
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span>Avg Salary: {formatCurrency(avgSalary)}</span>
            <Link href="/erp/hr/payroll" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Payroll →
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Filter & Controls Bar */}
      <section className={styles.controlsCard}>
        <div className={styles.controlsTopRow}>
          {/* Search Box */}
          <div className={styles.searchWrapper}>
            <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
            <input
              type="text"
              placeholder="Search by name, email, employee ID, designation..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            {search && (
              <button onClick={() => setSearch('')} className={styles.clearSearchBtn} title="Clear search">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
              </button>
            )}
          </div>

          {/* Filter Selects */}
          <div className={styles.filterSelectsGroup}>
            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className={styles.selectDropdown}
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Designation Filter */}
            <select
              value={selectedDesig}
              onChange={e => setSelectedDesig(e.target.value)}
              className={styles.selectDropdown}
            >
              <option value="ALL">All Designations</option>
              {designations.map(d => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.controlsBottomRow}>
          {/* Status Tabs */}
          <div className={styles.statusTabsList}>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`${styles.statusTabBtn} ${statusFilter === 'ALL' ? styles.statusTabBtnActive : ''}`}
            >
              All Staff
              <span style={{ opacity: 0.7 }}>({totalCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`${styles.statusTabBtn} ${statusFilter === 'ACTIVE' ? styles.statusTabBtnActive : ''}`}
            >
              Active
              <span style={{ opacity: 0.7 }}>({activeCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('ON_LEAVE')}
              className={`${styles.statusTabBtn} ${statusFilter === 'ON_LEAVE' ? styles.statusTabBtnActive : ''}`}
            >
              On Leave
              <span style={{ opacity: 0.7 }}>({onLeaveCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('TERMINATED')}
              className={`${styles.statusTabBtn} ${statusFilter === 'TERMINATED' ? styles.statusTabBtnActive : ''}`}
            >
              Terminated
              <span style={{ opacity: 0.7 }}>({terminatedCount})</span>
            </button>
          </div>

          {/* View Switcher */}
          <div className={styles.viewToggleGroup}>
            <button
              onClick={() => setViewMode('table')}
              className={`${styles.viewToggleBtn} ${viewMode === 'table' ? styles.viewToggleBtnActive : ''}`}
              title="Table View"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>table_rows</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`${styles.viewToggleBtn} ${viewMode === 'grid' ? styles.viewToggleBtnActive : ''}`}
              title="Card Grid View"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>grid_view</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. Main Data Presentation: Table vs Grid vs Empty State */}
      {isLoading ? (
        <div className={styles.tableCard} style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={styles.skeleton} style={{ height: '54px', borderRadius: '12px' }} />
            ))}
          </div>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className={styles.emptyStateBox}>
          <div className={styles.emptyStateIcon}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
              {search || selectedDept !== 'ALL' || selectedDesig !== 'ALL' || statusFilter !== 'ALL'
                ? 'person_search'
                : 'badge'}
            </span>
          </div>

          {search || selectedDept !== 'ALL' || selectedDesig !== 'ALL' || statusFilter !== 'ALL' ? (
            <>
              <h3 className={styles.emptyStateTitle}>No Matching Employees Found</h3>
              <p className={styles.emptyStateDesc}>
                No staff members matched your current filter criteria. Try adjusting your search keywords or clearing active filters.
              </p>
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedDept('ALL');
                  setSelectedDesig('ALL');
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
              <h3 className={styles.emptyStateTitle}>No Employees Registered Yet</h3>
              <p className={styles.emptyStateDesc}>
                Your organization roster is currently empty. Add your first team member to start managing assignments, tracking daily attendance, and automating payroll runs.
              </p>
              <Link href="/erp/hr/employees/new" className={styles.primaryBtn} style={{ marginTop: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
                Add Your First Employee
              </Link>
            </>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className={styles.tableCard}>
          <table className={styles.dataTable}>
            <thead>
              <tr className={styles.tableHeaderRow}>
                <th className={styles.tableHeaderCell}>Staff Member</th>
                <th className={styles.tableHeaderCell}>Department</th>
                <th className={styles.tableHeaderCell}>Designation</th>
                <th className={styles.tableHeaderCell}>Basic Salary</th>
                <th className={styles.tableHeaderCell}>Joined Date</th>
                <th className={styles.tableHeaderCell}>Status</th>
                <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => {
                const initials = `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`.toUpperCase() || 'EM';
                const deptName = emp.departmentRef?.name || emp.department || 'Unassigned';
                const desigName = emp.designationRef?.name || emp.designation || 'Staff';
                const status = emp.status || 'ACTIVE';

                return (
                  <tr
                    key={emp.id}
                    className={styles.tableRow}
                    onClick={() => handleRowClick(emp)}
                  >
                    <td className={styles.tableCell}>
                      <div className={styles.employeeProfileGroup}>
                        <div className={styles.empAvatar}>{initials}</div>
                        <div>
                          <div className={styles.empName}>
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className={styles.empContact}>{emp.email}</div>
                          {emp.employeeId && (
                            <span className={styles.empIdBadge}>{emp.employeeId}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className={styles.tableCell}>
                      <span className={styles.deptPill}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--primary)' }}>
                          corporate_fare
                        </span>
                        {deptName}
                      </span>
                    </td>

                    <td className={styles.tableCell}>
                      <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{desigName}</span>
                    </td>

                    <td className={styles.tableCell}>
                      <span className={styles.salaryText}>
                        {formatCurrency(emp.basicSalary || 0)}
                      </span>
                    </td>

                    <td className={styles.tableCell}>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {emp.joinDate ? new Date(emp.joinDate).toLocaleDateString() : '—'}
                      </span>
                    </td>

                    <td className={styles.tableCell}>
                      <span className={`${styles.statusChip} ${getStatusClass(status)}`}>
                        {status}
                      </span>
                    </td>

                    <td className={styles.tableCell} style={{ textAlign: 'right' }}>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '18px', color: 'var(--text-muted)' }}
                      >
                        chevron_right
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid / Card View */
        <div className={styles.cardsGrid}>
          {filteredEmployees.map(emp => {
            const initials = `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`.toUpperCase() || 'EM';
            const deptName = emp.departmentRef?.name || emp.department || 'Unassigned';
            const desigName = emp.designationRef?.name || emp.designation || 'Staff';
            const status = emp.status || 'ACTIVE';

            return (
              <div
                key={emp.id}
                className={styles.employeeCard}
                onClick={() => handleRowClick(emp)}
              >
                <div className={styles.cardTopRow}>
                  <div className={styles.employeeProfileGroup}>
                    <div className={styles.empAvatar}>{initials}</div>
                    <div className={styles.cardMainInfo}>
                      <span className={styles.empName}>{emp.firstName} {emp.lastName}</span>
                      <span className={styles.cardRole}>{desigName}</span>
                    </div>
                  </div>
                  <span className={`${styles.statusChip} ${getStatusClass(status)}`}>
                    {status}
                  </span>
                </div>

                <div className={styles.cardDetailsList}>
                  <div className={styles.cardDetailItem}>
                    <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--primary)' }}>
                      corporate_fare
                    </span>
                    <span>{deptName}</span>
                  </div>

                  <div className={styles.cardDetailItem}>
                    <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
                      mail
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {emp.email}
                    </span>
                  </div>

                  {emp.phone && (
                    <div className={styles.cardDetailItem}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
                        call
                      </span>
                      <span>{emp.phone}</span>
                    </div>
                  )}
                </div>

                <div className={styles.cardFooter}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Salary</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '13px' }}>
                      {formatCurrency(emp.basicSalary || 0)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: 600, fontSize: '12px' }}>
                    <span>Profile</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
