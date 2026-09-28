"use client";

import React from 'react';
import Link from 'next/link';
import styles from '../../crm.module.css';

interface OpportunityToolbarProps {
  currentView: 'list' | 'kanban' | 'pipeline' | 'forecast';
  onRefresh?: () => void;
  onExport?: () => void;
}

export function OpportunityToolbar({ currentView, onRefresh, onExport }: OpportunityToolbarProps) {
  return (
    <div className={styles.headerActions}>
      <button 
        onClick={onRefresh} 
        className={styles.headerIconBtn}
        title="Refresh Opportunities"
        aria-label="Refresh Opportunities"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>refresh</span>
      </button>

      <button 
        onClick={onExport} 
        className={styles.headerIconBtn}
        title="Export CSV"
        aria-label="Export CSV"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>download</span>
      </button>

      <Link 
        href="/erp/crm/opportunities/new"
        className={`${styles.headerIconBtn} ${styles.headerIconBtnPrimary}`}
        title="New Opportunity"
        aria-label="New Opportunity"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
      </Link>
    </div>
  );
}
