"use client";

import { useState, useEffect } from "react";
import styles from "../income/page.module.css"; // Reuse the layout grid styles

type Expense = {
  id: string;
  projectId?: string | null;
  category: string;
  amount: string;
  paymentMethod: string;
  approvalStatus: string;
  description: string | null;
  createdAt: string;
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Layout State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form State
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [description, setDescription] = useState("");

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/expenses");
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Derived Metrics
  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const totalPaid = expenses.filter(exp => exp.approvalStatus === "APPROVED").reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const totalUnpaid = totalExpenses - totalPaid;
  
  const thisMonthExpenses = expenses.filter(exp => {
    const d = new Date(exp.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

  const companyExpenses = expenses.filter(exp => !exp.projectId).reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const projectExpenses = totalExpenses - companyExpenses;

  // Unique categories for the filter
  const uniqueCategories = Array.from(new Set(expenses.map(exp => exp.category)));

  // Filter & Sort Logic
  let filteredExpenses = expenses.filter(exp => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = exp.description?.toLowerCase().includes(searchLower) || 
                          exp.category.toLowerCase().includes(searchLower);
    const matchesCat = filterCategory === "ALL" || exp.category === filterCategory;
    const matchesStatus = filterStatus === "ALL" || exp.approvalStatus === filterStatus;
    return matchesSearch && matchesCat && matchesStatus;
  });

  filteredExpenses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / itemsPerPage));
  const paginatedExpenses = filteredExpenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          amount,
          paymentMethod,
          description,
        }),
      });

      if (res.ok) {
        setCategory("");
        setAmount("");
        setPaymentMethod("");
        setDescription("");
        setIsModalOpen(false);
        fetchExpenses();
      }
    } catch (err) {
      console.error("Failed to submit expense", err);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/expenses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, approvalStatus: newStatus }),
      });
      if (res.ok) {
        fetchExpenses();
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const formatCurrency = (val: string | number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val));
  };

  const getStatusBadge = (status: string) => {
    if (status === "APPROVED") return <span className={`${styles.badge} ${styles['badge-paid']}`}>APPROVED</span>;
    if (status === "REJECTED") return <span className={`${styles.badge} ${styles['badge-unpaid']}`}>REJECTED</span>;
    return <span className={`${styles.badge} ${styles['badge-partial']}`}>PENDING</span>;
  };

  const openNewExpenseModal = () => {
    setCategory("");
    setAmount("");
    setPaymentMethod("");
    setDescription("");
    setIsModalOpen(true);
  };

  return (
    <div className="animate-fade-in container" style={{ maxWidth: '1400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <h1 style={{ margin: 0 }}>Expense Management</h1>
        <button onClick={openNewExpenseModal} className="btn btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          Add Expense
        </button>
      </div>

      <div className={styles.container}>
        {/* Top Section Metrics */}
        <div className={styles.metricsGrid}>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Total Expenses</div>
            <div className={styles.metricValue} style={{ color: 'var(--primary)' }}>{formatCurrency(totalExpenses)}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Paid Amount</div>
            <div className={styles.metricValue} style={{ color: 'var(--success)' }}>{formatCurrency(totalPaid)}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Unpaid Amount</div>
            <div className={styles.metricValue} style={{ color: 'var(--warning)' }}>{formatCurrency(totalUnpaid)}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>This Month Expenses</div>
            <div className={styles.metricValue}>{formatCurrency(thisMonthExpenses)}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Company Expenses</div>
            <div className={styles.metricValue}>{formatCurrency(companyExpenses)}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Project Expenses</div>
            <div className={styles.metricValue}>{formatCurrency(projectExpenses)}</div>
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
                placeholder="Search by vendor or description..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Category</label>
              <select className="input" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="ALL">All Categories</option>
                {uniqueCategories.map((c, i) => <option key={i} value={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Status</label>
              <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Approved / Paid</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div className={styles.filterGroup} style={{ flex: 'none', paddingBottom: '2px' }}>
              <button className="btn btn-secondary" onClick={() => window.print()}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                Export
              </button>
            </div>
          </div>

          {/* Expenses Table */}
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Vendor / Payee</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Total Amount</th>
                  <th style={{ textAlign: 'right' }}>Paid Amount</th>
                  <th style={{ textAlign: 'right' }}>Due Amount</th>
                  <th style={{ textAlign: 'center' }}>Method</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} style={{ textAlign: 'center' }}>Loading...</td></tr>
                ) : paginatedExpenses.length > 0 ? (
                  paginatedExpenses.map((exp) => {
                    const total = parseFloat(exp.amount);
                    const paid = exp.approvalStatus === "APPROVED" ? total : 0;
                    const due = total - paid;
                    
                    return (
                      <tr key={exp.id}>
                        <td>{new Date(exp.createdAt).toLocaleDateString()}</td>
                        <td style={{ fontWeight: 500 }}>{exp.category}</td>
                        <td>{exp.description?.substring(0, 20) || '-'}</td>
                        <td style={{ color: "var(--text-muted)", fontSize: "0.8rem", maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {exp.description || '-'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(total)}</td>
                        <td style={{ textAlign: 'right', color: paid > 0 ? 'var(--success)' : 'inherit' }}>{formatCurrency(paid)}</td>
                        <td style={{ textAlign: 'right', color: due > 0 ? 'var(--warning)' : 'inherit' }}>{formatCurrency(due)}</td>
                        <td style={{ textAlign: 'center', fontSize: '0.8rem' }}>{exp.paymentMethod.replace('_', ' ')}</td>
                        <td style={{ textAlign: 'center' }}>{getStatusBadge(exp.approvalStatus)}</td>
                        <td>
                          {exp.approvalStatus === "PENDING" ? (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button onClick={() => updateStatus(exp.id, "APPROVED")} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--success)' }}>Approve</button>
                              <button onClick={() => updateStatus(exp.id, "REJECTED")} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '12px' }}>Reject</button>
                            </div>
                          ) : (
                            <div style={{ textAlign: 'right', color: 'var(--text-muted)' }}>-</div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} style={{ textAlign: "center", padding: "var(--spacing-6)" }}>
                      No expense records found matching your filters.
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
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredExpenses.length)} of {filteredExpenses.length} entries
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

      {/* Expense Form Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Request Expense</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className="label">Category</label>
                <input required className="input" placeholder="e.g. Office Supplies, Server Hosting" value={category} onChange={(e) => setCategory(e.target.value)} />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className="label">Amount</label>
                  <input required type="number" step="0.01" className="input" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className="label">Payment Method</label>
                  <select required className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option value="" disabled>Select Method</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="MOBILE_BANKING">Mobile Banking (bKash/Nagad)</option>
                    <option value="CARD">Credit/Debit Card</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className="label">Vendor / Description</label>
                <textarea required className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: 'var(--spacing-4)' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Submit Expense
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
