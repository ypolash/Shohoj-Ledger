"use client";

import React, { useState } from 'react';
import { exportToCSV } from '@/lib/reports/exportUtils';
import styles from "../../income/page.module.css";

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
    return keys.map(key => <th key={key}>{key}</th>);
  };

  const renderTableRows = () => {
    return reportData.map((row, idx) => (
      <tr key={idx}>
        {Object.keys(row).map(key => (
          <td key={key}>
            {typeof row[key] === 'object' ? JSON.stringify(row[key]) : String(row[key])}
          </td>
        ))}
      </tr>
    ));
  };

  return (
    <div className="animate-fade-in container printable">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .printable, .printable * { visibility: visible; }
          .printable { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}} />

      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <div>
          <h1 style={{ margin: 0 }}>Financial Reports Hub</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>
            Generate, view, and export enterprise financial reports.
          </p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="glass-card no-print" style={{ marginBottom: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-4)', alignItems: 'flex-end' }}>
          
          <div style={{ flex: '1 1 250px' }}>
            <label className="label">Report Type</label>
            <select className="input" value={selectedReport} onChange={(e) => setSelectedReport(e.target.value)}>
              {REPORT_TYPES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <label className="label">Start Date (Optional)</label>
            <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <label className="label">End Date (Optional)</label>
            <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>

          {selectedReport === "ACCOUNT_LEDGER" && (
            <div style={{ flex: '1 1 150px' }}>
              <label className="label">Account Type</label>
              <select className="input" value={accountType} onChange={(e) => setAccountType(e.target.value)}>
                <option value="CASH">Cash</option>
                <option value="BANK">Bank</option>
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
                <option value="PAYROLL">Payroll</option>
              </select>
            </div>
          )}

          <div style={{ flex: '1 1 100%' }}></div>

          <button className="btn btn-primary" onClick={generateReport} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Report'}
          </button>
          
          <button className="btn btn-secondary" onClick={handleExportCSV} disabled={reportData.length === 0}>
            <span className="material-symbols-outlined">csv</span> Export CSV
          </button>
          
          <button className="btn btn-secondary" onClick={handlePrint} disabled={reportData.length === 0}>
            <span className="material-symbols-outlined">print</span> Print / PDF
          </button>
        </div>
      </div>

      {/* Report Preview */}
      <div className="glass-card printable">
        <h2 style={{ fontSize: '18px', marginBottom: 'var(--spacing-4)', textTransform: 'capitalize' }}>
          {selectedReport.replace(/_/g, " ")} {startDate && endDate ? `(${startDate} to ${endDate})` : ""}
        </h2>
        
        {reportData.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table} style={{ width: '100%' }}>
              <thead>
                <tr>{renderTableHeaders()}</tr>
              </thead>
              <tbody>
                {renderTableRows()}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "var(--spacing-6)", color: 'var(--text-muted)' }}>
            No data generated yet. Please select filters and click "Generate Report".
          </div>
        )}
      </div>

    </div>
  );
}
