"use client";

import { useState, useEffect } from "react";
import styles from "../income/page.module.css";

type Advance = {
  id: string;
  memberId: string;
  memberName: string;
  amount: string;
  status: string;
  description: string | null;
  settlementId: string | null;
  createdAt: string;
};

type User = {
  id: string;
  name: string;
};

export default function AdvancesPage() {
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const fetchData = async () => {
    try {
      const [advRes, usersRes] = await Promise.all([
        fetch("/api/advances"),
        fetch("/api/members")
      ]);
      const advData = await advRes.json();
      const usersData = await usersRes.json();
      setAdvances(advData);
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
        fetchData();
      }
    } catch (err) {
      console.error("Failed to submit advance", err);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/advances", {
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
      <h1 style={{ marginBottom: "var(--spacing-6)" }}>Member Advances (Due Balances)</h1>

      <div className={styles.grid}>
        {/* Issue Advance Form */}
        <div className="glass-card">
          <h3 style={{ marginBottom: "var(--spacing-4)" }}>Issue Advance</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "var(--spacing-4)" }}>
            Advances are short-term and will be automatically deducted from the member's very next monthly settlement payout.
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
              <label className="label">Advance Amount</label>
              <input required type="number" step="0.01" className="input" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>

            <div className={styles.formGroup}>
              <label className="label">Description / Reason</label>
              <textarea required className="input" rows={3} placeholder="e.g. Mid-month withdrawal" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Issue Advance
            </button>
          </form>
        </div>

        {/* Advances List */}
        <div className="glass-card" style={{ overflowX: "auto" }}>
          <h3 style={{ marginBottom: "var(--spacing-4)" }}>Active & Settled Advances</h3>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {advances.map((adv) => (
                  <tr key={adv.id}>
                    <td style={{ fontWeight: "500" }}>{adv.memberName}</td>
                    <td>{new Date(adv.createdAt).toLocaleDateString()}</td>
                    <td>{formatCurrency(adv.amount)}</td>
                    <td>
                      <span className={`${styles.badge} ${
                        adv.status === 'ACTIVE' ? styles['badge-unpaid'] : styles['badge-paid']
                      }`}>
                        {adv.status}
                      </span>
                    </td>
                    <td>
                      {adv.status === "ACTIVE" && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => updateStatus(adv.id, "DEDUCTED")} className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '12px', color: 'var(--success)', borderColor: 'var(--success)' }}>Mark Manual Return</button>
                        </div>
                      )}
                      {adv.status === "DEDUCTED" && adv.settlementId && (
                         <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>via Settlement</span>
                      )}
                    </td>
                  </tr>
                ))}
                {advances.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "var(--spacing-4)" }}>
                      No advances issued yet.
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
