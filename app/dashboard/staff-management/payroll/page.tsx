"use client";

import React, { useState, useEffect } from 'react';
import styles from "../../income/page.module.css";
import Link from 'next/link';

type SalaryPayment = {
  id: string;
  employee: { firstName: string; lastName: string; employeeId: string; department: string | null; designation: string; basicSalary: string };
  month: number;
  year: number;
  basicSalary: string;
  grossSalary: string;
  netSalary: string;
  status: string;
  paymentDate: string;
};

type PayrollSummary = {
  currentMonth: string;
  totalSalary: number;
  totalBonus: number;
  totalDeductions: number;
  totalNetPay: number;
  pendingCount: number;
  processedCount: number;
};

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  basicSalary: string;
};

export default function PayrollManagementPage() {
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form State
  const [selectedEmp, setSelectedEmp] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [workingDays, setWorkingDays] = useState(22);

  useEffect(() => {
    fetchPayments();
    fetchEmployees();
  }, [filterMonth, filterYear]);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/payroll?month=${filterMonth}&year=${filterYear}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
        setSummary(data.summary || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      if (res.ok) {
        const data = await res.json();
        setEmployees(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const processPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: selectedEmp, month: Number(month), year: Number(year), workingDays: Number(workingDays) })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Payroll drafted successfully!');
        setIsModalOpen(false);
        setSelectedEmp('');
        fetchPayments();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Failed to process payroll');
    } finally {
      setIsProcessing(false);
    }
  };

  const updatePayrollStatus = async (id: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
    try {
      const res = await fetch(`/api/payroll/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok) {
        fetchPayments();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (e) {
      alert('Failed to update status');
    }
  };

  const getMonthName = (monthNumber: number) => {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return date.toLocaleString('en-US', { month: 'short' });
  };

  const formatCurrency = (val: string | number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val));
  };

  // Filter Logic
  let filteredPayments = payments.filter(p => {
    const searchString = `${p.employee.firstName} ${p.employee.lastName} ${p.employee.employeeId} ${p.id}`.toLowerCase();
    const matchesSearch = searchString.includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || p.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / itemsPerPage));
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadgeClass = (status: string) => {
    if (status === 'PAID') return styles['badge-paid'];
    if (status === 'PENDING' || status === 'DRAFT' || status === 'CALCULATED') return styles['badge-unpaid'];
    if (status === 'APPROVED') return styles['badge-partial'];
    if (status === 'CANCELLED') return styles['badge-danger'] || 'badge bg-danger';
    return '';
  };

  return (
    <div className="animate-fade-in container" style={{ maxWidth: '1400px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <div>
          <h1 style={{ margin: 0 }}>Payroll Dashboard</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>
            Manage employee payroll, approvals, and history.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
          Generate Draft
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Net Pay</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>{formatCurrency(summary.totalNetPay)}</div>
          </div>
          <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Salary (Basic)</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{formatCurrency(summary.totalSalary)}</div>
          </div>
          <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Bonus</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--success)' }}>{formatCurrency(summary.totalBonus)}</div>
          </div>
          <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Deductions</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--danger)' }}>{formatCurrency(summary.totalDeductions)}</div>
          </div>
          <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Status Pending</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{summary.pendingCount}</div>
          </div>
          <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Status Processed</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--success)' }}>{summary.processedCount}</div>
          </div>
        </div>
      )}

      <div className={styles.container}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          
          {/* Filters Section */}
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup} style={{ flex: 1.5 }}>
              <label className="label">Search</label>
              <input 
                type="text" 
                className="input" 
                placeholder="Employee or ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Month</label>
              <select className="input" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m.toString()}>{getMonthName(m)}</option>
                ))}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Year</label>
              <select className="input" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Status</label>
              <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="APPROVED">Approved</option>
                <option value="PAID">Paid</option>
                <option value="CANCELLED">Cancelled</option>
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
                  <th>Payroll ID</th>
                  <th>Employee</th>
                  <th>Month/Year</th>
                  <th style={{ textAlign: 'right' }}>Basic</th>
                  <th style={{ textAlign: 'right' }}>Bonus</th>
                  <th style={{ textAlign: 'right' }}>Deductions</th>
                  <th style={{ textAlign: 'right' }}>Net Salary</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Payment Date</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={10} style={{ textAlign: 'center' }}>Loading history...</td></tr>
                ) : paginatedPayments.length > 0 ? (
                  paginatedPayments.map((pay) => {
                    const additions = Number(pay.grossSalary) - Number(pay.basicSalary);
                    const deductions = Number(pay.grossSalary) - Number(pay.netSalary);

                    return (
                      <tr key={pay.id} className={styles.clickableRow}>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{pay.id.substring(0, 8).toUpperCase()}</td>
                        <td style={{ fontWeight: 500 }}>
                          <div>{pay.employee.firstName} {pay.employee.lastName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pay.employee.employeeId}</div>
                        </td>
                        <td>{getMonthName(pay.month)} {pay.year}</td>
                        <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{formatCurrency(pay.basicSalary)}</td>
                        <td style={{ textAlign: 'right', color: additions > 0 ? 'var(--success)' : 'inherit' }}>
                          {additions > 0 ? `+${formatCurrency(additions)}` : '-'}
                        </td>
                        <td style={{ textAlign: 'right', color: deductions > 0 ? 'var(--danger)' : 'inherit' }}>
                          {deductions > 0 ? `-${formatCurrency(deductions)}` : '-'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>
                          {formatCurrency(pay.netSalary)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`${styles.badge} ${getStatusBadgeClass(pay.status)}`}>
                            {pay.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontSize: '13px', color: 'var(--text-muted)' }}>
                          {pay.status === 'PAID' ? new Date(pay.paymentDate).toLocaleDateString() : '-'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            {pay.status === 'DRAFT' && (
                               <button onClick={() => updatePayrollStatus(pay.id, 'APPROVED')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px', borderColor: 'var(--success)', color: 'var(--success)' }}>Approve</button>
                            )}
                            {pay.status === 'APPROVED' && (
                               <button onClick={() => updatePayrollStatus(pay.id, 'PAID')} className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '12px' }}>Pay</button>
                            )}
                            {pay.status !== 'CANCELLED' && pay.status !== 'PAID' && (
                               <button onClick={() => updatePayrollStatus(pay.id, 'CANCELLED')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px', borderColor: 'var(--danger)', color: 'var(--danger)' }}>Cancel</button>
                            )}
                            <Link href={`/dashboard/staff-management/payroll/payslip/${pay.id}`}>
                                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px', borderColor: 'var(--border)' }}>
                                Payslip
                                </button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} style={{ textAlign: "center", padding: "var(--spacing-6)" }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5 }}>payments</span>
                        <p>No payroll records found for this month.</p>
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
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPayments.length)} of {filteredPayments.length} entries
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

      {/* Generate Payroll Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Generate Draft Payroll</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={processPayroll} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Select Employee <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select className="input" value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)} required>
                  <option value="">-- Choose Staff --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeId})</option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="label">Month</label>
                  <input type="number" className="input" min="1" max="12" value={month} onChange={e => setMonth(Number(e.target.value))} required />
                </div>
                <div>
                  <label className="label">Year</label>
                  <input type="number" className="input" min="2020" max="2100" value={year} onChange={e => setYear(Number(e.target.value))} required />
                </div>
              </div>
              
              <div>
                <label className="label">Total Working Days in Month <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="number" className="input" value={workingDays} onChange={e => setWorkingDays(Number(e.target.value))} required />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Exclude weekly offs/holidays for correct deduction calculations.</p>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isProcessing}>
                  {isProcessing ? 'Processing...' : 'Generate Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
