"use client";

import React from 'react';
import Link from 'next/link';
import styles from '../../crm.module.css';

interface SalesOrderToolbarProps {
  onRefresh?: () => void;
  onExport?: () => void;
}

export function SalesOrderToolbar({ onRefresh, onExport }: SalesOrderToolbarProps) {
  return (
    <div className={styles.headerActions}>
      <button 
        onClick={onRefresh} 
        className={styles.headerIconBtn}
        title="Refresh Sales Orders"
        aria-label="Refresh Sales Orders"
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
        href="/erp/crm/sales-orders/new"
        className={`${styles.headerIconBtn} ${styles.headerIconBtnPrimary}`}
        title="New Sales Order"
        aria-label="New Sales Order"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
      </Link>
    </div>
  );
}
