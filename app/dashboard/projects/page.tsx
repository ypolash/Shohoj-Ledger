"use client";

import { useState, useEffect } from "react";
import styles from "../income/page.module.css"; // Reuse the layout grid styles

type Project = {
  id: string;
  name: string;
  clientName: string | null;
  status: string;
  totalIncome: number;
  totalExpense: number;
  profitability: number;
  createdAt: string;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Layout State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterClient, setFilterClient] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form State
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Derived Metrics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === "ACTIVE").length;
  const completedProjects = projects.filter(p => p.status === "COMPLETED").length;
  const pendingProjects = projects.filter(p => p.status === "PENDING").length; // Assuming 'PENDING' might exist
  const totalProfit = projects.reduce((sum, p) => sum + p.profitability, 0);

  // Unique filters
  const uniqueClients = Array.from(new Set(projects.map(p => p.clientName).filter(Boolean)));

  // Filter & Sort Logic
  let filteredProjects = projects.filter(p => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(searchLower) || 
                          (p.clientName?.toLowerCase() || "").includes(searchLower);
    const matchesStatus = filterStatus === "ALL" || p.status === filterStatus;
    const matchesClient = filterClient === "ALL" || p.clientName === filterClient;
    return matchesSearch && matchesStatus && matchesClient;
  });

  filteredProjects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / itemsPerPage));
  const paginatedProjects = filteredProjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          clientName,
        }),
      });

      if (res.ok) {
        setName("");
        setClientName("");
        setIsModalOpen(false);
        fetchProjects();
      }
    } catch (err) {
      console.error("Failed to create project", err);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        fetchProjects();
        if (selectedProject?.id === id) {
          setSelectedProject({ ...selectedProject, status: newStatus });
        }
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(val);
  };

  const getProfitabilityColor = (val: number) => {
    if (val > 0) return "var(--success)";
    if (val < 0) return "var(--danger)";
    return "var(--text-muted)";
  };

  const openNewProjectModal = () => {
    setName("");
    setClientName("");
    setIsModalOpen(true);
  };

  return (
    <div className="animate-fade-in container" style={{ maxWidth: '1400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <h1 style={{ margin: 0 }}>Project Management</h1>
        <button onClick={openNewProjectModal} className="btn btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          New Project
        </button>
      </div>

      <div className={styles.container}>
        {/* Top Section Metrics */}
        <div className={styles.metricsGrid}>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Total Projects</div>
            <div className={styles.metricValue}>{totalProjects}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Active Projects</div>
            <div className={styles.metricValue} style={{ color: 'var(--primary)' }}>{activeProjects}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Completed Projects</div>
            <div className={styles.metricValue} style={{ color: 'var(--success)' }}>{completedProjects}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Pending Projects</div>
            <div className={styles.metricValue} style={{ color: 'var(--warning)' }}>{pendingProjects}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Total Budget</div>
            <div className={styles.metricValue} style={{ color: 'var(--text-muted)' }}>{formatCurrency(0)}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Total Profit</div>
            <div className={styles.metricValue} style={{ color: getProfitabilityColor(totalProfit) }}>{formatCurrency(totalProfit)}</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          {/* Filters Section */}
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup} style={{ flex: 2 }}>
              <label className="label">Search Projects</label>
              <input 
                type="text" 
                className="input" 
                placeholder="Search by project or client name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Status</label>
              <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Client</label>
              <select className="input" value={filterClient} onChange={(e) => setFilterClient(e.target.value)}>
                <option value="ALL">All Clients</option>
                {uniqueClients.map((c, i) => <option key={i} value={c as string}>{c}</option>)}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Category</label>
              <select className="input" disabled>
                <option>All Categories</option>
              </select>
            </div>
            <div className={styles.filterGroup} style={{ flex: 'none', paddingBottom: '2px' }}>
              <button className="btn btn-secondary" onClick={() => window.print()}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                Export
              </button>
            </div>
          </div>

          {/* Projects Table */}
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Client</th>
                  <th>Category</th>
                  <th>Manager</th>
                  <th>Start Date</th>
                  <th style={{ textAlign: 'right' }}>Budget</th>
                  <th style={{ textAlign: 'right' }}>Revenue</th>
                  <th style={{ textAlign: 'right' }}>Profit</th>
                  <th style={{ textAlign: 'center' }}>Progress</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={11} style={{ textAlign: 'center' }}>Loading...</td></tr>
                ) : paginatedProjects.length > 0 ? (
                  paginatedProjects.map((proj) => (
                    <tr key={proj.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedProject(proj)}>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{proj.name}</td>
                      <td>{proj.clientName || '-'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>-</td>
                      <td style={{ color: 'var(--text-muted)' }}>-</td>
                      <td>{new Date(proj.createdAt).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>-</td>
                      <td style={{ textAlign: 'right', color: "var(--success)" }}>+{formatCurrency(proj.totalIncome)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: getProfitabilityColor(proj.profitability) }}>
                        {proj.profitability > 0 ? '+' : ''}{formatCurrency(proj.profitability)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: proj.status === 'COMPLETED' ? '100%' : '50%', height: '100%', background: proj.status === 'COMPLETED' ? 'var(--success)' : 'var(--primary)' }}></div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`${styles.badge} ${proj.status === 'ACTIVE' ? styles['badge-partial'] : styles['badge-paid']}`}>
                          {proj.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                           <button onClick={(e) => { e.stopPropagation(); setSelectedProject(proj); }} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>Details</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} style={{ textAlign: "center", padding: "var(--spacing-6)" }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'var(--text-muted)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5 }}>folder_open</span>
                        <p>No projects found matching your criteria.</p>
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
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredProjects.length)} of {filteredProjects.length} entries
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

      {/* New Project Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Start New Project</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className="label">Project Name</label>
                <input required className="input" placeholder="e.g. Q3 Marketing Campaign" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className={styles.formGroup}>
                <label className="label">Client Name (Optional)</label>
                <input className="input" placeholder="e.g. Acme Corp" value={clientName} onChange={(e) => setClientName(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: 'var(--spacing-4)' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Create Project
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Details Modal/Drawer */}
      {selectedProject && (
        <div className={styles.modalOverlay} onClick={() => setSelectedProject(null)}>
          <div className={styles.modalContent} style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 style={{ margin: 0 }}>{selectedProject.name}</h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
                  Client: {selectedProject.clientName || 'Internal'} • Started: {new Date(selectedProject.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button onClick={() => setSelectedProject(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
              <div style={{ padding: 'var(--spacing-4)', background: 'var(--surface-light)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Revenue</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(selectedProject.totalIncome)}</div>
              </div>
              <div style={{ padding: 'var(--spacing-4)', background: 'var(--surface-light)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Expenses</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--danger)' }}>{formatCurrency(selectedProject.totalExpense)}</div>
              </div>
              <div style={{ padding: 'var(--spacing-4)', background: 'var(--surface-light)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Profitability</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: getProfitabilityColor(selectedProject.profitability) }}>{formatCurrency(selectedProject.profitability)}</div>
              </div>
            </div>

            <div style={{ marginBottom: 'var(--spacing-6)' }}>
              <h4 style={{ marginBottom: 'var(--spacing-4)' }}>Project Actions & Status</h4>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span className={`${styles.badge} ${selectedProject.status === 'ACTIVE' ? styles['badge-partial'] : styles['badge-paid']}`}>
                  Current Status: {selectedProject.status}
                </span>
                
                {selectedProject.status === 'ACTIVE' && (
                  <button onClick={() => updateStatus(selectedProject.id, "COMPLETED")} className="btn btn-secondary">
                    Mark as Completed
                  </button>
                )}
                {selectedProject.status === 'COMPLETED' && (
                  <button onClick={() => updateStatus(selectedProject.id, "ACTIVE")} className="btn btn-secondary">
                    Reopen Project
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: 'var(--spacing-6)', paddingTop: 'var(--spacing-4)', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedProject(null)} style={{ flex: 1 }}>
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
