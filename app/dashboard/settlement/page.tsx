"use client";

import { useState, useEffect } from "react";
import styles from "../income/page.module.css";

type Settlement = {
  id: string;
  period: string;
  status: string; // PENDING or EXECUTED
  totalIncome: string;
  totalExpenses: string;
  ceoShare: string;
  developerShare: string;
  advisorShare: string;
  companyShare: string;
  createdAt: string;
};

export default function SettlementPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  // Layout State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [filterClient, setFilterClient] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form State
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [preview, setPreview] = useState<any>(null);
  const [previewing, setPreviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchSettlements = async () => {
    try {
      const res = await fetch("/api/settlements");
      const data = await res.json();
      setSettlements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, []);

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setPreviewing(true);
    try {
      const res = await fetch(`/api/settlements?month=${month}&year=${year}`);
      const data = await res.json();
      setPreview(data);
    } catch (err) {
      console.error("Failed to generate preview", err);
    } finally {
      setPreviewing(false);
    }
  };

  const handleCreateSettlement = async () => {
    if (!preview) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preview),
      });

      if (res.ok) {
        setPreview(null);
        setIsModalOpen(false);
        fetchSettlements();
      }
    } catch (err) {
      console.error("Failed to save settlement", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteSettlement = async (id: string) => {
    if (!confirm("Are you sure you want to execute this settlement? This will lock the balances and deposit shares.")) return;
    try {
      const res = await fetch("/api/settlements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "EXECUTE" }),
      });

      if (res.ok) {
        fetchSettlements();
        if (selectedSettlement && selectedSettlement.id === id) {
          setSelectedSettlement({ ...selectedSettlement, status: "EXECUTED" });
        }
      }
    } catch (err) {
      console.error("Failed to execute settlement", err);
    }
  };

  const handleDeleteSettlement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this settlement? This will reset member balances and undo company reserve deposits for this period.")) return;
    try {
      const res = await fetch(`/api/settlements?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchSettlements();
        if (selectedSettlement && selectedSettlement.id === id) {
          setSelectedSettlement(null);
        }
      } else {
        alert("Failed to delete settlement");
      }
    } catch (err) {
      console.error("Error deleting settlement", err);
    }
  };

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val || 0));
  };

  // Derived Metrics
  const totalSettlementsCount = settlements.length;
  const completedSettlementsCount = settlements.filter(s => s.status === "EXECUTED").length;
  const pendingSettlementsCount = settlements.filter(s => s.status === "PENDING").length;
  
  const totalSettlementAmount = settlements.reduce((sum, s) => {
    return sum + (Number(s.totalIncome) - Number(s.totalExpenses));
  }, 0);
  
  const remainingOutstanding = settlements.filter(s => s.status === "PENDING").reduce((sum, s) => {
    return sum + (Number(s.totalIncome) - Number(s.totalExpenses));
  }, 0);
  
  const thisMonthSettlements = settlements.filter(s => {
    const d = new Date(s.createdAt || new Date());
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, s) => {
    return sum + (Number(s.totalIncome) - Number(s.totalExpenses));
  }, 0);

  // Filter & Sort Logic
  let filteredSettlements = settlements.filter(s => {
    const matchesSearch = s.period?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || s.status === filterStatus;
    const matchesType = filterType === "ALL" || filterType === "Monthly Revenue Share";
    const matchesClient = filterClient === "ALL" || filterClient === "Internal Partners";
    return matchesSearch && matchesStatus && matchesType && matchesClient;
  });

  filteredSettlements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredSettlements.length / itemsPerPage));
  const paginatedSettlements = filteredSettlements.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openNewSettlementModal = () => {
    setPreview(null);
    setMonth((new Date().getMonth() + 1).toString());
    setYear(new Date().getFullYear().toString());
    setIsModalOpen(true);
  };

  const handleRowClick = (settlement: Settlement) => {
    setSelectedSettlement(settlement);
  };

  return (
    <div className="animate-fade-in container" style={{ maxWidth: '1400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <h1 style={{ margin: 0 }}>Settlement Management</h1>
        <button onClick={openNewSettlementModal} className="btn btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          New Settlement
        </button>
      </div>

      <div className={styles.container}>
        
        {/* Top Section Metrics */}
        <div className={styles.metricsGrid}>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Total Settlements</div>
            <div className={styles.metricValue} style={{ color: 'var(--text)' }}>{totalSettlementsCount}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Completed Settlements</div>
            <div className={styles.metricValue} style={{ color: 'var(--success)' }}>{completedSettlementsCount}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Pending Settlements</div>
            <div className={styles.metricValue} style={{ color: 'var(--warning)' }}>{pendingSettlementsCount}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Total Settlement Amount</div>
            <div className={styles.metricValue}>{formatCurrency(totalSettlementAmount)}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>This Month Settlements</div>
            <div className={styles.metricValue}>{formatCurrency(thisMonthSettlements)}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Remaining Outstanding Balance</div>
            <div className={styles.metricValue} style={{ color: 'var(--danger)' }}>{formatCurrency(remainingOutstanding)}</div>
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
                placeholder="Search by period or ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Member / Client</label>
              <select className="input" value={filterClient} onChange={(e) => setFilterClient(e.target.value)}>
                <option value="ALL">All Clients/Members</option>
                <option value="Internal Partners">Internal Partners</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Settlement Type</label>
              <select className="input" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="ALL">All Types</option>
                <option value="Monthly Revenue Share">Monthly Revenue Share</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Status</label>
              <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="EXECUTED">Executed</option>
              </select>
            </div>
            <div className={styles.filterGroup} style={{ flex: 'none', paddingBottom: '2px' }}>
              <button className="btn btn-secondary" onClick={() => window.print()}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                Export
              </button>
            </div>
          </div>

          {/* Settlements Table */}
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Settlement ID</th>
                  <th>Member / Client</th>
                  <th>Settlement Type</th>
                  <th style={{ textAlign: 'right' }}>Total Amount</th>
                  <th style={{ textAlign: 'right' }}>Paid Amount</th>
                  <th style={{ textAlign: 'right' }}>Remaining Amount</th>
                  <th>Settlement Date</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th>Last Updated</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} style={{ textAlign: 'center' }}>Loading...</td></tr>
                ) : paginatedSettlements.length > 0 ? (
                  paginatedSettlements.map((s) => {
                    const totalAmt = Number(s.totalIncome) - Number(s.totalExpenses);
                    const isExecuted = s.status === 'EXECUTED' || s.status === 'PAID'; // Some legacy might use PAID
                    const paidAmt = isExecuted ? totalAmt : 0;
                    const remainingAmt = isExecuted ? 0 : totalAmt;
                    
                    return (
                      <tr 
                        key={s.id} 
                        className={styles.clickableRow}
                        onClick={() => handleRowClick(s)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>#{s.id.slice(0, 8)}</td>
                        <td style={{ fontWeight: 500 }}>Internal Partners</td>
                        <td style={{ color: 'var(--text-muted)' }}>Monthly Revenue Share</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(totalAmt)}</td>
                        <td style={{ textAlign: 'right', color: isExecuted ? 'var(--success)' : 'var(--text-muted)' }}>
                          {formatCurrency(paidAmt)}
                        </td>
                        <td style={{ textAlign: 'right', color: remainingAmt > 0 ? 'var(--warning)' : 'inherit' }}>
                          {formatCurrency(remainingAmt)}
                        </td>
                        <td style={{ fontWeight: 500 }}>{s.period}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`${styles.badge} ${
                            isExecuted ? styles['badge-paid'] : styles['badge-partial']
                          }`}>
                            {isExecuted ? 'EXECUTED' : s.status}
                          </span>
                        </td>
                        <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            {s.status === "PENDING" && (
                              <button onClick={() => handleExecuteSettlement(s.id)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--success)', borderColor: 'var(--success)' }}>Execute</button>
                            )}
                            <button onClick={() => handleDeleteSettlement(s.id)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--danger)', borderColor: 'var(--danger)' }}>Delete</button>
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
                        <p>No settlements found matching your criteria.</p>
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
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredSettlements.length)} of {filteredSettlements.length} entries
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

      {/* Settlement Form Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Create Settlement</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            {!preview ? (
              <>
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "var(--spacing-4)" }}>
                  Select a month and year to calculate the net profit and distribution shares. This pulls only PAID/PARTIAL incomes and APPROVED expenses.
                </p>
                <form onSubmit={handlePreview} className={styles.form}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className="label">Month</label>
                      <select required className="input" value={month} onChange={(e) => setMonth(e.target.value)} style={{ appearance: 'auto' }}>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                          <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className="label">Year</label>
                      <input required type="number" className="input" value={year} onChange={(e) => setYear(e.target.value)} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', marginTop: 'var(--spacing-4)' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={previewing}>
                      {previewing ? "Calculating..." : "Generate Preview"}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className={styles.form}>
                <div style={{ padding: "var(--spacing-4)", background: "var(--surface-light)", borderRadius: "var(--radius-md)", border: '1px solid var(--border)' }}>
                  <h4 style={{ marginBottom: "var(--spacing-3)" }}>Preview: {preview.period}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Total Income:</span>
                    <span style={{ color: 'var(--success)' }}>{formatCurrency(preview.totalIncome)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Total Expenses:</span>
                    <span style={{ color: 'var(--danger)' }}>-{formatCurrency(preview.totalExpenses)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: 'bold', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <span>Net Profit:</span>
                    <span>{formatCurrency(preview.netProfit)}</span>
                  </div>

                  <h5 style={{ marginBottom: "var(--spacing-2)", color: "var(--text-muted)" }}>Distributions</h5>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>CEO Share (40%):</span>
                    <span>{formatCurrency(preview.ceoShare)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Developer Share (20%):</span>
                    <span>{formatCurrency(preview.developerShare)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Advisor Share (20%):</span>
                    <span>{formatCurrency(preview.advisorShare)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span>Company Reserve (20%):</span>
                    <span style={{ color: 'var(--primary)' }}>{formatCurrency(preview.companyShare)}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '16px', marginTop: 'var(--spacing-4)' }}>
                  <button onClick={handleCreateSettlement} className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                    {submitting ? "Saving..." : "Save Settlement Record"}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setPreview(null)}>
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Details Drawer */}
      {selectedSettlement && (
        <div className={styles.modalOverlay} onClick={() => setSelectedSettlement(null)} style={{ justifyContent: 'flex-end', padding: 0 }}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ height: '100%', width: '100%', maxWidth: '500px', borderRadius: 0, overflowY: 'auto' }}>
            <div className={styles.modalHeader} style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 10, padding: 'var(--spacing-4)', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ margin: 0 }}>Settlement Details</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>#{selectedSettlement.id}</div>
              </div>
              <button onClick={() => setSelectedSettlement(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div style={{ padding: 'var(--spacing-6)' }}>
              
              {/* Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ margin: '0 0 8px 0' }}>{formatCurrency(Number(selectedSettlement.totalIncome) - Number(selectedSettlement.totalExpenses))}</h2>
                  <span className={`${styles.badge} ${
                    selectedSettlement.status === 'EXECUTED' ? styles['badge-paid'] : styles['badge-partial']
                  }`}>
                    {selectedSettlement.status}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Outstanding Balance</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--warning)' }}>
                    {selectedSettlement.status === 'EXECUTED' ? formatCurrency(0) : formatCurrency(Number(selectedSettlement.totalIncome) - Number(selectedSettlement.totalExpenses))}
                  </div>
                </div>
              </div>

              {/* Grid Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                <div style={{ background: 'var(--surface-light)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Member / Client</div>
                  <div style={{ fontWeight: 500 }}>Internal Partners</div>
                </div>
                <div style={{ background: 'var(--surface-light)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Settlement Date</div>
                  <div style={{ fontWeight: 500 }}>{selectedSettlement.period}</div>
                </div>
                <div style={{ background: 'var(--surface-light)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Last Updated</div>
                  <div style={{ fontWeight: 500 }}>{new Date(selectedSettlement.createdAt).toLocaleDateString()}</div>
                </div>
                <div style={{ background: 'var(--surface-light)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Settlement Type</div>
                  <div style={{ fontWeight: 500 }}>Monthly Revenue Share</div>
                </div>
              </div>

              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 16px 0' }}>Payment Summary</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Income</span>
                  <span style={{ color: 'var(--success)' }}>{formatCurrency(selectedSettlement.totalIncome)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Expenses</span>
                  <span style={{ color: 'var(--danger)' }}>-{formatCurrency(selectedSettlement.totalExpenses)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Paid Amount</span>
                  <span>{selectedSettlement.status === 'EXECUTED' ? formatCurrency(Number(selectedSettlement.totalIncome) - Number(selectedSettlement.totalExpenses)) : formatCurrency(0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '8px 0' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Net Profit (Total Amount)</span>
                  <span style={{ fontWeight: 500 }}>{formatCurrency(Number(selectedSettlement.totalIncome) - Number(selectedSettlement.totalExpenses))}</span>
                </div>
              </div>

              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 16px 0' }}>Distribution Breakdown</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>CEO (40%)</span>
                  <span>{formatCurrency(selectedSettlement.ceoShare)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Developer (20%)</span>
                  <span>{formatCurrency(selectedSettlement.developerShare)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Advisor (20%)</span>
                  <span>{formatCurrency(selectedSettlement.advisorShare)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '8px 0' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Company Reserve (20%)</span>
                  <span style={{ color: 'var(--primary)' }}>{formatCurrency(selectedSettlement.companyShare)}</span>
                </div>
              </div>
              
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0' }}>Settlement Information</h4>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  <strong>Notes:</strong> Auto-calculated distribution for {selectedSettlement.period}. 
                  Related Income / Expense Records are locked for this period.
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ margin: '0 0 16px 0' }}>Activity Timeline / Transaction History</h4>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)', marginTop: '4px' }}></div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>Settlement Created</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(selectedSettlement.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                {selectedSettlement.status === 'EXECUTED' && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)', marginTop: '4px' }}></div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>Settlement Executed</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Company Reserve Deposit: {formatCurrency(selectedSettlement.companyShare)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                {selectedSettlement.status === "PENDING" && (
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1 }}
                    onClick={() => {
                      handleExecuteSettlement(selectedSettlement.id);
                      setSelectedSettlement(null);
                    }}
                  >
                    Execute Settlement
                  </button>
                )}
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: selectedSettlement.status === "PENDING" ? 1 : '1 1 100%' }}
                  onClick={() => setSelectedSettlement(null)}
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
