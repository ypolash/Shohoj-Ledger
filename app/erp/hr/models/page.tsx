"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import styles from './models.module.css';

interface ModelTalent {
  id: string;
  employeeId?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  agency?: string;
  category?: string;
  rate: number;
  status: string;
  height?: string;
  measurements?: string;
  portfolioUrl?: string;
  notes?: string;
  activeProjectsCount?: number;
  joinedAt?: string;
}

const EMPTY_FORM = {
  id: '',
  name: '',
  agency: 'Independent / Freelance',
  category: 'Commercial & Fashion',
  rate: '3000',
  email: '',
  phone: '',
  height: `5'8"`,
  measurements: '34-26-36',
  portfolioUrl: '',
  status: 'ACTIVE',
  notes: ''
};

const CATEGORIES = [
  'Commercial & Fashion',
  'E-Commerce & Catalog',
  'Runway & Editorial',
  'Lifestyle & Fitness',
  'Traditional & Bridal',
  'Actor / Extra'
];

export default function ModelsPage() {
  const [models, setModels] = useState<ModelTalent[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BUSY' | 'INACTIVE'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/hr/models');
      if (res.ok) {
        const data = await res.json();
        setModels(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // KPIs
  const stats = useMemo(() => {
    const total = models.length;
    const active = models.filter(m => m.status === 'ACTIVE').length;
    const agenciesCount = new Set(models.map(m => m.agency).filter(Boolean)).size;
    const avgRate = total > 0 ? Math.round(models.reduce((s, m) => s + (m.rate || 0), 0) / total) : 0;
    return { total, active, agenciesCount, avgRate };
  }, [models]);

  // Filtered List
  const filteredModels = useMemo(() => {
    return models.filter(m => {
      const matchSearch = (
        (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.agency || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.category || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.phone || '').toLowerCase().includes(search.toLowerCase())
      );
      const matchCategory = selectedCategory === 'ALL' || m.category === selectedCategory;
      const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [models, search, selectedCategory, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = isEditing ? `/api/hr/models/${form.id}` : '/api/hr/models';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          rate: parseFloat(form.rate) || 0
        })
      });

      if (res.ok) {
        showToast(isEditing ? '✓ Model profile updated' : '🎉 New model talent added successfully!');
        setShowModal(false);
        setForm(EMPTY_FORM);
        fetchModels();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to save model', 'error');
      }
    } catch (e) {
      showToast('Network error saving model', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove model "${name}" from the talent roster?`)) return;
    try {
      const res = await fetch(`/api/hr/models/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Model "${name}" removed`);
        fetchModels();
      }
    } catch (e) {
      showToast('Failed to delete model', 'error');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
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
            <span className={styles.liveBadgeText}>Workforce • Talent Directory</span>
          </div>
          <h1 className={styles.pageTitle}>
            <span className="material-symbols-outlined" style={{ color: '#ec4899', fontSize: '28px' }}>face_3</span>
            Model Talents & Cast
          </h1>
          <p className={styles.pageSubtitle}>
            Manage models, casting profiles, day shoot rates, comp cards, and shoot bookings.
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
            + Add Model
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox} style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
            <span className="material-symbols-outlined">face_3</span>
          </div>
          <div>
            <span className={styles.kpiLabel}>Total Models</span>
            <div className={styles.kpiValue}>{stats.total}</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <div>
            <span className={styles.kpiLabel}>Available For Booking</span>
            <div className={styles.kpiValue} style={{ color: '#34d399' }}>{stats.active}</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox} style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
            <span className="material-symbols-outlined">hub</span>
          </div>
          <div>
            <span className={styles.kpiLabel}>Agencies & Reps</span>
            <div className={styles.kpiValue} style={{ color: '#c084fc' }}>{stats.agenciesCount}</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <span className="material-symbols-outlined">payments</span>
          </div>
          <div>
            <span className={styles.kpiLabel}>Average Shoot Rate</span>
            <div className={styles.kpiValue} style={{ color: '#fbbf24' }}>{formatCurrency(stats.avgRate)}</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className={styles.toolbarCard}>
        <div className={styles.searchWrapper}>
          <span className="material-symbols-outlined" style={{ color: '#94a3b8', fontSize: '18px' }}>search</span>
          <input
            type="text"
            placeholder="Search models by name, agency, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className={styles.filterSelect}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Available</option>
            <option value="INACTIVE">Inactive / Booked</option>
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

      {/* Models List / Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: '32px', color: '#ec4899' }}>progress_activity</span>
          <p style={{ marginTop: '10px', fontSize: '13px' }}>Loading model talent roster...</p>
        </div>
      ) : filteredModels.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#475569' }}>face_3</span>
          <h3 style={{ color: '#f8fafc', fontSize: '16px', margin: '10px 0 6px 0' }}>No Models Found</h3>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 16px 0' }}>Add your first model talent to streamline CRM project shoot assignments.</p>
          <button
            type="button"
            onClick={() => {
              setForm(EMPTY_FORM);
              setIsEditing(false);
              setShowModal(true);
            }}
            className={styles.addBtn}
          >
            + Add Model
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className={styles.cardsGrid}>
          {filteredModels.map((m) => (
            <div key={m.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className={styles.avatarBox}>
                    {m.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <strong style={{ fontSize: '15px', color: '#f8fafc', display: 'block' }}>{m.name}</strong>
                    <span style={{ fontSize: '12px', color: '#f472b6', fontWeight: 600 }}>{m.category || 'Commercial Model'}</span>
                  </div>
                </div>

                <span className={styles.statusBadge} style={{
                  background: m.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: m.status === 'ACTIVE' ? '#34d399' : '#f87171',
                  border: m.status === 'ACTIVE' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                  {m.status === 'ACTIVE' ? '● Available' : '● Inactive'}
                </span>
              </div>

              {/* Agency & Shoot Rate */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Agency / Representation:</span>
                  <span className={styles.agencyBadge}>{m.agency || 'Independent'}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Shoot Day Rate:</span>
                  <strong style={{ fontSize: '14px', color: '#34d399' }}>{formatCurrency(m.rate)}</strong>
                </div>
              </div>

              {/* Physical Specs & Portfolio */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {m.height && (
                  <span className={styles.specBadge}>📏 Height: {m.height}</span>
                )}
                {m.measurements && (
                  <span className={styles.specBadge}>📐 {m.measurements}</span>
                )}
                {m.portfolioUrl && (
                  <a
                    href={m.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'rgba(236, 72, 153, 0.15)',
                      border: '1px solid rgba(236, 72, 153, 0.35)',
                      color: '#f472b6',
                      fontSize: '11px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>photo_library</span>
                    Comp Card / Book
                  </a>
                )}
              </div>

              {/* Footer */}
              <div className={styles.cardFooter}>
                <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {m.phone && <span>📞 {m.phone}</span>}
                  {m.email && <span>✉️ {m.email}</span>}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setForm({
                        id: m.id,
                        name: m.name,
                        agency: m.agency || '',
                        category: m.category || 'Commercial & Fashion',
                        rate: String(m.rate),
                        email: m.email || '',
                        phone: m.phone || '',
                        height: m.height || '',
                        measurements: m.measurements || '',
                        portfolioUrl: m.portfolioUrl || '',
                        status: m.status,
                        notes: m.notes || ''
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
                    title="Edit Model"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(m.id, m.name)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: '#f87171',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                    title="Remove Model"
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
                <th style={{ padding: '12px 16px' }}>Model Name</th>
                <th style={{ padding: '12px 16px' }}>Agency</th>
                <th style={{ padding: '12px 16px' }}>Category</th>
                <th style={{ padding: '12px 16px' }}>Shoot Rate</th>
                <th style={{ padding: '12px 16px' }}>Specs</th>
                <th style={{ padding: '12px 16px' }}>Contact</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredModels.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#f8fafc' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700 }}>{m.name}</td>
                  <td style={{ padding: '12px 16px', color: '#f472b6' }}>{m.agency || 'Independent'}</td>
                  <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{m.category}</td>
                  <td style={{ padding: '12px 16px', color: '#34d399', fontWeight: 700 }}>{formatCurrency(m.rate)}</td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '12px' }}>
                    {m.height && <span>{m.height} </span>}
                    {m.measurements && <span>({m.measurements})</span>}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '12px' }}>
                    <div>{m.phone}</div>
                    <div style={{ fontSize: '11px' }}>{m.email}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={styles.statusBadge} style={{
                      background: m.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: m.status === 'ACTIVE' ? '#34d399' : '#f87171',
                      border: m.status === 'ACTIVE' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                    }}>
                      {m.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setForm({
                          id: m.id,
                          name: m.name,
                          agency: m.agency || '',
                          category: m.category || 'Commercial & Fashion',
                          rate: String(m.rate),
                          email: m.email || '',
                          phone: m.phone || '',
                          height: m.height || '',
                          measurements: m.measurements || '',
                          portfolioUrl: m.portfolioUrl || '',
                          status: m.status,
                          notes: m.notes || ''
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
                      onClick={() => handleDelete(m.id, m.name)}
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

      {/* Add / Edit Model Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <span className="material-symbols-outlined" style={{ color: '#ec4899' }}>
                  {isEditing ? 'edit' : 'face_3'}
                </span>
                {isEditing ? 'Edit Model Profile' : 'Add New Model Talent'}
              </h3>
              <button onClick={() => setShowModal(false)} className={styles.closeBtn}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className={styles.inputGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Model Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zara Ahmed"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Agency / Representative</label>
                  <input
                    type="text"
                    placeholder="e.g. NextGen Models / Independent"
                    value={form.agency}
                    onChange={(e) => setForm({ ...form, agency: e.target.value })}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.inputGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className={styles.input}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Shoot Day Rate (BDT) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 3000"
                    value={form.rate}
                    onChange={(e) => setForm({ ...form, rate: e.target.value })}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.inputGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +880 1800-000000"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. zara@agency.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.inputGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Height</label>
                  <input
                    type="text"
                    placeholder={`e.g. 5'8" (173cm)`}
                    value={form.height}
                    onChange={(e) => setForm({ ...form, height: e.target.value })}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Measurements / Sizes</label>
                  <input
                    type="text"
                    placeholder="e.g. Bust: 34, Waist: 26, Hips: 36"
                    value={form.measurements}
                    onChange={(e) => setForm({ ...form, measurements: e.target.value })}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.inputGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Comp Card / Portfolio Link</label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/... or Instagram URL"
                    value={form.portfolioUrl}
                    onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })}
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
                    <option value="ACTIVE">Available For Booking</option>
                    <option value="INACTIVE">Currently Booked / Inactive</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Casting Notes / Restrictions</label>
                <textarea
                  rows={2}
                  placeholder="Available weekends only, experience in traditional bridal..."
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
                  {submitting ? 'Saving...' : isEditing ? 'Update Model ✓' : '+ Add Model ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
