"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../../crm.module.css';

// Modular Components
import { OpportunityKanban } from "../components/OpportunityKanban";
import { OpportunitySearch } from "../components/OpportunitySearch";
import { OpportunityToolbar } from "../components/OpportunityToolbar";
import { OpportunityLoading } from "../components/OpportunityLoading";
import { OpportunityFilters } from "../components/OpportunityFilters";

export default function OpportunitiesKanbanPage() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ query: '', stageId: '', ownerId: '' });

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const qParams = new URLSearchParams();
      if (filters.query) qParams.append("query", filters.query);
      if (filters.stageId) qParams.append("stageId", filters.stageId);
      if (filters.ownerId) qParams.append("ownerId", filters.ownerId);

      const res = await fetch(`/api/crm/opportunities?${qParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data.opportunities || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

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
            Deals Kanban Board
            <span className={styles.titleBadge}>{opportunities.length} Deals</span>
          </h1>
        </div>

        <div className={styles.headerActions}>
          <OpportunityToolbar currentView="kanban" onRefresh={fetchOpportunities} />
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <OpportunitySearch onSearch={(q) => setFilters(prev => ({ ...prev, query: q }))} />
          
          <div style={{
            display: 'inline-flex',
            background: 'var(--surface-hover)',
            borderRadius: '8px',
            padding: '3px',
            border: '1px solid var(--border-main)'
          }}>
            <Link href="/erp/crm/opportunities" style={getViewStyle(false)}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>table_rows</span>
              <span>List</span>
            </Link>
            <Link href="/erp/crm/opportunities/kanban" style={getViewStyle(true)}>
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
        
        <OpportunityFilters onFilterChange={(newFilter) => setFilters(prev => ({ ...prev, ...newFilter }))} />

        {loading ? <OpportunityLoading /> : <OpportunityKanban opportunities={opportunities} />}
      </div>
    </div>
  );
}
