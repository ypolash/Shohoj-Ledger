"use client";

import { useState, useEffect } from "react";
import styles from "../income/page.module.css";

type Advance = {
  id: string;
  memberId: string;
  memberName: string;
  amount: string;
  remainingAmount: string;
  status: string;
  reason: string | null;
  description: string | null; // some endpoints might use description
  settlementId: string | null;
  createdAt: string;
  updatedAt: string;
};

type User = {
  id: string;
  name: string;
};

export default function AdvancesPage() {
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Layout State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<Advance | null>(null);

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [filterEmployee, setFilterEmployee] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form State
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [advRes, usersRes] = await Promise.all([
        fetch("/api/advances"),
        fetch("/api/members")
      ]);
      const advData = await advRes.json();
      const usersData = await usersRes.json();
      setAdvances(Array.isArray(advData) ? advData : []);
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
      const res = await fetch("/api/advances", {
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
      console.error("Failed to submit advance", err);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to mark this advance as ${newStatus}?`)) return;
    try {
      const res = await fetch("/api/advances", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        fetchData();
        if (selectedAdvance && selectedAdvance.id === id) {
          setSelectedAdvance({ ...selectedAdvance, status: newStatus });
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
  const totalAdvances = advances.length;
  const totalAdvancedAmount = advances.reduce((sum, a) => sum + parseFloat(a.amount || "0"), 0);
  const outstandingAmount = advances.reduce((sum, a) => sum + parseFloat(a.remainingAmount || a.amount || "0"), 0);
  const totalRecovered = totalAdvancedAmount - outstandingAmount;
  const recoveryRate = totalAdvancedAmount > 0 ? (totalRecovered / totalAdvancedAmount) * 100 : 0;
  
  const thisMonthAdvances = advances.filter(a => {
    const d = new Date(a.createdAt || new Date());
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, a) => sum + parseFloat(a.amount || "0"), 0);

  // Filter & Sort Logic
  let filteredAdvances = advances.filter(a => {
    const matchesSearch = a.memberName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (a.reason || a.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || a.status === filterStatus;
    const matchesType = filterType === "ALL" || filterType === "Salary Advance";
    const matchesEmployee = filterEmployee === "ALL" || a.memberId === filterEmployee;
    return matchesSearch && matchesStatus && matchesType && matchesEmployee;
  });

  filteredAdvances.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredAdvances.length / itemsPerPage));
  const paginatedAdvances = filteredAdvances.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openNewAdvanceModal = () => {
    setMemberId("");
    setAmount("");
    setDescription("");
    setIsModalOpen(true);
  };

  const handleRowClick = (advance: Advance) => {
    setSelectedAdvance(advance);
  };

  return (
    <div className="animate-fade-in container" style={{ maxWidth: '1400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <h1 style={{ margin: 0 }}>Advance Management</h1>
        <button onClick={openNewAdvanceModal} className="btn btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          Add Advance
        </button>
      </div>

      <div className={styles.container}>
        
        {/* Top Section Metrics */}
        <div className={styles.metricsGrid}>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Total Advances</div>
            <div className={styles.metricValue} style={{ color: 'var(--text)' }}>{totalAdvances}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Outstanding Advances</div>
            <div className={styles.metricValue} style={{ color: 'var(--warning)' }}>{formatCurrency(outstandingAmount)}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Total Advanced Amount</div>
            <div className={styles.metricValue}>{formatCurrency(totalAdvancedAmount)}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Total Recovered</div>
            <div className={styles.metricValue} style={{ color: 'var(--success)' }}>{formatCurrency(totalRecovered)}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>This Month Advances</div>
            <div className={styles.metricValue}>{formatCurrency(thisMonthAdvances)}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Recovery Rate</div>
            <div className={styles.metricValue} style={{ color: 'var(--primary)' }}>{recoveryRate.toFixed(1)}%</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          
          {/* Filters Section */}
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup} style={{ flex: 1.5 }}>
              <label className="label">Search</label>
              <input 
                type="text" 
                className="input" 
                placeholder="Search by ID, reason..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Employee</label>
              <select className="input" value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)}>
                <option value="ALL">All Employees</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Advance Type</label>
              <select className="input" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="ALL">All Types</option>
                <option value="Salary Advance">Salary Advance</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Status</label>
              <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="DEDUCTED">Recovered / Deducted</option>
              </select>
            </div>
            <div className={styles.filterGroup} style={{ flex: 'none', paddingBottom: '2px' }}>
              <button className="btn btn-secondary" onClick={() => window.print()}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                Export
              </button>
            </div>
          </div>

          {/* Advances Table */}
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Advance ID</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Advance Type</th>
                  <th style={{ textAlign: 'right' }}>Advance Amount</th>
                  <th style={{ textAlign: 'right' }}>Recovered Amount</th>
                  <th style={{ textAlign: 'right' }}>Remaining Balance</th>
                  <th>Issue Date</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} style={{ textAlign: 'center' }}>Loading...</td></tr>
                ) : paginatedAdvances.length > 0 ? (
                  paginatedAdvances.map((adv) => {
                    const outstanding = parseFloat(adv.remainingAmount ?? adv.amount);
                    const recovered = parseFloat(adv.amount) - outstanding;
                    
                    return (
                      <tr 
                        key={adv.id} 
                        className={styles.clickableRow}
                        onClick={() => handleRowClick(adv)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>#{adv.id.slice(0, 8)}</td>
                        <td style={{ fontWeight: 500 }}>{adv.memberName}</td>
                        <td style={{ color: 'var(--text-muted)' }}>General</td>
                        <td>Salary Advance</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(adv.amount)}</td>
                        <td style={{ textAlign: 'right', color: recovered > 0 ? 'var(--success)' : 'inherit' }}>
                          {formatCurrency(recovered)}
                        </td>
                        <td style={{ textAlign: 'right', color: outstanding > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                          {formatCurrency(outstanding)}
                        </td>
                        <td>{new Date(adv.createdAt).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`${styles.badge} ${
                            adv.status === 'ACTIVE' ? styles['badge-unpaid'] : styles['badge-paid']
                          }`}>
                            {adv.status}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            {adv.status === "ACTIVE" && (
                              <button onClick={() => updateStatus(adv.id, "DEDUCTED")} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--success)', borderColor: 'var(--success)' }}>Mark Recovered</button>
                            )}
                            {adv.status === "DEDUCTED" && adv.settlementId && (
                               <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>via Settlement</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} style={{ textAlign: "center", padding: "var(--spacing-6)" }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5 }}>receipt_long</span>
                        <p>No advances found matching your criteria.</p>
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
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAdvances.length)} of {filteredAdvances.length} entries
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

      {/* Advance Form Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Issue New Advance</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "var(--spacing-4)" }}>
              Advances are short-term and will be automatically deducted from the member's very next monthly settlement payout.
            </p>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className="label">Employee / Member</label>
                <select required className="input" value={memberId} onChange={(e) => setMemberId(e.target.value)} style={{ appearance: 'auto' }}>
                  <option value="" disabled>Choose a member...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className="label">Advance Type</label>
                  <select className="input" style={{ appearance: 'auto' }}>
                    <option value="Salary Advance">Salary Advance</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className="label">Advance Amount</label>
                  <input required type="number" step="0.01" className="input" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className="label">Description / Notes</label>
                <textarea required className="input" rows={3} placeholder="e.g. Mid-month withdrawal" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: 'var(--spacing-4)' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? "Issuing..." : "Issue Advance"}
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
      {selectedAdvance && (
        <div className={styles.modalOverlay} onClick={() => setSelectedAdvance(null)} style={{ justifyContent: 'flex-end', padding: 0 }}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ height: '100%', width: '100%', maxWidth: '500px', borderRadius: 0, overflowY: 'auto' }}>
            <div className={styles.modalHeader} style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 10, padding: 'var(--spacing-4)', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ margin: 0 }}>Advance Details</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>#{selectedAdvance.id}</div>
              </div>
              <button onClick={() => setSelectedAdvance(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div style={{ padding: 'var(--spacing-6)' }}>
              
              {/* Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ margin: '0 0 8px 0' }}>{formatCurrency(selectedAdvance.amount)}</h2>
                  <span className={`${styles.badge} ${
                    selectedAdvance.status === 'ACTIVE' ? styles['badge-unpaid'] : styles['badge-paid']
                  }`}>
                    {selectedAdvance.status}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Remaining Balance</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--warning)' }}>
                    {formatCurrency(selectedAdvance.remainingAmount || selectedAdvance.amount)}
                  </div>
                </div>
              </div>

              {/* Grid Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                <div style={{ background: 'var(--surface-light)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Employee</div>
                  <div style={{ fontWeight: 500 }}>{selectedAdvance.memberName}</div>
                </div>
                <div style={{ background: 'var(--surface-light)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Department</div>
                  <div style={{ fontWeight: 500 }}>General</div>
                </div>
                <div style={{ background: 'var(--surface-light)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Issue Date</div>
                  <div style={{ fontWeight: 500 }}>{new Date(selectedAdvance.createdAt).toLocaleDateString()}</div>
                </div>
                <div style={{ background: 'var(--surface-light)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Advance Type</div>
                  <div style={{ fontWeight: 500 }}>Salary Advance</div>
                </div>
              </div>

              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0' }}>Advance Information</h4>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  <strong>Notes:</strong> {selectedAdvance.reason || selectedAdvance.description || 'N/A'}
                </div>
              </div>

              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 16px 0' }}>Amount Summary</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Advanced</span>
                  <span>{formatCurrency(selectedAdvance.amount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Recovered Amount</span>
                  <span style={{ color: 'var(--success)' }}>
                    {formatCurrency(parseFloat(selectedAdvance.amount) - parseFloat(selectedAdvance.remainingAmount ?? selectedAdvance.amount))}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '8px 0' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Remaining Balance</span>
                  <span style={{ fontWeight: 500, color: 'var(--warning)' }}>
                    {formatCurrency(selectedAdvance.remainingAmount ?? selectedAdvance.amount)}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ margin: '0 0 16px 0' }}>Activity Timeline</h4>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)', marginTop: '4px' }}></div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>Advance Issued</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(selectedAdvance.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                {selectedAdvance.status !== 'ACTIVE' && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)', marginTop: '4px' }}></div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>Advance Recovered ({selectedAdvance.status})</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {selectedAdvance.updatedAt ? new Date(selectedAdvance.updatedAt).toLocaleString() : new Date().toLocaleString()}
                      </div>
                      {selectedAdvance.settlementId && (
                        <div style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '4px' }}>
                          Recovered during monthly settlement
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                {selectedAdvance.status === "ACTIVE" && (
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1 }}
                    onClick={() => {
                      updateStatus(selectedAdvance.id, "DEDUCTED");
                      setSelectedAdvance(null);
                    }}
                  >
                    Mark as Recovered
                  </button>
                )}
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: selectedAdvance.status === "ACTIVE" ? 1 : '1 1 100%' }}
                  onClick={() => setSelectedAdvance(null)}
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
