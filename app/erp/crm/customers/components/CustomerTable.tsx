"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './CustomerTable.module.css';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  MoreVertical, 
  Eye, 
  Edit3, 
  Trash2, 
  PlusCircle, 
  Copy, 
  Check, 
  Mail, 
  Phone, 
  Download, 
  FileText,
  CreditCard,
  Building,
  User,
  ShoppingBag
} from 'lucide-react';

interface CustomerTableProps {
  customers: any[];
  onDelete?: (id: string) => void;
  onQuickView?: (customer: any) => void;
  density?: 'comfortable' | 'compact';
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  totalRecords?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkExport?: (selectedCustomers: any[]) => void;
}

type SortField = 'name' | 'customerCode' | 'balance' | 'creditLimit' | 'status' | 'createdAt';
type SortDirection = 'asc' | 'desc';

// Vibrant avatar color palette
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  'linear-gradient(135deg, #10b981, #047857)',
  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  'linear-gradient(135deg, #f59e0b, #b45309)',
  'linear-gradient(135deg, #ec4899, #be185d)',
  'linear-gradient(135deg, #06b6d4, #0e7490)',
  'linear-gradient(135deg, #6366f1, #4338ca)',
];

export function CustomerTable({
  customers,
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
}: CustomerTableProps) {
  const router = useRouter();

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Dropdown menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Copied indicator state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Handle Sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort customers
  const sortedCustomers = useMemo(() => {
    if (!customers || customers.length === 0) return [];
    
    return [...customers].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'name') {
        aVal = (a.displayName || a.name || '').toLowerCase();
        bVal = (b.displayName || b.name || '').toLowerCase();
      } else if (sortField === 'balance') {
        aVal = Number(a.balance || a.outstandingBalance || 0);
        bVal = Number(b.balance || b.outstandingBalance || 0);
      } else if (sortField === 'creditLimit') {
        aVal = Number(a.creditLimit || 0);
        bVal = Number(b.creditLimit || 0);
      } else if (sortField === 'customerCode') {
        aVal = (a.customerCode || '').toLowerCase();
        bVal = (b.customerCode || '').toLowerCase();
      } else if (sortField === 'status') {
        aVal = (a.status || 'ACTIVE').toLowerCase();
        bVal = (b.status || 'ACTIVE').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [customers, sortField, sortDirection]);

  // Master Checkbox logic
  const allSelected = sortedCustomers.length > 0 && selectedIds.size === sortedCustomers.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < sortedCustomers.length;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedCustomers.map(c => c.id)));
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

  // Helper for generating avatar initials
  const getAvatarInfo = (name: string, id: string) => {
    const safeName = name || 'Customer';
    const initials = safeName
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    
    // Hash id for consistent gradient color
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    const gradient = AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
    return { initials, gradient };
  };

  // Helper for status badge class
  const getStatusClass = (status?: string) => {
    const s = (status || 'ACTIVE').toUpperCase();
    if (s === 'ACTIVE') return styles.statusActive;
    if (s === 'INACTIVE') return styles.statusInactive;
    return styles.statusBlocked;
  };

  // Bulk export handler
  const handleBulkExportClick = () => {
    const selectedCustomers = customers.filter(c => selectedIds.has(c.id));
    if (onBulkExport) {
      onBulkExport(selectedCustomers);
    } else {
      const headers = ['Code', 'Name', 'Email', 'Phone', 'Group', 'Balance', 'Credit Limit', 'Status'];
      const csvContent = [
        headers.join(','),
        ...selectedCustomers.map(c => [
          `"${c.customerCode || ''}"`,
          `"${c.displayName || c.name || ''}"`,
          `"${c.email || ''}"`,
          `"${c.phone || c.mobile || ''}"`,
          `"${c.customerGroup?.name || c.group?.name || ''}"`,
          `"${c.balance || c.outstandingBalance || 0}"`,
          `"${c.creditLimit || 0}"`,
          `"${c.status || 'ACTIVE'}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `selected_customers_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Bulk delete handler
  const handleBulkDeleteClick = () => {
    const ids = Array.from(selectedIds);
    if (!confirm(`Are you sure you want to delete ${ids.length} selected customer(s)?`)) return;
    if (onBulkDelete) {
      onBulkDelete(ids);
      setSelectedIds(new Set());
    } else if (onDelete) {
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
                    aria-label="Select all customers"
                  />
                </th>

                {/* Customer Name & Code */}
                <th 
                  className={`${styles.th} ${styles.thSortable}`}
                  onClick={() => handleSort('name')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Customer / Business
                    <span className={styles.sortIconWrapper}>
                      {sortField === 'name' ? (
                        sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                      ) : (
                        <ArrowUpDown size={14} style={{ opacity: 0.4 }} />
                      )}
                    </span>
                  </div>
                </th>

                {/* Contact Information */}
                <th className={styles.th}>Contact Details</th>

                {/* Customer Group */}
                <th className={styles.th}>Segment / Group</th>

                {/* Balance & Credit Health */}
                <th 
                  className={`${styles.th} ${styles.thSortable}`}
                  onClick={() => handleSort('balance')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Balance & Credit Limit
                    <span className={styles.sortIconWrapper}>
                      {sortField === 'balance' ? (
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
                  onClick={() => handleSort('status')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Status
                    <span className={styles.sortIconWrapper}>
                      {sortField === 'status' ? (
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
              {sortedCustomers.map((customer) => {
                const isSelected = selectedIds.has(customer.id);
                const { initials, gradient } = getAvatarInfo(customer.displayName || customer.name, customer.id);
                const balance = Number(customer.balance || customer.outstandingBalance || 0);
                const creditLimit = Number(customer.creditLimit || 0);
                const creditUtilizedPercent = creditLimit > 0 ? Math.min(100, Math.round((balance / creditLimit) * 100)) : 0;
                const status = (customer.status || 'ACTIVE').toUpperCase();
                const isMenuOpen = openMenuId === customer.id;

                return (
                  <tr 
                    key={customer.id}
                    className={`${styles.tr} ${isSelected ? styles.trSelected : ''}`}
                    onClick={() => router.push(`/erp/crm/customers/${customer.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Row Checkbox */}
                    <td 
                      className={`${styles.td} ${styles.checkboxCell}`}
                      onClick={(e) => handleSelectRow(customer.id, e)}
                    >
                      <input
                        type="checkbox"
                        className={styles.customCheckbox}
                        checked={isSelected}
                        onChange={() => {}}
                        aria-label={`Select ${customer.displayName || customer.name}`}
                      />
                    </td>

                    {/* Customer Identity */}
                    <td className={styles.td}>
                      <div className={styles.customerIdentity}>
                        <div className={styles.avatar} style={{ background: gradient }}>
                          {initials}
                        </div>
                        <div className={styles.customerMeta}>
                          <Link 
                            href={`/erp/crm/customers/${customer.id}`}
                            className={styles.customerName}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {customer.displayName || customer.name}
                          </Link>
                          
                          <div className={styles.codeAndTags}>
                            {customer.customerCode && (
                              <span className={styles.codeBadge}>
                                #{customer.customerCode}
                              </span>
                            )}
                            {Array.isArray(customer.tags) && customer.tags.slice(0, 2).map((tag: string, idx: number) => (
                              <span key={idx} className={styles.tagBadge}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Person & Channels */}
                    <td className={styles.td}>
                      <div className={styles.contactInfo}>
                        {customer.primaryContactPerson ? (
                          <div className={styles.contactPerson}>
                            {customer.primaryContactPerson}
                          </div>
                        ) : customer.contacts?.[0]?.name ? (
                          <div className={styles.contactPerson}>
                            {customer.contacts[0].name}
                          </div>
                        ) : (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No contact name</div>
                        )}

                        <div className={styles.contactLinkRow}>
                          {customer.email && (
                            <a 
                              href={`mailto:${customer.email}`}
                              className={styles.contactLink}
                              onClick={(e) => e.stopPropagation()}
                              title={customer.email}
                            >
                              <Mail size={13} />
                              <span>{customer.email.length > 20 ? customer.email.slice(0, 18) + '...' : customer.email}</span>
                            </a>
                          )}

                          {(customer.phone || customer.mobile) && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <a 
                                href={`tel:${customer.phone || customer.mobile}`}
                                className={styles.contactLink}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Phone size={13} />
                                <span>{customer.phone || customer.mobile}</span>
                              </a>
                              <button 
                                className={styles.copyButton}
                                title="Copy phone number"
                                onClick={(e) => handleCopyText(customer.phone || customer.mobile, customer.id + '_phone', e)}
                              >
                                {copiedId === customer.id + '_phone' ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Customer Group */}
                    <td className={styles.td}>
                      <div className={styles.groupBadge}>
                        <Building size={13} color="var(--text-muted)" />
                        <span>{customer.customerGroup?.name || customer.group?.name || 'General'}</span>
                      </div>
                    </td>

                    {/* Financial Health Meter */}
                    <td className={styles.td}>
                      <div className={styles.balanceInfo}>
                        <div className={styles.balanceAmount}>
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(balance)}
                        </div>

                        {creditLimit > 0 ? (
                          <>
                            <div className={styles.creditLimitMeta}>
                              <span>Limit: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(creditLimit)}</span>
                              <span>{creditUtilizedPercent}%</span>
                            </div>
                            <div className={styles.creditBarTrack}>
                              <div 
                                className={`${styles.creditBarFill} ${
                                  creditUtilizedPercent > 90 
                                    ? styles.creditBarDanger 
                                    : creditUtilizedPercent > 70 
                                      ? styles.creditBarWarning 
                                      : styles.creditBarSafe
                                }`}
                                style={{ width: `${creditUtilizedPercent}%` }}
                              />
                            </div>
                          </>
                        ) : (
                          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                            No credit limit set
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status Pill */}
                    <td className={styles.td}>
                      <span className={`${styles.statusBadge} ${getStatusClass(customer.status)}`}>
                        <span className={styles.statusDot} />
                        {status}
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td className={styles.td} style={{ textAlign: 'right', paddingRight: '20px' }}>
                      <div className={styles.actionGroup} onClick={(e) => e.stopPropagation()}>
                        
                        {/* Quick Order Button */}
                        <button
                          className={styles.quickOrderBtn}
                          title="Create Sales Order"
                          onClick={() => router.push(`/erp/crm/sales-orders/new?customerId=${customer.id}`)}
                        >
                          <ShoppingBag size={14} />
                          <span>Order</span>
                        </button>

                        {/* Quick Preview Button */}
                        <button
                          className={styles.iconBtn}
                          title="Quick View Details"
                          onClick={() => onQuickView && onQuickView(customer)}
                        >
                          <Eye size={15} />
                        </button>

                        {/* 3-Dots Menu Dropdown */}
                        <div className={styles.menuWrapper}>
                          <button
                            className={styles.iconBtn}
                            onClick={() => setOpenMenuId(isMenuOpen ? null : customer.id)}
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
                                  router.push(`/erp/crm/customers/${customer.id}`);
                                }}
                              >
                                <User size={15} color="var(--primary)" />
                                <span>Full Customer Profile</span>
                              </button>

                              <button 
                                className={styles.menuItem}
                                onClick={() => {
                                  setOpenMenuId(null);
                                  router.push(`/erp/crm/customers/${customer.id}/edit`);
                                }}
                              >
                                <Edit3 size={15} color="var(--text-muted)" />
                                <span>Edit Customer</span>
                              </button>

                              <button 
                                className={styles.menuItem}
                                onClick={() => {
                                  setOpenMenuId(null);
                                  router.push(`/erp/crm/quotations/new?customerId=${customer.id}`);
                                }}
                              >
                                <FileText size={15} color="var(--text-muted)" />
                                <span>Create Quotation</span>
                              </button>

                              <div className={styles.menuDivider} />

                              <button 
                                className={`${styles.menuItem} ${styles.menuItemDanger}`}
                                onClick={() => {
                                  setOpenMenuId(null);
                                  if (onDelete) onDelete(customer.id);
                                }}
                              >
                                <Trash2 size={15} color="var(--danger)" />
                                <span>Delete Customer</span>
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
            <span>Showing {sortedCustomers.length} of {totalRecords || sortedCustomers.length} customers</span>
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
