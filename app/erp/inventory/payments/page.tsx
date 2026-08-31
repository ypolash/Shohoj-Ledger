"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Drawer } from "@/components/ui/Drawer/Drawer";
import { InventoryDataTable, InventoryColumn } from "../components/InventoryDataTable";

/**
 * ERP Inventory — Payments & Due Settlement Hub (Version 2.4)
 * Real-time tracking of supplier dues, settlement drawer, and payment accounting.
 */
export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<"due" | "paid">("due");
  const [purchases, setPurchases] = useState<any[]>([]);
  const [paymentsMap, setPaymentsMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Drawer state for updating payments
  const [selectedDueItem, setSelectedDueItem] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [purRes, ledgerRes] = await Promise.all([
        fetch("/api/inventory/purchases"),
        fetch("/api/ledger?module=INVENTORY")
      ]);

      let purList: any[] = [];
      if (purRes.ok) {
        const purData = await purRes.json();
        purList = purData.purchases || [];
        setPurchases(purList);
      }

      if (ledgerRes.ok) {
        const entries: any[] = await ledgerRes.json();
        const map: Record<string, number> = {};
        entries.forEach((e) => {
          if (e.referenceId && (e.voucherType === "SUPPLIER_PAYMENT" || e.voucherType === "PURCHASE_PAYMENT")) {
            map[e.referenceId] = (map[e.referenceId] || 0) + Number(e.debit || e.amount || 0);
          }
        });
        setPaymentsMap(map);
      }
    } catch (err) {
      console.error("Failed to load payments data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute calculated due & paid lists
  const enhancedPurchases = purchases.map((p) => {
    const total = Number(p.totalAmount || p.subtotal || 0);
    const paid = paymentsMap[p.id] || 0;
    const due = Math.max(0, total - paid);
    return {
      ...p,
      totalAmountNum: total,
      paidAmountNum: paid,
      dueBalanceNum: due,
      isFullyPaid: due === 0
    };
  });

  const duePurchases = enhancedPurchases.filter((p) => p.dueBalanceNum > 0);
  const paidPurchases = enhancedPurchases.filter((p) => p.paidAmountNum > 0);

  const currentList = activeTab === "due" ? duePurchases : paidPurchases;

  const filteredList = currentList.filter((p) => {
    const poNum = (p.purchaseOrderNumber || p.id || "").toLowerCase();
    const supName = (p.supplier?.name || "").toLowerCase();
    return !search || poNum.includes(search.toLowerCase()) || supName.includes(search.toLowerCase());
  });

  // KPI Calculations
  const totalDuesOutstanding = duePurchases.reduce((sum, p) => sum + p.dueBalanceNum, 0);
  const totalSettledPayments = Object.values(paymentsMap).reduce((sum, v) => sum + v, 0);

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDueItem) return;

    const amt = Number(paymentAmount);
    if (!amt || amt <= 0) {
      setActionMsg({ type: "error", text: "Please enter a valid payment amount." });
      return;
    }

    setIsSubmitting(true);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/inventory/purchases/${selectedDueItem.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          paymentMethod: paymentMethod,
          notes: `Supplier payment for ${selectedDueItem.purchaseOrderNumber}`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Payment recording failed.");
      }

      setActionMsg({ type: "success", text: "Payment processed and posted to ledger!" });
      setSelectedDueItem(null);
      setPaymentAmount("");
      loadData();
    } catch (err: any) {
      setActionMsg({ type: "error", text: err.message || "Failed to submit payment." });
    } finally {
      setIsSubmitting(false);
    }
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
      key: "totalAmount",
      header: "Total Invoiced",
      render: (p) => (
        <span style={{ fontWeight: 600, fontFamily: "monospace", fontSize: "14px", color: "var(--text-main)" }}>
          ৳{p.totalAmountNum.toLocaleString()}
        </span>
      )
    },
    {
      key: "balance",
      header: activeTab === "due" ? "Outstanding Due" : "Settled Amount",
      render: (p) => (
        <span
          style={{
            fontWeight: 700,
            fontFamily: "monospace",
            fontSize: "14px",
            color: activeTab === "due" ? "#f59e0b" : "var(--success, #10b981)"
          }}
        >
          ৳{(activeTab === "due" ? p.dueBalanceNum : p.paidAmountNum).toLocaleString()}
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
            setSelectedDueItem(p);
            setPaymentAmount(String(p.dueBalanceNum || p.totalAmountNum));
            setActionMsg(null);
          }}
          className={activeTab === "due" ? "btn btn-primary" : "btn btn-secondary"}
          style={{ padding: "6px 14px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
            {activeTab === "due" ? "payments" : "visibility"}
          </span>
          {activeTab === "due" ? "Pay Due" : "Details"}
        </button>
      )
    }
  ];

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-5)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, color: "var(--text-main)" }}>Supplier Payments</h1>
        </div>
      </div>

      {actionMsg && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            background: actionMsg.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
            color: actionMsg.type === "success" ? "var(--success, #10b981)" : "var(--danger, #ef4444)",
            border: `1px solid ${actionMsg.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
            fontSize: "14px"
          }}
        >
          {actionMsg.text}
        </div>
      )}

      {/* KPI Cards Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
        <div
          className="glass-panel"
          style={{
            padding: "20px",
            borderRadius: "14px",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            background: "rgba(245, 158, 11, 0.05)"
          }}
        >
          <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
            Total Supplier Dues
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#f59e0b", fontFamily: "monospace", marginTop: "4px" }}>
            ৳{totalDuesOutstanding.toLocaleString()}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
            {duePurchases.length} invoices awaiting payment
          </div>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: "20px",
            borderRadius: "14px",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            background: "rgba(16, 185, 129, 0.05)"
          }}
        >
          <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
            Total Paid Disbursed
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--success, #10b981)", fontFamily: "monospace", marginTop: "4px" }}>
            ৳{totalSettledPayments.toLocaleString()}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
            Posted to General Ledger
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--border-main)" }}>
        <button
          onClick={() => setActiveTab("due")}
          style={{
            padding: "12px 24px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "due" ? "2px solid var(--primary, #38bdf8)" : "2px solid transparent",
            color: activeTab === "due" ? "var(--primary, #38bdf8)" : "var(--text-muted)",
            fontWeight: activeTab === "due" ? 600 : 500,
            cursor: "pointer",
            fontSize: "14px",
            transition: "all 0.2s ease"
          }}
        >
          Due Purchases ({duePurchases.length})
        </button>
        <button
          onClick={() => setActiveTab("paid")}
          style={{
            padding: "12px 24px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "paid" ? "2px solid var(--success, #10b981)" : "2px solid transparent",
            color: activeTab === "paid" ? "var(--success, #10b981)" : "var(--text-muted)",
            fontWeight: activeTab === "paid" ? 600 : 500,
            cursor: "pointer",
            fontSize: "14px",
            transition: "all 0.2s ease"
          }}
        >
          Paid Purchases ({paidPurchases.length})
        </button>
      </div>

      {/* Universal Inventory Table */}
      <InventoryDataTable
        columns={columns}
        data={filteredList}
        isLoading={isLoading}
        emptyIcon="payments"
        emptyTitle={`No ${activeTab} purchases found`}
        emptySubtitle={
          activeTab === "due"
            ? "All supplier purchases are fully settled. Great job!"
            : "No payments have been recorded yet."
        }
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={`Search ${activeTab} payments by PO # or supplier...`}
        actionsSlot={
          <button
            onClick={loadData}
            className="btn btn-secondary"
            style={{ padding: "8px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
            title="Refresh"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>refresh</span>
          </button>
        }
        onRowClick={(p) => {
          setSelectedDueItem(p);
          setPaymentAmount(String(p.dueBalanceNum || p.totalAmountNum));
          setActionMsg(null);
        }}
      />

      {/* Payment Update Drawer */}
      <Drawer
        isOpen={!!selectedDueItem}
        onClose={() => setSelectedDueItem(null)}
        position="right"
        size="md"
        title="Disburse Supplier Payment"
      >
        {selectedDueItem && (
          <form onSubmit={handleUpdatePayment} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ background: "var(--surface-hover)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-main)" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: "12px" }}>
                Purchase Order Details
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>PO Number</div>
                  <div style={{ fontWeight: 600, fontFamily: "monospace" }}>{selectedDueItem.purchaseOrderNumber}</div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Supplier</div>
                  <div style={{ fontWeight: 600 }}>{selectedDueItem.supplier?.name || "Supplier"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Total Expense</div>
                  <div style={{ fontWeight: 600, fontFamily: "monospace" }}>৳{selectedDueItem.totalAmountNum.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Current Due</div>
                  <div style={{ fontWeight: 700, color: "#f59e0b", fontFamily: "monospace" }}>
                    ৳{selectedDueItem.dueBalanceNum.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase" }}>
                Payment Amount (৳) *
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="number"
                  max={selectedDueItem.dueBalanceNum > 0 ? selectedDueItem.dueBalanceNum : undefined}
                  min="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                  style={{
                    flex: 1,
                    fontSize: "16px",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid var(--border-main)",
                    background: "var(--surface-input)",
                    color: "var(--text-main)",
                    fontFamily: "monospace",
                    fontWeight: 600
                  }}
                />
                {selectedDueItem.dueBalanceNum > 0 && (
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(String(selectedDueItem.dueBalanceNum))}
                    className="btn btn-secondary"
                    style={{ padding: "0 14px", fontSize: "12px", whiteSpace: "nowrap" }}
                  >
                    Pay Full
                  </button>
                )}
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase" }}>
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-main)",
                  background: "var(--surface-input)",
                  color: "var(--text-main)",
                  fontSize: "13px"
                }}
              >
                <option value="CASH">Cash in Hand</option>
                <option value="BANK">Bank Account Transfer</option>
                <option value="MOBILE">Mobile Money (bKash/Nagad)</option>
                <option value="CHEQUE">Bank Cheque</option>
              </select>
            </div>

            <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.2)", fontSize: "12px", color: "var(--text-muted)" }}>
              ℹ This disbursement will reduce Accounts Payable liability and credit your selected cash/bank asset account.
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !paymentAmount || Number(paymentAmount) <= 0}
              className="btn btn-primary"
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: isSubmitting ? "not-allowed" : "pointer"
              }}
            >
              {isSubmitting ? "Disbursing..." : "Confirm & Post Payment"}
            </button>
          </form>
        )}
      </Drawer>
    </div>
  );
}
