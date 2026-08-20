"use client";

import React, { useState } from 'react';
import { exportToCSV } from '@/lib/reports/exportUtils';

const REPORT_TYPES = [
  { id: "TRIAL_BALANCE", name: "Trial Balance" },
  { id: "PROFIT_LOSS", name: "Profit & Loss Statement" },
  { id: "BALANCE_SHEET", name: "Balance Sheet" },
  { id: "CASH_FLOW", name: "Cash Flow Statement" },
  { id: "GENERAL_LEDGER", name: "General Ledger" },
  { id: "ACCOUNT_LEDGER", name: "Account Ledger" },
  { id: "INCOME_STATEMENT", name: "Income Statement" },
  { id: "EXPENSE_STATEMENT", name: "Expense Statement" },
  { id: "PAYROLL_COST", name: "Payroll Cost Report" },
  { id: "DEPARTMENT_EXPENSE", name: "Department Expense Report" },
  { id: "MEMBER_LOAN", name: "Member Loan Report" },
  { id: "ADVANCE", name: "Advance Report" },
  { id: "SETTLEMENT", name: "Settlement Report" },
  { id: "RESERVE", name: "Reserve Report" },
  { id: "FUND", name: "Fund Report" },
];

export default function FinanceReportsHub() {
  const [selectedReport, setSelectedReport] = useState("TRIAL_BALANCE");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Specific Filters
  const [accountType, setAccountType] = useState("CASH");

  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateReport = async () => {
    setIsLoading(true);
    try {
      let url = `/api/reports/finance?type=${selectedReport}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (selectedReport === "ACCOUNT_LEDGER") url += `&accountType=${accountType}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setReportData(data.report || []);
        await logAudit("GENERATED");
      } else {
        alert("Failed to generate report.");
      }
    } catch (e) {
      console.error(e);
      alert("Error generating report.");
    } finally {
      setIsLoading(false);
    }
  };

  const logAudit = async (action: string, format?: string) => {
    try {
      await fetch("/api/reports/finance/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportName: selectedReport,
          action,
          format,
          filters: { startDate, endDate, accountType }
        })
      });
    } catch (e) {
      console.error("Failed to log audit", e);
    }
  };

  const handleExportCSV = async () => {
    if (reportData.length === 0) return alert("Generate the report first");
    await logAudit("EXPORTED", "CSV");
    exportToCSV(reportData, `${selectedReport}_${new Date().toISOString().split("T")[0]}`);
  };

  const handlePrint = async () => {
    if (reportData.length === 0) return alert("Generate the report first");
    await logAudit("PRINTED", "PDF");
    window.print();
  };

  const renderTableHeaders = () => {
    if (reportData.length === 0) return null;
    const keys = Object.keys(reportData[0]);
    return keys.map(key => <th key={key} style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px', textAlign: 'left' }}>{key.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}</th>);
  };

  const renderTableRows = () => {
    return reportData.map((row, idx) => (
      <tr key={idx} style={{ borderBottom: '1px solid var(--border-main)', background: idx % 2 === 0 ? 'transparent' : 'var(--surface-hover)' }}>
        {Object.keys(row).map(key => (
          <td key={key} style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--text-main)' }}>
            {typeof row[key] === 'object' ? JSON.stringify(row[key]) : 
             typeof row[key] === 'number' && key.toLowerCase().includes('total') || key.toLowerCase().includes('amount') || key.toLowerCase().includes('balance') || key.toLowerCase().includes('cost') || key.toLowerCase().includes('profit') || key.toLowerCase().includes('expense') || key.toLowerCase().includes('cash') || key.toLowerCase().includes('debit') || key.toLowerCase().includes('credit') || key.toLowerCase().includes('assets') || key.toLowerCase().includes('liabilities') || key.toLowerCase().includes('equity')
              ? `৳${Number(row[key]).toLocaleString()}` 
              : String(row[key])}
          </td>
        ))}
      </tr>
    ));
  };

  return (
    <div className="animate-fade-in printable" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .printable, .printable * { visibility: visible; }
          .printable { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}} />

      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Financial Reports</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            Generate, view, and export enterprise financial reports.
          </p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="glass-panel no-print" style={{ padding: '24px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
          
          <div style={{ flex: '1 1 250px' }}>
            <label style={ls}>Report Type</label>
            <select value={selectedReport} onChange={(e) => { setSelectedReport(e.target.value); setReportData([]); }} style={is}>
              {REPORT_TYPES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <label style={ls}>Start Date (Optional)</label>
            <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setReportData([]); }} style={is} />
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <label style={ls}>End Date (Optional)</label>
            <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setReportData([]); }} style={is} />
          </div>

          {selectedReport === "ACCOUNT_LEDGER" && (
            <div style={{ flex: '1 1 150px' }}>
              <label style={ls}>Account Type</label>
              <select value={accountType} onChange={(e) => { setAccountType(e.target.value); setReportData([]); }} style={is}>
                <option value="CASH">Cash</option>
                <option value="BANK">Bank</option>
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
                <option value="PAYROLL">Payroll</option>
              </select>
            </div>
          )}

          <div style={{ flex: '1 1 100%' }}></div>

          <button className="btn btn-primary hover-lift" onClick={generateReport} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', fontWeight: 600 }}>
            {isLoading ? <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>autorenew</span> : <span className="material-symbols-outlined">analytics</span>}
            {isLoading ? 'Generating...' : 'Generate Report'}
          </button>
          
          <button className="btn btn-secondary" onClick={handleExportCSV} disabled={reportData.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>csv</span> Export CSV
          </button>
          
          <button className="btn btn-secondary" onClick={handlePrint} disabled={reportData.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>print</span> Print / PDF
          </button>
        </div>
      </div>

      {/* Report Preview */}
      <div className="glass-panel printable" style={{ padding: '32px', borderRadius: '16px', background: 'var(--surface-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '2px solid var(--border-main)', paddingBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '22px', margin: 0, textTransform: 'capitalize', color: 'var(--text-main)' }}>
              {selectedReport.replace(/_/g, " ")}
            </h2>
            {startDate || endDate ? (
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Period: {startDate || 'Start'} to {endDate || 'End'}
              </div>
            ) : null}
          </div>
          <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {reportData.length > 0 && <span style={{ padding: '6px 12px', background: 'var(--success-subtle)', color: 'var(--success)', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>{reportData.length} records generated</span>}
          </div>
        </div>
        
        {reportData.length > 0 ? (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-main)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--surface-hover)', borderBottom: '2px solid var(--border-main)' }}>
                  {renderTableHeaders()}
                </tr>
              </thead>
              <tbody>
                {renderTableRows()}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 0", color: 'var(--text-muted)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.3, display: 'block', marginBottom: '16px' }}}>receipt_long</span>
            No data generated yet. Please select filters and click "Generate Report".
          </div>
        )}
      </div>
    </div>
  );
}

const ls: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' };
const is: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' };
