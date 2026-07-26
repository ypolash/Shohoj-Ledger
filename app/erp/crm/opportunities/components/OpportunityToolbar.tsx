"use client";

import React from 'react';
import Link from 'next/link';

interface OpportunityToolbarProps {
  currentView: 'list' | 'kanban' | 'pipeline' | 'forecast';
  onRefresh?: () => void;
}

export function OpportunityToolbar({ currentView, onRefresh }: OpportunityToolbarProps) {
  const btnStyle = {
    padding: '8px 16px',
    background: 'var(--surface-hover)',
    border: '1px solid var(--border-main)',
    color: 'var(--text-main)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  };

  const getViewStyle = (viewName: string) => ({
    padding: '6px 12px',
    background: currentView === viewName ? 'var(--primary-glow)' : 'transparent',
    color: currentView === viewName ? 'var(--primary)' : 'var(--text-muted)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: currentView === viewName ? 600 : 500,
    fontSize: '13px',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  });

  return (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
      
      {/* View Switcher */}
      <div style={{ display: 'flex', background: 'var(--surface-main)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '4px' }}>
        <Link href="/erp/crm/opportunities" style={getViewStyle('list')}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>list</span> List
        </Link>
        <Link href="/erp/crm/opportunities/kanban" style={getViewStyle('kanban')}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>view_kanban</span> Kanban
        </Link>
        <Link href="/erp/crm/opportunities/pipeline" style={getViewStyle('pipeline')}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>filter_alt</span> Pipeline
        </Link>
        <Link href="/erp/crm/opportunities/forecast" style={getViewStyle('forecast')}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>monitoring</span> Forecast
        </Link>
      </div>

      <button onClick={onRefresh} style={{ ...btnStyle, borderRadius: '8px' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
      </button>

      <button style={{ ...btnStyle, borderRadius: '8px' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
        Export
      </button>

      <Link href="/erp/crm/opportunities/new">
        <button style={{ ...btnStyle, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
          New Opportunity
        </button>
      </Link>
    </div>
  );
}
