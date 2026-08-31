"use client";

import React, { useState } from "react";

/**
 * Column definition for InventoryDataTable
 */
export interface InventoryColumn<T = any> {
  key: string;
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (row: T, index: number) => React.ReactNode;
}

/**
 * Props for InventoryDataTable
 */
export interface InventoryDataTableProps<T = any> {
  columns: InventoryColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyIcon?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  onRowClick?: (row: T) => void;
  // Search & Filter Toolbar
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filterSlot?: React.ReactNode;
  actionsSlot?: React.ReactNode;
  // Pagination
  page?: number;
  totalPages?: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange?: (newPage: number) => void;
}

/**
 * Reusable Universal Inventory Data Table Component (Version 2.4)
 * Provides glassmorphism container, floating headers, hover elevation, and status badge integration.
 */
export function InventoryDataTable<T extends { id?: string | number }>({
  columns,
  data,
  isLoading = false,
  emptyIcon = "inventory_2",
  emptyTitle = "No records found",
  emptySubtitle = "There are no items matching your current filters or query.",
  onRowClick,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search inventory records...",
  filterSlot,
  actionsSlot,
  page = 1,
  totalPages = 1,
  totalItems,
  itemsPerPage = 20,
  onPageChange,
}: InventoryDataTableProps<T>) {
  const [hoveredRowId, setHoveredRowId] = useState<string | number | null>(null);

  const startIndex = (page - 1) * itemsPerPage + 1;
  const endIndex = totalItems ? Math.min(page * itemsPerPage, totalItems) : data.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
      {/* Top Smart Toolbar */}
      {(onSearchChange || filterSlot || actionsSlot) && (
        <div
          className="glass-panel"
          style={{
            padding: "14px 18px",
            borderRadius: "14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            background: "var(--surface-main, rgba(30, 41, 59, 0.7))",
            border: "1px solid var(--border-main, rgba(255, 255, 255, 0.08))",
          }}
        >
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flex: 1, minWidth: "260px", flexWrap: "wrap" }}>
            {onSearchChange && (
              <div style={{ position: "relative", flex: 1, minWidth: "220px", maxWidth: "420px" }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "18px",
                    color: "var(--text-muted, #94a3b8)",
                    pointerEvents: "none",
                  }}
                >
                  search
                </span>
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchValue || ""}
                  onChange={(e) => onSearchChange(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px 9px 38px",
                    borderRadius: "10px",
                    border: "1px solid var(--border-main, rgba(255, 255, 255, 0.12))",
                    background: "var(--surface-input, rgba(15, 23, 42, 0.6))",
                    color: "var(--text-main, #f8fafc)",
                    fontSize: "13px",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                />
              </div>
            )}
            {filterSlot}
          </div>

          {actionsSlot && <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>{actionsSlot}</div>}
        </div>
      )}

      {/* Main Glass Table Container */}
      <div
        className="glass-panel"
        style={{
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid var(--border-main, rgba(255, 255, 255, 0.08))",
          background: "var(--surface-main, rgba(15, 23, 42, 0.65))",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
            <thead>
              <tr
                style={{
                  background: "var(--surface-hover, rgba(30, 41, 59, 0.85))",
                  borderBottom: "1px solid var(--border-main, rgba(255, 255, 255, 0.1))",
                }}
              >
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{
                      padding: "14px 18px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--text-muted, #94a3b8)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      textAlign: col.align || "left",
                      width: col.width,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--border-main, rgba(255, 255, 255, 0.06))" }}>
                    {columns.map((col) => (
                      <td key={col.key} style={{ padding: "16px 18px" }}>
                        <div
                          style={{
                            height: "16px",
                            borderRadius: "6px",
                            background: "var(--surface-hover, rgba(255, 255, 255, 0.06))",
                            animation: "pulse 1.5s infinite ease-in-out",
                            opacity: 0.6,
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} style={{ textAlign: "center", padding: "64px 24px", color: "var(--text-muted, #94a3b8)" }}>
                    <div
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "50%",
                        background: "var(--surface-hover, rgba(255, 255, 255, 0.05))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 16px auto",
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "32px", opacity: 0.6, color: "var(--primary, #38bdf8)" }}>
                        {emptyIcon}
                      </span>
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-main, #f8fafc)", marginBottom: "4px" }}>
                      {emptyTitle}
                    </div>
                    <div style={{ fontSize: "13px", maxWidth: "360px", margin: "0 auto", opacity: 0.8 }}>
                      {emptySubtitle}
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, index) => {
                  const rowId = row.id ?? index;
                  const isHovered = hoveredRowId === rowId;
                  return (
                    <tr
                      key={rowId}
                      onClick={() => onRowClick && onRowClick(row)}
                      onMouseEnter={() => setHoveredRowId(rowId)}
                      onMouseLeave={() => setHoveredRowId(null)}
                      style={{
                        borderBottom: "1px solid var(--border-main, rgba(255, 255, 255, 0.06))",
                        background: isHovered ? "var(--surface-hover, rgba(51, 65, 85, 0.45))" : "transparent",
                        cursor: onRowClick ? "pointer" : "default",
                        transition: "all 0.15s ease",
                        transform: isHovered ? "translateY(-1px)" : "none",
                      }}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          style={{
                            padding: "14px 18px",
                            textAlign: col.align || "left",
                            color: "var(--text-main, #f8fafc)",
                            verticalAlign: "middle",
                          }}
                        >
                          {col.render ? col.render(row, index) : (row as any)[col.key] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        {totalPages > 1 && onPageChange && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 20px",
              borderTop: "1px solid var(--border-main, rgba(255, 255, 255, 0.08))",
              background: "var(--surface-hover, rgba(30, 41, 59, 0.5))",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <span style={{ fontSize: "13px", color: "var(--text-muted, #94a3b8)" }}>
              Showing {startIndex}–{endIndex} {totalItems ? `of ${totalItems} records` : ""}
            </span>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                className="btn btn-secondary"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  borderRadius: "8px",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  opacity: page === 1 ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chevron_left</span>
                Prev
              </button>
              <span
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  color: "var(--text-main, #f8fafc)",
                  fontWeight: 600,
                  borderRadius: "6px",
                  background: "var(--surface-input, rgba(15, 23, 42, 0.5))",
                }}
              >
                {page} / {totalPages}
              </span>
              <button
                className="btn btn-secondary"
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  borderRadius: "8px",
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                  opacity: page === totalPages ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                Next
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
