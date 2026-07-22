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
  paymentDate: string | null;
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

type Employee = { id: string; firstName: string; lastName: string; employeeId: string; basicSalary: string; departmentId: string | null };
type Department = { id: string; name: string };
type AuditLog = { id: string; user: { name: string; email: string }; role: string; oldStatus: string | null; newStatus: string; remarks: string | null; createdAt: string };

export default function PayrollManagementPage() {
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Modals
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  // Modal Data
  const [paymentTargetIds, setPaymentTargetIds] = useState<string[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAudits, setLoadingAudits] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Generate Form State
  const [generateTarget, setGenerateTarget] = useState<'ALL' | 'DEPARTMENT' | 'EMPLOYEE'>('ALL');
  const [selectedEmp, setSelectedEmp] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [workingDays, setWorkingDays] = useState(22);

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  // Bulk State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPayments();
    fetchEmployeesAndDepts();
  }, [filterMonth, filterYear]);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/payroll?month=${filterMonth}&year=${filterYear}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
        setSummary(data.summary || null);
        setSelectedIds(new Set()); // clear selection on reload
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployeesAndDepts = async () => {
    try {
      const [empRes, deptRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/departments')
      ]);
      if (empRes.ok) setEmployees(await empRes.json());
      if (deptRes.ok) setDepartments(await deptRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  const openHistory = async (id: string) => {
    setIsHistoryModalOpen(true);
    setLoadingAudits(true);
    try {
      const res = await fetch(`/api/payroll/${id}/history`);
      if (res.ok) {
        setAuditLogs(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAudits(false);
    }
  };

  const processBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    let payload: any = { month: Number(month), year: Number(year), workingDays: Number(workingDays) };
    
    if (generateTarget === 'EMPLOYEE') payload.employeeIds = [selectedEmp];
    else if (generateTarget === 'DEPARTMENT') payload.departmentId = selectedDept;

    try {
      const res = await fetch('/api/payroll/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Successfully generated ${data.generated} payrolls. Skipped ${data.skipped} existing.`);
        setIsGenerateModalOpen(false);
        fetchPayments();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Failed to process bulk generate');
    } finally {
      setIsProcessing(false);
    }
  };

  const processStatusTransition = async (ids: string[], newStatus: string, extraPayload: any = {}) => {
    if (!confirm(`Are you sure you want to change status to ${newStatus} for ${ids.length} records?`)) return;
    try {
      const res = await fetch('/api/payroll/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIds: ids, status: newStatus, ...extraPayload })
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

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    await processStatusTransition(paymentTargetIds, 'PAID', {
      paymentMethod, transactionRef, paymentNote
    });
    setIsProcessing(false);
    setIsPaymentModalOpen(false);
    setTransactionRef('');
    setPaymentNote('');
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedPayments.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
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

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / itemsPerPage));
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadgeClass = (status: string) => {
    if (status === 'PAID') return styles['badge-paid'];
    if (status === 'PENDING' || status === 'DRAFT' || status === 'CALCULATED') return styles['badge-unpaid'];
    if (status === 'APPROVED' || status === 'SUBMITTED') return styles['badge-partial'];
    if (status === 'CANCELLED') return styles['badge-danger'] || 'badge bg-danger';
    if (status === 'LOCKED') return styles['badge-success'] || 'badge bg-dark';
    if (status === 'ARCHIVED') return styles['badge-secondary'] || 'badge bg-secondary';
    return '';
  };

  return (
    <div className="animate-fade-in container" style={{ maxWidth: '1400px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <div>
          <h1 style={{ margin: 0 }}>Payroll Dashboard</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>
            Manage employee payroll, workflow approvals, and history.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/dashboard/staff-management/payroll/reports">
            <button className="btn btn-secondary">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>bar_chart</span>
              Reports
            </button>
          </Link>
          <button className="btn btn-primary" onClick={() => setIsGenerateModalOpen(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
            Generate Payroll
          </button>
        </div>
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
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Pending</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{summary.pendingCount}</div>
          </div>
          <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Processed (Paid)</div>
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
                <option value="CALCULATED">Calculated</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="APPROVED">Approved</option>
                <option value="PAID">Paid</option>
                <option value="LOCKED">Locked</option>
                <option value="ARCHIVED">Archived</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedIds.size > 0 && (
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div><strong style={{ color: 'var(--primary)' }}>{selectedIds.size}</strong> records selected</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => processStatusTransition(Array.from(selectedIds), 'SUBMITTED')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>Submit</button>
                <button onClick={() => processStatusTransition(Array.from(selectedIds), 'APPROVED')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px', borderColor: 'var(--success)', color: 'var(--success)' }}>Approve</button>
                <button onClick={() => { setPaymentTargetIds(Array.from(selectedIds)); setIsPaymentModalOpen(true); }} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }}>Mark Paid</button>
                <button onClick={() => processStatusTransition(Array.from(selectedIds), 'LOCKED')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px', background: '#1e293b', color: 'white', borderColor: '#1e293b' }}>Lock</button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className={styles.tableContainer} style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input type="checkbox" onChange={toggleSelectAll} checked={paginatedPayments.length > 0 && selectedIds.size === paginatedPayments.length} />
                  </th>
                  <th>ID</th>
                  <th>Employee</th>
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
                  <tr><td colSpan={10} style={{ textAlign: 'center' }}>Loading...</td></tr>
                ) : paginatedPayments.length > 0 ? (
                  paginatedPayments.map((pay) => {
                    const additions = Number(pay.grossSalary) - Number(pay.basicSalary);
                    const deductions = Number(pay.grossSalary) - Number(pay.netSalary);
                    const isSelected = selectedIds.has(pay.id);

                    return (
                      <tr key={pay.id} className={styles.clickableRow} style={isSelected ? { background: 'rgba(59,130,246,0.05)' } : {}}>
                        <td style={{ textAlign: 'center' }}>
                          <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(pay.id)} />
                        </td>
                        <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pay.id.substring(0, 8).toUpperCase()}</td>
                        <td style={{ fontWeight: 500 }}>
                          <div>{pay.employee.firstName} {pay.employee.lastName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pay.employee.employeeId} | {pay.employee.department || 'No Dept'}</div>
                        </td>
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
                          <span className={`${styles.badge} ${getStatusBadgeClass(pay.status)}`} style={{ fontSize: '10px' }}>
                            {pay.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)' }}>
                          {pay.paymentDate ? new Date(pay.paymentDate).toLocaleDateString() : '-'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button onClick={() => openHistory(pay.id)} title="View History" className="btn btn-secondary" style={{ padding: '4px', border: 'none', background: 'transparent' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>history</span>
                            </button>
                            <Link href={`/dashboard/staff-management/payroll/payslip/${pay.id}`}>
                              <button title="View Payslip" className="btn btn-secondary" style={{ padding: '4px', border: 'none', background: 'transparent' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>receipt_long</span>
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
      {isGenerateModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsGenerateModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Generate Bulk Payroll</h3>
              <button onClick={() => setIsGenerateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={processBulkGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Target Audience</label>
                <select className="input" value={generateTarget} onChange={e => setGenerateTarget(e.target.value as any)}>
                  <option value="ALL">All Active Employees</option>
                  <option value="DEPARTMENT">Specific Department</option>
                  <option value="EMPLOYEE">Specific Employee</option>
                </select>
              </div>

              {generateTarget === 'DEPARTMENT' && (
                <div>
                  <label className="label">Select Department <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <select className="input" value={selectedDept} onChange={e => setSelectedDept(e.target.value)} required>
                    <option value="">-- Choose Dept --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}

              {generateTarget === 'EMPLOYEE' && (
                <div>
                  <label className="label">Select Employee <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <select className="input" value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)} required>
                    <option value="">-- Choose Staff --</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeId})</option>)}
                  </select>
                </div>
              )}
              
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
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsGenerateModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isProcessing}>
                  {isProcessing ? 'Processing...' : 'Generate Payroll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsPaymentModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Process Payment</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handlePaySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px', fontSize: '13px', color: 'var(--primary)' }}>
                You are about to mark <strong>{paymentTargetIds.length}</strong> record(s) as PAID. This will generate an Expense in the ledger.
              </div>
              
              <div>
                <label className="label">Payment Method</label>
                <select className="input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} required>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Mobile Banking">Mobile Banking</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="label">Transaction Reference (Optional)</label>
                <input type="text" className="input" placeholder="e.g. TXN123456" value={transactionRef} onChange={e => setTransactionRef(e.target.value)} />
              </div>

              <div>
                <label className="label">Payment Note (Optional)</label>
                <textarea className="input" rows={2} placeholder="Add any additional notes here..." value={paymentNote} onChange={e => setPaymentNote(e.target.value)}></textarea>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsPaymentModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isProcessing}>
                  {isProcessing ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsHistoryModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Payroll Audit Timeline</h3>
              <button onClick={() => setIsHistoryModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
              {loadingAudits ? (
                <div style={{ textAlign: 'center', padding: '24px' }}>Loading timeline...</div>
              ) : auditLogs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '16px', top: '10px', bottom: '10px', width: '2px', background: 'var(--border)' }}></div>
                  {auditLogs.map((log, idx) => (
                    <div key={log.id} style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--card-bg)', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>history</span>
                      </div>
                      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 600 }}>{log.newStatus}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text)' }}>
                          <strong>{log.user.name}</strong> ({log.role.replace('_', ' ')}) changed status from {log.oldStatus || 'None'} to {log.newStatus}.
                        </div>
                        {log.remarks && (
                          <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(0,0,0,0.03)', borderRadius: '4px', fontSize: '12px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                            "{log.remarks}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No audit history found.</div>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-secondary" onClick={() => setIsHistoryModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
