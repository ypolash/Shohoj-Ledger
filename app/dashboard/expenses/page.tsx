"use client";

import { useState, useEffect } from "react";
import styles from "../income/page.module.css"; // Reuse the layout grid styles

type Expense = {
  id: string;
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

  // Form State
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [description, setDescription] = useState("");

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/expenses");
      const data = await res.json();
      setExpenses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

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

  const formatCurrency = (val: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(parseFloat(val));
  };

  const getStatusBadge = (status: string) => {
    if (status === "APPROVED") return <span className={`${styles.badge} ${styles['badge-paid']}`}>APPROVED</span>;
    if (status === "REJECTED") return <span className={`${styles.badge} ${styles['badge-unpaid']}`}>REJECTED</span>;
    return <span className={`${styles.badge} ${styles['badge-partial']}`}>PENDING</span>;
  };

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: "var(--spacing-6)" }}>Expense Management</h1>

      <div className={styles.grid}>
        {/* Record Expense Form */}
        <div className="glass-card">
          <h3 style={{ marginBottom: "var(--spacing-4)" }}>Request Expense</h3>
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
              <label className="label">Description / Reason</label>
              <textarea required className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Submit Expense
            </button>
          </form>
        </div>

        {/* Expenses List */}
        <div className="glass-card" style={{ overflowX: "auto" }}>
          <h3 style={{ marginBottom: "var(--spacing-4)" }}>Recent Expenses</h3>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td>{new Date(exp.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div>{exp.category}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{exp.description}</div>
                    </td>
                    <td>{formatCurrency(exp.amount)}</td>
                    <td>{exp.paymentMethod}</td>
                    <td>{getStatusBadge(exp.approvalStatus)}</td>
                    <td>
                      {exp.approvalStatus === "PENDING" && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => updateStatus(exp.id, "APPROVED")} className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '12px', color: 'var(--success)', borderColor: 'var(--success)' }}>Approve</button>
                          <button onClick={() => updateStatus(exp.id, "REJECTED")} className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '12px', color: 'var(--danger)', borderColor: 'var(--danger)' }}>Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "var(--spacing-4)" }}>
                      No expenses recorded yet.
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
