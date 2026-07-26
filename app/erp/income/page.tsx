"use client";

import { useState, useEffect } from "react";
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

  // Layout State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Income Form State
  const [editingId, setEditingId] = useState<string | null>(null);
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

  // Derived Metrics
  const totalIncome = incomes.reduce((sum, inc) => sum + parseFloat(inc.amount), 0);
  const totalReceived = incomes.reduce((sum, inc) => sum + parseFloat(inc.received), 0);
  const totalPending = totalIncome - totalReceived;
  const shareableIncome = incomes.filter(inc => inc.shareable).reduce((sum, inc) => sum + parseFloat(inc.amount), 0);
  const nonShareableIncome = totalIncome - shareableIncome;
  
  const thisMonthIncome = incomes.filter(inc => {
    const d = new Date(inc.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, inc) => sum + parseFloat(inc.amount), 0);

  // Filter & Sort Logic
  let filteredIncomes = incomes.filter(inc => {
    const matchesSearch = inc.source?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          inc.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = filterCategory === "ALL" || inc.category === filterCategory;
    const matchesStatus = filterStatus === "ALL" || inc.paymentStatus === filterStatus;
    return matchesSearch && matchesCat && matchesStatus;
  });

  filteredIncomes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredIncomes.length / itemsPerPage));
  const paginatedIncomes = filteredIncomes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/income?id=${editingId}` : "/api/income";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
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
        setEditingId(null);
        setSource("");
        setAmount("");
        setReceived("");
        setShareable(true);
        setDescription("");
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error("Failed to submit income", err);
    }
  };

  const handleIncomeDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this income record?")) return;
    try {
      const res = await fetch(`/api/income?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
      else alert("Failed to delete income");
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (inc: Income) => {
    setEditingId(inc.id);
    setCategory(inc.category);
    setSource(inc.source || "");
    setAmount(inc.amount);
    setReceived(inc.received);
    setShareable(inc.shareable);
    setDescription(inc.description || "");
    setIsModalOpen(true);
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
    }
  };

  const formatCurrency = (val: string | number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val));
  };

  const openNewIncomeModal = () => {
    setEditingId(null);
    setSource("");
    setAmount("");
    setReceived("");
    setShareable(true);
    setDescription("");
    setIsModalOpen(true);
  };

  return (
    <div className="animate-fade-in container" style={{ maxWidth: '1400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <h1 style={{ margin: 0 }}>Income Management</h1>
        <button onClick={openNewIncomeModal} className="btn btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          Add Income
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        <button 
          onClick={() => setActiveTab('income')}
          style={{ 
            background: 'none', border: 'none', padding: '12px 16px', 
            color: activeTab === 'income' ? 'var(--primary)' : 'var(--text-muted)', 
            borderBottom: activeTab === 'income' ? '2px solid var(--primary)' : '2px solid transparent',
            cursor: 'pointer', fontSize: '16px', fontWeight: activeTab === 'income' ? 600 : 400
          }}
        >
          Income Ledger
        </button>
        <button 
          onClick={() => setActiveTab('categories')}
          style={{ 
            background: 'none', border: 'none', padding: '12px 16px', 
            color: activeTab === 'categories' ? 'var(--primary)' : 'var(--text-muted)', 
            borderBottom: activeTab === 'categories' ? '2px solid var(--primary)' : '2px solid transparent',
            cursor: 'pointer', fontSize: '16px', fontWeight: activeTab === 'categories' ? 600 : 400
          }}
        >
          Categories
        </button>
      </div>

      {/* Tab: Income */}
      {activeTab === 'income' && (
        <div className={styles.container}>
          
          {/* Top Section Metrics */}
          <div className={styles.metricsGrid}>
            <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
              <div className={styles.metricTitle}>Total Income</div>
              <div className={styles.metricValue} style={{ color: 'var(--primary)' }}>{formatCurrency(totalIncome)}</div>
            </div>
            <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
              <div className={styles.metricTitle}>Received Amount</div>
              <div className={styles.metricValue} style={{ color: 'var(--success)' }}>{formatCurrency(totalReceived)}</div>
            </div>
            <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
              <div className={styles.metricTitle}>Pending / Due</div>
              <div className={styles.metricValue} style={{ color: 'var(--warning)' }}>{formatCurrency(totalPending)}</div>
            </div>
            <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
              <div className={styles.metricTitle}>This Month</div>
              <div className={styles.metricValue}>{formatCurrency(thisMonthIncome)}</div>
            </div>
            <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
              <div className={styles.metricTitle}>Shareable</div>
              <div className={styles.metricValue}>{formatCurrency(shareableIncome)}</div>
            </div>
            <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
              <div className={styles.metricTitle}>Non-shareable</div>
              <div className={styles.metricValue}>{formatCurrency(nonShareableIncome)}</div>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
            
            {/* Filters Section */}
            <div className={styles.filtersRow}>
              <div className={styles.filterGroup} style={{ flex: 2 }}>
                <label className="label">Search</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Search by source or category..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className={styles.filterGroup}>
                <label className="label">Category</label>
                <select className="input" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                  <option value="ALL">All Categories</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label className="label">Status</label>
                <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="ALL">All Statuses</option>
                  <option value="PAID">Paid</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="UNPAID">Unpaid</option>
                </select>
              </div>
              <div className={styles.filterGroup} style={{ flex: 'none', paddingBottom: '2px' }}>
                <button className="btn btn-secondary" onClick={() => window.print()}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                  Export
                </button>
              </div>
            </div>

            {/* Income Table */}
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Source</th>
                    <th style={{ textAlign: 'right' }}>Total Amount</th>
                    <th style={{ textAlign: 'right' }}>Received</th>
                    <th style={{ textAlign: 'right' }}>Due</th>
                    <th style={{ textAlign: 'center' }}>Shareable</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={9} style={{ textAlign: 'center' }}>Loading...</td></tr>
                  ) : paginatedIncomes.length > 0 ? (
                    paginatedIncomes.map((inc) => {
                      const total = parseFloat(inc.amount);
                      const receivedAmount = parseFloat(inc.received);
                      const due = total - receivedAmount;
                      
                      return (
                        <tr key={inc.id}>
                          <td>{new Date(inc.createdAt).toLocaleDateString()}</td>
                          <td style={{ fontWeight: 500 }}>{inc.category}</td>
                          <td>{inc.source || '-'}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(total)}</td>
                          <td style={{ textAlign: 'right', color: 'var(--success)' }}>{formatCurrency(receivedAmount)}</td>
                          <td style={{ textAlign: 'right', color: due > 0 ? 'var(--warning)' : 'inherit' }}>{formatCurrency(due)}</td>
                          <td style={{ textAlign: 'center' }}>
                            {inc.shareable ? (
                              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '18px' }}>check_circle</span>
                            ) : (
                              <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', fontSize: '18px' }}>cancel</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`${styles.badge} ${styles['badge-' + inc.paymentStatus.toLowerCase()]}`}>
                              {inc.paymentStatus}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button onClick={() => handleEditClick(inc)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>Edit</button>
                              <button onClick={() => handleIncomeDelete(inc.id)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '12px' }}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} style={{ textAlign: "center", padding: "var(--spacing-6)" }}>
                        No income records found matching your filters.
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
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredIncomes.length)} of {filteredIncomes.length} entries
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
      )}

      {/* Tab: Categories */}
      {activeTab === 'categories' && (
        <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '1fr 2fr' }}>
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
                <input required className="input" placeholder="e.g. Consulting, Subscription" value={catName} onChange={(e) => setCatName(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={catSubmitting}>
                {catSubmitting ? "Adding..." : "Add Category"}
              </button>
            </form>
          </div>

          <div className="glass-card" style={{ height: 'fit-content' }}>
            <h3 style={{ marginBottom: '16px' }}>Existing Categories</h3>
            {loading ? (
              <p style={{ color: 'var(--text-muted)' }}>Loading categories...</p>
            ) : categories.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No categories found.</p>
            ) : (
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-light)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px', fontWeight: 'normal' }}>Name</th>
                    <th style={{ padding: '12px', fontWeight: 'normal', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{cat.name}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button onClick={() => handleCategoryDelete(cat.id)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '12px' }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Income Form Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>{editingId ? "Update Income" : "Record New Income"}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleIncomeSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className="label">Category</label>
                {categories.length > 0 ? (
                  <select required className="input" value={category} onChange={(e) => setCategory(e.target.value)} style={{ appearance: 'auto' }}>
                    <option value="" disabled>Select a category</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                ) : (
                  <input required className="input" placeholder="e.g. Client Project" value={category} onChange={(e) => setCategory(e.target.value)} />
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

              <div style={{ display: 'flex', gap: '16px', marginTop: 'var(--spacing-4)' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingId ? "Save Changes" : "Record Income"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
