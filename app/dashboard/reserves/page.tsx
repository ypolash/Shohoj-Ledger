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

  // Form State
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("DEPOSIT");
  const [description, setDescription] = useState("");

  const fetchReserves = async () => {
    try {
      const res = await fetch("/api/reserves");
      const data = await res.json();
      setTransactions(data.transactions);
      setTotalReserve(data.totalReserve);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReserves();
  }, []);

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
        fetchReserves();
      }
    } catch (err) {
      console.error("Failed to submit reserve transaction", err);
    }
  };

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val));
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <h1>Reserve Balance Tracking</h1>
        <div className="glass-card" style={{ padding: "var(--spacing-3) var(--spacing-5)" }}>
          <span style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginRight: "12px" }}>Current Company Reserve</span>
          <strong style={{ fontSize: "1.25rem", color: totalReserve >= 0 ? "var(--success)" : "var(--danger)" }}>
            {formatCurrency(totalReserve)}
          </strong>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Record Transaction Form */}
        <div className="glass-card">
          <h3 style={{ marginBottom: "var(--spacing-4)" }}>Manual Adjustment</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "var(--spacing-4)" }}>
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

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Submit Adjustment
            </button>
          </form>
        </div>

        {/* Transactions List */}
        <div className="glass-card" style={{ overflowX: "auto" }}>
          <h3 style={{ marginBottom: "var(--spacing-4)" }}>Reserve History</h3>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Source</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`${styles.badge} ${tx.type === 'DEPOSIT' ? styles['badge-paid'] : styles['badge-unpaid']}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td>{tx.settlementId ? "System (Settlement)" : "Manual"}</td>
                    <td>{tx.description || '-'}</td>
                    <td style={{ color: tx.type === 'DEPOSIT' ? "var(--success)" : "var(--danger)", fontWeight: "500" }}>
                      {tx.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "var(--spacing-4)" }}>
                      No reserve history yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
