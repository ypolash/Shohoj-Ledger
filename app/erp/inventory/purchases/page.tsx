"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ShoppingBag, 
  Plus, 
  RefreshCw, 
  Search, 
  FileText, 
  Download, 
  Package, 
  Eye, 
  CheckCircle2, 
  Truck, 
  DollarSign, 
  Layers, 
  User 
} from "lucide-react";
import * as XLSX from 'xlsx';
import NewPurchaseModal from "./components/NewPurchaseModal";
import PurchaseDetailDrawer from "./components/PurchaseDetailDrawer";
import PurchaseInvoiceModal from "./components/PurchaseInvoiceModal";
import styles from "./PurchasesPage.module.css";

export default function PurchasesPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<any | null>(null);
  const [invoicePurchase, setInvoicePurchase] = useState<any | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchPurchases = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/inventory/purchases?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" }
      });
      if (res.ok) {
        const data = await res.json();
        setPurchases(data.purchases || []);
      }
    } catch (err) {
      console.error("Failed to fetch purchases:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPurchases();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const poNum = (p.purchaseOrderNumber || p.id || "").toLowerCase();
      const supName = (p.supplier?.name || "").toLowerCase();
      const matchesSearch =
        !search.trim() || poNum.includes(search.toLowerCase()) || supName.includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" ||
        (p.status || "APPROVED").toUpperCase() === statusFilter.toUpperCase();
      return matchesSearch && matchesStatus;
    });
  }, [purchases, search, statusFilter]);

  const handleExportCSV = () => {
    if (purchases.length === 0) return;
    const exportData = filteredPurchases.map((p) => ({
      "PO Number": p.purchaseOrderNumber || p.id,
      "Supplier": p.supplier?.name || "N/A",
      "Order Date": new Date(p.orderDate || p.createdAt).toLocaleDateString(),
      "Total Amount (BDT)": Number(p.totalAmount || p.subtotal || 0),
      "Status": p.status || "APPROVED",
      "Items Count": p.lines?.length || 0
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchases");
    XLSX.writeFile(wb, `purchases_report_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.headerWrapper}>
        <div className={styles.titleGroup}>
          <h1>
            Purchases Hub
            <span className={styles.titleBadge}>{purchases.length} Orders</span>
          </h1>
          <p>Manage supplier procurements, track expense recognition, and disburse purchase dues.</p>
        </div>

        <div className={styles.actionGroup}>
          <button 
            className={styles.btnSecondary}
            onClick={handleRefresh}
            title="Refresh purchases list"
          >
            <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button 
            className={styles.btnSecondary}
            onClick={handleExportCSV}
            title="Export CSV"
          >
            <Download size={15} />
            <span>Export</span>
          </button>

          <button
            className={styles.btnSecondary}
            onClick={() => router.push("/erp/inventory/products")}
          >
            <Package size={15} />
            <span>Products</span>
          </button>

          <button
            className={styles.btnPrimary}
            onClick={() => router.push("/erp/inventory/purchases/new")}
          >
            <Plus size={16} />
            <span>New Purchase</span>
          </button>
        </div>
      </div>

      {/* Success Alert Banner */}
      {successMsg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          fontSize: '0.875rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Toolbar & Filter Tabs */}
      <div className={styles.toolbarCard}>
        {/* Status Tabs */}
        <div className={styles.statusTabsRow}>
          {(['ALL', 'APPROVED', 'RECEIVED', 'DRAFT', 'CANCELLED'] as const).map(tab => (
            <button
              key={tab}
              className={`${styles.statusTab} ${statusFilter === tab ? styles.statusTabActive : ''}`}
              onClick={() => setStatusFilter(tab)}
            >
              {tab === 'ALL' ? 'All Purchases' : tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className={styles.filterControlsRow}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search by PO number or supplier name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>
      </div>

      {/* Purchases Table */}
      {isLoading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} color="var(--primary)" />
          <p>Loading purchase orders...</p>
        </div>
      ) : filteredPurchases.length === 0 ? (
        <div className={styles.tablePanel} style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--surface-hover)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <ShoppingBag size={28} />
          </div>
          <h3 style={{ margin: '0 0 6px 0', color: 'var(--text-main)' }}>No Purchases Found</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {search ? "No purchases match your search criteria." : "Record your first supplier purchase order."}
          </p>
          <button onClick={() => router.push("/erp/inventory/purchases/new")} className={styles.btnPrimary} style={{ marginTop: '16px' }}>
            <Plus size={16} /> New Purchase
          </button>
        </div>
      ) : (
        <div className={styles.tablePanel}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>PO Number / Date</th>
                  <th className={styles.th}>Supplier Company</th>
                  <th className={styles.th}>Line Items</th>
                  <th className={styles.th}>Total Expense</th>
                  <th className={styles.th}>PO Status</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((p) => {
                  const isReceived = p.status === "RECEIVED";
                  const isDraft = p.status === "DRAFT";
                  const isCancelled = p.status === "CANCELLED";

                  return (
                    <tr 
                      key={p.id} 
                      className={styles.tr}
                      onClick={() => setSelectedPurchase(p)}
                    >
                      <td className={styles.td}>
                        <span className={styles.poCode}>
                          {p.purchaseOrderNumber || p.id.slice(0, 8)}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {new Date(p.orderDate || p.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Truck size={15} color="var(--text-muted)" />
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                              {p.supplier?.name || "General Supplier"}
                            </div>
                            {p.supplier?.phone && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {p.supplier.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className={styles.td}>
                        <span className={styles.itemPill}>
                          <Package size={12} style={{ marginRight: '4px' }} />
                          {p.lines?.length || 0} line item(s)
                        </span>
                      </td>

                      <td className={styles.td}>
                        <div style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                          ৳{Number(p.totalAmount || p.subtotal || 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>
                          ✓ Expense Recognized
                        </div>
                      </td>

                      <td className={styles.td}>
                        <span 
                          className={styles.statusBadge}
                          style={{
                            color: isCancelled ? '#ef4444' : isReceived ? '#10b981' : isDraft ? '#f59e0b' : '#3b82f6',
                            background: isCancelled ? 'rgba(239, 68, 68, 0.12)' : isReceived ? 'rgba(16, 185, 129, 0.12)' : isDraft ? 'rgba(245, 158, 11, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                            border: `1px solid ${isCancelled ? 'rgba(239, 68, 68, 0.25)' : isReceived ? 'rgba(16, 185, 129, 0.25)' : isDraft ? 'rgba(245, 158, 11, 0.25)' : 'rgba(59, 130, 246, 0.25)'}`
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                          {p.status || "APPROVED"}
                        </span>
                      </td>

                      <td className={styles.td} style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setSelectedPurchase(p)}
                            className={styles.btnSecondary}
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                            title="View Details & Payments"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>

                          <button
                            onClick={() => setInvoicePurchase(p)}
                            className={styles.btnSecondary}
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.75rem',
                              color: 'var(--primary)',
                              borderColor: 'rgba(59, 130, 246, 0.3)',
                              background: 'rgba(59, 130, 246, 0.08)'
                            }}
                            title="View & Print Official Invoice"
                          >
                            <FileText size={13} />
                            <span>Invoice</span>
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

      {/* New Purchase Modal */}
      <NewPurchaseModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={() => {
          setSuccessMsg("Purchase order created and posted to Expense Ledger!");
          setTimeout(() => setSuccessMsg(""), 5000);
          fetchPurchases();
        }}
      />

      {/* Purchase Detail & Payment Drawer */}
      <PurchaseDetailDrawer
        purchase={selectedPurchase}
        isOpen={!!selectedPurchase}
        onClose={() => setSelectedPurchase(null)}
        onPaymentSuccess={() => {
          fetchPurchases();
        }}
      />

      {/* Official Purchase Invoice Modal */}
      <PurchaseInvoiceModal
        purchase={invoicePurchase}
        isOpen={!!invoicePurchase}
        onClose={() => setInvoicePurchase(null)}
      />
    </div>
  );
}
