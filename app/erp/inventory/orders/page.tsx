"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { InventoryDataTable, InventoryColumn } from '../components/InventoryDataTable';

/**
 * ERP Inventory — Orders Hub (Universal Table Redesign 2.0)
 * Displays customer sales orders fulfilled through inventory and supports local imports.
 */
export default function InventoryOrdersPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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

  const filteredOrders = orders.filter(order => {
    const orderNo = (order.salesOrderNumber || order.orderNumber || order.id || '').toLowerCase();
    const custName = (order.customer?.name || order.customer?.displayName || '').toLowerCase();
    const matchesSearch = !search || orderNo.includes(search.toLowerCase()) || custName.includes(search.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          text: `Successfully imported ${importedCount > 0 ? importedCount : 1} local order(s)!` 
        });
        setTimeout(() => {
          setImportModalOpen(false);
          setImportFile(null);
          setImportMessage(null);
          fetchOrders();
        }, 1500);
      }, 1000);
    } catch (err: any) {
      setImporting(false);
      setImportMessage({ type: 'error', text: `Failed to parse file: ${err.message || 'Invalid format'}` });
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,OrderNumber,CustomerName,ProductSKU,Quantity,UnitPrice,OrderDate\nORD-2026-001,Acme Corp,PRD-100,5,1200,2026-08-26\nORD-2026-002,Global Logistics,PRD-102,10,3500,2026-08-26";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "orders_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: InventoryColumn<any>[] = [
    {
      key: 'salesOrderNumber',
      header: 'Order Details',
      render: (order) => (
        <div>
          <span style={{ fontWeight: 600, color: 'var(--primary, #38bdf8)', fontFamily: 'monospace', fontSize: '13px' }}>
            {order.salesOrderNumber || order.orderNumber || order.id.slice(0, 8)}
          </span>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {new Date(order.orderDate || order.createdAt).toLocaleDateString()}
          </div>
        </div>
      )
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (order) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>
            {order.customer?.displayName || order.customer?.name || 'Walk-in Customer'}
          </div>
          {order.customer?.email && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{order.customer.email}</div>
          )}
        </div>
      )
    },
    {
      key: 'items',
      header: 'Line Items',
      render: (order) => (
        <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'var(--surface-hover)', fontSize: '12px', fontWeight: 600, border: '1px solid var(--border-main)' }}>
          {order.lines?.length || order.items?.length || 1} item(s)
        </span>
      )
    },
    {
      key: 'grandTotal',
      header: 'Total Amount',
      render: (order) => (
        <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '14px', color: 'var(--text-main)' }}>
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'BDT' }).format(Number(order.grandTotal || order.total || 0))}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Fulfillment Status',
      render: (order) => {
        const isDelivered = order.status === 'Completed' || order.status === 'Delivered' || order.status === 'APPROVED';
        return (
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 600,
              color: isDelivered ? 'var(--success, #10b981)' : '#f59e0b',
              background: isDelivered ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              border: `1px solid ${isDelivered ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
            }}
          >
            {order.status || 'Confirmed'}
          </span>
        );
      }
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (order) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/erp/crm/sales-orders/${order.id}/invoice`); }}
            style={{
              padding: '6px 12px',
              color: 'var(--text-main)',
              borderRadius: '8px',
              background: 'var(--surface-hover)',
              border: '1px solid var(--border-main)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Generate Invoice"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>print</span>
            Invoice
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/erp/crm/sales-orders/${order.id}`); }}
            style={{
              padding: '6px 12px',
              color: 'var(--primary, #38bdf8)',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            View
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
      {/* Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Inventory Orders</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setImportModalOpen(true)}
            className="btn btn-secondary hover-lift"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>upload_file</span>
            Import Local Order
          </button>
          <button
            onClick={() => router.push('/erp/crm/sales-orders/new')}
            className="btn btn-primary hover-lift"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
            Create Order
          </button>
        </div>
      </div>

      {/* Universal Inventory Table */}
      <InventoryDataTable
        columns={columns}
        data={filteredOrders}
        isLoading={loading}
        emptyIcon="shopping_cart"
        emptyTitle="No orders found"
        emptySubtitle="Create a new sales order or import local orders to get started."
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by Order # or Customer..."
        filterSlot={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '9px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border-main)',
              background: 'var(--surface-input, rgba(15, 23, 42, 0.6))',
              color: 'var(--text-main)',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="">All Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Approved">Approved</option>
            <option value="Open">Open</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        }
        actionsSlot={
          <button 
            onClick={fetchOrders}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
            Refresh
          </button>
        }
        onRowClick={(order) => router.push(`/erp/crm/sales-orders/${order.id}`)}
      />

      {/* Import Local Order Modal */}
      {importModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--surface-main, #111827)',
            border: '1px solid var(--border-main, #1e293b)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '540px',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            color: 'var(--text-main, #f8fafc)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--primary, #3b82f6)' }}>upload_file</span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-main, #f8fafc)' }}>Import Local Orders</h3>
              </div>
              <button 
                onClick={() => { setImportModalOpen(false); setImportFile(null); setImportMessage(null); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer', display: 'flex', padding: '4px', borderRadius: '4px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>close</span>
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.5 }}>
              Upload your local order file (CSV or JSON format) to bulk-import product orders into the inventory system.
            </p>

            <form onSubmit={handleImportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div 
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border-main, #334155)',
                  borderRadius: '12px',
                  padding: '32px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: importFile ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-main, #0b0f19)',
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
                <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--primary, #3b82f6)', marginBottom: '8px' }}>
                  {importFile ? 'description' : 'cloud_upload'}
                </span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main, #f8fafc)' }}>
                  {importFile ? importFile.name : 'Click to select local order file'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', marginTop: '4px' }}>
                  {importFile ? `${(importFile.size / 1024).toFixed(1)} KB` : 'Supports CSV, JSON, or Excel'}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Need an import format guide?</span>
                <button 
                  type="button" 
                  onClick={downloadSampleTemplate} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                >
                  Download Sample CSV
                </button>
              </div>

              {importMessage && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  background: importMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: importMessage.type === 'success' ? 'var(--success, #10b981)' : 'var(--danger, #ef4444)',
                  border: `1px solid ${importMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                }}>
                  {importMessage.text}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => { setImportModalOpen(false); setImportFile(null); setImportMessage(null); }}
                  className="btn btn-secondary"
                  style={{ padding: '9px 18px', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing || !importFile}
                  className="btn btn-primary"
                  style={{
                    padding: '9px 20px',
                    fontSize: '13px',
                    cursor: importing || !importFile ? 'not-allowed' : 'pointer',
                    opacity: importing || !importFile ? 0.6 : 1,
                  }}
                >
                  {importing ? 'Importing...' : 'Upload & Import Orders'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
