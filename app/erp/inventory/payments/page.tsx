"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Drawer } from "@/components/ui/Drawer/Drawer";
import { 
  CreditCard, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Clock, 
  Truck, 
  ArrowUpRight, 
  Check, 
  X 
} from "lucide-react";
import styles from "./PaymentsPage.module.css";

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<"due" | "paid">("due");
  const [purchases, setPurchases] = useState<any[]>([]);
  const [paymentsMap, setPaymentsMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Compute calculated due & paid lists
  const enhancedPurchases = useMemo(() => {
    return purchases.map((p) => {
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
  }, [purchases, paymentsMap]);

  const duePurchases = useMemo(() => enhancedPurchases.filter((p) => p.dueBalanceNum > 0), [enhancedPurchases]);
  const paidPurchases = useMemo(() => enhancedPurchases.filter((p) => p.paidAmountNum > 0), [enhancedPurchases]);

  const currentList = activeTab === "due" ? duePurchases : paidPurchases;

  const filteredList = useMemo(() => {
    return currentList.filter((p) => {
      const poNum = (p.purchaseOrderNumber || p.id || "").toLowerCase();
      const supName = (p.supplier?.name || "").toLowerCase();
      return !search.trim() || poNum.includes(search.toLowerCase()) || supName.includes(search.toLowerCase());
    });
  }, [currentList, search]);

  // Totals
  const totalDuesOutstanding = useMemo(() => duePurchases.reduce((sum, p) => sum + p.dueBalanceNum, 0), [duePurchases]);
  const totalSettledPayments = useMemo(() => Object.values(paymentsMap).reduce((sum, v) => sum + v, 0), [paymentsMap]);

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

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.headerWrapper}>
        <div className={styles.titleGroup}>
          <h1>
            Supplier Payments
            <span className={styles.titleBadge}>{duePurchases.length} Dues Pending</span>
          </h1>
          <p>Disburse payments against purchase orders, settle accounts payable, and track ledger receipts.</p>
        </div>

        <div className={styles.actionGroup}>
          <button 
            className={styles.btnSecondary}
            onClick={handleRefresh}
            title="Refresh payment balances"
          >
            <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {actionMsg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '12px',
          background: actionMsg.type === "success" ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${actionMsg.type === "success" ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: actionMsg.type === "success" ? '#10b981' : '#ef4444',
          fontSize: '0.875rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {actionMsg.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Toolbar & Filter Tabs with Integrated Summary */}
      <div className={styles.toolbarCard}>
        <div className={styles.statusTabsRow}>
          <div className={styles.tabsLeft}>
            <button
              onClick={() => setActiveTab("due")}
              className={`${styles.statusTab} ${activeTab === "due" ? styles.statusTabActiveAmber : ''}`}
            >
              <Clock size={14} />
              <span>Outstanding Dues ({duePurchases.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("paid")}
              className={`${styles.statusTab} ${activeTab === "paid" ? styles.statusTabActiveGreen : ''}`}
            >
              <CheckCircle2 size={14} />
              <span>Settled Invoices ({paidPurchases.length})</span>
            </button>
          </div>

          <div className={styles.summaryBadges}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Total Dues: </span>
              <strong style={{ color: '#f59e0b', fontFamily: 'monospace' }}>৳{totalDuesOutstanding.toLocaleString()}</strong>
            </div>
            <div style={{ color: 'var(--border-main)' }}>|</div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Total Settled: </span>
              <strong style={{ color: '#10b981', fontFamily: 'monospace' }}>৳{totalSettledPayments.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className={styles.filterControlsRow}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder={`Search ${activeTab === "due" ? "due" : "paid"} payments by PO # or supplier...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      {isLoading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} color="var(--primary)" />
          <p>Loading payment records...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className={styles.tablePanel} style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--surface-hover)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <CreditCard size={28} />
          </div>
          <h3 style={{ margin: '0 0 6px 0', color: 'var(--text-main)' }}>
            {activeTab === "due" ? "No Outstanding Dues" : "No Settled Payments Found"}
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {activeTab === "due"
              ? "All supplier purchases are fully settled. Great job!"
              : "No supplier payments have been recorded yet."}
          </p>
        </div>
      ) : (
        <div className={styles.tablePanel}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>PO Number / Date</th>
                  <th className={styles.th}>Supplier Details</th>
                  <th className={styles.th}>Total Invoiced</th>
                  <th className={styles.th}>{activeTab === "due" ? "Outstanding Due" : "Settled Amount"}</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((p) => (
                  <tr 
                    key={p.id} 
                    className={styles.tr}
                    onClick={() => {
                      setSelectedDueItem(p);
                      setPaymentAmount(String(p.dueBalanceNum || p.totalAmountNum));
                      setActionMsg(null);
                    }}
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
                      <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                        ৳{p.totalAmountNum.toLocaleString()}
                      </span>
                    </td>

                    <td className={styles.td}>
                      <span 
                        style={{
                          fontWeight: 800,
                          fontFamily: 'monospace',
                          fontSize: '1rem',
                          color: activeTab === "due" ? '#f59e0b' : '#10b981'
                        }}
                      >
                        ৳{(activeTab === "due" ? p.dueBalanceNum : p.paidAmountNum).toLocaleString()}
                      </span>
                    </td>

                    <td className={styles.td} style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            setSelectedDueItem(p);
                            setPaymentAmount(String(p.dueBalanceNum || p.totalAmountNum));
                            setActionMsg(null);
                          }}
                          className={activeTab === "due" ? styles.btnPrimary : styles.btnSecondary}
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        >
                          <CreditCard size={13} />
                          <span>{activeTab === "due" ? "Pay Due" : "Details"}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Update Drawer */}
      <Drawer
        isOpen={!!selectedDueItem}
        onClose={() => setSelectedDueItem(null)}
        position="right"
        size="md"
        title="Disburse Supplier Payment"
      >
        {selectedDueItem && (
          <form onSubmit={handleUpdatePayment} className={styles.drawerForm}>
            <div className={styles.detailsBox}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Purchase Order Summary
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>PO Number</div>
                  <div style={{ fontWeight: 700, fontFamily: "monospace", color: "var(--primary)" }}>
                    {selectedDueItem.purchaseOrderNumber}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Supplier</div>
                  <div style={{ fontWeight: 700, color: "var(--text-main)" }}>
                    {selectedDueItem.supplier?.name || "Supplier"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Total Expense</div>
                  <div style={{ fontWeight: 700, fontFamily: "monospace", color: "var(--text-main)" }}>
                    ৳{selectedDueItem.totalAmountNum.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Current Due</div>
                  <div style={{ fontWeight: 800, color: "#f59e0b", fontFamily: "monospace" }}>
                    ৳{selectedDueItem.dueBalanceNum.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.775rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
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
                    fontSize: "1rem",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid var(--border-main)",
                    background: "var(--surface-hover)",
                    color: "var(--text-main)",
                    fontFamily: "monospace",
                    fontWeight: 700,
                    outline: "none"
                  }}
                />
                {selectedDueItem.dueBalanceNum > 0 && (
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(String(selectedDueItem.dueBalanceNum))}
                    className={styles.btnSecondary}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Pay Full
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.775rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
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
                  background: "var(--surface-hover)",
                  color: "var(--text-main)",
                  fontSize: "0.9rem",
                  outline: "none"
                }}
              >
                <option value="CASH">Cash in Hand</option>
                <option value="BANK">Bank Account Transfer</option>
                <option value="MOBILE">Mobile Money (bKash/Nagad)</option>
                <option value="CHEQUE">Bank Cheque</option>
              </select>
            </div>

            <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.2)", fontSize: "0.775rem", color: "var(--text-muted)" }}>
              ℹ This disbursement will reduce Accounts Payable liability and credit your selected payment asset account in the General Ledger.
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !paymentAmount || Number(paymentAmount) <= 0}
              className={styles.btnPrimary}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "0.95rem",
                fontWeight: 700,
                justifyContent: "center"
              }}
            >
              {isSubmitting ? "Posting Disbursement..." : "Confirm & Post Payment"}
            </button>
          </form>
        )}
      </Drawer>
    </div>
  );
}
