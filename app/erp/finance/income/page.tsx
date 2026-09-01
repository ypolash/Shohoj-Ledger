"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { IncomeToolbar } from './components/IncomeToolbar';
import { IncomeFilters } from './components/IncomeFilters';
import { IncomeSearch } from './components/IncomeSearch';
import { IncomeTable } from './components/IncomeTable';
import { IncomeCard } from './components/IncomeCard';
import { IncomeSummary } from './components/IncomeSummary';
import { IncomeQuickDrawer } from './components/IncomeQuickDrawer';
import { UserX, Plus } from 'lucide-react';
import Link from 'next/link';

export default function IncomePage() {
  const [incomes, setIncomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickViewIncome, setQuickViewIncome] = useState<any | null>(null);

  // Filters & Search
  const [filters, setFilters] = useState({
    query: '',
    category: '',
    status: '',
    dateRange: ''
  });

  // UI preferences & View Modes
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

  const fetchIncomes = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      setError(null);
      const res = await fetch('/api/income');
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (Array.isArray(data)) {
        setIncomes(data);
      } else {
        setIncomes([]);
        setError("API returned unexpected data format.");
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes]);

  // Filter change helper
  const handleFilterChange = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => {
      let changed = false;
      for (const [key, val] of Object.entries(newFilters)) {
        if ((prev as any)[key] !== val) {
          changed = true;
          break;
        }
      }
      if (!changed) return prev;
      return { ...prev, ...newFilters };
    });
    setPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({ query: '', category: '', status: '', dateRange: '' });
    setPage(1);
  }, []);

  // Compute Overall KPI Metrics
  const kpiStats = useMemo(() => {
    let totalRevenue = 0;
    let totalReceived = 0;
    let totalDue = 0;

    incomes.forEach(inc => {
      const amt = Number(inc.amount || 0);
      const rec = Number(inc.received || 0);
      totalRevenue += amt;
      totalReceived += rec;
      totalDue += Math.max(0, amt - rec);
    });

    return {
      totalRevenue,
      totalReceived,
      totalDue,
      transactionCount: incomes.length
    };
  }, [incomes]);

  // Filtered dataset
  const filteredIncomes = useMemo(() => {
    return incomes.filter(inc => {
      // Query filter
      if (filters.query) {
        const q = filters.query.toLowerCase();
        const ref = `inc-${(inc.id || '').slice(0, 8)}`.toLowerCase();
        const src = (inc.source || '').toLowerCase();
        const cat = (inc.category || '').toLowerCase();
        const desc = (inc.description || '').toLowerCase();
        if (!ref.includes(q) && !src.includes(q) && !cat.includes(q) && !desc.includes(q)) {
          return false;
        }
      }

      // Category filter
      if (filters.category && (inc.category || '').toLowerCase() !== filters.category.toLowerCase()) {
        return false;
      }

      // Status filter
      if (filters.status) {
        const total = Number(inc.amount || 0);
        const rec = Number(inc.received || 0);
        const st = (inc.paymentStatus || (rec >= total ? 'PAID' : rec > 0 ? 'PARTIAL' : 'UNPAID')).toUpperCase();
        if (st !== filters.status.toUpperCase()) {
          return false;
        }
      }

      // Date Range filter
      if (filters.dateRange) {
        const created = new Date(inc.createdAt);
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
  }, [incomes, filters]);

  // Paginated dataset
  const paginatedIncomes = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredIncomes.slice(start, start + pageSize);
  }, [filteredIncomes, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredIncomes.length / pageSize));

  // Single delete
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this income record?')) return;
    try {
      const res = await fetch(`/api/income?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchIncomes(true);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || 'Failed to delete income');
      }
    } catch (err) {
      alert('Failed to delete income');
    }
  }, [fetchIncomes]);

  // Bulk delete
  const handleBulkDelete = useCallback(async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => fetch(`/api/income?id=${id}`, { method: 'DELETE' })));
      fetchIncomes(true);
    } catch (err) {
      console.error("Bulk delete error", err);
    }
  }, [fetchIncomes]);

  // Stat card click-to-filter
  const handleStatCardFilter = useCallback((type: 'all' | 'paid' | 'due') => {
    if (type === 'all') {
      handleFilterChange({ status: '' });
    } else if (type === 'paid') {
      handleFilterChange({ status: filters.status === 'PAID' ? '' : 'PAID' });
    } else if (type === 'due') {
      handleFilterChange({ status: filters.status === 'UNPAID' ? '' : 'UNPAID' });
    }
  }, [filters.status, handleFilterChange]);

  const getActiveFilterType = () => {
    if (filters.status === 'PAID') return 'paid';
    if (filters.status === 'UNPAID' || filters.status === 'PARTIAL') return 'due';
    if (!filters.status && !filters.category && !filters.dateRange && !filters.query) return 'all';
    return undefined;
  };

  const hasActiveFilters = Boolean(
    filters.query || filters.category || filters.status || filters.dateRange
  );

  return (
    <PageContainer>
      {/* Top Toolbar */}
      <IncomeToolbar 
        onRefresh={() => fetchIncomes(true)}
        incomes={filteredIncomes}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        density={density}
        onDensityChange={setDensity}
      />

      {/* KPI Stat Cards with Click-to-Filter */}
      <IncomeSummary 
        totalRevenue={kpiStats.totalRevenue}
        totalReceived={kpiStats.totalReceived}
        totalDue={kpiStats.totalDue}
        transactionCount={kpiStats.transactionCount}
        activeFilter={getActiveFilterType()}
        onFilterClick={handleStatCardFilter}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Search & Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <IncomeSearch 
            initialValue={filters.query}
            onSearch={(q) => handleFilterChange({ query: q })}
          />
        </div>

        <IncomeFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
        />

        {/* Content Body */}
        {error ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--danger)', background: 'rgba(239,68,68,0.05)', borderRadius: '12px' }}>
            <p>Error loading income records: {error}</p>
          </div>
        ) : loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading income directory...
          </div>
        ) : filteredIncomes.length === 0 ? (
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
              <UserX size={32} color="var(--primary)" />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px 0' }}>
              {hasActiveFilters ? 'No Income Records Match Filters' : 'No Income Records Found'}
            </h3>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 24px 0', maxWidth: '400px', lineHeight: 1.5 }}>
              {hasActiveFilters 
                ? 'Try adjusting your search query, category, or payment status filters.'
                : 'No income or receivables have been recorded yet. Start logging revenues.'}
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

              <Link href="/erp/finance/income/create" style={{ textDecoration: 'none' }}>
                <button style={{
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
                }}>
                  <Plus size={18} />
                  <span>Record First Income</span>
                </button>
              </Link>
            </div>
          </div>
        ) : viewMode === 'grid' || isMobile ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '16px' 
          }}>
            {paginatedIncomes.map(inc => (
              <IncomeCard 
                key={inc.id} 
                income={inc} 
                onDelete={handleDelete}
                onQuickView={setQuickViewIncome}
              />
            ))}
          </div>
        ) : (
          <IncomeTable 
            incomes={paginatedIncomes} 
            onDelete={handleDelete}
            onQuickView={setQuickViewIncome}
            onRefresh={() => fetchIncomes(true)}
            density={density}
            currentPage={page}
            totalPages={totalPages}
            totalRecords={filteredIncomes.length}
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
      <IncomeQuickDrawer 
        income={quickViewIncome}
        onClose={() => setQuickViewIncome(null)}
      />
    </PageContainer>
  );
}
