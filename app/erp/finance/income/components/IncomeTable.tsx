"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './IncomeTable.module.css';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  MoreVertical, 
  Eye, 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  Calendar, 
  Wallet,
  Receipt,
  FileText
} from 'lucide-react';

interface IncomeTableProps {
  incomes: any[];
  onDelete?: (id: string) => void;
  onQuickView?: (income: any) => void;
  onRefresh?: () => void;
  density?: 'comfortable' | 'compact';
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  totalRecords?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkExport?: (selectedIncomes: any[]) => void;
}

type SortField = 'createdAt' | 'id' | 'source' | 'category' | 'amount' | 'paymentStatus';
type SortDirection = 'asc' | 'desc';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #10b981, #047857)',
  'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  'linear-gradient(135deg, #f59e0b, #b45309)',
  'linear-gradient(135deg, #ec4899, #be185d)',
  'linear-gradient(135deg, #06b6d4, #0e7490)',
  'linear-gradient(135deg, #6366f1, #4338ca)',
];

export function IncomeTable({
  incomes = [],
  onDelete,
  onQuickView,
  onRefresh,
  density = 'comfortable',
  currentPage = 1,
  totalPages = 1,
  totalRecords = 0,
  pageSize = 50,
  onPageChange,
  onPageSizeChange,
  onBulkDelete,
  onBulkExport
}: IncomeTableProps) {
  const router = useRouter();

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Dropdown menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Copied indicator state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'createdAt' || field === 'amount' ? 'desc' : 'asc');
    }
  };

  const sortedIncomes = useMemo(() => {
    if (!incomes || incomes.length === 0) return [];

    return [...incomes].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'createdAt') {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      } else if (sortField === 'amount') {
        aVal = Number(a.amount || 0);
        bVal = Number(b.amount || 0);
      } else if (sortField === 'source') {
        aVal = (a.source || '').toLowerCase();
        bVal = (b.source || '').toLowerCase();
      } else if (sortField === 'category') {
        aVal = (a.category || '').toLowerCase();
        bVal = (b.category || '').toLowerCase();
      } else if (sortField === 'paymentStatus') {
        aVal = (a.paymentStatus || 'UNPAID').toLowerCase();
        bVal = (b.paymentStatus || 'UNPAID').toLowerCase();
      } else if (sortField === 'id') {
        aVal = (a.id || '').toLowerCase();
        bVal = (b.id || '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [incomes, sortField, sortDirection]);

  // Master Checkbox logic
  const allSelected = sortedIncomes.length > 0 && selectedIds.size === sortedIncomes.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < sortedIncomes.length;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedIncomes.map(inc => inc.id)));
    }
  };

  const handleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopyText = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getAvatarInfo = (name: string, id: string) => {
    const safeName = name || 'Income';
    const initials = safeName
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    const gradient = AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
    return { initials, gradient };
  };

  const getStatusClass = (status?: string) => {
    const s = (status || 'UNPAID').toUpperCase();
    if (s === 'PAID') return styles.statusPaid;
    if (s === 'PARTIAL') return styles.statusPartial;
    return styles.statusUnpaid;
  };

  const handleBulkExportClick = () => {
    const selectedIncomes = incomes.filter(inc => selectedIds.has(inc.id));
    if (onBulkExport) {
      onBulkExport(selectedIncomes);
    } else {
      const headers = ['Reference', 'Date', 'Payer / Source', 'Category', 'Total Amount', 'Received Amount', 'Balance Due', 'Status', 'Memo'];
      const csvContent = [
        headers.join(','),
        ...selectedIncomes.map(inc => [
          `"INC-${inc.id.slice(0, 8).toUpperCase()}"`,
          `"${new Date(inc.createdAt).toLocaleDateString()}"`,
          `"${inc.source || ''}"`,
          `"${inc.category || ''}"`,
          `"${inc.amount || 0}"`,
          `"${inc.received || 0}"`,
          `"${Math.max(0, Number(inc.amount || 0) - Number(inc.received || 0))}"`,
          `"${inc.paymentStatus || 'UNPAID'}"`,
          `"${(inc.description || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `selected_income_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleBulkDeleteClick = () => {
    const ids = Array.from(selectedIds);
    if (!confirm(`Are you sure you want to delete ${ids.length} selected income transaction(s)?`)) return;
    if (onBulkDelete) {
      onBulkDelete(ids);
      setSelectedIds(new Set());
    } else if (onDelete) {
      ids.forEach(id => onDelete(id));
      setSelectedIds(new Set());
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income transaction?')) return;
    try {
      const res = await fetch(`/api/income?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (onRefresh) onRefresh();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || 'Failed to delete income');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete income');
    }
  };

  return (
    <>
      <div className={`${styles.tableContainer} ${density === 'compact' ? styles.compact : ''}`}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                {/* Select All Checkbox */}
                <th className={`${styles.th} ${styles.checkboxCell}`}>
                  <input
                    type="checkbox"
                    className={styles.customCheckbox}
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={handleSelectAll}
                    aria-label="Select all incomes"
                  />
                </th>

                {/* Date */}
                <th 
                  className={`${styles.th} ${styles.thSortable}`}
                  onClick={() => handleSort('createdAt')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Date
                    <span className={styles.sortIconWrapper}>
                      {sortField === 'createdAt' ? (
                        sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                      ) : (
                        <ArrowUpDown size={14} style={{ opacity: 0.4 }} />
                      )}
                    </span>
                  </div>
                </th>

                {/* Reference */}
                <th 
                  className={`${styles.th} ${styles.thSortable}`}
                  onClick={() => handleSort('id')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Reference
                    <span className={styles.sortIconWrapper}>
                      {sortField === 'id' ? (
                        sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                      ) : (
                        <ArrowUpDown size={14} style={{ opacity: 0.4 }} />
                      )}
                    </span>
                  </div>
                </th>

                {/* Payer / Source */}
                <th 
                  className={`${styles.th} ${styles.thSortable}`}
                  onClick={() => handleSort('source')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Payer / Source
                    <span className={styles.sortIconWrapper}>
                      {sortField === 'source' ? (
                        sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                      ) : (
                        <ArrowUpDown size={14} style={{ opacity: 0.4 }} />
                      )}
                    </span>
                  </div>
                </th>

                {/* Category */}
                <th 
                  className={`${styles.th} ${styles.thSortable}`}
                  onClick={() => handleSort('category')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Category
                    <span className={styles.sortIconWrapper}>
                      {sortField === 'category' ? (
                        sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                      ) : (
                        <ArrowUpDown size={14} style={{ opacity: 0.4 }} />
                      )}
                    </span>
                  </div>
                </th>

                {/* Amount Received / Total */}
                <th 
                  className={`${styles.th} ${styles.thSortable}`}
                  onClick={() => handleSort('amount')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Received / Total (BDT)
                    <span className={styles.sortIconWrapper}>
                      {sortField === 'amount' ? (
                        sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                      ) : (
                        <ArrowUpDown size={14} style={{ opacity: 0.4 }} />
                      )}
                    </span>
                  </div>
                </th>

                {/* Status */}
                <th 
                  className={`${styles.th} ${styles.thSortable}`}
                  onClick={() => handleSort('paymentStatus')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Status
                    <span className={styles.sortIconWrapper}>
                      {sortField === 'paymentStatus' ? (
                        sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                      ) : (
                        <ArrowUpDown size={14} style={{ opacity: 0.4 }} />
                      )}
                    </span>
                  </div>
                </th>

                {/* Actions */}
                <th className={styles.th} style={{ textAlign: 'right', paddingRight: '20px' }}>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {sortedIncomes.map((inc) => {
                const isSelected = selectedIds.has(inc.id);
                const { initials, gradient } = getAvatarInfo(inc.source || inc.category, inc.id);
                const totalAmount = Number(inc.amount || 0);
                const receivedAmount = Number(inc.received || 0);
                const dueAmount = Math.max(0, totalAmount - receivedAmount);
                const percentCollected = totalAmount > 0 ? Math.min(100, Math.round((receivedAmount / totalAmount) * 100)) : 0;
                const status = (inc.paymentStatus || (receivedAmount >= totalAmount ? 'PAID' : receivedAmount > 0 ? 'PARTIAL' : 'UNPAID')).toUpperCase();
                const isMenuOpen = openMenuId === inc.id;

                return (
                  <tr 
                    key={inc.id}
                    className={`${styles.tr} ${isSelected ? styles.trSelected : ''}`}
                    onClick={() => router.push(`/erp/finance/income/${inc.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Row Checkbox */}
                    <td 
                      className={`${styles.td} ${styles.checkboxCell}`}
                      onClick={(e) => handleSelectRow(inc.id, e)}
                    >
                      <input
                        type="checkbox"
                        className={styles.customCheckbox}
                        checked={isSelected}
                        onChange={() => {}}
                        aria-label={`Select income ${inc.id}`}
                      />
                    </td>

                    {/* Date */}
                    <td className={styles.td}>
                      <div className={styles.dateDisplay}>
                        <span className={styles.dateMain}>
                          {new Date(inc.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                        <span className={styles.dateSub}>
                          {new Date(inc.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>

                    {/* Reference */}
                    <td className={styles.td}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Link 
                          href={`/erp/finance/income/${inc.id}`}
                          className={styles.referenceBadge}
                          onClick={(e) => e.stopPropagation()}
                        >
                          #INC-{inc.id.slice(0, 8).toUpperCase()}
                        </Link>
                        <button
                          onClick={(e) => handleCopyText(`INC-${inc.id.slice(0, 8).toUpperCase()}`, inc.id, e)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                          title="Copy reference code"
                        >
                          {copiedId === inc.id ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>

                    {/* Source / Payer */}
                    <td className={styles.td}>
                      <div className={styles.sourceIdentity}>
                        <div className={styles.sourceAvatar} style={{ background: gradient }}>
                          {initials}
                        </div>
                        <div className={styles.sourceDetails}>
                          <span className={styles.sourceName}>
                            {inc.source || 'General Revenue'}
                          </span>
                          {inc.description && (
                            <span className={styles.sourceMemo} title={inc.description}>
                              {inc.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className={styles.td}>
                      <div className={styles.categoryBadge}>
                        <span>{inc.category || 'General'}</span>
                      </div>
                    </td>

                    {/* Received / Total Breakdown */}
                    <td className={styles.td}>
                      <div className={styles.financialBreakdown}>
                        <div className={styles.amountReceived}>
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(receivedAmount)}
                        </div>
                        <div className={styles.amountMeta}>
                          <span>Total: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(totalAmount)}</span>
                          {dueAmount > 0 && (
                            <span style={{ color: 'var(--warning)', fontWeight: 600 }}>Due: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(dueAmount)}</span>
                          )}
                        </div>
                        <div className={styles.collectionBarTrack}>
                          <div 
                            className={`${styles.collectionBarFill} ${
                              percentCollected === 100 
                                ? styles.collectionPaid 
                                : percentCollected > 0 
                                  ? styles.collectionPartial 
                                  : styles.collectionUnpaid
                            }`}
                            style={{ width: `${percentCollected}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status Pill */}
                    <td className={styles.td}>
                      <span className={`${styles.statusBadge} ${getStatusClass(status)}`}>
                        <span className={styles.statusDot} />
                        {status}
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td className={styles.td} style={{ textAlign: 'right', paddingRight: '20px' }}>
                      <div className={styles.actionGroup} onClick={(e) => e.stopPropagation()}>
                        
                        {/* Quick Preview Button */}
                        <button
                          className={styles.iconBtn}
                          title="Quick View Voucher"
                          onClick={() => onQuickView && onQuickView(inc)}
                        >
                          <Eye size={15} />
                        </button>

                        {/* 3-Dots Menu Dropdown */}
                        <div className={styles.menuWrapper}>
                          <button
                            className={styles.iconBtn}
                            onClick={() => setOpenMenuId(isMenuOpen ? null : inc.id)}
                            title="More actions"
                          >
                            <MoreVertical size={15} />
                          </button>

                          {isMenuOpen && (
                            <div className={styles.dropdownMenu} onMouseLeave={() => setOpenMenuId(null)}>
                              <button 
                                className={styles.menuItem}
                                onClick={() => {
                                  setOpenMenuId(null);
                                  router.push(`/erp/finance/income/${inc.id}`);
                                }}
                              >
                                <Receipt size={15} color="var(--primary)" />
                                <span>Full Voucher Details</span>
                              </button>

                              <button 
                                className={styles.menuItem}
                                onClick={() => {
                                  setOpenMenuId(null);
                                  router.push(`/erp/finance/income/${inc.id}/edit`);
                                }}
                              >
                                <Edit3 size={15} color="var(--text-muted)" />
                                <span>Edit Income</span>
                              </button>

                              <div className={styles.menuDivider} />

                              <button 
                                className={`${styles.menuItem} ${styles.menuItemDanger}`}
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleDeleteItem(inc.id);
                                }}
                              >
                                <Trash2 size={15} color="var(--danger)" />
                                <span>Delete Income</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Bar */}
        <div className={styles.paginationBar}>
          <div className={styles.pageSizeSelector}>
            <span>Showing {sortedIncomes.length} of {totalRecords || sortedIncomes.length} transactions</span>
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

      {/* Floating Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className={styles.bulkActionBar}>
          <div className={styles.bulkCount}>
            <span className={styles.bulkBadge}>{selectedIds.size}</span>
            <span>selected</span>
          </div>

          <div className={styles.bulkActions}>
            <button 
              className={styles.bulkBtn}
              onClick={handleBulkExportClick}
            >
              <Download size={15} />
              Export Selected
            </button>

            <button 
              className={`${styles.bulkBtn} ${styles.bulkBtnDanger}`}
              onClick={handleBulkDeleteClick}
            >
              <Trash2 size={15} />
              Delete Selected
            </button>

            <button 
              className={styles.bulkBtn}
              onClick={() => setSelectedIds(new Set())}
              style={{ background: 'transparent', border: 'none' }}
            >
              Deselect All
            </button>
          </div>
        </div>
      )}
    </>
  );
}
