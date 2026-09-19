"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import styles from './freelance.module.css';

interface Freelancer {
  id: string;
  employeeId?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role: string;
  department?: string;
  rate: number;
  status: string;
  skills: string[];
  portfolioUrl?: string;
  notes?: string;
  activeProjectsCount?: number;
  joinedAt?: string;
}

const EMPTY_FORM = {
  id: '',
  name: '',
  role: 'Freelance Video Editor',
  rate: '1500',
  email: '',
  phone: '',
  skills: 'Premiere Pro, DaVinci Resolve, Color Grading',
  portfolioUrl: '',
  status: 'ACTIVE',
  notes: ''
};

export default function FreelancePage() {
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BUSY' | 'INACTIVE'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchFreelancers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/hr/freelancers');
      if (res.ok) {
        const data = await res.json();
        setFreelancers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFreelancers();
  }, [fetchFreelancers]);

  // KPIs
  const stats = useMemo(() => {
    const total = freelancers.length;
    const active = freelancers.filter(f => f.status === 'ACTIVE').length;
    const busy = freelancers.filter(f => (f.activeProjectsCount || 0) > 0).length;
    const avgRate = total > 0 ? Math.round(freelancers.reduce((s, f) => s + (f.rate || 0), 0) / total) : 0;
    return { total, active, busy, avgRate };
  }, [freelancers]);

  // Roles list
  const rolesList = useMemo(() => {
    const set = new Set<string>();
    freelancers.forEach(f => { if (f.role) set.add(f.role); });
    return Array.from(set);
  }, [freelancers]);

  // Filtered List
  const filteredFreelancers = useMemo(() => {
    return freelancers.filter(f => {
      const matchSearch = (
        (f.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (f.role || '').toLowerCase().includes(search.toLowerCase()) ||
        (f.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (f.skills || []).some(s => s.toLowerCase().includes(search.toLowerCase()))
      );
      const matchRole = selectedRole === 'ALL' || f.role === selectedRole;
      const matchStatus = statusFilter === 'ALL' || f.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [freelancers, search, selectedRole, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = isEditing ? `/api/hr/freelancers/${form.id}` : '/api/hr/freelancers';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          rate: parseFloat(form.rate) || 0,
          skills: form.skills.split(',').map(s => s.trim()).filter(Boolean)
        })
      });

      if (res.ok) {
        showToast(isEditing ? '✓ Freelancer updated successfully' : '🎉 New freelancer added successfully!');
        setShowModal(false);
        setForm(EMPTY_FORM);
        fetchFreelancers();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to save freelancer', 'error');
      }
    } catch (e) {
      showToast('Network error saving freelancer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove freelancer "${name}"?`)) return;
    try {
      const res = await fetch(`/api/hr/freelancers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Freelancer "${name}" removed`);
        fetchFreelancers();
      }
    } catch (e) {
      showToast('Failed to delete freelancer', 'error');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className={styles.container}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: '12px 20px',
          borderRadius: '12px',
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff',
          fontWeight: 700,
          fontSize: '13px',
          zIndex: 9999,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}>
          {toast.message}
        </div>
      )}

      {/* Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.liveBadgeRow}>
            <span className={styles.livePulseDot} />
            <span className={styles.liveBadgeText}>Workforce • Creative Talent Network</span>
          </div>
          <h1 className={styles.pageTitle}>
            <span className="material-symbols-outlined" style={{ color: '#3b82f6', fontSize: '28px' }}>laptop_chromebook</span>
            Freelance Talents & Contractors
          </h1>
          <p className={styles.pageSubtitle}>
            Manage freelance video editors, motion graphic artists, colorists, and project-based creative staff.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={() => {
              setForm(EMPTY_FORM);
              setIsEditing(false);
              setShowModal(true);
            }}
            className={styles.addBtn}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
            + Add Freelancer
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <span className="material-symbols-outlined">engineering</span>
          </div>
          <div>
            <span className={styles.kpiLabel}>Total Freelancers</span>
            <div className={styles.kpiValue}>{stats.total}</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <div>
            <span className={styles.kpiLabel}>Available Talents</span>
            <div className={styles.kpiValue} style={{ color: '#34d399' }}>{stats.active}</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <span className="material-symbols-outlined">work</span>
          </div>
          <div>
            <span className={styles.kpiLabel}>On Live Projects</span>
            <div className={styles.kpiValue} style={{ color: '#fbbf24' }}>{stats.busy}</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox} style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
            <span className="material-symbols-outlined">payments</span>
          </div>
          <div>
            <span className={styles.kpiLabel}>Average Project Rate</span>
            <div className={styles.kpiValue} style={{ color: '#c084fc' }}>{formatCurrency(stats.avgRate)}</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className={styles.toolbarCard}>
        <div className={styles.searchWrapper}>
          <span className="material-symbols-outlined" style={{ color: '#94a3b8', fontSize: '18px' }}>search</span>
          <input
            type="text"
            placeholder="Search freelancers by name, skill, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="ALL">All Specialties</option>
            {rolesList.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className={styles.filterSelect}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Available</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`${styles.viewToggleBtn} ${viewMode === 'grid' ? styles.viewToggleBtnActive : ''}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>grid_view</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`${styles.viewToggleBtn} ${viewMode === 'table' ? styles.viewToggleBtnActive : ''}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>table_rows</span>
            </button>
          </div>
        </div>
      </div>

      {/* Freelancers List / Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: '32px', color: '#3b82f6' }}>progress_activity</span>
          <p style={{ marginTop: '10px', fontSize: '13px' }}>Loading freelance talent roster...</p>
        </div>
      ) : filteredFreelancers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#475569' }}>person_off</span>
          <h3 style={{ color: '#f8fafc', fontSize: '16px', margin: '10px 0 6px 0' }}>No Freelancers Found</h3>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 16px 0' }}>Add your first freelance video editor or creative contractor.</p>
          <button
            type="button"
            onClick={() => {
              setForm(EMPTY_FORM);
              setIsEditing(false);
              setShowModal(true);
            }}
            className={styles.addBtn}
          >
            + Add Freelancer
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className={styles.cardsGrid}>
          {filteredFreelancers.map((f) => (
            <div key={f.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className={styles.avatarBox}>
                    {f.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <strong style={{ fontSize: '15px', color: '#f8fafc', display: 'block' }}>{f.name}</strong>
                    <span style={{ fontSize: '12px', color: '#60a5fa', fontWeight: 600 }}>{f.role}</span>
                  </div>
                </div>

                <span className={styles.statusBadge} style={{
                  background: f.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: f.status === 'ACTIVE' ? '#34d399' : '#f87171',
                  border: f.status === 'ACTIVE' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                  {f.status === 'ACTIVE' ? '● Available' : '● Inactive'}
                </span>
              </div>

              {/* Rate & Contact */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Agreed Standard Rate:</span>
                  <strong style={{ fontSize: '14px', color: '#34d399' }}>{formatCurrency(f.rate)}</strong>
                </div>
                {f.portfolioUrl && (
                  <a
                    href={f.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.35)',
                      color: '#60a5fa',
                      fontSize: '11px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>open_in_new</span>
                    Showreel
                  </a>
                )}
              </div>

              {/* Skills */}
              {f.skills && f.skills.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {f.skills.map((skill, i) => (
                    <span key={i} className={styles.skillPill}>{skill}</span>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className={styles.cardFooter}>
                <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {f.phone && <span>📞 {f.phone}</span>}
                  {f.email && <span>✉️ {f.email}</span>}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setForm({
                        id: f.id,
                        name: f.name,
                        role: f.role,
                        rate: String(f.rate),
                        email: f.email || '',
                        phone: f.phone || '',
                        skills: (f.skills || []).join(', '),
                        portfolioUrl: f.portfolioUrl || '',
                        status: f.status,
                        notes: f.notes || ''
                      });
                      setIsEditing(true);
                      setShowModal(true);
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#cbd5e1',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                    title="Edit Freelancer"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(f.id, f.name)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: '#f87171',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                    title="Remove Freelancer"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div style={{ background: 'var(--surface-card, #0f172a)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                <th style={{ padding: '12px 16px' }}>Freelancer</th>
                <th style={{ padding: '12px 16px' }}>Specialty</th>
                <th style={{ padding: '12px 16px' }}>Rate</th>
                <th style={{ padding: '12px 16px' }}>Skills</th>
                <th style={{ padding: '12px 16px' }}>Contact</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFreelancers.map(f => (
                <tr key={f.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#f8fafc' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700 }}>{f.name}</td>
                  <td style={{ padding: '12px 16px', color: '#60a5fa' }}>{f.role}</td>
                  <td style={{ padding: '12px 16px', color: '#34d399', fontWeight: 700 }}>{formatCurrency(f.rate)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {(f.skills || []).slice(0, 3).map((s, i) => (
                        <span key={i} className={styles.skillPill}>{s}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '12px' }}>
                    <div>{f.phone}</div>
                    <div style={{ fontSize: '11px' }}>{f.email}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={styles.statusBadge} style={{
                      background: f.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: f.status === 'ACTIVE' ? '#34d399' : '#f87171',
                      border: f.status === 'ACTIVE' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                    }}>
                      {f.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setForm({
                          id: f.id,
                          name: f.name,
                          role: f.role,
                          rate: String(f.rate),
                          email: f.email || '',
                          phone: f.phone || '',
                          skills: (f.skills || []).join(', '),
                          portfolioUrl: f.portfolioUrl || '',
                          status: f.status,
                          notes: f.notes || ''
                        });
                        setIsEditing(true);
                        setShowModal(true);
                      }}
                      style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', marginRight: '8px' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(f.id, f.name)}
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Freelancer Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <span className="material-symbols-outlined" style={{ color: '#3b82f6' }}>
                  {isEditing ? 'edit' : 'person_add'}
                </span>
                {isEditing ? 'Edit Freelancer Profile' : 'Add New Freelancer'}
              </h3>
              <button onClick={() => setShowModal(false)} className={styles.closeBtn}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className={styles.inputGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Niamul Hasan"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Primary Role / Specialty *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead Video Editor, Colorist"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.inputGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Standard Rate (BDT) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1500"
                    value={form.rate}
                    onChange={(e) => setForm({ ...form, rate: e.target.value })}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +880 1700-000000"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.inputGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. niam@shohoj.local"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Availability Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className={styles.input}
                  >
                    <option value="ACTIVE">Available / Active</option>
                    <option value="INACTIVE">On Break / Inactive</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Skills & Software (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Premiere Pro, DaVinci Resolve, After Effects, Sound Design"
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Portfolio / Showreel URL (Frame.io, Drive, Behance)</label>
                <input
                  type="url"
                  placeholder="https://frame.io/... or https://behance.net/..."
                  value={form.portfolioUrl}
                  onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Internal Notes / Bio</label>
                <textarea
                  rows={2}
                  placeholder="Experienced in fashion commercials, turnaround 24 hours..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className={styles.input}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={styles.submitBtn}
                >
                  {submitting ? 'Saving...' : isEditing ? 'Update Freelancer ✓' : '+ Add Freelancer ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
