"use client";

import { useState, useEffect } from "react";
import styles from "../income/page.module.css";

type ReserveTransaction = {
  id: string;
  amount: string;
  type: string;
  description: string | null;
  settlementId: string | null;
  createdAt: string;
};

export default function ReservesPage() {
  const [transactions, setTransactions] = useState<ReserveTransaction[]>([]);
  const [totalReserve, setTotalReserve] = useState(0);
  const [loading, setLoading] = useState(true);

  // Layout State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<ReserveTransaction | null>(null);

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form State
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("DEPOSIT");
  const [description, setDescription] = useState("");

  const fetchReserves = async () => {
    try {
      const res = await fetch("/api/reserves");
      const data = await res.json();
      setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
      setTotalReserve(data.totalReserve || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReserves();
  }, []);

  // Derived Metrics
  const totalAdded = transactions.filter(t => t.type === 'DEPOSIT').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalUsed = transactions.filter(t => t.type === 'WITHDRAWAL').reduce((sum, t) => sum + Number(t.amount), 0);
  const thisMonthActivity = transactions.filter(t => {
    const d = new Date(t.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const reserveGrowth = totalAdded > 0 ? ((totalAdded - totalUsed) / totalAdded) * 100 : 0;

  // Filter & Sort Logic
  let filteredTx = transactions.filter(t => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = t.description?.toLowerCase().includes(searchLower) || 
                          (t.settlementId ? "system settlement" : "manual adjustment").includes(searchLower);
    const matchesType = filterType === "ALL" || t.type === filterType;
    return matchesSearch && matchesType;
  });

  filteredTx.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredTx.length / itemsPerPage));
  const paginatedTx = filteredTx.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/reserves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          type,
          description,
        }),
      });

      if (res.ok) {
        setAmount("");
        setDescription("");
        setIsModalOpen(false);
        fetchReserves();
      }
    } catch (err) {
      console.error("Failed to submit reserve transaction", err);
    }
  };

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val));
  };

  const openNewReserveModal = () => {
    setAmount("");
    setType("DEPOSIT");
    setDescription("");
    setIsModalOpen(true);
  };

  return (
    <div className="animate-fade-in container" style={{ maxWidth: '1400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <h1 style={{ margin: 0 }}>Reserve Management</h1>
        <button onClick={openNewReserveModal} className="btn btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          Add Reserve
        </button>
      </div>

      <div className={styles.container}>
        {/* Top Section Metrics */}
        <div className={styles.metricsGrid}>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Total Reserve Balance</div>
            <div className={styles.metricValue} style={{ color: totalReserve >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatCurrency(totalReserve)}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Available Reserve</div>
            <div className={styles.metricValue}>{formatCurrency(totalReserve)}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Total Reserve Added</div>
            <div className={styles.metricValue} style={{ color: 'var(--success)' }}>{formatCurrency(totalAdded)}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Total Reserve Used</div>
            <div className={styles.metricValue} style={{ color: 'var(--danger)' }}>{formatCurrency(totalUsed)}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>This Month Activity</div>
            <div className={styles.metricValue}>{thisMonthActivity} Txns</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Reserve Growth</div>
            <div className={styles.metricValue} style={{ color: reserveGrowth >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {reserveGrowth >= 0 ? '+' : ''}{reserveGrowth.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          {/* Filters Section */}
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup} style={{ flex: 2 }}>
              <label className="label">Search Reserves</label>
              <input 
                type="text" 
                className="input" 
                placeholder="Search description or source..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Category</label>
              <select className="input" disabled>
                <option>All Categories</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Transaction Type</label>
              <select className="input" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="ALL">All Types</option>
                <option value="DEPOSIT">Deposits</option>
                <option value="WITHDRAWAL">Withdrawals</option>
              </select>
            </div>
            <div className={styles.filterGroup} style={{ flex: 'none', paddingBottom: '2px' }}>
              <button className="btn btn-secondary" onClick={() => window.print()}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                Export
              </button>
            </div>
          </div>

          {/* Reserves Table */}
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reserve Name / Source</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Amount Added</th>
                  <th style={{ textAlign: 'right' }}>Amount Used</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center' }}>Loading...</td></tr>
                ) : paginatedTx.length > 0 ? (
                  paginatedTx.map((tx) => (
                    <tr key={tx.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedTx(tx)}>
                      <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                        {tx.settlementId ? "System (Settlement)" : "Manual Adjustment"}
                      </td>
                      <td>
                        <span className={`${styles.badge} ${tx.type === 'DEPOSIT' ? styles['badge-paid'] : styles['badge-unpaid']}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td>{tx.description || '-'}</td>
                      <td style={{ textAlign: 'right', color: 'var(--success)' }}>
                        {tx.type === 'DEPOSIT' ? `+${formatCurrency(tx.amount)}` : '-'}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--danger)' }}>
                        {tx.type === 'WITHDRAWAL' ? `-${formatCurrency(tx.amount)}` : '-'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`${styles.badge} ${styles['badge-paid']}`}>COMPLETED</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                           <button onClick={(e) => { e.stopPropagation(); setSelectedTx(tx); }} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>Details</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "var(--spacing-6)" }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'var(--text-muted)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5 }}>account_balance_wallet</span>
                        <p>No reserve transactions found.</p>
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
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTx.length)} of {filteredTx.length} entries
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

      {/* Manual Adjustment Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Manual Reserve Adjustment</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "var(--spacing-4)", marginTop: "-16px" }}>
              The reserve balance automatically receives the Company Share during Monthly Settlements. Use this form for manual corrections or external reserve withdrawals.
            </p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className="label">Amount</label>
                  <input required type="number" step="0.01" className="input" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className="label">Type</label>
                  <select required className="input" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="DEPOSIT">Deposit (Add to Reserve)</option>
                    <option value="WITHDRAWAL">Withdrawal (Deduct)</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className="label">Description / Reason</label>
                <textarea required className="input" rows={3} placeholder="e.g. Office emergency funds, manual correction" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: 'var(--spacing-4)' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Submit Adjustment
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reserve Details Modal */}
      {selectedTx && (
        <div className={styles.modalOverlay} onClick={() => setSelectedTx(null)}>
          <div className={styles.modalContent} style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 style={{ margin: 0 }}>{selectedTx.settlementId ? "System (Settlement)" : "Manual Adjustment"}</h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
                  Transaction Type: {selectedTx.type} • Date: {new Date(selectedTx.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button onClick={() => setSelectedTx(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
              <div style={{ padding: 'var(--spacing-4)', background: 'var(--surface-light)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Transaction Amount</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: selectedTx.type === 'DEPOSIT' ? 'var(--success)' : 'var(--danger)' }}>
                  {selectedTx.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(selectedTx.amount)}
                </div>
              </div>
              <div style={{ padding: 'var(--spacing-4)', background: 'var(--surface-light)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Status</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                  <span className={`${styles.badge} ${styles['badge-paid']}`}>COMPLETED</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 'var(--spacing-6)' }}>
              <h4 style={{ marginBottom: 'var(--spacing-4)' }}>Description / Notes</h4>
              <p style={{ color: 'var(--text)', background: 'var(--surface-light)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius)', fontSize: '0.9rem' }}>
                {selectedTx.description || 'No description provided.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: 'var(--spacing-6)', paddingTop: 'var(--spacing-4)', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedTx(null)} style={{ flex: 1 }}>
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
