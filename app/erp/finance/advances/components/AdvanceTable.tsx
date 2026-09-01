"use client";

import React, { useState, useMemo } from 'react';
import styles from './AdvanceTable.module.css';
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
  User 
} from 'lucide-react';

interface AdvanceTableProps {
  advances: any[];
  onEdit: (advance: any) => void;
  onDelete: (id: string) => void;
  onQuickView?: (advance: any) => void;
  density?: 'comfortable' | 'compact';
  currentPage?: number;
  totalPages?: number;
  totalRecords?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkExport?: (selectedAdvances: any[]) => void;
}

type SortField = 'createdAt' | 'id' | 'member' | 'amount';
type SortDirection = 'asc' | 'desc';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  'linear-gradient(135deg, #10b981, #047857)',
  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  'linear-gradient(135deg, #ec4899, #be185d)',
];

export function AdvanceTable({
  advances = [],
  onEdit,
  onDelete,
  onQuickView,
  density = 'comfortable',
  currentPage = 1,
  totalPages = 1,
  totalRecords = 0,
  pageSize = 50,
  onPageChange,
  onPageSizeChange,
  onBulkDelete,
  onBulkExport
}: AdvanceTableProps) {
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

  const sortedAdvances = useMemo(() => {
    if (!advances || advances.length === 0) return [];

    return [...advances].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'createdAt') {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      } else if (sortField === 'amount') {
        aVal = Number(a.amount || 0);
        bVal = Number(b.amount || 0);
      } else if (sortField === 'member') {
        aVal = (a.member?.name || '').toLowerCase();
        bVal = (b.member?.name || '').toLowerCase();
      } else if (sortField === 'id') {
        aVal = (a.id || '').toLowerCase();
        bVal = (b.id || '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [advances, sortField, sortDirection]);

  // Master Checkbox logic
  const allSelected = sortedAdvances.length > 0 && selectedIds.size === sortedAdvances.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < sortedAdvances.length;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedAdvances.map(adv => adv.id)));
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
    const safeName = name || 'Staff';
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

  const handleBulkExportClick = () => {
    const selectedAdvances = advances.filter(adv => selectedIds.has(adv.id));
    if (onBulkExport) {
      onBulkExport(selectedAdvances);
    } else {
      const headers = ['Reference', 'Date', 'Staff Member', 'Amount Issued', 'Reason'];
      const csvContent = [
        headers.join(','),
        ...selectedAdvances.map(adv => [
          `"ADV-${adv.id.slice(0, 8).toUpperCase()}"`,
          `"${new Date(adv.createdAt).toLocaleDateString()}"`,
          `"${adv.member?.name || 'Staff'}"`,
          `"${adv.amount || 0}"`,
          `"${(adv.reason || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `selected_advances_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleBulkDeleteClick = () => {
    const ids = Array.from(selectedIds);
    if (!confirm(`Are you sure you want to delete ${ids.length} selected advance transaction(s)?`)) return;
    if (onBulkDelete) {
      onBulkDelete(ids);
      setSelectedIds(new Set());
    } else {
      ids.forEach(id => onDelete(id));
      setSelectedIds(new Set());
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
                    aria-label="Select all advances"
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

                {/* Staff Member */}
                <th 
                  className={`${styles.th} ${styles.thSortable}`}
                  onClick={() => handleSort('member')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Staff Member
                    <span className={styles.sortIconWrapper}>
                      {sortField === 'member' ? (
                        sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                      ) : (
                        <ArrowUpDown size={14} style={{ opacity: 0.4 }} />
                      )}
                    </span>
                  </div>
                </th>

                {/* Amount */}
                <th 
                  className={`${styles.th} ${styles.thSortable}`}
                  onClick={() => handleSort('amount')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Advance Amount (BDT)
                    <span className={styles.sortIconWrapper}>
                      {sortField === 'amount' ? (
                        sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                      ) : (
                        <ArrowUpDown size={14} style={{ opacity: 0.4 }} />
                      )}
                    </span>
                  </div>
                </th>

                {/* Reason / Memo */}
                <th className={styles.th}>
                  Purpose / Reason
                </th>

                {/* Status */}
                <th className={styles.th}>
                  Status
                </th>

                {/* Actions */}
                <th className={styles.th} style={{ textAlign: 'right', paddingRight: '20px' }}>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {sortedAdvances.map((adv) => {
                const isSelected = selectedIds.has(adv.id);
                const employeeName = adv.member?.name || 'Staff Member';
                const { initials, gradient } = getAvatarInfo(employeeName, adv.id);
                const amount = Number(adv.amount || 0);
                const isMenuOpen = openMenuId === adv.id;

                return (
                  <tr 
                    key={adv.id}
                    className={`${styles.tr} ${isSelected ? styles.trSelected : ''}`}
                    onClick={() => onQuickView && onQuickView(adv)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Row Checkbox */}
                    <td 
                      className={`${styles.td} ${styles.checkboxCell}`}
                      onClick={(e) => handleSelectRow(adv.id, e)}
                    >
                      <input
                        type="checkbox"
                        className={styles.customCheckbox}
                        checked={isSelected}
                        onChange={() => {}}
                        aria-label={`Select advance ${adv.id}`}
                      />
                    </td>

                    {/* Date */}
                    <td className={styles.td}>
                      <div className={styles.dateDisplay}>
                        <span className={styles.dateMain}>
                          {new Date(adv.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                        <span className={styles.dateSub}>
                          {new Date(adv.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>

                    {/* Reference */}
                    <td className={styles.td}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          color: 'var(--warning, #f59e0b)',
                          background: 'rgba(245, 158, 11, 0.1)',
                          padding: '3px 8px',
                          borderRadius: '6px'
                        }}>
                          #ADV-{adv.id.slice(0, 8).toUpperCase()}
                        </span>
                        <button
                          onClick={(e) => handleCopyText(`ADV-${adv.id.slice(0, 8).toUpperCase()}`, adv.id, e)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                          title="Copy reference code"
                        >
                          {copiedId === adv.id ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>

                    {/* Staff Member */}
                    <td className={styles.td}>
                      <div className={styles.employeeIdentity}>
                        <div className={styles.employeeAvatar} style={{ background: gradient }}>
                          {initials}
                        </div>
                        <div className={styles.employeeDetails}>
                          <span className={styles.employeeName}>
                            {employeeName}
                          </span>
                          <span className={styles.employeeSub}>
                            ID: {adv.memberId ? adv.memberId.slice(0, 8) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className={styles.td}>
                      <div className={styles.financialBreakdown}>
                        <span className={styles.amountMain}>
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(amount)}
                        </span>
                      </div>
                    </td>

                    {/* Reason */}
                    <td className={styles.td}>
                      <span style={{ fontSize: '0.825rem', color: 'var(--text-main)', maxWidth: '240px', display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {adv.reason || 'General Advance'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className={styles.td}>
                      <span className={`${styles.statusBadge} ${styles.statusActive}`}>
                        <span className={styles.statusDot} />
                        Active
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td className={styles.td} style={{ textAlign: 'right', paddingRight: '20px' }}>
                      <div className={styles.actionGroup} onClick={(e) => e.stopPropagation()}>
                        
                        {/* Quick Preview Button */}
                        <button
                          className={styles.iconBtn}
                          title="Quick View Slip"
                          onClick={() => onQuickView && onQuickView(adv)}
                        >
                          <Eye size={15} />
                        </button>

                        {/* Edit Button */}
                        <button
                          className={styles.iconBtn}
                          title="Edit Advance"
                          onClick={() => onEdit(adv)}
                        >
                          <Edit3 size={15} color="var(--primary)" />
                        </button>

                        {/* Delete Button */}
                        <button
                          className={styles.iconBtn}
                          title="Delete Advance"
                          onClick={() => onDelete(adv.id)}
                        >
                          <Trash2 size={15} color="var(--danger)" />
                        </button>
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
            <span>Showing {sortedAdvances.length} of {totalRecords || sortedAdvances.length} transactions</span>
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
