"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../../crm.module.css';

// Modular Components
import { OpportunityPipeline } from "../components/OpportunityPipeline";
import { OpportunityToolbar } from "../components/OpportunityToolbar";
import { OpportunityLoading } from "../components/OpportunityLoading";

export default function OpportunitiesPipelinePage() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/crm/opportunities');
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
  }, []);

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
            Sales Pipeline Funnel
            <span className={styles.titleBadge}>{opportunities.length} Deals</span>
          </h1>
        </div>

        <div className={styles.headerActions}>
          <OpportunityToolbar currentView="pipeline" onRefresh={fetchOpportunities} />
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '14px' }}>
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
            <Link href="/erp/crm/opportunities/kanban" style={getViewStyle(false)}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>view_kanban</span>
              <span>Kanban</span>
            </Link>
            <Link href="/erp/crm/opportunities/pipeline" style={getViewStyle(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>conversion_path</span>
              <span>Pipeline</span>
            </Link>
            <Link href="/erp/crm/opportunities/forecast" style={getViewStyle(false)}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>monitoring</span>
              <span>Forecast</span>
            </Link>
          </div>
        </div>

        {loading ? <OpportunityLoading /> : <OpportunityPipeline opportunities={opportunities} />}
      </div>
    </div>
  );
}
