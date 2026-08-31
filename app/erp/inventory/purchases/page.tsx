"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { InventoryDataTable, InventoryColumn } from "../components/InventoryDataTable";
import NewPurchaseModal from "./components/NewPurchaseModal";
import PurchaseDetailDrawer from "./components/PurchaseDetailDrawer";
import { exportToCSV, exportToExcel } from "@/lib/reports/exportUtils";

/**
 * ERP Inventory — Purchases Hub (Version 2.4)
 * Displays all supplier purchases, expense recognition, and integrates payment tracking.
 */
export default function PurchasesPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<any | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchPurchases = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/inventory/purchases");
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

  const filteredPurchases = purchases.filter((p) => {
    const poNum = (p.purchaseOrderNumber || p.id || "").toLowerCase();
    const supName = (p.supplier?.name || "").toLowerCase();
    const matchesSearch = !search || poNum.includes(search.toLowerCase()) || supName.includes(search.toLowerCase());
    const matchesStatus = !statusFilter || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    const exportData = filteredPurchases.map((p) => ({
      "PO Number": p.purchaseOrderNumber,
      "Supplier": p.supplier?.name || "N/A",
      "Order Date": new Date(p.orderDate || p.createdAt).toLocaleDateString(),
      "Total Amount (BDT)": Number(p.totalAmount || 0),
      "Status": p.status || "APPROVED",
      "Items Count": p.lines?.length || 0
    }));
    exportToCSV(exportData, `purchases_report_${new Date().toISOString().slice(0, 10)}`);
  };

  const handleExportExcel = () => {
    const exportData = filteredPurchases.map((p) => ({
      "PO Number": p.purchaseOrderNumber,
      "Supplier": p.supplier?.name || "N/A",
      "Order Date": new Date(p.orderDate || p.createdAt).toLocaleDateString(),
      "Total Amount (BDT)": Number(p.totalAmount || 0),
      "Status": p.status || "APPROVED",
      "Items Count": p.lines?.length || 0
    }));
    exportToExcel(exportData, `purchases_report_${new Date().toISOString().slice(0, 10)}`);
  };

  const columns: InventoryColumn<any>[] = [
    {
      key: "purchaseOrderNumber",
      header: "Invoice / PO #",
      render: (p) => (
        <div>
          <span style={{ fontWeight: 600, color: "var(--primary, #38bdf8)", fontFamily: "monospace", fontSize: "13px" }}>
            {p.purchaseOrderNumber}
          </span>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
            {new Date(p.orderDate || p.createdAt).toLocaleDateString()}
          </div>
        </div>
      )
    },
    {
      key: "supplier",
      header: "Supplier Company",
      render: (p) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "14px" }}>
            {p.supplier?.name || "Supplier"}
          </div>
          {p.supplier?.phone && (
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{p.supplier.phone}</div>
          )}
        </div>
      )
    },
    {
      key: "lines",
      header: "Items Count",
      render: (p) => (
        <span style={{ padding: "4px 10px", borderRadius: "20px", background: "var(--surface-hover)", fontSize: "12px", fontWeight: 600, border: "1px solid var(--border-main)" }}>
          {p.lines?.length || 0} line item(s)
        </span>
      )
    },
    {
      key: "totalAmount",
      header: "Purchase Expense",
      render: (p) => (
        <div>
          <div style={{ fontWeight: 700, fontFamily: "monospace", fontSize: "14px", color: "var(--text-main)" }}>
            ৳{Number(p.totalAmount || p.subtotal || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: "11px", color: "var(--primary, #38bdf8)" }}>✓ Counted as Expense</div>
        </div>
      )
    },
    {
      key: "status",
      header: "PO Status",
      render: (p) => (
        <span
          style={{
            padding: "4px 10px",
            borderRadius: "20px",
            fontSize: "11px",
            fontWeight: 600,
            color: p.status === "RECEIVED" ? "var(--success, #10b981)" : "var(--primary, #38bdf8)",
            background: p.status === "RECEIVED" ? "rgba(16, 185, 129, 0.15)" : "rgba(56, 189, 248, 0.15)",
            border: `1px solid ${p.status === "RECEIVED" ? "rgba(16, 185, 129, 0.3)" : "rgba(56, 189, 248, 0.3)"}`
          }}
        >
          {p.status || "APPROVED"}
        </span>
      )
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (p) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedPurchase(p);
          }}
          className="btn btn-secondary"
          style={{ padding: "6px 14px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>visibility</span>
          View
        </button>
      )
    }
  ];

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-5)" }}>
      {/* Header & Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ margin: 0, color: "var(--text-main)" }}>Purchases</h1>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            className="btn btn-secondary hover-lift"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
            onClick={() => router.push("/erp/inventory/products")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>inventory_2</span>
            Register Product
          </button>
          <button
            className="btn btn-primary hover-lift"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
            onClick={() => setIsNewModalOpen(true)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>add</span>
            New Purchase
          </button>
        </div>
      </div>

      {successMsg && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            background: "rgba(16, 185, 129, 0.15)",
            color: "var(--success, #10b981)",
            border: "1px solid var(--success)",
            fontSize: "14px"
          }}
        >
          ✓ {successMsg}
        </div>
      )}

      {/* Universal Inventory Table */}
      <InventoryDataTable
        columns={columns}
        data={filteredPurchases}
        isLoading={isLoading}
        emptyIcon="shopping_bag"
        emptyTitle="No purchases recorded"
        emptySubtitle="Click 'New Purchase' to record your first supplier purchase and recognize expenses."
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search purchases by PO # or supplier..."
        filterSlot={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "9px 14px",
              borderRadius: "10px",
              border: "1px solid var(--border-main)",
              background: "var(--surface-input, rgba(15, 23, 42, 0.6))",
              color: "var(--text-main)",
              fontSize: "13px",
              outline: "none"
            }}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="APPROVED">Approved</option>
            <option value="RECEIVED">Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        }
        actionsSlot={
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleExportCSV}
              className="btn btn-secondary"
              style={{ padding: "8px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
              title="Export to CSV"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>csv</span>
              CSV
            </button>
            <button
              onClick={handleExportExcel}
              className="btn btn-secondary"
              style={{ padding: "8px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
              title="Export to Excel"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>table_view</span>
              Excel
            </button>
            <button
              onClick={fetchPurchases}
              className="btn btn-secondary"
              style={{ padding: "8px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
              title="Refresh"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>refresh</span>
            </button>
          </div>
        }
        onRowClick={(p) => setSelectedPurchase(p)}
      />

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
    </div>
  );
}
