"use client";

import React, { useState, useMemo } from 'react';
import styles from './SettlementTable.module.css';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  Trash2, 
  Calendar, 
  PieChart, 
  Users 
} from 'lucide-react';

interface SettlementTableProps {
  settlements: any[];
  onDelete?: (id: string) => void;
  onQuickView?: (settlement: any) => void;
  density?: 'comfortable' | 'compact';
  currentPage?: number;
  totalPages?: number;
  totalRecords?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

type SortField = 'createdAt' | 'period' | 'revenue' | 'expense' | 'netProfit';
type SortDirection = 'asc' | 'desc';

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function SettlementTable({
  settlements = [],
  onDelete,
  onQuickView,
  density = 'comfortable',
  currentPage = 1,
  totalPages = 1,
  totalRecords = 0,
  pageSize = 50,
  onPageChange,
  onPageSizeChange
}: SettlementTableProps) {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedSettlements = useMemo(() => {
    if (!settlements || settlements.length === 0) return [];

    return [...settlements].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'createdAt') {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      } else if (sortField === 'period') {
        aVal = Number(a.year) * 100 + Number(a.month);
        bVal = Number(b.year) * 100 + Number(b.month);
      } else if (sortField === 'revenue') {
        aVal = Number(a.totalRevenue || 0);
        bVal = Number(b.totalRevenue || 0);
      } else if (sortField === 'expense') {
        aVal = Number(a.totalExpense || 0);
        bVal = Number(b.totalExpense || 0);
      } else if (sortField === 'netProfit') {
        aVal = Number(a.netProfit || 0);
        bVal = Number(b.netProfit || 0);
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [settlements, sortField, sortDirection]);

  return (
    <div className={`${styles.tableContainer} ${density === 'compact' ? styles.compact : ''}`}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              {/* Period */}
              <th 
                className={`${styles.th} ${styles.thSortable}`}
                onClick={() => handleSort('period')}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  Settlement Period
                  <span className={styles.sortIconWrapper}>
                    {sortField === 'period' ? (
                      sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    ) : (
                      <ArrowUpDown size={14} style={{ opacity: 0.4 }} />
                    )}
                  </span>
                </div>
              </th>

              {/* Date Settled */}
              <th 
                className={`${styles.th} ${styles.thSortable}`}
                onClick={() => handleSort('createdAt')}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  Audited Date
                  <span className={styles.sortIconWrapper}>
                    {sortField === 'createdAt' ? (
                      sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    ) : (
                      <ArrowUpDown size={14} style={{ opacity: 0.4 }} />
                    )}
                  </span>
                </div>
              </th>

              {/* Revenue */}
              <th 
                className={`${styles.th} ${styles.thSortable}`}
                onClick={() => handleSort('revenue')}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  Audited Revenue (BDT)
                  <span className={styles.sortIconWrapper}>
                    {sortField === 'revenue' ? (
                      sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    ) : (
                      <ArrowUpDown size={14} style={{ opacity: 0.4 }} />
                    )}
                  </span>
                </div>
              </th>

              {/* Expenses */}
              <th 
                className={`${styles.th} ${styles.thSortable}`}
                onClick={() => handleSort('expense')}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  Total Expenses (BDT)
                  <span className={styles.sortIconWrapper}>
                    {sortField === 'expense' ? (
                      sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    ) : (
                      <ArrowUpDown size={14} style={{ opacity: 0.4 }} />
                    )}
                  </span>
                </div>
              </th>

              {/* Net Profit */}
              <th 
                className={`${styles.th} ${styles.thSortable}`}
                onClick={() => handleSort('netProfit')}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  Net Profit (BDT)
                  <span className={styles.sortIconWrapper}>
                    {sortField === 'netProfit' ? (
                      sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    ) : (
                      <ArrowUpDown size={14} style={{ opacity: 0.4 }} />
                    )}
                  </span>
                </div>
              </th>

              {/* Shareholder Allocations */}
              <th className={styles.th}>
                Shareholder Split
              </th>

              {/* Actions */}
              <th className={styles.th} style={{ textAlign: 'right', paddingRight: '20px' }}>
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {sortedSettlements.map((s) => {
              const periodName = `${MONTH_NAMES[(s.month || 1) - 1]} ${s.year}`;
              const totalRevenue = Number(s.totalRevenue || 0);
              const totalExpense = Number(s.totalExpense || 0);
              const netProfit = Number(s.netProfit || 0);

              return (
                <tr 
                  key={s.id}
                  className={styles.tr}
                  onClick={() => onQuickView && onQuickView(s)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Period Badge */}
                  <td className={styles.td}>
                    <div className={styles.periodBadge}>
                      <Calendar size={14} />
                      <span>{periodName}</span>
                    </div>
                  </td>

                  {/* Date Settled */}
                  <td className={styles.td}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                      {new Date(s.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </td>

                  {/* Revenue */}
                  <td className={styles.td}>
                    <span style={{ fontWeight: 600, color: '#10b981' }}>
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(totalRevenue)}
                    </span>
                  </td>

                  {/* Expense */}
                  <td className={styles.td}>
                    <span style={{ fontWeight: 600, color: '#ef4444' }}>
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(totalExpense)}
                    </span>
                  </td>

                  {/* Net Profit */}
                  <td className={styles.td}>
                    <span className={netProfit >= 0 ? styles.profitPositive : styles.profitNegative}>
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(netProfit)}
                    </span>
                  </td>

                  {/* Shareholder Distributions */}
                  <td className={styles.td}>
                    <div className={styles.distributionPills}>
                      {s.ceoAmount !== undefined && (
                        <span className={styles.shareholderPill}>
                          CEO: <strong>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(Number(s.ceoAmount || 0))}</strong>
                        </span>
                      )}
                      {s.devAmount !== undefined && Number(s.devAmount) > 0 && (
                        <span className={styles.shareholderPill}>
                          Dev: <strong>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(Number(s.devAmount || 0))}</strong>
                        </span>
                      )}
                      {s.advisorAmount !== undefined && Number(s.advisorAmount) > 0 && (
                        <span className={styles.shareholderPill}>
                          Advisor: <strong>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(Number(s.advisorAmount || 0))}</strong>
                        </span>
                      )}
                      {s.companyAmount !== undefined && Number(s.companyAmount) > 0 && (
                        <span className={styles.shareholderPill} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                          Reserve: <strong>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(Number(s.companyAmount || 0))}</strong>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions Column */}
                  <td className={styles.td} style={{ textAlign: 'right', paddingRight: '20px' }}>
                    <div className={styles.actionGroup} onClick={(e) => e.stopPropagation()}>
                      <button
                        className={styles.iconBtn}
                        title="Quick View Settlement Report"
                        onClick={() => onQuickView && onQuickView(s)}
                      >
                        <Eye size={15} />
                      </button>

                      {onDelete && (
                        <button
                          className={styles.iconBtn}
                          title="Delete Settlement Record"
                          onClick={() => onDelete(s.id)}
                        >
                          <Trash2 size={15} color="var(--danger)" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className={styles.paginationBar}>
        <div className={styles.pageSizeSelector}>
          <span>Showing {sortedSettlements.length} of {totalRecords || sortedSettlements.length} settlement periods</span>
          {onPageSizeChange && (
            <select 
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className={styles.pageSelect}
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          )}
        </div>

        {totalPages > 1 && onPageChange && (
          <div className={styles.paginationControls}>
            <button 
              className={styles.pageBtn}
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
              .map((page, idx, arr) => (
                <React.Fragment key={page}>
                  {idx > 0 && arr[idx - 1] !== page - 1 && (
                    <span style={{ padding: '0 4px', color: 'var(--text-muted)' }}>...</span>
                  )}
                  <button
                    className={`${styles.pageBtn} ${currentPage === page ? styles.pageBtnActive : ''}`}
                    onClick={() => onPageChange(page)}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))}

            <button 
              className={styles.pageBtn}
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
