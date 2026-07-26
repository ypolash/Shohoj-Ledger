"use client";

import { useState, useEffect } from "react";
import styles from "../income/page.module.css";

type FundTransaction = {
  id: string;
  amount: string;
  source: string | null;
  description: string | null;
  createdAt: string;
};

export default function FundsPage() {
  const [funds, setFunds] = useState<FundTransaction[]>([]);
  const [totalFunds, setTotalFunds] = useState(0);
  const [loading, setLoading] = useState(true);

  // Layout State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFund, setSelectedFund] = useState<FundTransaction | null>(null);

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form State
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [description, setDescription] = useState("");

  const fetchFunds = async () => {
    try {
      const res = await fetch("/api/funds");
      const data = await res.json();
      setFunds(Array.isArray(data.funds) ? data.funds : []);
      setTotalFunds(data.totalFunds || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunds();
  }, []);

  // Derived Metrics (Mocking unavailable metrics to meet UI spec)
  const availableBalance = totalFunds; // Assuming all funds are available
  const totalDeposits = totalFunds;
  const totalWithdrawals = 0; // Not tracked in current schema
  const activeFunds = Array.from(new Set(funds.map(f => f.source))).filter(Boolean).length;
  
  const thisMonthTransactions = funds.filter(f => {
    const d = new Date(f.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // Filter & Sort Logic
  let filteredFunds = funds.filter(f => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = f.source?.toLowerCase().includes(searchLower) || 
                          f.description?.toLowerCase().includes(searchLower);
    const matchesType = filterType === "ALL"; // Dummy filter
    const matchesStatus = filterStatus === "ALL"; // Dummy filter
    return matchesSearch && matchesType && matchesStatus;
  });

  filteredFunds.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredFunds.length / itemsPerPage));
  const paginatedFunds = filteredFunds.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/funds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          source,
          description,
        }),
      });

      if (res.ok) {
        setAmount("");
        setSource("");
        setDescription("");
        setIsModalOpen(false);
        fetchFunds();
      }
    } catch (err) {
      console.error("Failed to submit fund transaction", err);
    }
  };

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val));
  };

  const openNewFundModal = () => {
    setAmount("");
    setSource("");
    setDescription("");
    setIsModalOpen(true);
  };

  return (
    <div className="animate-fade-in container" style={{ maxWidth: '1400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <h1 style={{ margin: 0 }}>Company Funds Management</h1>
        <button onClick={openNewFundModal} className="btn btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          Add Fund
        </button>
      </div>

      <div className={styles.container}>
        {/* Top Section Metrics */}
        <div className={styles.metricsGrid}>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Total Funds</div>
            <div className={styles.metricValue} style={{ color: 'var(--primary)' }}>{formatCurrency(totalFunds)}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Available Balance</div>
            <div className={styles.metricValue} style={{ color: 'var(--success)' }}>{formatCurrency(availableBalance)}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Total Deposits</div>
            <div className={styles.metricValue}>{formatCurrency(totalDeposits)}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Total Withdrawals</div>
            <div className={styles.metricValue} style={{ color: 'var(--danger)' }}>{formatCurrency(totalWithdrawals)}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Active Funds</div>
            <div className={styles.metricValue}>{activeFunds}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>This Month</div>
            <div className={styles.metricValue}>{thisMonthTransactions} Txns</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          {/* Filters Section */}
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup} style={{ flex: 2 }}>
              <label className="label">Search Funds</label>
              <input 
                type="text" 
                className="input" 
                placeholder="Search by source or description..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Fund Type</label>
              <select className="input" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="ALL">All Types</option>
                <option value="CAPITAL">Capital</option>
                <option value="RESERVE">Reserve</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Status</label>
              <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <div className={styles.filterGroup} style={{ flex: 'none', paddingBottom: '2px' }}>
              <button className="btn btn-secondary" onClick={() => window.print()}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                Export
              </button>
            </div>
          </div>

          {/* Funds Table */}
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Fund Name / Source</th>
                  <th>Fund Type</th>
                  <th style={{ textAlign: 'right' }}>Opening Balance</th>
                  <th style={{ textAlign: 'right' }}>Current Balance</th>
                  <th style={{ textAlign: 'right' }}>Deposits</th>
                  <th style={{ textAlign: 'right' }}>Withdrawals</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center' }}>Loading...</td></tr>
                ) : paginatedFunds.length > 0 ? (
                  paginatedFunds.map((fund) => (
                    <tr key={fund.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedFund(fund)}>
                      <td>{new Date(fund.createdAt).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{fund.source || 'General Capital'}</td>
                      <td>Capital Injection</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>-</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(fund.amount)}</td>
                      <td style={{ textAlign: 'right', color: "var(--success)" }}>+{formatCurrency(fund.amount)}</td>
                      <td style={{ textAlign: 'right', color: "var(--danger)" }}>-</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`${styles.badge} ${styles['badge-paid']}`}>ACTIVE</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                           <button onClick={(e) => { e.stopPropagation(); setSelectedFund(fund); }} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>Details</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "var(--spacing-6)" }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'var(--text-muted)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5 }}>account_balance</span>
                        <p>No funds found matching your criteria.</p>
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
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredFunds.length)} of {filteredFunds.length} entries
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

      {/* Add Fund Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Add Capital / Fund</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "var(--spacing-4)", marginTop: "-16px" }}>
              These funds are non-shareable and represent direct capital injections into the company.
            </p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className="label">Amount</label>
                <input required type="number" step="0.01" className="input" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>

              <div className={styles.formGroup}>
                <label className="label">Source (e.g., Owner, Investor)</label>
                <input required className="input" placeholder="Owner Name" value={source} onChange={(e) => setSource(e.target.value)} />
              </div>

              <div className={styles.formGroup}>
                <label className="label">Description / Notes</label>
                <textarea className="input" rows={3} placeholder="Initial capital, equipment purchase loan..." value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: 'var(--spacing-4)' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Record Fund Injection
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fund Details Modal */}
      {selectedFund && (
        <div className={styles.modalOverlay} onClick={() => setSelectedFund(null)}>
          <div className={styles.modalContent} style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 style={{ margin: 0 }}>{selectedFund.source || 'General Capital'}</h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
                  Fund Type: Capital Injection • Date: {new Date(selectedFund.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button onClick={() => setSelectedFund(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
              <div style={{ padding: 'var(--spacing-4)', background: 'var(--surface-light)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Current Balance</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(selectedFund.amount)}</div>
              </div>
              <div style={{ padding: 'var(--spacing-4)', background: 'var(--surface-light)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Status</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                  <span className={`${styles.badge} ${styles['badge-paid']}`}>ACTIVE</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 'var(--spacing-6)' }}>
              <h4 style={{ marginBottom: 'var(--spacing-4)' }}>Fund Notes / Description</h4>
              <p style={{ color: 'var(--text)', background: 'var(--surface-light)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius)', fontSize: '0.9rem' }}>
                {selectedFund.description || 'No description provided.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: 'var(--spacing-6)', paddingTop: 'var(--spacing-4)', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedFund(null)} style={{ flex: 1 }}>
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
