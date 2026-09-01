"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { SettlementToolbar } from './components/SettlementToolbar';
import { SettlementTable } from './components/SettlementTable';
import { SettlementCard } from './components/SettlementCard';
import { SettlementSummary } from './components/SettlementSummary';
import { SettlementQuickDrawer } from './components/SettlementQuickDrawer';
import { UserX, Plus, X, Save, Calendar, PieChart, Users, DollarSign, Calculator, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickViewSettlement, setQuickViewSettlement] = useState<any | null>(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareholderModalOpen, setIsShareholderModalOpen] = useState(false);

  // Settlement Form state
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [preview, setPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Shareholder percentages
  const [ceoPercent, setCeoPercent] = useState(100);
  const [devPercent, setDevPercent] = useState(0);
  const [advisorPercent, setAdvisorPercent] = useState(0);
  const [companyPercent, setCompanyPercent] = useState(0);

  // UI preferences
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

  const fetchSettlements = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/settlements');
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (Array.isArray(data)) {
        setSettlements(data);
      } else {
        setSettlements([]);
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  // Load defaults on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('settlement_defaults');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed) {
          setCeoPercent(parsed.ceoPercent ?? 100);
          setDevPercent(parsed.devPercent ?? 0);
          setAdvisorPercent(parsed.advisorPercent ?? 0);
          setCompanyPercent(parsed.companyPercent ?? 0);
        }
      }
    } catch(e) {}
  }, []);

  // Fetch preview when month or year changes
  const fetchPreview = useCallback(async () => {
    if (!month || !year) return;
    setPreviewLoading(true);
    setModalError(null);
    try {
      const res = await fetch(`/api/settlements/preview?month=${month}&year=${year}`);
      if (res.ok) {
        const data = await res.json();
        setPreview(data);
      } else {
        const err = await res.json().catch(() => ({}));
        setModalError(err.error || 'Failed to calculate period P&L');
      }
    } catch (e: any) {
      setModalError(e.message || 'Error calculating preview');
    } finally {
      setPreviewLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    if (isModalOpen) {
      fetchPreview();
    }
  }, [isModalOpen, fetchPreview]);

  const totalPercent = ceoPercent + devPercent + advisorPercent + companyPercent;

  const handleSaveDefaults = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalPercent !== 100) {
      alert(`Percentages must sum to exactly 100%. Currently: ${totalPercent}%`);
      return;
    }
    localStorage.setItem('settlement_defaults', JSON.stringify({
      ceoPercent,
      devPercent,
      advisorPercent,
      companyPercent
    }));
    setIsShareholderModalOpen(false);
  };

  const handleCreateSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalPercent !== 100) {
      setModalError(`Shareholder percentages must sum to 100%. Currently: ${totalPercent}%`);
      return;
    }

    setSubmitLoading(true);
    setModalError(null);

    try {
      const payload = {
        month: parseInt(month),
        year: parseInt(year),
        ceoPercent,
        devPercent,
        advisorPercent,
        companyPercent
      };

      const res = await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchSettlements();
      } else {
        const errorData = await res.json().catch(() => ({}));
        setModalError(errorData.error || 'Failed to settle period');
      }
    } catch (e: any) {
      setModalError(e.message || 'Error settling period');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this settlement record?')) return;
    try {
      const res = await fetch(`/api/settlements?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSettlements();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to delete settlement');
      }
    } catch (e) {
      alert('Failed to delete settlement');
    }
  }, [fetchSettlements]);

  // Compute KPI metrics
  const kpiStats = useMemo(() => {
    let totalRevenue = 0;
    let totalExpense = 0;
    let totalProfit = 0;

    settlements.forEach(s => {
      totalRevenue += Number(s.totalRevenue || 0);
      totalExpense += Number(s.totalExpense || 0);
      totalProfit += Number(s.netProfit || 0);
    });

    return {
      totalRevenue,
      totalExpense,
      totalProfit,
      periodCount: settlements.length
    };
  }, [settlements]);

  // Pagination
  const paginatedSettlements = useMemo(() => {
    const start = (page - 1) * pageSize;
    return settlements.slice(start, start + pageSize);
  }, [settlements, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(settlements.length / pageSize));

  return (
    <PageContainer>
      {/* Top Toolbar */}
      <SettlementToolbar
        onSettlePeriod={() => setIsModalOpen(true)}
        onOpenShareholderModal={() => setIsShareholderModalOpen(true)}
        onRefresh={fetchSettlements}
        settlements={settlements}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        density={density}
        onDensityChange={setDensity}
      />

      {/* KPI Stat Cards */}
      <SettlementSummary
        totalRevenue={kpiStats.totalRevenue}
        totalExpense={kpiStats.totalExpense}
        totalProfit={kpiStats.totalProfit}
        periodCount={kpiStats.periodCount}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Content Body */}
        {error ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--danger)', background: 'rgba(239,68,68,0.05)', borderRadius: '12px' }}>
            <p>Error loading settlements: {error}</p>
          </div>
        ) : loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading settlements directory...
          </div>
        ) : settlements.length === 0 ? (
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
              <PieChart size={32} color="var(--primary)" />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px 0' }}>
              No Period Settlements Recorded
            </h3>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 24px 0', maxWidth: '400px', lineHeight: 1.5 }}>
              Reconcile monthly revenues and expenses to distribute dividends to shareholders.
            </p>

            <button 
              onClick={() => setIsModalOpen(true)}
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
              <span>Settle First Period</span>
            </button>
          </div>
        ) : viewMode === 'grid' || isMobile ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '16px' 
          }}>
            {paginatedSettlements.map(s => (
              <SettlementCard 
                key={s.id} 
                settlement={s} 
                onDelete={handleDelete}
                onQuickView={setQuickViewSettlement}
              />
            ))}
          </div>
        ) : (
          <SettlementTable 
            settlements={paginatedSettlements} 
            onDelete={handleDelete}
            onQuickView={setQuickViewSettlement}
            density={density}
            currentPage={page}
            totalPages={totalPages}
            totalRecords={settlements.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
          />
        )}
      </div>

      {/* Slide-out Quick Preview Drawer */}
      <SettlementQuickDrawer 
        settlement={quickViewSettlement}
        onClose={() => setQuickViewSettlement(null)}
      />

      {/* Settle New Period Modal */}
      {isModalOpen && (
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
            maxWidth: '560px',
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
                  Settle Monthly Period
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Audit period P&L and allocate shareholder distributions
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSettlement} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
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

              {/* Period Selectors */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Settlement Month
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
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
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={m} value={idx + 1}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Year
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    min="2020"
                    max="2035"
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

              {/* Real-time P&L Audit Card */}
              <div style={{
                background: 'var(--surface-hover)',
                border: '1px solid var(--border-main)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Audited P&L for Selected Period
                  </span>
                  {previewLoading && <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Auditing...</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Gross Revenue:</span>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#10b981' }}>
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(preview?.totalRevenue || 0)}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Total Expenses:</span>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ef4444' }}>
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(preview?.totalExpense || 0)}
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '8px 12px',
                  background: 'var(--surface-main)',
                  border: '1px solid var(--border-main)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '4px'
                }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Net Distributable:</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: (preview?.netProfit || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(preview?.netProfit || 0)}
                  </span>
                </div>
              </div>

              {/* Shareholder Percentages */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Shareholder Allocations (% must equal 100%)
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: totalPercent === 100 ? '#10b981' : '#ef4444' }}>
                    {totalPercent}% / 100%
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Founder / CEO %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={ceoPercent}
                      onChange={(e) => setCeoPercent(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-main)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tech / Dev %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={devPercent}
                      onChange={(e) => setDevPercent(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-main)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Advisors %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={advisorPercent}
                      onChange={(e) => setAdvisorPercent(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-main)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Company Reserve %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={companyPercent}
                      onChange={(e) => setCompanyPercent(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-main)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '14px', borderTop: '1px solid var(--border-main)' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                  disabled={submitLoading || totalPercent !== 100}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--primary)',
                    color: 'white',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: submitLoading || totalPercent !== 100 ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px var(--primary-glow)'
                  }}
                >
                  <Save size={16} />
                  <span>{submitLoading ? 'Auditing & Settling...' : 'Confirm & Settle Period'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shareholder Defaults Modal */}
      {isShareholderModalOpen && (
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
            maxWidth: '480px',
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
                  Default Shareholder Splits
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Set default equity percentages for settlement calculations
                </p>
              </div>
              <button 
                onClick={() => setIsShareholderModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDefaults} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Target: 100% Total</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: totalPercent === 100 ? '#10b981' : '#ef4444' }}>
                    Current Total: {totalPercent}%
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>Founder / CEO Allocation %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={ceoPercent}
                      onChange={(e) => setCeoPercent(Number(e.target.value))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>Tech / Dev Allocation %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={devPercent}
                      onChange={(e) => setDevPercent(Number(e.target.value))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>Advisors & Partners %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={advisorPercent}
                      onChange={(e) => setAdvisorPercent(Number(e.target.value))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>Company Reserves (Retained Earnings) %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={companyPercent}
                      onChange={(e) => setCompanyPercent(Number(e.target.value))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '14px', borderTop: '1px solid var(--border-main)' }}>
                <button
                  type="button"
                  onClick={() => setIsShareholderModalOpen(false)}
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
                  disabled={totalPercent !== 100}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--primary)',
                    color: 'white',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: totalPercent !== 100 ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px var(--primary-glow)'
                  }}
                >
                  <Save size={16} />
                  <span>Save Defaults</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
