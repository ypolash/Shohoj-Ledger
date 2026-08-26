"use client";

import React, { useState } from 'react';
import Link from 'next/link';

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
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <button 
        onClick={handleExport}
        disabled={exporting}
        style={{
          padding: '10px 16px',
          background: 'var(--surface-main)',
          border: '1px solid var(--border-main)',
          borderRadius: '8px',
          color: 'var(--text-main)',
          fontSize: '13px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          cursor: exporting ? 'not-allowed' : 'pointer',
          boxShadow: 'var(--shadow-sm)',
          opacity: exporting ? 0.7 : 1
        }}
        title="Export Filtered Leads to CSV"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>
          {exporting ? 'progress_activity' : 'download'}
        </span>
        {exporting ? 'Exporting...' : 'Export'}
      </button>

      <button style={{
        padding: '10px 16px',
        background: 'var(--surface-main)',
        border: '1px solid var(--border-main)',
        borderRadius: '8px',
        color: 'var(--text-main)',
        fontSize: '13px',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-sm)'
      }} onClick={onRefresh} title="Refresh Leads List">
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
      </button>

      <Link href="/erp/crm/leads/create" style={{ textDecoration: 'none' }}>
        <button style={{
          padding: '10px 20px',
          background: 'var(--primary)',
          border: '1px solid var(--primary-700)',
          borderRadius: '8px',
          color: 'white',
          fontSize: '14px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-md)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
          New Lead
        </button>
      </Link>
    </div>
  );
}
