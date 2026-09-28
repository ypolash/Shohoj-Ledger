"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

// Modular Components
import { OpportunityTable } from "./components/OpportunityTable";
import { OpportunityFilters } from "./components/OpportunityFilters";
import { OpportunitySearch } from "./components/OpportunitySearch";
import { OpportunityToolbar } from "./components/OpportunityToolbar";
import { OpportunityEmptyState } from "./components/OpportunityEmptyState";
import { OpportunityLoading } from "./components/OpportunityLoading";
import { OpportunityCard } from "./components/OpportunityCard";

import Link from 'next/link';
import styles from '../crm.module.css';

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ query: '', stageId: '', ownerId: '' });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const qParams = new URLSearchParams();
      if (filters.query) qParams.append("query", filters.query);
      if (filters.stageId) qParams.append("stageId", filters.stageId);
      if (filters.ownerId) qParams.append("ownerId", filters.ownerId);

      const res = await fetch(`/api/crm/opportunities?${qParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data.opportunities || data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters.query, filters.stageId, filters.ownerId]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleSearch = useCallback((q: string) => {
    setFilters(prev => (prev.query === q ? prev : { ...prev, query: q }));
  }, []);

  const handleFilterChange = useCallback((newFilter: { stageId?: string; ownerId?: string }) => {
    setFilters(prev => ({ ...prev, ...newFilter }));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this opportunity?")) return;
    try {
      const res = await fetch(`/api/crm/opportunities/${id}`, { method: 'DELETE' });
      if (res.ok) fetchOpportunities();
    } catch (err) {
      console.error(err);
    }
  };

  const getViewStyle = (active: boolean) => ({
    padding: '6px 12px',
    background: active ? 'var(--surface-card, #ffffff)' : 'transparent',
    color: active ? 'var(--primary)' : 'var(--text-muted)',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '12px',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
  });

  return (
    <div className={styles.container}>
      {/* 1. Executive Minimalist Header */}
      <header className={styles.headerCard}>
        <div className={styles.headerTitleGroup}>
          <h1 className={styles.pageTitle}>
            Opportunities &amp; Deals
            <span className={styles.titleBadge}>{opportunities.length} Deals</span>
          </h1>
        </div>

        <div className={styles.headerActions}>
          <OpportunityToolbar currentView="list" onRefresh={fetchOpportunities} />
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <OpportunitySearch onSearch={handleSearch} />
          
          {/* Views Navigator */}
          <div style={{
            display: 'inline-flex',
            background: 'var(--surface-hover)',
            borderRadius: '8px',
            padding: '3px',
            border: '1px solid var(--border-main)'
          }}>
            <Link href="/erp/crm/opportunities" style={getViewStyle(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>table_rows</span>
              <span>List</span>
            </Link>
            <Link href="/erp/crm/opportunities/kanban" style={getViewStyle(false)}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>view_kanban</span>
              <span>Kanban</span>
            </Link>
            <Link href="/erp/crm/opportunities/pipeline" style={getViewStyle(false)}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>conversion_path</span>
              <span>Pipeline</span>
            </Link>
            <Link href="/erp/crm/opportunities/forecast" style={getViewStyle(false)}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>monitoring</span>
              <span>Forecast</span>
            </Link>
          </div>
        </div>

        <OpportunityFilters onFilterChange={handleFilterChange} />

        {loading ? (
          <OpportunityLoading />
        ) : opportunities.length === 0 ? (
          <OpportunityEmptyState />
        ) : isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {opportunities.map(opp => <OpportunityCard key={opp.id} opportunity={opp} />)}
          </div>
        ) : (
          <OpportunityTable opportunities={opportunities} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
}
