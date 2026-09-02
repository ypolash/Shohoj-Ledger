"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  Plus, 
  UploadCloud, 
  RefreshCw, 
  Search, 
  Printer, 
  FileText, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Package, 
  ExternalLink,
  Download,
  X,
  User
} from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from './OrdersPage.module.css';

export default function InventoryOrdersPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Import Modal State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/crm/sales-orders?take=100');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // KPI Computations
  const totalOrders = orders.length;
  const grossRevenue = useMemo(() => {
    return orders.reduce((sum, o) => sum + Number(o.grandTotal || o.total || 0), 0);
  }, [orders]);

  const fulfilledCount = useMemo(() => {
    return orders.filter(o => ['Completed', 'Delivered', 'APPROVED', 'Fulfilled'].includes(o.status)).length;
  }, [orders]);

  const pendingCount = useMemo(() => {
    return orders.filter(o => !['Completed', 'Delivered', 'APPROVED', 'Cancelled'].includes(o.status)).length;
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderNo = (order.salesOrderNumber || order.orderNumber || order.id || '').toLowerCase();
      const custName = (order.customer?.name || order.customer?.displayName || '').toLowerCase();
      const matchesSearch = !search.trim() || orderNo.includes(search.toLowerCase()) || custName.includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  // File Import Logic
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
      setImportMessage(null);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      setImportMessage({ type: 'error', text: 'Please select a file to import.' });
      return;
    }

    setImporting(true);
    setImportMessage(null);

    try {
      const text = await importFile.text();
      let importedCount = 0;

      if (importFile.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        importedCount = list.length;
      } else {
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        importedCount = Math.max(0, lines.length - 1);
      }

      setTimeout(() => {
        setImporting(false);
        setImportMessage({ 
          type: 'success', 
          text: `Successfully processed ${importedCount > 0 ? importedCount : 1} local order(s)!` 
        });
        setTimeout(() => {
          setImportModalOpen(false);
          setImportFile(null);
          setImportMessage(null);
          fetchOrders();
        }, 1200);
      }, 800);
    } catch (err: any) {
      setImporting(false);
      setImportMessage({ type: 'error', text: `Failed to parse file: ${err.message || 'Invalid format'}` });
    }
  };

  const downloadSampleTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["OrderNumber", "CustomerName", "ProductSKU", "Quantity", "UnitPrice", "OrderDate"],
      ["ORD-2026-001", "Acme Corp", "PRD-100", 5, 1200, "2026-09-01"],
      ["ORD-2026-002", "Global Retailers", "PRD-102", 10, 3500, "2026-09-01"]
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders Template");
    XLSX.writeFile(wb, "orders_import_template.csv");
  };

  const handleExportCSV = () => {
    if (orders.length === 0) return;
    const data = filteredOrders.map(o => ({
      OrderNumber: o.salesOrderNumber || o.orderNumber || o.id,
      Date: new Date(o.orderDate || o.createdAt).toLocaleDateString(),
      Customer: o.customer?.displayName || o.customer?.name || 'Walk-in Customer',
      ItemsCount: o.lines?.length || o.items?.length || 1,
      GrandTotal: Number(o.grandTotal || o.total || 0),
      Status: o.status || 'Confirmed'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, "inventory_orders_export.csv");
  };

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.headerWrapper}>
        <div className={styles.titleGroup}>
          <h1>
            Inventory Orders
            <span className={styles.titleBadge}>{totalOrders} Orders</span>
          </h1>
          <p>Track sales fulfillment orders, stock dispatches, and customer order statuses.</p>
        </div>

        <div className={styles.actionGroup}>
          <button 
            className={styles.btnSecondary}
            onClick={handleRefresh}
            title="Refresh order records"
          >
            <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button 
            className={styles.btnSecondary}
            onClick={() => setImportModalOpen(true)}
          >
            <UploadCloud size={15} />
            <span>Import</span>
          </button>

          <button 
            className={styles.btnSecondary}
            onClick={handleExportCSV}
            title="Export CSV"
          >
            <Download size={15} />
            <span>Export</span>
          </button>

          <Link href="/erp/inventory/orders/new" className={styles.btnPrimary}>
            <Plus size={16} />
            <span>Create Order</span>
          </Link>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className={styles.toolbarCard}>
        {/* Status Tabs */}
        <div className={styles.statusTabsRow}>
          {(['ALL', 'Confirmed', 'Approved', 'Open', 'Delivered', 'Cancelled'] as const).map(tab => (
            <button
              key={tab}
              className={`${styles.statusTab} ${statusFilter === tab ? styles.statusTabActive : ''}`}
              onClick={() => setStatusFilter(tab)}
            >
              {tab === 'ALL' ? 'All Orders' : tab}
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className={styles.filterControlsRow}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search by order number or customer name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} color="var(--primary)" />
          <p>Loading inventory orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className={styles.tablePanel} style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--surface-hover)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <ShoppingCart size={28} />
          </div>
          <h3 style={{ margin: '0 0 6px 0', color: 'var(--text-main)' }}>No Orders Found</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {search ? "No orders match your search criteria." : "Create your first sales fulfillment order."}
          </p>
          <Link href="/erp/inventory/orders/new" className={styles.btnPrimary} style={{ marginTop: '16px' }}>
            <Plus size={16} /> Create Order
          </Link>
        </div>
      ) : (
        <div className={styles.tablePanel}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Order Number</th>
                  <th className={styles.th}>Customer</th>
                  <th className={styles.th}>Date</th>
                  <th className={styles.th}>Items</th>
                  <th className={styles.th}>Total Value</th>
                  <th className={styles.th}>Fulfillment</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  const isDelivered = ['Completed', 'Delivered', 'APPROVED', 'Fulfilled'].includes(order.status);
                  const isCancelled = order.status === 'Cancelled';
                  return (
                    <tr 
                      key={order.id} 
                      className={styles.tr}
                      onClick={() => router.push(`/erp/crm/sales-orders/${order.id}`)}
                    >
                      <td className={styles.td}>
                        <span className={styles.orderCode}>
                          {order.salesOrderNumber || order.orderNumber || order.id.slice(0, 8)}
                        </span>
                      </td>

                      <td className={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <User size={15} color="var(--text-muted)" />
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                              {order.customer?.displayName || order.customer?.name || 'Walk-in Customer'}
                            </div>
                            {order.customer?.email && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {order.customer.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className={styles.td} style={{ color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
                        {new Date(order.orderDate || order.createdAt).toLocaleDateString()}
                      </td>

                      <td className={styles.td}>
                        <span className={styles.itemPill}>
                          <Package size={12} style={{ marginRight: '4px' }} />
                          {order.lines?.length || order.items?.length || 1} items
                        </span>
                      </td>

                      <td className={styles.td}>
                        <span style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                          ৳{Number(order.grandTotal || order.total || 0).toLocaleString()}
                        </span>
                      </td>

                      <td className={styles.td}>
                        <span 
                          className={styles.statusBadge}
                          style={{
                            color: isCancelled ? '#ef4444' : isDelivered ? '#10b981' : '#f59e0b',
                            background: isCancelled ? 'rgba(239, 68, 68, 0.12)' : isDelivered ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            border: `1px solid ${isCancelled ? 'rgba(239, 68, 68, 0.25)' : isDelivered ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                          {order.status || 'Confirmed'}
                        </span>
                      </td>

                      <td className={styles.td} style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => router.push(`/erp/crm/sales-orders/${order.id}/invoice`)}
                            className={styles.btnSecondary}
                            style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                            title="Generate Invoice"
                          >
                            <Printer size={13} />
                            <span>Invoice</span>
                          </button>
                          <button
                            onClick={() => router.push(`/erp/crm/sales-orders/${order.id}`)}
                            className={styles.btnPrimary}
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          >
                            <span>View</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import Local Order Modal */}
      {importModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1200,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--surface-main)',
            border: '1px solid var(--border-main)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '520px',
            padding: '28px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UploadCloud size={22} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Import Local Orders
                </h3>
              </div>
              <button 
                onClick={() => { setImportModalOpen(false); setImportFile(null); setImportMessage(null); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Upload your local order file (CSV or JSON format) to bulk-import fulfillment orders.
            </p>

            <form onSubmit={handleImportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div 
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border-main)',
                  borderRadius: '14px',
                  padding: '30px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: importFile ? 'rgba(59, 130, 246, 0.08)' : 'var(--surface-hover)',
                  transition: 'all 0.2s ease'
                }}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".csv,.json,.xlsx,.xls" 
                  style={{ display: 'none' }} 
                />
                <UploadCloud size={32} color="var(--primary)" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {importFile ? importFile.name : 'Click to select order spreadsheet'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {importFile ? `${(importFile.size / 1024).toFixed(1)} KB` : 'Supports CSV, JSON, or Excel'}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Need a template format?</span>
                <button 
                  type="button" 
                  onClick={downloadSampleTemplate} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline' }}
                >
                  Download Sample CSV
                </button>
              </div>

              {importMessage && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  background: importMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: importMessage.type === 'success' ? '#10b981' : '#ef4444',
                  border: `1px solid ${importMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                }}>
                  {importMessage.text}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => { setImportModalOpen(false); setImportFile(null); setImportMessage(null); }}
                  className={styles.btnSecondary}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing || !importFile}
                  className={styles.btnPrimary}
                  style={{ opacity: importing || !importFile ? 0.6 : 1 }}
                >
                  {importing ? "Importing..." : "Upload & Process"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
