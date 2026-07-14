"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Income = {
  id: string;
  category: string;
  source: string | null;
  amount: string;
  received: string;
  paymentStatus: string;
  shareable: boolean;
  description: string | null;
  createdAt: string;
};

export default function IncomePage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [received, setReceived] = useState("");
  const [shareable, setShareable] = useState(true);
  const [description, setDescription] = useState("");

  const fetchData = async () => {
    try {
      const [incRes, catRes] = await Promise.all([
        fetch("/api/income"),
        fetch("/api/income-categories")
      ]);
      const [incData, catData] = await Promise.all([
        incRes.json(),
        catRes.json()
      ]);
      setIncomes(incData);
      setCategories(catData);
      // Auto-select first category if available and not set
      if (catData.length > 0 && !category) {
        setCategory(catData[0].name);
      }
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
      const res = await fetch("/api/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          source,
          amount,
          received,
          shareable,
          description,
        }),
      });

      if (res.ok) {
        // Reset form
        setSource("");
        setAmount("");
        setReceived("");
        setShareable(true);
        setDescription("");
        // Refresh list
        fetchData();
      }
    } catch (err) {
      console.error("Failed to submit income", err);
    }
  };

  const formatCurrency = (val: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(parseFloat(val));
  };

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: "var(--spacing-6)" }}>Income Management</h1>

      <div className={styles.grid}>
        {/* Record Income Form */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
            <h3 style={{ margin: 0 }}>Record New Income</h3>
            <Link href="/dashboard/income-categories" style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>Manage Categories &rarr;</Link>
          </div>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className="label">Category</label>
              {categories.length > 0 ? (
                <select required className="input" value={category} onChange={(e) => setCategory(e.target.value)} style={{ appearance: 'auto' }}>
                  <option value="" disabled>Select a category</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              ) : (
                <input required className="input" placeholder="e.g. Client Project, Retainer" value={category} onChange={(e) => setCategory(e.target.value)} />
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label className="label">Source (Client/Entity)</label>
              <input className="input" placeholder="e.g. Acme Corp" value={source} onChange={(e) => setSource(e.target.value)} />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className="label">Total Amount</label>
                <input required type="number" step="0.01" className="input" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className="label">Amount Received</label>
                <input required type="number" step="0.01" className="input" placeholder="0.00" value={received} onChange={(e) => setReceived(e.target.value)} />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" checked={shareable} onChange={(e) => setShareable(e.target.checked)} />
                Shareable (Included in settlement)
              </label>
            </div>

            <div className={styles.formGroup}>
              <label className="label">Description / Notes</label>
              <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Record Income
            </button>
          </form>
        </div>

        {/* Income List */}
        <div className="glass-card" style={{ overflowX: "auto" }}>
          <h3 style={{ marginBottom: "var(--spacing-4)" }}>Recent Incomes</h3>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Source</th>
                  <th>Amount</th>
                  <th>Received</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {incomes.map((inc) => (
                  <tr key={inc.id}>
                    <td>{new Date(inc.createdAt).toLocaleDateString()}</td>
                    <td>{inc.category} {inc.shareable ? '🔹' : ''}</td>
                    <td>{inc.source || '-'}</td>
                    <td>{formatCurrency(inc.amount)}</td>
                    <td>{formatCurrency(inc.received)}</td>
                    <td>
                      <span className={`${styles.badge} ${styles['badge-' + inc.paymentStatus.toLowerCase()]}`}>
                        {inc.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
                {incomes.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "var(--spacing-4)" }}>
                      No income recorded yet.
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
