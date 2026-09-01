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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, outstanding: 0, salesTotal: 0 });
  
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

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/crm/customers/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch customer statistics", err);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

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

  // KPI Stat card filter shortcuts
  const handleStatCardFilter = useCallback((type: 'all' | 'active' | 'outstanding' | 'sales') => {
    if (type === 'all') {
      handleFilterChange({ status: '', hasBalance: '' });
    } else if (type === 'active') {
      handleFilterChange({ status: filters.status === 'ACTIVE' ? '' : 'ACTIVE' });
    } else if (type === 'outstanding') {
      handleFilterChange({ hasBalance: filters.hasBalance === 'positive' ? '' : 'positive' });
    }
  }, [filters.status, filters.hasBalance, handleFilterChange]);

  // Active filter helper for statistics highlight
  const getActiveFilterType = () => {
    if (filters.status === 'ACTIVE') return 'active';
    if (filters.hasBalance === 'positive') return 'outstanding';
    if (!filters.status && !filters.groupId && !filters.hasCreditLimit && !filters.hasBalance && !filters.query) return 'all';
    return undefined;
  };

  // Single customer delete
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/crm/customers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCustomers(true);
        fetchStats();
      } else {
        alert("Failed to delete customer.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting.");
    }
  }, [fetchCustomers, fetchStats]);

  // Bulk customer delete
  const handleBulkDelete = useCallback(async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => fetch(`/api/crm/customers/${id}`, { method: 'DELETE' })));
      fetchCustomers(true);
      fetchStats();
    } catch (err) {
      console.error("Bulk delete error", err);
    }
  }, [fetchCustomers, fetchStats]);

  const hasActiveFilters = Boolean(
    filters.query || filters.status || filters.groupId || filters.hasCreditLimit || filters.hasBalance
  );

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  return (
    <PageContainer>
      <PageHeader 
        title="Customer Directory & CRM" 
        description="Monitor enterprise customer relationships, credit limits, outstanding balances, and order histories."
      />

      {/* KPI Stat Cards with Click-to-Filter */}
      <CustomerStatistics 
        {...stats}
        activeFilter={getActiveFilterType()}
        onFilterClick={handleStatCardFilter}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Top Control Bar: Search & Toolbar */}
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
          <CustomerToolbar 
            onRefresh={() => { fetchCustomers(true); fetchStats(); }}
            customers={customers}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            density={density}
            onDensityChange={setDensity}
          />
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
    </PageContainer>
  );
}
