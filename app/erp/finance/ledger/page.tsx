"use client";

import React, { useState, useEffect } from 'react';
import styles from "../../income/page.module.css";
import Link from 'next/link';

type LedgerEntry = {
  id: string;
  date: string;
  voucherNo: string;
  voucherType: string;
  module: string;
  accountType: string;
  debit: string;
  credit: string;
  status: string;
  description: string;
  createdBy: { name: string; email: string } | null;
  createdAt: string;
};

export default function UnifiedLedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModule, setFilterModule] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchLedgerEntries();
  }, [filterModule, searchQuery]);

  const fetchLedgerEntries = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/ledger?module=${filterModule}&search=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (val: string | number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val));
  };

  const totalPages = Math.max(1, Math.ceil(entries.length / itemsPerPage));
  const paginatedEntries = entries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Calculate Running Balance (assuming list is sorted desc, so we calculate from bottom up if we wanted true running balance, 
  // but for a simple datatable, we just display Debit/Credit per row)
  
  const getBadgeClass = (moduleName: string) => {
    switch (moduleName) {
      case 'Income': return styles['badge-success'] || 'badge bg-success';
      case 'Expense': return styles['badge-danger'] || 'badge bg-danger';
      case 'Payroll': return styles['badge-partial'] || 'badge bg-warning';
      case 'Advance': return styles['badge-unpaid'] || 'badge bg-info';
      case 'Loan': return styles['badge-paid'] || 'badge bg-primary';
      case 'Reserve': return styles['badge-secondary'] || 'badge bg-secondary';
      case 'Fund': return styles['badge-success'] || 'badge bg-success';
      default: return 'badge bg-dark';
    }
  };

  return (
    <div className="animate-fade-in container" style={{ maxWidth: '1400px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <div>
          <h1 style={{ margin: 0 }}>Unified General Ledger</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>
            Chronological log of all financial transactions across the company.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>print</span>
            Print Ledger
          </button>
        </div>
      </div>

      <div className={styles.container}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          
          {/* Filters Section */}
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup} style={{ flex: 1.5 }}>
              <label className="label">Search Reference or Voucher</label>
              <input 
                type="text" 
                className="input" 
                placeholder="e.g. VCH-0001, Server costs..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Module</label>
              <select className="input" value={filterModule} onChange={(e) => setFilterModule(e.target.value)}>
                <option value="ALL">All Modules</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
                <option value="Payroll">Payroll</option>
                <option value="Advance">Advance</option>
                <option value="Loan">Loan</option>
                <option value="Reserve">Reserve</option>
                <option value="Fund">Fund</option>
                <option value="Settlement">Settlement</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className={styles.tableContainer} style={{ overflowX: 'auto' }} id="printable-ledger">
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Voucher No</th>
                  <th>Module</th>
                  <th style={{ minWidth: '250px' }}>Description / Particulars</th>
                  <th>Account Type</th>
                  <th style={{ textAlign: 'right' }}>Debit (In)</th>
                  <th style={{ textAlign: 'right' }}>Credit (Out)</th>
                  <th style={{ textAlign: 'center' }}>Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center' }}>Loading ledger...</td></tr>
                ) : paginatedEntries.length > 0 ? (
                  paginatedEntries.map((entry) => {
                    return (
                      <tr key={entry.id} className={styles.clickableRow}>
                        <td style={{ fontSize: '13px' }}>
                          <div style={{ fontWeight: 500 }}>{new Date(entry.createdAt).toLocaleDateString()}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(entry.createdAt).toLocaleTimeString()}</div>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                          <div>{entry.voucherNo}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{entry.voucherType}</div>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${getBadgeClass(entry.module)}`} style={{ fontSize: '10px' }}>
                            {entry.module}
                          </span>
                        </td>
                        <td style={{ fontSize: '13px' }}>{entry.description || '-'}</td>
                        <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{entry.accountType}</td>
                        <td style={{ textAlign: 'right', fontWeight: Number(entry.debit) > 0 ? 'bold' : 'normal', color: Number(entry.debit) > 0 ? 'var(--success)' : 'inherit' }}>
                          {Number(entry.debit) > 0 ? formatCurrency(entry.debit) : '-'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: Number(entry.credit) > 0 ? 'bold' : 'normal', color: Number(entry.credit) > 0 ? 'var(--danger)' : 'inherit' }}>
                          {Number(entry.credit) > 0 ? formatCurrency(entry.credit) : '-'}
                        </td>
                        <td style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                          {entry.createdBy?.name || 'System Auto'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "var(--spacing-6)" }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5 }}>receipt_long</span>
                        <p>No ledger entries found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, entries.length)} of {entries.length} entries
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn btn-secondary" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  Previous
                </button>
                <button 
                  className="btn btn-secondary" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #printable-ledger, #printable-ledger * { visibility: visible; }
          #printable-ledger { position: absolute; left: 0; top: 0; width: 100%; }
          .btn { display: none !important; }
        }
      `}} />

    </div>
  );
}
