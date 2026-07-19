"use client";

import { useState, useEffect } from "react";
import styles from "../income/page.module.css";

type Loan = {
  id: string;
  memberId: string;
  memberName: string;
  amount: string;
  remainingAmount: string;
  issueDate: string;
  dueDate: string;
  status: string;
  reason: string | null;
  description: string | null;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
};

type User = {
  id: string;
  name: string;
};

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Layout State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form State
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [loansRes, usersRes] = await Promise.all([
        fetch("/api/loans"),
        fetch("/api/members")
      ]);
      const loansData = await loansRes.json();
      const usersData = await usersRes.json();
      setLoans(Array.isArray(loansData) ? loansData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          amount,
          description,
        }),
      });

      if (res.ok) {
        setMemberId("");
        setAmount("");
        setDescription("");
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error("Failed to submit loan", err);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to mark this loan as ${newStatus}?`)) return;
    try {
      const res = await fetch("/api/loans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        fetchData();
        if (selectedLoan && selectedLoan.id === id) {
          setSelectedLoan({ ...selectedLoan, status: newStatus });
        }
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val || 0));
  };

  // Derived Metrics
  const totalLoans = loans.length;
  const activeLoans = loans.filter(l => l.status === "ACTIVE").length;
  const totalBorrowed = loans.reduce((sum, l) => sum + parseFloat(l.amount || "0"), 0);
  const outstandingBalance = loans.reduce((sum, l) => sum + parseFloat(l.remainingAmount || l.amount || "0"), 0);
  const totalRepaid = totalBorrowed - outstandingBalance;
  
  const thisMonthRepayments = loans.filter(l => {
    if (l.status !== 'REPAID' && l.status !== 'DEDUCTED') return false;
    // Approximation for 'this month' based on status update if we assume it's recent, 
    // or we just fallback to a calculation based on amount paid this month. 
    // Since we lack a dedicated payment table, this is an estimate.
    const d = new Date(l.updatedAt || new Date());
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, l) => sum + (parseFloat(l.amount || "0") - parseFloat(l.remainingAmount || "0")), 0);

  // Filter & Sort Logic
  let filteredLoans = loans.filter(l => {
    const matchesSearch = l.memberName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (l.reason || l.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          l.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || l.status === filterStatus || (filterStatus === "OVERDUE" && l.isOverdue);
    const matchesType = filterType === "ALL" || filterType === "Member Loan"; // Placeholder if multiple types exist
    return matchesSearch && matchesStatus && matchesType;
  });

  filteredLoans.sort((a, b) => new Date(b.issueDate || b.createdAt).getTime() - new Date(a.issueDate || a.createdAt).getTime());

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredLoans.length / itemsPerPage));
  const paginatedLoans = filteredLoans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openNewLoanModal = () => {
    setMemberId("");
    setAmount("");
    setDescription("");
    setIsModalOpen(true);
  };

  const handleRowClick = (loan: Loan) => {
    setSelectedLoan(loan);
  };

  return (
    <div className="animate-fade-in container" style={{ maxWidth: '1400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <h1 style={{ margin: 0 }}>Loan Management</h1>
        <button onClick={openNewLoanModal} className="btn btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          Add Loan
        </button>
      </div>

      <div className={styles.container}>
        
        {/* Top Section Metrics */}
        <div className={styles.metricsGrid}>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Total Loans</div>
            <div className={styles.metricValue} style={{ color: 'var(--text)' }}>{totalLoans}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Active Loans</div>
            <div className={styles.metricValue} style={{ color: 'var(--primary)' }}>{activeLoans}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Outstanding Balance</div>
            <div className={styles.metricValue} style={{ color: 'var(--warning)' }}>{formatCurrency(outstandingBalance)}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Total Borrowed</div>
            <div className={styles.metricValue}>{formatCurrency(totalBorrowed)}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Total Repaid</div>
            <div className={styles.metricValue} style={{ color: 'var(--success)' }}>{formatCurrency(totalRepaid)}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>This Month Repayments</div>
            <div className={styles.metricValue}>{formatCurrency(thisMonthRepayments)}</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          
          {/* Filters Section */}
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup} style={{ flex: 2 }}>
              <label className="label">Search</label>
              <input 
                type="text" 
                className="input" 
                placeholder="Search by borrower, ID, or reason..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Type</label>
              <select className="input" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="ALL">All Types</option>
                <option value="Member Loan">Member Loan</option>
                <option value="Advance">Advance</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Status</label>
              <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="REPAID">Repaid</option>
                <option value="DEDUCTED">Deducted</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>
            <div className={styles.filterGroup} style={{ flex: 'none', paddingBottom: '2px' }}>
              <button className="btn btn-secondary" onClick={() => window.print()}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                Export
              </button>
            </div>
          </div>

          {/* Loans Table */}
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Loan ID</th>
                  <th>Borrower</th>
                  <th>Loan Name</th>
                  <th style={{ textAlign: 'right' }}>Borrowed</th>
                  <th style={{ textAlign: 'right' }}>Outstanding</th>
                  <th style={{ textAlign: 'center' }}>Int. Rate</th>
                  <th>Due Date</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center' }}>Loading...</td></tr>
                ) : paginatedLoans.length > 0 ? (
                  paginatedLoans.map((loan) => {
                    const outstanding = parseFloat(loan.remainingAmount || loan.amount);
                    return (
                      <tr 
                        key={loan.id} 
                        className={styles.clickableRow}
                        onClick={() => handleRowClick(loan)}
                        style={{ cursor: 'pointer', background: loan.isOverdue ? 'rgba(239, 68, 68, 0.02)' : 'transparent' }}
                      >
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>#{loan.id.slice(0, 8)}</td>
                        <td style={{ fontWeight: 500 }}>{loan.memberName}</td>
                        <td>{loan.reason || loan.description || 'General Purpose'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(loan.amount)}</td>
                        <td style={{ textAlign: 'right', color: outstanding > 0 ? 'var(--warning)' : 'var(--success)' }}>
                          {formatCurrency(outstanding)}
                        </td>
                        <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>0%</td>
                        <td style={{ color: loan.isOverdue ? 'var(--danger)' : 'inherit' }}>
                          {new Date(loan.dueDate).toLocaleDateString()}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`${styles.badge} ${
                            loan.status === 'REPAID' ? styles['badge-paid'] :
                            loan.status === 'DEDUCTED' ? styles['badge-partial'] :
                            loan.isOverdue ? styles['badge-unpaid'] : styles['badge-partial']
                          }`}>
                            {loan.isOverdue ? "OVERDUE" : loan.status}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            {loan.status === "ACTIVE" && (
                              <button onClick={() => updateStatus(loan.id, "REPAID")} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--success)', borderColor: 'var(--success)' }}>Mark Repaid</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "var(--spacing-6)" }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5 }}>account_balance_wallet</span>
                        <p>No loans found matching your criteria.</p>
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
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLoans.length)} of {filteredLoans.length} entries
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

      {/* Loan Form Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Issue New Loan</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "var(--spacing-4)" }}>
              Loans have a standard 6-month repayment period. If a loan remains active past this date, it may be forcibly deducted during settlement.
            </p>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className="label">Borrower (Member)</label>
                <select required className="input" value={memberId} onChange={(e) => setMemberId(e.target.value)} style={{ appearance: 'auto' }}>
                  <option value="" disabled>Choose a member...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className="label">Loan Type</label>
                  <select className="input" style={{ appearance: 'auto' }}>
                    <option value="Member Loan">Member Loan</option>
                    <option value="Advance">Advance</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className="label">Lender</label>
                  <input className="input" value="Company Reserve" disabled style={{ background: 'var(--surface-light)' }} />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className="label">Loan Amount</label>
                <input required type="number" step="0.01" className="input" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>

              <div className={styles.formGroup}>
                <label className="label">Description / Reason</label>
                <textarea required className="input" rows={3} placeholder="e.g. Personal emergency, advance against salary" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: 'var(--spacing-4)' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? "Issuing..." : "Issue Loan"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Drawer */}
      {selectedLoan && (
        <div className={styles.modalOverlay} onClick={() => setSelectedLoan(null)} style={{ justifyContent: 'flex-end', padding: 0 }}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ height: '100%', width: '100%', maxWidth: '500px', borderRadius: 0, overflowY: 'auto' }}>
            <div className={styles.modalHeader} style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 10, padding: 'var(--spacing-4)', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ margin: 0 }}>Loan Details</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>#{selectedLoan.id}</div>
              </div>
              <button onClick={() => setSelectedLoan(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div style={{ padding: 'var(--spacing-6)' }}>
              
              {/* Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ margin: '0 0 8px 0' }}>{formatCurrency(selectedLoan.amount)}</h2>
                  <span className={`${styles.badge} ${
                    selectedLoan.status === 'REPAID' ? styles['badge-paid'] :
                    selectedLoan.status === 'DEDUCTED' ? styles['badge-partial'] :
                    selectedLoan.isOverdue ? styles['badge-unpaid'] : styles['badge-partial']
                  }`}>
                    {selectedLoan.isOverdue ? "OVERDUE" : selectedLoan.status}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Outstanding</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--warning)' }}>
                    {formatCurrency(selectedLoan.remainingAmount || selectedLoan.amount)}
                  </div>
                </div>
              </div>

              {/* Grid Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                <div style={{ background: 'var(--surface-light)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Borrower</div>
                  <div style={{ fontWeight: 500 }}>{selectedLoan.memberName}</div>
                </div>
                <div style={{ background: 'var(--surface-light)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Lender</div>
                  <div style={{ fontWeight: 500 }}>Company Reserve</div>
                </div>
                <div style={{ background: 'var(--surface-light)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Issue Date</div>
                  <div style={{ fontWeight: 500 }}>{new Date(selectedLoan.issueDate || selectedLoan.createdAt).toLocaleDateString()}</div>
                </div>
                <div style={{ background: 'var(--surface-light)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Due Date</div>
                  <div style={{ fontWeight: 500, color: selectedLoan.isOverdue ? 'var(--danger)' : 'inherit' }}>
                    {new Date(selectedLoan.dueDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0' }}>Loan Information</h4>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <strong>Type:</strong> Member Loan
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <strong>Interest Rate:</strong> 0% (Halal/No Interest)
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  <strong>Reason:</strong> {selectedLoan.reason || selectedLoan.description || 'N/A'}
                </div>
              </div>

              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 16px 0' }}>Repayment Schedule</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Duration</span>
                  <span>6 Months</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '8px 0' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Estimated Monthly</span>
                  <span>{formatCurrency(parseFloat(selectedLoan.amount) / 6)}</span>
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ margin: '0 0 16px 0' }}>Activity Timeline</h4>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)', marginTop: '4px' }}></div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>Loan Issued</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(selectedLoan.issueDate || selectedLoan.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                {selectedLoan.status !== 'ACTIVE' && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)', marginTop: '4px' }}></div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>Loan Marked as {selectedLoan.status}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date().toLocaleString()} {/* Fallback since we don't have updatedAt currently available easily in UI */}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                {selectedLoan.status === "ACTIVE" && (
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1 }}
                    onClick={() => {
                      updateStatus(selectedLoan.id, "REPAID");
                      setSelectedLoan(null);
                    }}
                  >
                    Mark as Repaid
                  </button>
                )}
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: selectedLoan.status === "ACTIVE" ? 1 : '1 1 100%' }}
                  onClick={() => setSelectedLoan(null)}
                >
                  Close Details
                </button>
              </div>
              
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
