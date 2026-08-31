"use client";

import React from "react";

export interface OrderItem {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

interface SalesOrderItemsTableProps {
  items: OrderItem[];
  onItemChange: (index: number, field: "quantity" | "unitPrice" | "discount", val: number) => void;
  onRemoveItem: (index: number) => void;
}

/**
 * SalesOrderItemsTable (Version 2.4)
 * Section 3 of Sales Order Form: Line items table with editable quantities,
 * pre-filled unit price, line discount, and live calculated totals.
 */
export function SalesOrderItemsTable({
  items,
  onItemChange,
  onRemoveItem
}: SalesOrderItemsTableProps) {
  return (
    <div
      className="glass-panel"
      style={{
        padding: "20px",
        borderRadius: "14px",
        border: "1px solid var(--border-main)",
        display: "flex",
        flexDirection: "column",
        gap: "14px"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--primary, #38bdf8)" }}>
            format_list_bulleted
          </span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            3. Order Items Table ({items.length})
          </span>
        </div>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          Values auto-calculate in real time
        </span>
      </div>

      <div style={{ overflowX: "auto", borderRadius: "10px", border: "1px solid var(--border-main)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "var(--surface-hover)", borderBottom: "1px solid var(--border-main)" }}>
              <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>Product Description</th>
              <th style={{ padding: "12px 16px", color: "var(--text-muted)", width: "120px" }}>Quantity</th>
              <th style={{ padding: "12px 16px", color: "var(--text-muted)", width: "140px" }}>Unit Price (৳)</th>
              <th style={{ padding: "12px 16px", color: "var(--text-muted)", width: "120px" }}>Discount (৳)</th>
              <th style={{ padding: "12px 16px", color: "var(--text-muted)", width: "140px", textAlign: "right" }}>Total</th>
              <th style={{ padding: "12px 16px", width: "40px" }}></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "36px 0", color: "var(--text-muted)" }}>
                  No items added yet. Use the product search bar in Step 2 above to add products.
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.id} style={{ borderBottom: "1px solid var(--border-main)" }}>
                  <td style={{ padding: "10px 16px", fontWeight: 600, color: "var(--text-main)" }}>
                    {item.description}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => onItemChange(index, "quantity", Number(e.target.value))}
                      style={smallInputStyle}
                      required
                    />
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.unitPrice}
                      onChange={(e) => onItemChange(index, "unitPrice", Number(e.target.value))}
                      style={{ ...smallInputStyle, fontFamily: "monospace" }}
                      required
                    />
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <input
                      type="number"
                      min="0"
                      value={item.discount}
                      onChange={(e) => onItemChange(index, "discount", Number(e.target.value))}
                      style={smallInputStyle}
                    />
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 700, fontFamily: "monospace", fontSize: "14px" }}>
                    ৳{Number(item.total).toLocaleString()}
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(index)}
                      style={{ background: "none", border: "none", color: "var(--danger, #ef4444)", cursor: "pointer" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>delete</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const smallInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 10px",
  borderRadius: "8px",
  border: "1px solid var(--border-main, rgba(255,255,255,0.12))",
  background: "var(--surface-input, rgba(15, 23, 42, 0.6))",
  color: "var(--text-main, #f8fafc)",
  fontSize: "13px",
  boxSizing: "border-box",
  outline: "none"
};
