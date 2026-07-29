"use client";

import React, { ReactNode } from 'react';
import { exportToCSV, exportToExcel, exportToPDF } from '@/lib/reports/exportUtils';
import { ReportHeader } from './ReportHeader';

interface ReportWrapperProps {
  title: string;
  data: any[];
  columns: string[]; // Used for PDF table columns and ordering
  filters?: ReactNode; // Optional UI controls like date pickers
  children: ReactNode; // The actual table to render on screen
}

export function ReportWrapper({ title, data, columns, filters, children }: ReportWrapperProps) {
  
  const handleExportCSV = () => {
    if (data.length === 0) return alert("No data to export");
    exportToCSV(data, `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split("T")[0]}`);
  };

  const handleExportExcel = () => {
    if (data.length === 0) return alert("No data to export");
    exportToExcel(data, `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split("T")[0]}`);
  };

  const handleExportPDF = () => {
    if (data.length === 0) return alert("No data to export");
    exportToPDF(title, columns, data, `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split("T")[0]}`);
  };

  const handlePrint = () => {
    if (data.length === 0) return alert("No data to print");
    window.print();
  };

  return (
    <div className="report-container printable animate-fade-in container">
      
      {/* 
        Global Print Styles specific to reports.
        We inject them here so any report using this wrapper gets perfect A4 printing.
      */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .printable, .printable * { visibility: visible; }
          .printable { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            background: white !important;
          }
          .no-print { display: none !important; }
          .print-only-header { display: block !important; }
          
          /* Table optimizations for print */
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 4px; font-size: 10px; }
          th { background-color: #f5f5f5 !important; -webkit-print-color-adjust: exact; }
          
          /* Ensure headers repeat on new pages */
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          tr { page-break-inside: avoid; }
          
          /* Add page margins for A4 */
          @page { margin: 15mm; }
        }
      `}} />

      {/* Control Panel (Screen Only) */}
      <div className="glass-card no-print" style={{ marginBottom: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-4)', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          
          {/* Custom Filters injected by the parent page */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-4)', flex: 1 }}>
            {filters}
          </div>

          {/* Standardized Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={handleExportCSV} disabled={data.length === 0} title="Export as CSV">
              <span className="material-symbols-outlined">csv</span> CSV
            </button>
            <button className="btn btn-secondary" onClick={handleExportExcel} disabled={data.length === 0} title="Export as Excel">
              <span className="material-symbols-outlined">table</span> Excel
            </button>
            <button className="btn btn-secondary" onClick={handleExportPDF} disabled={data.length === 0} title="Export as PDF">
              <span className="material-symbols-outlined">picture_as_pdf</span> PDF
            </button>
            <button className="btn btn-primary" onClick={handlePrint} disabled={data.length === 0} title="Print directly to printer">
              <span className="material-symbols-outlined">print</span> Print
            </button>
          </div>

        </div>
      </div>

      {/* Report Content */}
      <div className="glass-card printable" style={{ overflowX: 'auto', background: 'var(--surface-color)' }}>
        {/* Hidden on screen, visible on print */}
        <ReportHeader title={title} />
        
        {/* The actual table data */}
        {data.length > 0 ? (
          children
        ) : (
          <div className="no-print" style={{ textAlign: "center", padding: "var(--spacing-6)", color: 'var(--text-muted)' }}>
            No data generated yet. Please select filters and generate the report.
          </div>
        )}
      </div>

    </div>
  );
}
