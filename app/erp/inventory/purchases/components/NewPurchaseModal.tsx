"use client";

import React, { useState, useEffect } from "react";

interface NewPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PurchaseLineItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

/**
 * NewPurchaseModal (Version 2.4)
 * Handles creating new Purchase Orders with dynamic line items, supplier selection,
 * and automatic expense recognition.
 */
export default function NewPurchaseModal({ isOpen, onClose, onSuccess }: NewPurchaseModalProps) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [supplierRef, setSupplierRef] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PurchaseLineItem[]>([
    { id: "1", productId: "", productName: "", quantity: 1, unitPrice: 0, lineTotal: 0 }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Generate PO Number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.floor(1000 + Math.random() * 9000);
    setPoNumber(`PO-SHO-${dateStr}-${rand}`);

    // Fetch suppliers and products
    const loadData = async () => {
      try {
        const [supRes, prodRes] = await Promise.all([
          fetch("/api/inventory/suppliers"),
          fetch("/api/inventory/products?limit=200")
        ]);
        if (supRes.ok) {
          const supData = await supRes.json();
          setSuppliers(supData.suppliers || []);
        }
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(prodData.products || []);
        }
      } catch (err) {
        console.error("Failed to load modal data:", err);
      }
    };
    loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProductSelect = (index: number, prodId: string) => {
    const selected = products.find((p) => p.id === prodId);
    const updated = [...items];
    if (selected) {
      const price = Number(selected.purchasePrice || selected.costPrice || selected.sellingPrice || 0);
      const qty = updated[index].quantity || 1;
      updated[index] = {
        ...updated[index],
        productId: selected.id,
        productName: selected.name,
        unitPrice: price,
        lineTotal: qty * price
      };
    } else {
      updated[index] = {
        ...updated[index],
        productId: "",
        productName: "",
        unitPrice: 0,
        lineTotal: 0
      };
    }
    setItems(updated);
  };

  const handleLineChange = (index: number, field: "quantity" | "unitPrice", val: number) => {
    const updated = [...items];
    updated[index][field] = val;
    updated[index].lineTotal = Number(updated[index].quantity || 0) * Number(updated[index].unitPrice || 0);
    setItems(updated);
  };

  const addLine = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), productId: "", productName: "", quantity: 1, unitPrice: 0, lineTotal: 0 }
    ]);
  };

  const removeLine = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const grandTotal = items.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supplierId) {
      setError("Please select a supplier.");
      return;
    }

    const validItems = items.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      setError("Please add at least one product with quantity greater than 0.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/inventory/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          poNumber,
          expectedDate: expectedDate || null,
          supplierRef,
          notes,
          items: validItems
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create purchase order.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(6px)",
        padding: "16px"
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "760px",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: "20px",
          padding: "32px",
          background: "var(--surface-bg, #1e293b)",
          border: "1px solid var(--border-main)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)"
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", color: "var(--text-main)", fontWeight: 700 }}>
              New Purchase Order
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
              Create an inventory purchase and automatically recognize operational expenses.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>close</span>
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "10px",
              background: "rgba(239, 68, 68, 0.15)",
              color: "var(--danger, #ef4444)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              fontSize: "13px",
              marginBottom: "16px"
            }}
          >
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Top Form Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Supplier *</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                required
                style={inputStyle}
              >
                <option value="">— Select Supplier —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.phone ? `(${s.phone})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>PO Number *</label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                required
                style={{ ...inputStyle, fontFamily: "monospace", fontWeight: 600 }}
              />
            </div>
            <div>
              <label style={labelStyle}>Expected Delivery Date</label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Supplier Reference / Invoice #</label>
              <input
                type="text"
                value={supplierRef}
                onChange={(e) => setSupplierRef(e.target.value)}
                placeholder="e.g. SUP-INV-9821"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={labelStyle}>Purchased Items *</label>
              <button
                type="button"
                onClick={addLine}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary, #38bdf8)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add</span>
                Add Item
              </button>
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
                    <th style={{ padding: "10px 14px", color: "var(--text-muted)" }}>Product</th>
                    <th style={{ padding: "10px 14px", color: "var(--text-muted)", width: "100px" }}>Qty</th>
                    <th style={{ padding: "10px 14px", color: "var(--text-muted)", width: "140px" }}>Unit Cost (৳)</th>
                    <th style={{ padding: "10px 14px", color: "var(--text-muted)", width: "140px", textAlign: "right" }}>Total</th>
                    <th style={{ padding: "10px 14px", width: "40px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid var(--border-main)" }}>
                      <td style={{ padding: "8px 12px" }}>
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductSelect(index, e.target.value)}
                          style={smallInputStyle}
                          required
                        >
                          <option value="">Select Product...</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.productCode})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleLineChange(index, "quantity", Number(e.target.value))}
                          style={smallInputStyle}
                          required
                        />
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.unitPrice}
                          onChange={(e) => handleLineChange(index, "unitPrice", Number(e.target.value))}
                          style={smallInputStyle}
                          required
                        />
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, fontFamily: "monospace" }}>
                        ৳{Number(item.lineTotal || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "center" }}>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLine(index)}
                            style={{ background: "none", border: "none", color: "var(--danger, #ef4444)", cursor: "pointer" }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes & Grand Total */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "260px" }}>
              <label style={labelStyle}>Order Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment terms, delivery instructions, or notes..."
                rows={2}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
            <div
              style={{
                padding: "16px 20px",
                borderRadius: "12px",
                background: "rgba(56, 189, 248, 0.08)",
                border: "1px solid rgba(56, 189, 248, 0.2)",
                minWidth: "220px",
                textAlign: "right"
              }}
            >
              <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                Total Purchase Amount
              </div>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-main)", fontFamily: "monospace", marginTop: "4px" }}>
                ৳{grandTotal.toLocaleString()}
              </div>
              <div style={{ fontSize: "11px", color: "var(--primary, #38bdf8)", marginTop: "4px" }}>
                ✓ Auto-posted to Expense Ledger
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", paddingTop: "12px", borderTop: "1px solid var(--border-main)" }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: "10px 18px", fontSize: "13px" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{
                padding: "10px 24px",
                fontSize: "13px",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? "Saving..." : "Create Purchase & Post Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--text-secondary, #94a3b8)",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.05em"
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid var(--border-main, rgba(255,255,255,0.12))",
  background: "var(--surface-input, rgba(15, 23, 42, 0.6))",
  color: "var(--text-main, #f8fafc)",
  fontSize: "13px",
  boxSizing: "border-box",
  outline: "none"
};

const smallInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  borderRadius: "8px",
  border: "1px solid var(--border-main, rgba(255,255,255,0.12))",
  background: "var(--surface-input, rgba(15, 23, 42, 0.8))",
  color: "var(--text-main, #f8fafc)",
  fontSize: "13px",
  boxSizing: "border-box",
  outline: "none"
};
