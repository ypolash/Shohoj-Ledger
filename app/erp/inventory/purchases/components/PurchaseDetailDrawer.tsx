"use client";

import React, { useState, useEffect } from "react";
import { Drawer } from "@/components/ui/Drawer/Drawer";

interface PurchaseDetailDrawerProps {
  purchase: any | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: () => void;
}

/**
 * PurchaseDetailDrawer (Version 2.4)
 * Slide-over inspector for purchase order details, supplier info, line items, and payment status.
 */
export default function PurchaseDetailDrawer({
  purchase,
  isOpen,
  onClose,
  onPaymentSuccess
}: PurchaseDetailDrawerProps) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!purchase?.id || !isOpen) return;

    const fetchPayments = async () => {
      setLoadingPayments(true);
      try {
        const res = await fetch(`/api/inventory/purchases/${purchase.id}/payments`);
        if (res.ok) {
          const data = await res.json();
          setPayments(data.payments || []);
        }
      } catch (err) {
        console.error("Failed to load payments:", err);
      } finally {
        setLoadingPayments(false);
      }
    };

    fetchPayments();
  }, [purchase?.id, isOpen]);

  if (!purchase) return null;

  const totalAmount = Number(purchase.totalAmount || purchase.subtotal || 0);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.debit || p.amount || 0), 0);
  const dueBalance = Math.max(0, totalAmount - totalPaid);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentMsg(null);

    const amt = Number(payAmount);
    if (!amt || amt <= 0) {
      setPaymentMsg({ type: "error", text: "Please enter a valid payment amount." });
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await fetch(`/api/inventory/purchases/${purchase.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          paymentMethod: payMethod,
          notes: `Settlement for PO: ${purchase.purchaseOrderNumber}`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process payment.");
      }

      setPaymentMsg({ type: "success", text: "Payment successfully recorded and posted to ledger!" });
      setIsPaying(false);
      setPayAmount("");
      if (onPaymentSuccess) onPaymentSuccess();
      // Reload payments
      const refreshRes = await fetch(`/api/inventory/purchases/${purchase.id}/payments`);
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setPayments(refreshData.payments || []);
      }
    } catch (err: any) {
      setPaymentMsg({ type: "error", text: err.message || "Payment failed." });
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={`Purchase Order #${purchase.purchaseOrderNumber}`} size="lg">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px", color: "var(--text-main)" }}>
        {/* Status and Supplier Banner */}
        <div
          style={{
            padding: "16px 20px",
            borderRadius: "14px",
            background: "var(--surface-hover, rgba(30, 41, 59, 0.7))",
            border: "1px solid var(--border-main)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}
        >
          <div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
              Supplier
            </div>
            <div style={{ fontSize: "16px", fontWeight: 700, marginTop: "2px" }}>
              {purchase.supplier?.name || "Supplier"}
            </div>
            {purchase.supplier?.phone && (
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{purchase.supplier.phone}</div>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <span
              style={{
                padding: "5px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 600,
                background: dueBalance === 0 ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                color: dueBalance === 0 ? "var(--success, #10b981)" : "#f59e0b",
                border: `1px solid ${dueBalance === 0 ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"}`
              }}
            >
              {dueBalance === 0 ? "Fully Paid" : `Due: ৳${dueBalance.toLocaleString()}`}
            </span>
          </div>
        </div>

        {/* Purchase Items Breakdown */}
        <div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "10px", textTransform: "uppercase" }}>
            Line Items ({purchase.lines?.length || 0})
          </div>
          <div
            style={{
              borderRadius: "12px",
              border: "1px solid var(--border-main)",
              overflow: "hidden",
              background: "var(--surface-input, rgba(15, 23, 42, 0.4))"
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "var(--surface-hover)", borderBottom: "1px solid var(--border-main)" }}>
                  <th style={{ padding: "10px 14px", color: "var(--text-muted)" }}>Item Description</th>
                  <th style={{ padding: "10px 14px", color: "var(--text-muted)", width: "80px" }}>Qty</th>
                  <th style={{ padding: "10px 14px", color: "var(--text-muted)", width: "110px" }}>Unit Price</th>
                  <th style={{ padding: "10px 14px", color: "var(--text-muted)", width: "110px", textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(purchase.lines || []).map((line: any, idx: number) => (
                  <tr key={line.id || idx} style={{ borderBottom: "1px solid var(--border-main)" }}>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ fontWeight: 600 }}>{line.remarks || line.productId || "Product Item"}</div>
                    </td>
                    <td style={{ padding: "10px 14px" }}>{Number(line.quantity)}</td>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace" }}>৳{Number(line.unitPrice).toLocaleString()}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>
                      ৳{Number(line.lineTotal || (line.quantity * line.unitPrice)).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary */}
        <div
          style={{
            padding: "16px 20px",
            borderRadius: "12px",
            background: "rgba(56, 189, 248, 0.06)",
            border: "1px solid rgba(56, 189, 248, 0.15)",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
            <span style={{ color: "var(--text-muted)" }}>Total Expense Recognized:</span>
            <span style={{ fontWeight: 700, fontFamily: "monospace" }}>৳{totalAmount.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
            <span style={{ color: "var(--text-muted)" }}>Total Paid:</span>
            <span style={{ fontWeight: 600, color: "var(--success, #10b981)", fontFamily: "monospace" }}>
              ৳{totalPaid.toLocaleString()}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "14px",
              fontWeight: 700,
              borderTop: "1px solid var(--border-main)",
              paddingTop: "8px"
            }}
          >
            <span>Outstanding Due:</span>
            <span style={{ color: dueBalance > 0 ? "#f59e0b" : "var(--success, #10b981)", fontFamily: "monospace" }}>
              ৳{dueBalance.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Payment History & Fast Entry */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Payment History
            </div>
            {dueBalance > 0 && !isPaying && (
              <button
                type="button"
                onClick={() => {
                  setIsPaying(true);
                  setPayAmount(String(dueBalance));
                }}
                className="btn btn-primary"
                style={{ padding: "6px 14px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>payments</span>
                Record Payment
              </button>
            )}
          </div>

          {paymentMsg && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                marginBottom: "12px",
                background: paymentMsg.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                color: paymentMsg.type === "success" ? "var(--success, #10b981)" : "var(--danger, #ef4444)",
                border: `1px solid ${paymentMsg.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`
              }}
            >
              {paymentMsg.text}
            </div>
          )}

          {isPaying && (
            <form
              onSubmit={handleRecordPayment}
              style={{
                padding: "16px",
                borderRadius: "12px",
                background: "var(--surface-hover)",
                border: "1px solid var(--border-main)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginBottom: "16px"
              }}
            >
              <div style={{ fontWeight: 600, fontSize: "13px" }}>Disburse Payment</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                    Amount (৳) *
                  </label>
                  <input
                    type="number"
                    max={dueBalance}
                    min="1"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-main)",
                      background: "var(--surface-input)",
                      color: "var(--text-main)",
                      fontSize: "13px"
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                    Method *
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-main)",
                      background: "var(--surface-input)",
                      color: "var(--text-main)",
                      fontSize: "13px"
                    }}
                  >
                    <option value="CASH">Cash in Hand</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="MOBILE">Mobile Money (bKash/Nagad)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsPaying(false)}
                  className="btn btn-secondary"
                  style={{ padding: "6px 12px", fontSize: "12px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="btn btn-primary"
                  style={{ padding: "6px 16px", fontSize: "12px" }}
                >
                  {submittingPayment ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          )}

          {payments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: "13px" }}>
              No payments recorded yet for this purchase.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {payments.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "var(--surface-input)",
                    border: "1px solid var(--border-main)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "13px"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.description || "Supplier Payment"}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {new Date(p.date || p.createdAt).toLocaleDateString()} · Ref: {p.voucherNo}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontFamily: "monospace", color: "var(--success, #10b981)" }}>
                    ৳{Number(p.debit || p.amount || 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
