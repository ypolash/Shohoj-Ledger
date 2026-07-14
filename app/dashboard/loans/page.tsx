"use client";

import { useState, useEffect } from "react";
import styles from "../income/page.module.css";

type Loan = {
  id: string;
  memberId: string;
  memberName: string;
  amount: string;
  issueDate: string;
  dueDate: string;
  status: string;
  description: string | null;
  isOverdue: boolean;
};

type User = {
  id: string;
  name: string;
};

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const fetchData = async () => {
    try {
      const [loansRes, usersRes] = await Promise.all([
        fetch("/api/loans"),
        fetch("/api/users")
      ]);
      const loansData = await loansRes.json();
      const usersData = await usersRes.json();
      setLoans(loansData);
      setUsers(usersData);
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
        fetchData();
      }
    } catch (err) {
      console.error("Failed to submit loan", err);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/loans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val));
  };

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: "var(--spacing-6)" }}>Member Loans & Advances</h1>

      <div className={styles.grid}>
        {/* Issue Loan Form */}
        <div className="glass-card">
          <h3 style={{ marginBottom: "var(--spacing-4)" }}>Issue New Loan</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "var(--spacing-4)" }}>
            Loans have a standard 6-month repayment period. If a loan remains active past this date, it may be forcibly deducted during settlement.
          </p>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className="label">Select Member</label>
              <select required className="input" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
                <option value="" disabled>Choose a member...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className="label">Loan Amount</label>
              <input required type="number" step="0.01" className="input" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>

            <div className={styles.formGroup}>
              <label className="label">Description / Reason</label>
              <textarea required className="input" rows={3} placeholder="e.g. Personal emergency, advance against salary" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Issue Loan
            </button>
          </form>
        </div>

        {/* Loans List */}
        <div className="glass-card" style={{ overflowX: "auto" }}>
          <h3 style={{ marginBottom: "var(--spacing-4)" }}>Active & Past Loans</h3>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Issued</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan.id} style={{ background: loan.isOverdue ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                    <td style={{ fontWeight: "500" }}>{loan.memberName}</td>
                    <td>{new Date(loan.issueDate).toLocaleDateString()}</td>
                    <td>{formatCurrency(loan.amount)}</td>
                    <td style={{ color: loan.isOverdue ? 'var(--danger)' : 'var(--text-muted)' }}>
                      {new Date(loan.dueDate).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${
                        loan.status === 'REPAID' ? styles['badge-paid'] :
                        loan.status === 'DEDUCTED' ? styles['badge-partial'] :
                        loan.isOverdue ? styles['badge-unpaid'] : styles['badge-partial']
                      }`}>
                        {loan.isOverdue ? "OVERDUE" : loan.status}
                      </span>
                    </td>
                    <td>
                      {loan.status === "ACTIVE" && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => updateStatus(loan.id, "REPAID")} className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '12px', color: 'var(--success)', borderColor: 'var(--success)' }}>Mark Repaid</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {loans.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "var(--spacing-4)" }}>
                      No loans issued yet.
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
