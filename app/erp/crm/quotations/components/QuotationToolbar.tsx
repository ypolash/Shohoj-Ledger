"use client";

import React from 'react';
import Link from 'next/link';
import styles from '../../crm.module.css';

interface QuotationToolbarProps {
  onRefresh?: () => void;
  onExport?: () => void;
}

export function QuotationToolbar({ onRefresh, onExport }: QuotationToolbarProps) {
  return (
    <div className={styles.headerActions}>
      <button 
        onClick={onRefresh} 
        className={styles.headerIconBtn}
        title="Refresh Quotations"
        aria-label="Refresh Quotations"
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
        href="/erp/crm/quotations/new"
        className={`${styles.headerIconBtn} ${styles.headerIconBtnPrimary}`}
        title="New Quotation"
        aria-label="New Quotation"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
      </Link>
    </div>
  );
}
