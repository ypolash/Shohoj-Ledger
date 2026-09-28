"use client";

import React, { useState } from 'react';
import Link from 'next/link';

import styles from '../../crm.module.css';

interface LeadToolbarProps {
  leads?: any[];
  onRefresh?: () => void;
}

export function LeadToolbar({ leads = [], onRefresh }: LeadToolbarProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    if (!leads || leads.length === 0) {
      alert("No leads available to export.");
      return;
    }

    setExporting(true);
    try {
      const headers = ["Lead Number", "Company Name", "Contact Person", "Phone", "Email", "Status", "Priority", "Lead Source", "Estimated Value", "Assigned To", "Created At"];
      
      const rows = leads.map(l => [
        `"${(l.leadNumber || l.id || '').replace(/"/g, '""')}"`,
        `"${(l.companyName || '').replace(/"/g, '""')}"`,
        `"${(l.contactPerson || '').replace(/"/g, '""')}"`,
        `"${(l.phone || '').replace(/"/g, '""')}"`,
        `"${(l.email || '').replace(/"/g, '""')}"`,
        `"${(l.status || '').replace(/"/g, '""')}"`,
        `"${(l.priority || '').replace(/"/g, '""')}"`,
        `"${(l.leadSource || l.serviceType || '').replace(/"/g, '""')}"`,
        `"${l.estimatedValue || l.expectedValue || 0}"`,
        `"${(l.assignedTo ? `${l.assignedTo.firstName || ''} ${l.assignedTo.lastName || ''}`.trim() : '').replace(/"/g, '""')}"`,
        `"${new Date(l.createdAt).toLocaleDateString()}"`
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `crm_leads_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export leads.");
    } finally {
      setTimeout(() => setExporting(false), 500);
    }
  };

  return (
    <div className={styles.headerActions}>
      <button 
        onClick={handleExport}
        disabled={exporting || leads.length === 0}
        className={styles.headerIconBtn}
        title="Export CSV"
        aria-label="Export CSV"
      >
        <span className={`material-symbols-outlined ${exporting ? styles.spinning : ''}`} style={{ fontSize: '20px' }}>
          {exporting ? 'progress_activity' : 'download'}
        </span>
      </button>

      <button 
        onClick={onRefresh} 
        className={styles.headerIconBtn}
        title="Refresh Leads"
        aria-label="Refresh Leads"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>refresh</span>
      </button>

      <Link 
        href="/erp/crm/leads/create" 
        className={`${styles.headerIconBtn} ${styles.headerIconBtnPrimary}`}
        title="New Lead"
        aria-label="New Lead"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
      </Link>
    </div>
  );
}
