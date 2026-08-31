"use client";

import React, { useState, useEffect, useRef } from "react";

interface ProductQuickSearchProps {
  products: any[];
  onSelectProduct: (product: any) => void;
}

/**
 * ProductQuickSearch Component (Version 2.4)
 * Bordered quick search bar with instant autocomplete to add products in 1 click.
 */
export function ProductQuickSearch({ products = [], onSelectProduct }: ProductQuickSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = query.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          (p.sku && p.sku.toLowerCase().includes(query.toLowerCase())) ||
          (p.productCode && p.productCode.toLowerCase().includes(query.toLowerCase()))
      )
    : products.slice(0, 8);

  const handleSelect = (p: any) => {
    onSelectProduct(p);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div
      ref={wrapperRef}
      style={{
        padding: "16px 20px",
        borderRadius: "14px",
        border: "1.5px solid var(--primary, #38bdf8)",
        background: "var(--surface-hover, rgba(30, 41, 59, 0.6))",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        position: "relative",
        boxShadow: "0 0 15px rgba(56, 189, 248, 0.1)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--primary, #38bdf8)" }}>
            inventory_2
          </span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            2. Product Selection & Quick Add
          </span>
        </div>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          Type product name or SKU to add to order
        </span>
      </div>

      <div style={{ position: "relative", width: "100%" }}>
        <span
          className="material-symbols-outlined"
          style={{
            position: "absolute",
            left: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "20px",
            color: "var(--primary, #38bdf8)",
            pointerEvents: "none"
          }}
        >
          search
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search and select product (e.g. Calcium Carbonate, SKU, Barcode)..."
          style={{
            width: "100%",
            padding: "12px 14px 12px 44px",
            borderRadius: "10px",
            border: "1px solid var(--border-main, rgba(255, 255, 255, 0.15))",
            background: "var(--surface-input, rgba(15, 23, 42, 0.8))",
            color: "var(--text-main, #f8fafc)",
            fontSize: "14px",
            outline: "none",
            boxSizing: "border-box"
          }}
        />

        {isOpen && filtered.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              right: 0,
              zIndex: 100,
              background: "var(--surface-bg, #1e293b)",
              border: "1px solid var(--border-main)",
              borderRadius: "12px",
              boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
              maxHeight: "260px",
              overflowY: "auto",
              padding: "6px"
            }}
          >
            {filtered.map((p) => {
              const price = Number(p.sellingPrice || p.price || 0);
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "background 0.15s ease"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-main)" }}>{p.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {p.productCode ? `Code: ${p.productCode}` : ""} {p.sku ? `· SKU: ${p.sku}` : ""}{" "}
                      {p.currentStock !== undefined ? `· Stock: ${p.currentStock} ${p.unit || "pcs"}` : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, fontFamily: "monospace", fontSize: "14px", color: "var(--primary, #38bdf8)" }}>
                      ৳{price.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--success, #10b981)" }}>+ Add to order</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
