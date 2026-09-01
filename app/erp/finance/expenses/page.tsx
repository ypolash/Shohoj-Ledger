"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { ExpenseToolbar } from './components/ExpenseToolbar';
import { ExpenseFilters } from './components/ExpenseFilters';
import { ExpenseSearch } from './components/ExpenseSearch';
import { ExpenseTable } from './components/ExpenseTable';
import { ExpenseCard } from './components/ExpenseCard';
import { ExpenseSummary } from './components/ExpenseSummary';
import { ExpenseQuickDrawer } from './components/ExpenseQuickDrawer';
import { UserX, Plus } from 'lucide-react';
import Link from 'next/link';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickViewExpense, setQuickViewExpense] = useState<any | null>(null);

  // Filters & Search
  const [filters, setFilters] = useState({
    query: '',
    category: '',
    paymentMethod: '',
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

  const fetchExpenses = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      setError(null);
      const res = await fetch('/api/expenses');
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (Array.isArray(data)) {
        setExpenses(data);
      } else {
        setExpenses([]);
        setError("API returned unexpected data format.");
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

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
    setFilters({ query: '', category: '', paymentMethod: '', dateRange: '' });
    setPage(1);
  }, []);

  // Compute Overall KPI Metrics
  const kpiStats = useMemo(() => {
    let totalExpense = 0;
    let bankTotal = 0;
    let cashTotal = 0;

    expenses.forEach(exp => {
      const amt = Number(exp.amount || 0);
      totalExpense += amt;
      const method = (exp.paymentMethod || '').toLowerCase();
      if (method.includes('bank')) {
        bankTotal += amt;
      } else if (method.includes('cash')) {
        cashTotal += amt;
      }
    });

    return {
      totalExpense,
      bankTotal,
      cashTotal,
      transactionCount: expenses.length
    };
  }, [expenses]);

  // Filtered dataset
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      // Query filter
      if (filters.query) {
        const q = filters.query.toLowerCase();
        const ref = `exp-${(exp.id || '').slice(0, 8)}`.toLowerCase();
        const cat = (exp.category || '').toLowerCase();
        const method = (exp.paymentMethod || '').toLowerCase();
        const desc = (exp.description || '').toLowerCase();
        if (!ref.includes(q) && !cat.includes(q) && !method.includes(q) && !desc.includes(q)) {
          return false;
        }
      }

      // Category filter
      if (filters.category && (exp.category || '').toLowerCase() !== filters.category.toLowerCase()) {
        return false;
      }

      // Payment Method filter
      if (filters.paymentMethod && (exp.paymentMethod || '').toLowerCase() !== filters.paymentMethod.toLowerCase()) {
        return false;
      }

      // Date Range filter
      if (filters.dateRange) {
        const created = new Date(exp.createdAt);
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
  }, [expenses, filters]);

  // Paginated dataset
  const paginatedExpenses = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredExpenses.slice(start, start + pageSize);
  }, [filteredExpenses, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / pageSize));

  // Single delete
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense record?')) return;
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchExpenses(true);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || 'Failed to delete expense');
      }
    } catch (err) {
      alert('Failed to delete expense');
    }
  }, [fetchExpenses]);

  // Bulk delete
  const handleBulkDelete = useCallback(async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => fetch(`/api/expenses?id=${id}`, { method: 'DELETE' })));
      fetchExpenses(true);
    } catch (err) {
      console.error("Bulk delete error", err);
    }
  }, [fetchExpenses]);

  // Stat card click-to-filter
  const handleStatCardFilter = useCallback((type: 'all' | 'bank' | 'cash') => {
    if (type === 'all') {
      handleFilterChange({ paymentMethod: '' });
    } else if (type === 'bank') {
      handleFilterChange({ paymentMethod: filters.paymentMethod === 'Bank Transfer' ? '' : 'Bank Transfer' });
    } else if (type === 'cash') {
      handleFilterChange({ paymentMethod: filters.paymentMethod === 'Cash on Hand' ? '' : 'Cash on Hand' });
    }
  }, [filters.paymentMethod, handleFilterChange]);

  const getActiveFilterType = () => {
    if (filters.paymentMethod === 'Bank Transfer') return 'bank';
    if (filters.paymentMethod === 'Cash on Hand') return 'cash';
    if (!filters.paymentMethod && !filters.category && !filters.dateRange && !filters.query) return 'all';
    return undefined;
  };

  const hasActiveFilters = Boolean(
    filters.query || filters.category || filters.paymentMethod || filters.dateRange
  );

  return (
    <PageContainer>
      {/* Top Toolbar */}
      <ExpenseToolbar 
        onRefresh={() => fetchExpenses(true)}
        expenses={filteredExpenses}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        density={density}
        onDensityChange={setDensity}
      />

      {/* KPI Stat Cards with Click-to-Filter */}
      <ExpenseSummary 
        totalExpense={kpiStats.totalExpense}
        bankTotal={kpiStats.bankTotal}
        cashTotal={kpiStats.cashTotal}
        transactionCount={kpiStats.transactionCount}
        activeFilter={getActiveFilterType()}
        onFilterClick={handleStatCardFilter}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Search & Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <ExpenseSearch 
            initialValue={filters.query}
            onSearch={(q) => handleFilterChange({ query: q })}
          />
        </div>

        <ExpenseFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
        />

        {/* Content Body */}
        {error ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--danger)', background: 'rgba(239,68,68,0.05)', borderRadius: '12px' }}>
            <p>Error loading expense records: {error}</p>
          </div>
        ) : loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading expense directory...
          </div>
        ) : filteredExpenses.length === 0 ? (
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
              <UserX size={32} color="var(--danger)" />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px 0' }}>
              {hasActiveFilters ? 'No Expense Records Match Filters' : 'No Expense Records Found'}
            </h3>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 24px 0', maxWidth: '400px', lineHeight: 1.5 }}>
              {hasActiveFilters 
                ? 'Try adjusting your search query, category, or payment channel filters.'
                : 'No expenses have been recorded yet. Start logging disbursements.'}
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

              <Link href="/erp/finance/expenses/create" style={{ textDecoration: 'none' }}>
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
                  <span>Record First Expense</span>
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
            {paginatedExpenses.map(exp => (
              <ExpenseCard 
                key={exp.id} 
                expense={exp} 
                onDelete={handleDelete}
                onQuickView={setQuickViewExpense}
              />
            ))}
          </div>
        ) : (
          <ExpenseTable 
            expenses={paginatedExpenses} 
            onDelete={handleDelete}
            onQuickView={setQuickViewExpense}
            onRefresh={() => fetchExpenses(true)}
            density={density}
            currentPage={page}
            totalPages={totalPages}
            totalRecords={filteredExpenses.length}
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
      <ExpenseQuickDrawer 
        expense={quickViewExpense}
        onClose={() => setQuickViewExpense(null)}
      />
    </PageContainer>
  );
}
