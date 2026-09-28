"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

// Modular Components
import { CustomerTable } from "./components/CustomerTable";
import { CustomerFilters } from "./components/CustomerFilters";
import { CustomerSearch } from "./components/CustomerSearch";
import { CustomerToolbar } from "./components/CustomerToolbar";
import { CustomerStatistics } from "./components/CustomerStatistics";
import { CustomerEmptyState } from "./components/CustomerEmptyState";
import { CustomerLoading } from "./components/CustomerLoading";
import { CustomerCard } from "./components/CustomerCard";
import { CustomerQuickDrawer } from "./components/CustomerQuickDrawer";

import styles from '../crm.module.css';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Pagination State
  const [filters, setFilters] = useState({ 
    query: '', 
    status: '', 
    groupId: '', 
    hasCreditLimit: '', 
    hasBalance: '' 
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // View mode & UI Preferences
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [isMobile, setIsMobile] = useState(false);
  const [quickViewCustomer, setQuickViewCustomer] = useState<any | null>(null);

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

  const fetchCustomers = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const qParams = new URLSearchParams();
      if (filters.query) qParams.append("query", filters.query);
      if (filters.status) qParams.append("status", filters.status);
      if (filters.groupId) qParams.append("groupId", filters.groupId);
      if (filters.hasCreditLimit) qParams.append("hasCreditLimit", filters.hasCreditLimit);
      if (filters.hasBalance) qParams.append("hasBalance", filters.hasBalance);
      
      const skip = (page - 1) * pageSize;
      qParams.append("skip", skip.toString());
      qParams.append("take", pageSize.toString());

      const res = await fetch(`/api/crm/customers?${qParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.data || []);
        setTotalRecords(data.total || (data.data ? data.data.length : 0));
      }
    } catch (err) {
      console.error("Failed to fetch customers", err);
    } finally {
      setLoading(false);
    }
  }, [filters.query, filters.status, filters.groupId, filters.hasCreditLimit, filters.hasBalance, page, pageSize]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Filter change helper (memoized and stable)
  const handleFilterChange = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => {
      let isChanged = false;
      for (const [key, val] of Object.entries(newFilters)) {
        if ((prev as any)[key] !== val) {
          isChanged = true;
          break;
        }
      }
      if (!isChanged) return prev;
      return { ...prev, ...newFilters };
    });
    setPage(1);
  }, []);

  // Reset all filters
  const handleResetFilters = useCallback(() => {
    setFilters({ query: '', status: '', groupId: '', hasCreditLimit: '', hasBalance: '' });
    setPage(1);
  }, []);

  // Search input handler
  const handleSearchQuery = useCallback((q: string) => {
    handleFilterChange({ query: q });
  }, [handleFilterChange]);

  // Single customer delete
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/crm/customers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCustomers(true);
      } else {
        alert("Failed to delete customer.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting.");
    }
  }, [fetchCustomers]);

  // Bulk customer delete
  const handleBulkDelete = useCallback(async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => fetch(`/api/crm/customers/${id}`, { method: 'DELETE' })));
      fetchCustomers(true);
    } catch (err) {
      console.error("Bulk delete error", err);
    }
  }, [fetchCustomers]);

  const hasActiveFilters = Boolean(
    filters.query || filters.status || filters.groupId || filters.hasCreditLimit || filters.hasBalance
  );

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  return (
    <div className={styles.container}>
      {/* 1. Executive Minimalist Header */}
      <header className={styles.headerCard}>
        <div className={styles.headerTitleGroup}>
          <h1 className={styles.pageTitle}>
            Customer Directory
            <span className={styles.titleBadge}>{totalRecords} Customers</span>
          </h1>
        </div>

        <div className={styles.headerActions}>
          <CustomerToolbar 
            onRefresh={() => fetchCustomers(true)}
            customers={customers}
          />
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Top Control Bar: Search & View Controls */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '14px' 
        }}>
          <CustomerSearch 
            initialValue={filters.query}
            onSearch={handleSearchQuery} 
          />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'inline-flex',
              background: 'var(--surface-hover)',
              borderRadius: '8px',
              padding: '3px',
              border: '1px solid var(--border-main)'
            }}>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: viewMode === 'table' ? 'var(--surface-card, #ffffff)' : 'transparent',
                  border: 'none',
                  color: viewMode === 'table' ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                title="Table View"
                aria-label="Table View"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>table_rows</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: viewMode === 'grid' ? 'var(--surface-card, #ffffff)' : 'transparent',
                  border: 'none',
                  color: viewMode === 'grid' ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                title="Grid View"
                aria-label="Grid View"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>grid_view</span>
              </button>
            </div>

            {viewMode === 'table' && (
              <button
                onClick={() => setDensity(d => d === 'comfortable' ? 'compact' : 'comfortable')}
                style={{
                  padding: '7px 12px',
                  background: 'var(--surface-card, #ffffff)',
                  border: '1px solid var(--border-main)',
                  borderRadius: '8px',
                  color: 'var(--text-main)',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
                title={`Toggle Density (${density})`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-muted)' }}>tune</span>
                <span>{density === 'comfortable' ? 'Comfortable' : 'Compact'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Filters & Filter Pills */}
        <CustomerFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
        />

        {/* Content Body: Loading / Empty / Table / Grid */}
        {loading ? (
          <CustomerLoading />
        ) : customers.length === 0 ? (
          <CustomerEmptyState 
            hasFilters={hasActiveFilters}
            onResetFilters={handleResetFilters}
          />
        ) : viewMode === 'grid' || isMobile ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '16px' 
          }}>
            {customers.map(customer => (
              <CustomerCard 
                key={customer.id} 
                customer={customer} 
                onDelete={handleDelete}
                onQuickView={setQuickViewCustomer}
              />
            ))}
          </div>
        ) : (
          <CustomerTable 
            customers={customers} 
            onDelete={handleDelete}
            onQuickView={setQuickViewCustomer}
            density={density}
            currentPage={page}
            totalPages={totalPages}
            totalRecords={totalRecords}
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
      <CustomerQuickDrawer 
        customer={quickViewCustomer}
        onClose={() => setQuickViewCustomer(null)}
      />
    </div>
  );
}
