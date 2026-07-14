"use client";

import { useState, useEffect } from "react";
import styles from "../income/page.module.css";

type Settlement = {
  id: string;
  period: string;
  status: string;
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

  // Preview State
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [preview, setPreview] = useState<any>(null);

  const fetchSettlements = async () => {
    try {
      const res = await fetch("/api/settlements");
      const data = await res.json();
      setSettlements(data);
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
    try {
      const res = await fetch(`/api/settlements?month=${month}&year=${year}`);
      const data = await res.json();
      setPreview(data);
    } catch (err) {
      console.error("Failed to generate preview", err);
    }
  };

  const handleCreateSettlement = async () => {
    if (!preview) return;
    try {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preview),
      });

      if (res.ok) {
        setPreview(null);
        fetchSettlements();
      }
    } catch (err) {
      console.error("Failed to save settlement", err);
    }
  };

  const handleExecuteSettlement = async (id: string) => {
    try {
      const res = await fetch("/api/settlements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "EXECUTE" }),
      });

      if (res.ok) {
        fetchSettlements();
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
      } else {
        alert("Failed to delete settlement");
      }
    } catch (err) {
      console.error("Error deleting settlement", err);
    }
  };

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val));
  };

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: "var(--spacing-6)" }}>Monthly Settlement Engine</h1>

      <div className={styles.grid}>
        {/* Settlement Generator */}
        <div className="glass-card">
          <h3 style={{ marginBottom: "var(--spacing-4)" }}>Calculate Settlement</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "var(--spacing-4)" }}>
            Select a month and year to calculate the net profit and distribution shares. This pulls only PAID/PARTIAL incomes and APPROVED expenses.
          </p>
          <form onSubmit={handlePreview} className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className="label">Month</label>
                <select required className="input" value={month} onChange={(e) => setMonth(e.target.value)}>
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

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Generate Preview
            </button>
          </form>

          {preview && (
            <div style={{ marginTop: "var(--spacing-6)", padding: "var(--spacing-4)", background: "rgba(0,0,0,0.2)", borderRadius: "var(--radius-md)" }}>
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

              <button onClick={handleCreateSettlement} className="btn btn-secondary" style={{ width: '100%' }}>
                Save Settlement Record
              </button>
            </div>
          )}
        </div>

        {/* Settlement History */}
        <div className="glass-card" style={{ overflowX: "auto" }}>
          <h3 style={{ marginBottom: "var(--spacing-4)" }}>Settlement History</h3>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Net Profit</th>
                  <th>Company (20%)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: "500" }}>{s.period}</td>
                    <td>{formatCurrency(Number(s.totalIncome) - Number(s.totalExpenses))}</td>
                    <td style={{ color: "var(--primary)" }}>{formatCurrency(s.companyShare)}</td>
                    <td>
                      <span className={`${styles.badge} ${s.status === 'PENDING' ? styles['badge-partial'] : styles['badge-paid']}`}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: '8px' }}>
                      {s.status === "PENDING" && (
                        <button onClick={() => handleExecuteSettlement(s.id)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px', color: 'var(--success)', borderColor: 'var(--success)' }}>
                          Execute
                        </button>
                      )}
                      <button onClick={() => handleDeleteSettlement(s.id)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {settlements.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "var(--spacing-4)" }}>
                      No settlements recorded yet.
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
