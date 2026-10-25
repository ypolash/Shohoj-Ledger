"use client";

import React, { useState, useEffect, useRef } from "react";

export interface TableHeaderTheme {
  id: string;
  name: string;
  bg: string;
  color: string;
  borderColor: string;
  swatch: string;
}

export const TABLE_HEADER_THEMES: Record<string, TableHeaderTheme> = {
  green: {
    id: "green",
    name: "Emerald Green",
    bg: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
    color: "#ffffff",
    borderColor: "#047857",
    swatch: "#10b981",
  },
  forest: {
    id: "forest",
    name: "Deep Forest",
    bg: "linear-gradient(135deg, #064e3b 0%, #047857 100%)",
    color: "#ffffff",
    borderColor: "#064e3b",
    swatch: "#047857",
  },
  blue: {
    id: "blue",
    name: "Classic Blue",
    bg: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
    color: "#ffffff",
    borderColor: "#1e40af",
    swatch: "#2563eb",
  },
  teal: {
    id: "teal",
    name: "Modern Teal",
    bg: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
    color: "#ffffff",
    borderColor: "#115e59",
    swatch: "#14b8a6",
  },
  indigo: {
    id: "indigo",
    name: "Royal Indigo",
    bg: "linear-gradient(135deg, #3730a3 0%, #4f46e5 100%)",
    color: "#ffffff",
    borderColor: "#312e81",
    swatch: "#4f46e5",
  },
  purple: {
    id: "purple",
    name: "Vibrant Purple",
    bg: "linear-gradient(135deg, #6b21a8 0%, #9333ea 100%)",
    color: "#ffffff",
    borderColor: "#581c87",
    swatch: "#9333ea",
  },
  amber: {
    id: "amber",
    name: "Warm Amber",
    bg: "linear-gradient(135deg, #b45309 0%, #d97706 100%)",
    color: "#ffffff",
    borderColor: "#92400e",
    swatch: "#d97706",
  },
  rose: {
    id: "rose",
    name: "Rose Crimson",
    bg: "linear-gradient(135deg, #be123c 0%, #e11d48 100%)",
    color: "#ffffff",
    borderColor: "#9f1239",
    swatch: "#e11d48",
  },
  slate: {
    id: "slate",
    name: "Midnight Slate",
    bg: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    color: "#f8fafc",
    borderColor: "rgba(255, 255, 255, 0.12)",
    swatch: "#334155",
  },
};

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
  // Color Customization
  showColorSwitcher?: boolean;
  defaultHeaderTheme?: string;
  // Pagination
  page?: number;
  totalPages?: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange?: (newPage: number) => void;
}

/**
 * Reusable Universal Inventory Data Table Component (Version 2.5)
 * Provides 0px radius enterprise styling, green header by default, dynamic color switcher, and elevation.
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
  showColorSwitcher = true,
  defaultHeaderTheme = "green",
  page = 1,
  totalPages = 1,
  totalItems,
  itemsPerPage = 20,
  onPageChange,
}: InventoryDataTableProps<T>) {
  const [hoveredRowId, setHoveredRowId] = useState<string | number | null>(null);
  const [headerThemeKey, setHeaderThemeKey] = useState<string>(defaultHeaderTheme);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const colorMenuRef = useRef<HTMLDivElement>(null);

  // Sync theme with localStorage
  useEffect(() => {
    const readTheme = () => {
      const saved = localStorage.getItem("inventory_table_header_theme");
      if (saved && TABLE_HEADER_THEMES[saved]) {
        setHeaderThemeKey(saved);
      } else {
        setHeaderThemeKey(defaultHeaderTheme);
      }
    };

    readTheme();
    window.addEventListener("storage", readTheme);
    window.addEventListener("inventoryTableHeaderThemeChanged", readTheme);

    return () => {
      window.removeEventListener("storage", readTheme);
      window.removeEventListener("inventoryTableHeaderThemeChanged", readTheme);
    };
  }, [defaultHeaderTheme]);

  // Click outside listener for color switcher menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colorMenuRef.current && !colorMenuRef.current.contains(e.target as Node)) {
        setShowColorMenu(false);
      }
    };
    if (showColorMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showColorMenu]);

  const selectTheme = (themeId: string) => {
    setHeaderThemeKey(themeId);
    if (typeof window !== "undefined") {
      localStorage.setItem("inventory_table_header_theme", themeId);
      window.dispatchEvent(new Event("inventoryTableHeaderThemeChanged"));
    }
  };

  const currentTheme = TABLE_HEADER_THEMES[headerThemeKey] || TABLE_HEADER_THEMES.green;

  const startIndex = (page - 1) * itemsPerPage + 1;
  const endIndex = totalItems ? Math.min(page * itemsPerPage, totalItems) : data.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
      {/* Top Smart Toolbar */}
      {(onSearchChange || filterSlot || actionsSlot || showColorSwitcher) && (
        <div
          className="glass-panel"
          style={{
            padding: "14px 18px",
            borderRadius: "0px",
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
                    borderRadius: "0px",
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

          {/* Right Toolbar Actions & Color Switcher */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center", position: "relative" }}>
            {actionsSlot}

            {showColorSwitcher && (
              <div ref={colorMenuRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setShowColorMenu((prev) => !prev)}
                  title={`Header Color: ${currentTheme.name} (Click to switch)`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 11px",
                    borderRadius: "0px",
                    border: "1px solid var(--border-main, rgba(255, 255, 255, 0.15))",
                    background: "var(--surface-input, rgba(15, 23, 42, 0.6))",
                    color: "var(--text-main, #f8fafc)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "0px",
                      background: currentTheme.swatch,
                      display: "inline-block",
                      boxShadow: `0 0 6px ${currentTheme.swatch}`,
                      border: "1px solid rgba(255, 255, 255, 0.4)",
                    }}
                  />
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    palette
                  </span>
                  <span style={{ fontSize: "12px" }}>{currentTheme.name}</span>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: "16px",
                      transform: showColorMenu ? "rotate(180deg)" : "none",
                      transition: "transform 0.15s ease",
                    }}
                  >
                    expand_more
                  </span>
                </button>

                {/* Color Switcher Dropdown (0px Radius) */}
                {showColorMenu && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "calc(100% + 4px)",
                      zIndex: 60,
                      minWidth: "210px",
                      background: "var(--surface-card, #1e293b)",
                      border: "1px solid var(--border-main, rgba(255, 255, 255, 0.15))",
                      borderRadius: "0px",
                      boxShadow: "0 12px 30px rgba(0, 0, 0, 0.5)",
                      padding: "8px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px",
                    }}
                  >
                    <div
                      style={{
                        padding: "4px 8px 6px 8px",
                        fontSize: "10px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--text-muted, #94a3b8)",
                        borderBottom: "1px solid var(--border-main, rgba(255, 255, 255, 0.08))",
                        marginBottom: "4px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>Table Header Theme</span>
                      <span style={{ fontSize: "9px", opacity: 0.8 }}>0px Style</span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2px", maxHeight: "280px", overflowY: "auto" }}>
                      {Object.values(TABLE_HEADER_THEMES).map((theme) => {
                        const isSelected = theme.id === headerThemeKey;
                        return (
                          <button
                            key={theme.id}
                            type="button"
                            onClick={() => {
                              selectTheme(theme.id);
                              setShowColorMenu(false);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "7px 10px",
                              borderRadius: "0px",
                              border: isSelected ? `1px solid ${theme.swatch}` : "1px solid transparent",
                              background: isSelected ? "rgba(255, 255, 255, 0.1)" : "transparent",
                              color: isSelected ? "#ffffff" : "var(--text-secondary, #cbd5e1)",
                              fontSize: "12px",
                              fontWeight: isSelected ? 700 : 500,
                              cursor: "pointer",
                              textAlign: "left",
                              transition: "all 0.12s ease",
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.background = "transparent";
                              }
                            }}
                          >
                            <span
                              style={{
                                width: "16px",
                                height: "16px",
                                borderRadius: "0px",
                                background: theme.bg,
                                border: "1px solid rgba(255, 255, 255, 0.3)",
                                flexShrink: 0,
                                display: "inline-block",
                                boxShadow: isSelected ? `0 0 6px ${theme.swatch}` : "none",
                              }}
                            />
                            <span style={{ flex: 1 }}>{theme.name}</span>
                            {isSelected && (
                              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: theme.swatch }}>
                                check
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Glass Table Container */}
      <div
        className="glass-panel"
        style={{
          borderRadius: "0px",
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
                  background: currentTheme.bg,
                  borderBottom: `2px solid ${currentTheme.borderColor}`,
                  transition: "background 0.25s ease, border-color 0.25s ease",
                }}
              >
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{
                      padding: "14px 18px",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: currentTheme.color,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      textAlign: col.align || "left",
                      width: col.width,
                      whiteSpace: "nowrap",
                      textShadow: currentTheme.color === "#ffffff" ? "0 1px 2px rgba(0,0,0,0.25)" : "none",
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
                            borderRadius: "0px",
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
                        borderRadius: "0px",
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
                  borderRadius: "0px",
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
                  borderRadius: "0px",
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
                  borderRadius: "0px",
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
