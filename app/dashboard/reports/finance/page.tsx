"use client";

import React, { useState } from 'react';
import styles from "../../income/page.module.css";
import { ReportWrapper } from '@/components/reports/ReportWrapper';

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

  const getReportTitle = () => {
    const reportName = selectedReport.replace(/_/g, " ");
    const dateSuffix = startDate && endDate ? `(${startDate} to ${endDate})` : "";
    return `${reportName} ${dateSuffix}`.trim();
  };

  const columns = reportData.length > 0 ? Object.keys(reportData[0]) : [];

  const filters = (
    <>
      <div style={{ flex: '1 1 200px' }}>
        <label className="label">Report Type</label>
        <select className="input" value={selectedReport} onChange={(e) => setSelectedReport(e.target.value)}>
          {REPORT_TYPES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      <div style={{ flex: '1 1 130px' }}>
        <label className="label">Start Date (Optional)</label>
        <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} />
      </div>

      <div style={{ flex: '1 1 130px' }}>
        <label className="label">End Date (Optional)</label>
        <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} />
      </div>

      {selectedReport === "ACCOUNT_LEDGER" && (
        <div style={{ flex: '1 1 130px' }}>
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

      <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '4px' }}>
        <button className="btn btn-primary" onClick={generateReport} disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate'}
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <div>
          <h1 style={{ margin: 0 }}>Financial Reports Hub</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>
            Generate, view, and export enterprise financial reports.
          </p>
        </div>
      </div>

      <ReportWrapper 
        title={getReportTitle()}
        data={reportData}
        columns={columns}
        filters={filters}
      >
        <table className={styles.table} style={{ width: '100%' }}>
          <thead>
            <tr>{renderTableHeaders()}</tr>
          </thead>
          <tbody>
            {renderTableRows()}
          </tbody>
        </table>
      </ReportWrapper>
    </>
  );
}
