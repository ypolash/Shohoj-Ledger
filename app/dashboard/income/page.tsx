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

type IncomeCategory = {
  id: string;
  name: string;
  createdAt: string;
};

export default function IncomePage() {
  const [activeTab, setActiveTab] = useState<"income" | "categories">("income");

  const [incomes, setIncomes] = useState<Income[]>([]);
  const [categories, setCategories] = useState<IncomeCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Income Form State
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [received, setReceived] = useState("");
  const [shareable, setShareable] = useState(true);
  const [description, setDescription] = useState("");

  // Category Form State
  const [catName, setCatName] = useState("");
  const [catSubmitting, setCatSubmitting] = useState(false);
  const [catError, setCatError] = useState("");

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
      const validIncData = Array.isArray(incData) ? incData : [];
      const validCatData = Array.isArray(catData) ? catData : [];
      setIncomes(validIncData);
      setCategories(validCatData);
      // Auto-select first category if available and not set
      if (validCatData.length > 0 && !category) {
        setCategory(validCatData[0].name);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleIncomeSubmit = async (e: React.FormEvent) => {
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

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatSubmitting(true);
    setCatError("");

    try {
      const res = await fetch("/api/income-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create category");
      }

      setCatName("");
      fetchData();
    } catch (err: any) {
      setCatError(err.message);
    } finally {
      setCatSubmitting(false);
    }
  };

  const handleCategoryDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const res = await fetch(`/api/income-categories?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchData();
      } else {
        alert("Failed to delete category");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting category");
    }
  };

  const formatCurrency = (val: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(parseFloat(val));
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: "var(--spacing-6)" }}>
        <h1 style={{ margin: 0 }}>Income Management</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        <button 
          onClick={() => setActiveTab('income')}
          style={{ 
            background: 'none', 
            border: 'none', 
            padding: '12px 16px', 
            color: activeTab === 'income' ? 'var(--primary)' : 'var(--text-muted)', 
            borderBottom: activeTab === 'income' ? '2px solid var(--primary)' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'income' ? 600 : 400
          }}
        >
          New Income & Ledger
        </button>
        <button 
          onClick={() => setActiveTab('categories')}
          style={{ 
            background: 'none', 
            border: 'none', 
            padding: '12px 16px', 
            color: activeTab === 'categories' ? 'var(--primary)' : 'var(--text-muted)', 
            borderBottom: activeTab === 'categories' ? '2px solid var(--primary)' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'categories' ? 600 : 400
          }}
        >
          Categories
        </button>
      </div>

      {/* Tab: Income */}
      {activeTab === 'income' && (
        <div className={styles.grid}>
          {/* Record Income Form */}
          <div className="glass-card">
            <h3 style={{ marginBottom: 'var(--spacing-4)' }}>Record New Income</h3>
            <form onSubmit={handleIncomeSubmit} className={styles.form}>
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
          <div className="glass-card" style={{ overflowX: "auto", height: 'fit-content' }}>
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
      )}

      {/* Tab: Categories */}
      {activeTab === 'categories' && (
        <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '1fr 2fr' }}>
          {/* Create Form */}
          <div className="glass-card" style={{ height: 'fit-content' }}>
            <h3 style={{ marginBottom: '16px' }}>Add New Category</h3>
            
            {catError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                {catError}
              </div>
            )}

            <form onSubmit={handleCategorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Category Name</label>
                <input 
                  required 
                  className="input" 
                  placeholder="e.g. Consulting, Subscription" 
                  value={catName} 
                  onChange={(e) => setCatName(e.target.value)} 
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={catSubmitting}>
                {catSubmitting ? "Adding..." : "Add Category"}
              </button>
            </form>
          </div>

          {/* List */}
          <div className="glass-card" style={{ height: 'fit-content' }}>
            <h3 style={{ marginBottom: '16px' }}>Existing Categories</h3>
            
            {loading ? (
              <p style={{ color: 'var(--text-muted)' }}>Loading categories...</p>
            ) : categories.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No categories found. Default categories will be generated.</p>
            ) : (
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px', fontWeight: 'normal' }}>Name</th>
                    <th style={{ padding: '12px', fontWeight: 'normal', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{cat.name}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleCategoryDelete(cat.id)}
                          className="btn btn-danger"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
