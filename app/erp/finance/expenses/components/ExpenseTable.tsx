"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './ExpenseTable.module.css';
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

interface ExpenseTableProps {
  expenses: any[];
  onDelete?: (id: string) => void;
  onQuickView?: (expense: any) => void;
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
  onBulkExport?: (selectedExpenses: any[]) => void;
}

type SortField = 'createdAt' | 'id' | 'category' | 'amount' | 'paymentMethod' | 'approvalStatus';
type SortDirection = 'asc' | 'desc';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #ef4444, #b91c1c)',
  'linear-gradient(135deg, #f97316, #c2410c)',
  'linear-gradient(135deg, #ec4899, #be185d)',
  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  'linear-gradient(135deg, #6366f1, #4338ca)',
  'linear-gradient(135deg, #0ea5e9, #0369a1)',
];

export function ExpenseTable({
  expenses = [],
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
}: ExpenseTableProps) {
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

  const sortedExpenses = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];

    return [...expenses].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'createdAt') {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      } else if (sortField === 'amount') {
        aVal = Number(a.amount || 0);
        bVal = Number(b.amount || 0);
      } else if (sortField === 'category') {
        aVal = (a.category || '').toLowerCase();
        bVal = (b.category || '').toLowerCase();
      } else if (sortField === 'paymentMethod') {
        aVal = (a.paymentMethod || '').toLowerCase();
        bVal = (b.paymentMethod || '').toLowerCase();
      } else if (sortField === 'approvalStatus') {
        aVal = (a.approvalStatus || 'APPROVED').toLowerCase();
        bVal = (b.approvalStatus || 'APPROVED').toLowerCase();
      } else if (sortField === 'id') {
        aVal = (a.id || '').toLowerCase();
        bVal = (b.id || '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [expenses, sortField, sortDirection]);

  // Master Checkbox logic
  const allSelected = sortedExpenses.length > 0 && selectedIds.size === sortedExpenses.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < sortedExpenses.length;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedExpenses.map(exp => exp.id)));
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
    const safeName = name || 'Expense';
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
    const s = (status || 'APPROVED').toUpperCase();
    if (s === 'APPROVED') return styles.statusPaid;
    if (s === 'PENDING') return styles.statusPending;
    return styles.statusRejected;
  };

  const handleBulkExportClick = () => {
    const selectedExpenses = expenses.filter(exp => selectedIds.has(exp.id));
    if (onBulkExport) {
      onBulkExport(selectedExpenses);
    } else {
      const headers = ['Reference', 'Date', 'Category', 'Payment Channel', 'Amount Paid', 'Status', 'Description'];
      const csvContent = [
        headers.join(','),
        ...selectedExpenses.map(exp => [
          `"EXP-${exp.id.slice(0, 8).toUpperCase()}"`,
          `"${new Date(exp.createdAt).toLocaleDateString()}"`,
          `"${exp.category || ''}"`,
          `"${exp.paymentMethod || ''}"`,
          `"${exp.amount || 0}"`,
          `"${exp.approvalStatus || 'APPROVED'}"`,
          `"${(exp.description || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `selected_expenses_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleBulkDeleteClick = () => {
    const ids = Array.from(selectedIds);
    if (!confirm(`Are you sure you want to delete ${ids.length} selected expense transaction(s)?`)) return;
    if (onBulkDelete) {
      onBulkDelete(ids);
      setSelectedIds(new Set());
    } else if (onDelete) {
      ids.forEach(id => onDelete(id));
      setSelectedIds(new Set());
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense transaction?')) return;
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (onRefresh) onRefresh();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || 'Failed to delete expense');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete expense');
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
                    aria-label="Select all expenses"
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

                {/* Category / Description */}
                <th 
                  className={`${styles.th} ${styles.thSortable}`}
                  onClick={() => handleSort('category')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Category / Details
                    <span className={styles.sortIconWrapper}>
                      {sortField === 'category' ? (
                        sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                      ) : (
                        <ArrowUpDown size={14} style={{ opacity: 0.4 }} />
                      )}
                    </span>
                  </div>
                </th>

                {/* Payment Method */}
                <th 
                  className={`${styles.th} ${styles.thSortable}`}
                  onClick={() => handleSort('paymentMethod')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Payment Channel
                    <span className={styles.sortIconWrapper}>
                      {sortField === 'paymentMethod' ? (
                        sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                      ) : (
                        <ArrowUpDown size={14} style={{ opacity: 0.4 }} />
                      )}
                    </span>
                  </div>
                </th>

                {/* Amount Paid */}
                <th 
                  className={`${styles.th} ${styles.thSortable}`}
                  onClick={() => handleSort('amount')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Amount (BDT)
                    <span className={styles.sortIconWrapper}>
                      {sortField === 'amount' ? (
                        sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                      ) : (
                        <ArrowUpDown size={14} style={{ opacity: 0.4 }} />
                      )}
                    </span>
                  </div>
                </th>

                {/* Approval Status */}
                <th 
                  className={`${styles.th} ${styles.thSortable}`}
                  onClick={() => handleSort('approvalStatus')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Status
                    <span className={styles.sortIconWrapper}>
                      {sortField === 'approvalStatus' ? (
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
              {sortedExpenses.map((exp) => {
                const isSelected = selectedIds.has(exp.id);
                const { initials, gradient } = getAvatarInfo(exp.category, exp.id);
                const amount = Number(exp.amount || 0);
                const status = (exp.approvalStatus || 'APPROVED').toUpperCase();
                const isMenuOpen = openMenuId === exp.id;

                return (
                  <tr 
                    key={exp.id}
                    className={`${styles.tr} ${isSelected ? styles.trSelected : ''}`}
                    onClick={() => router.push(`/erp/finance/expenses/${exp.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Row Checkbox */}
                    <td 
                      className={`${styles.td} ${styles.checkboxCell}`}
                      onClick={(e) => handleSelectRow(exp.id, e)}
                    >
                      <input
                        type="checkbox"
                        className={styles.customCheckbox}
                        checked={isSelected}
                        onChange={() => {}}
                        aria-label={`Select expense ${exp.id}`}
                      />
                    </td>

                    {/* Date */}
                    <td className={styles.td}>
                      <div className={styles.dateDisplay}>
                        <span className={styles.dateMain}>
                          {new Date(exp.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                        <span className={styles.dateSub}>
                          {new Date(exp.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>

                    {/* Reference */}
                    <td className={styles.td}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Link 
                          href={`/erp/finance/expenses/${exp.id}`}
                          className={styles.referenceBadge}
                          onClick={(e) => e.stopPropagation()}
                        >
                          #EXP-{exp.id.slice(0, 8).toUpperCase()}
                        </Link>
                        <button
                          onClick={(e) => handleCopyText(`EXP-${exp.id.slice(0, 8).toUpperCase()}`, exp.id, e)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                          title="Copy reference code"
                        >
                          {copiedId === exp.id ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>

                    {/* Category & Memo */}
                    <td className={styles.td}>
                      <div className={styles.payeeIdentity}>
                        <div className={styles.payeeAvatar} style={{ background: gradient }}>
                          {initials}
                        </div>
                        <div className={styles.payeeDetails}>
                          <span className={styles.payeeName}>
                            {exp.category || 'General Expense'}
                          </span>
                          {exp.description && (
                            <span className={styles.payeeMemo} title={exp.description}>
                              {exp.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Payment Method */}
                    <td className={styles.td}>
                      <div className={styles.categoryBadge}>
                        <span>{exp.paymentMethod || 'Bank Transfer'}</span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className={styles.td}>
                      <div className={styles.financialBreakdown}>
                        <span className={styles.amountExpense}>
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(amount)}
                        </span>
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
                          onClick={() => onQuickView && onQuickView(exp)}
                        >
                          <Eye size={15} />
                        </button>

                        {/* 3-Dots Menu Dropdown */}
                        <div className={styles.menuWrapper}>
                          <button
                            className={styles.iconBtn}
                            onClick={() => setOpenMenuId(isMenuOpen ? null : exp.id)}
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
                                  router.push(`/erp/finance/expenses/${exp.id}`);
                                }}
                              >
                                <Receipt size={15} color="var(--primary)" />
                                <span>Full Voucher Details</span>
                              </button>

                              <button 
                                className={styles.menuItem}
                                onClick={() => {
                                  setOpenMenuId(null);
                                  router.push(`/erp/finance/expenses/${exp.id}/edit`);
                                }}
                              >
                                <Edit3 size={15} color="var(--text-muted)" />
                                <span>Edit Expense</span>
                              </button>

                              <div className={styles.menuDivider} />

                              <button 
                                className={`${styles.menuItem} ${styles.menuItemDanger}`}
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleDeleteItem(exp.id);
                                }}
                              >
                                <Trash2 size={15} color="var(--danger)" />
                                <span>Delete Expense</span>
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
            <span>Showing {sortedExpenses.length} of {totalRecords || sortedExpenses.length} transactions</span>
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
