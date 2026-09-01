"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { AdvanceToolbar } from './components/AdvanceToolbar';
import { AdvanceFilters } from './components/AdvanceFilters';
import { AdvanceSearch } from './components/AdvanceSearch';
import { AdvanceTable } from './components/AdvanceTable';
import { AdvanceCard } from './components/AdvanceCard';
import { AdvanceSummary } from './components/AdvanceSummary';
import { AdvanceQuickDrawer } from './components/AdvanceQuickDrawer';
import { UserX, Plus, X, Save, Calendar, User, DollarSign, FileText } from 'lucide-react';

export default function AdvancesPage() {
  const [advances, setAdvances] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickViewAdvance, setQuickViewAdvance] = useState<any | null>(null);

  // Modal state for issue/edit advance
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ memberId: '', amount: '', reason: '', date: new Date().toISOString().split('T')[0] });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Filters & Search
  const [filters, setFilters] = useState({
    query: '',
    memberId: '',
    dateRange: ''
  });

  // View mode & pagination
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [isMobile, setIsMobile] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setViewMode('grid');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchAdvances = useCallback(async () => {
    setIsLoading(true);
    try {
      setError(null);
      const res = await fetch('/api/finance/advances');
      if (res.ok) {
        const data = await res.json();
        setAdvances(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to fetch advances');
      }
    } catch (e: any) {
      setError(e.message || 'Error fetching advances');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/hr/members');
      if (res.ok) {
        const data = await res.json();
        setMembers(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchAdvances();
    fetchMembers();
  }, [fetchAdvances, fetchMembers]);

  const handleFilterChange = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({ query: '', memberId: '', dateRange: '' });
    setPage(1);
  }, []);

  const handleOpenIssueModal = () => {
    setEditingId(null);
    setForm({ 
      memberId: members[0]?.id || '', 
      amount: '', 
      reason: '', 
      date: new Date().toISOString().split('T')[0] 
    });
    setModalError('');
    setShowModal(true);
  };

  const handleEdit = (advance: any) => {
    setForm({
      memberId: advance.memberId || '',
      amount: advance.amount ? String(advance.amount) : '',
      reason: advance.reason || '',
      date: advance.createdAt ? new Date(advance.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setEditingId(advance.id);
    setModalError('');
    setShowModal(true);
  };

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this advance record?')) return;
    try {
      const res = await fetch(`/api/finance/advances/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAdvances();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to delete advance');
      }
    } catch (e) {
      alert('Failed to delete advance');
    }
  }, [fetchAdvances]);

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => fetch(`/api/finance/advances/${id}`, { method: 'DELETE' })));
      fetchAdvances();
    } catch (err) {
      console.error(err);
    }
  }, [fetchAdvances]);

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.memberId) {
      setModalError('Please select a staff member.');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setModalError('Please enter a valid amount.');
      return;
    }

    setSubmitting(true);
    setModalError('');

    try {
      const url = editingId ? `/api/finance/advances/${editingId}` : '/api/finance/advances';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setModalError(data.error || `Failed to ${editingId ? 'update' : 'issue'} advance`);
        return;
      }

      setShowModal(false);
      setEditingId(null);
      fetchAdvances();
    } catch (e: any) {
      setModalError(e.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  // Compute KPI metrics
  const kpiStats = useMemo(() => {
    let totalAmount = 0;
    const memberSet = new Set<string>();

    advances.forEach(adv => {
      totalAmount += Number(adv.amount || 0);
      if (adv.memberId) memberSet.add(adv.memberId);
    });

    return {
      totalAmount,
      totalCount: advances.length,
      uniqueMembersCount: memberSet.size
    };
  }, [advances]);

  // Filtered dataset
  const filteredAdvances = useMemo(() => {
    return advances.filter(adv => {
      // Search query
      if (filters.query) {
        const q = filters.query.toLowerCase();
        const ref = `adv-${(adv.id || '').slice(0, 8)}`.toLowerCase();
        const name = (adv.member?.name || '').toLowerCase();
        const reason = (adv.reason || '').toLowerCase();
        if (!ref.includes(q) && !name.includes(q) && !reason.includes(q)) {
          return false;
        }
      }

      // Member ID filter
      if (filters.memberId && adv.memberId !== filters.memberId) {
        return false;
      }

      // Date Range filter
      if (filters.dateRange) {
        const created = new Date(adv.createdAt);
        const now = new Date();
        if (filters.dateRange === 'this_month') {
          if (created.getMonth() !== now.getMonth() || created.getFullYear() !== now.getFullYear()) {
            return false;
          }
        } else if (filters.dateRange === 'last_month') {
          const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
          const lastYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
          if (created.getMonth() !== lastMonth || created.getFullYear() !== lastYear) {
            return false;
          }
        } else if (filters.dateRange === 'this_year') {
          if (created.getFullYear() !== now.getFullYear()) {
            return false;
          }
        }
      }

      return true;
    });
  }, [advances, filters]);

  // Pagination
  const paginatedAdvances = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAdvances.slice(start, start + pageSize);
  }, [filteredAdvances, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredAdvances.length / pageSize));

  const hasActiveFilters = Boolean(filters.query || filters.memberId || filters.dateRange);

  return (
    <PageContainer>
      {/* Top Toolbar */}
      <AdvanceToolbar
        onIssueAdvance={handleOpenIssueModal}
        onRefresh={fetchAdvances}
        advances={filteredAdvances}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        density={density}
        onDensityChange={setDensity}
      />

      {/* KPI Stat Cards */}
      <AdvanceSummary
        totalAmount={kpiStats.totalAmount}
        totalCount={kpiStats.totalCount}
        uniqueMembersCount={kpiStats.uniqueMembersCount}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Search & Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <AdvanceSearch
            initialValue={filters.query}
            onSearch={(q) => handleFilterChange({ query: q })}
          />
        </div>

        <AdvanceFilters
          members={members}
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
        />

        {/* Content Body */}
        {error ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--danger)', background: 'rgba(239,68,68,0.05)', borderRadius: '12px' }}>
            <p>Error loading advance records: {error}</p>
          </div>
        ) : isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading advances directory...
          </div>
        ) : filteredAdvances.length === 0 ? (
          <div className="glass-card" style={{ 
            padding: '56px 24px', 
            textAlign: 'center', 
            borderRadius: '16px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            background: 'var(--surface-main)',
            border: '1px solid var(--border-main)'
          }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              background: 'var(--surface-hover)', 
              borderRadius: '18px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: '16px',
              border: '1px solid var(--border-main)'
            }}>
              <UserX size={32} color="var(--warning, #f59e0b)" />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px 0' }}>
              {hasActiveFilters ? 'No Advance Records Match Filters' : 'No Staff Advances Recorded'}
            </h3>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 24px 0', maxWidth: '400px', lineHeight: 1.5 }}>
              {hasActiveFilters 
                ? 'Try adjusting your search query, staff member, or date filters.'
                : 'No employee salary or cash advances have been issued yet.'}
            </p>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              {hasActiveFilters && (
                <button 
                  onClick={handleResetFilters}
                  style={{
                    padding: '10px 18px',
                    background: 'var(--surface-hover)',
                    border: '1px solid var(--border-main)',
                    borderRadius: '8px',
                    color: 'var(--text-main)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Reset Filters
                </button>
              )}

              <button 
                onClick={handleOpenIssueModal}
                style={{
                  padding: '10px 20px',
                  background: 'var(--primary)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px var(--primary-glow)'
                }}
              >
                <Plus size={18} />
                <span>Issue First Advance</span>
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' || isMobile ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '16px' 
          }}>
            {paginatedAdvances.map(adv => (
              <AdvanceCard 
                key={adv.id} 
                advance={adv} 
                onEdit={handleEdit}
                onDelete={handleDelete}
                onQuickView={setQuickViewAdvance}
              />
            ))}
          </div>
        ) : (
          <AdvanceTable 
            advances={paginatedAdvances} 
            onEdit={handleEdit}
            onDelete={handleDelete}
            onQuickView={setQuickViewAdvance}
            density={density}
            currentPage={page}
            totalPages={totalPages}
            totalRecords={filteredAdvances.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            onBulkDelete={handleBulkDelete}
          />
        )}
      </div>

      {/* Slide-out Quick Preview Drawer */}
      <AdvanceQuickDrawer 
        advance={quickViewAdvance}
        onClose={() => setQuickViewAdvance(null)}
        onEdit={handleEdit}
      />

      {/* Issue / Edit Advance Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '20px'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '520px',
            background: 'var(--surface-main)',
            border: '1px solid var(--border-main)',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-main)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--surface-hover)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {editingId ? 'Edit Staff Advance' : 'Issue Staff Advance'}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Disburse employee salary advance or petty cash
                </p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {modalError && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: 'var(--danger)',
                  fontSize: '0.85rem'
                }}>
                  {modalError}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Staff Member *
                </label>
                <select
                  value={form.memberId}
                  onChange={(e) => setForm({ ...form, memberId: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-main)',
                    background: 'var(--surface-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                >
                  <option value="">Select Employee...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Amount (BDT) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-main)',
                      background: 'var(--surface-main)',
                      color: 'var(--warning, #f59e0b)',
                      fontSize: '1rem',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Disbursement Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-main)',
                      background: 'var(--surface-main)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Reason / Purpose (Optional)
                </label>
                <textarea
                  rows={3}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="e.g. Medical emergency, salary advance for festival..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-main)',
                    background: 'var(--surface-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '14px', borderTop: '1px solid var(--border-main)' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-main)',
                    background: 'var(--surface-hover)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--primary)',
                    color: 'white',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px var(--primary-glow)'
                  }}
                >
                  <Save size={16} />
                  <span>{submitting ? 'Saving...' : editingId ? 'Update Advance' : 'Confirm & Issue'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
