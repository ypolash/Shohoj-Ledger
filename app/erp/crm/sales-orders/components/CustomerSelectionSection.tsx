"use client";

import React from "react";

interface CustomerSelectionSectionProps {
  customerMode: "existing" | "temporary";
  setCustomerMode: (mode: "existing" | "temporary") => void;
  customerId: string;
  setCustomerId: (id: string) => void;
  customers: any[];
  tempName: string;
  setTempName: (name: string) => void;
  tempPhone: string;
  setTempPhone: (phone: string) => void;
  tempEmail: string;
  setTempEmail: (email: string) => void;
  tempAddress: string;
  setTempAddress: (address: string) => void;
}

/**
 * CustomerSelectionSection (Version 2.4)
 * Section 1 of Sales Order Form: Customer Type toggle (Existing vs Temporary)
 * with dynamic conditional field rendering.
 */
export function CustomerSelectionSection({
  customerMode,
  setCustomerMode,
  customerId,
  setCustomerId,
  customers,
  tempName,
  setTempName,
  tempPhone,
  setTempPhone,
  tempEmail,
  setTempEmail,
  tempAddress,
  setTempAddress
}: CustomerSelectionSectionProps) {
  return (
    <div
      className="glass-panel"
      style={{
        padding: "20px",
        borderRadius: "14px",
        border: "1px solid var(--border-main)",
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--primary, #38bdf8)" }}>
            person
          </span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            1. Customer Information
          </span>
        </div>

        {/* Customer Type Radio Toggle */}
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px", color: "var(--text-main)" }}>
            <input
              type="radio"
              name="customerMode"
              checked={customerMode === "existing"}
              onChange={() => setCustomerMode("existing")}
            />
            Existing Customer
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px", color: "var(--text-main)" }}>
            <input
              type="radio"
              name="customerMode"
              checked={customerMode === "temporary"}
              onChange={() => setCustomerMode("temporary")}
            />
            Temporary / Guest Customer
          </label>
        </div>
      </div>

      {/* Existing Customer Dropdown */}
      {customerMode === "existing" ? (
        <div>
          <label style={labelStyle}>Select Existing Customer *</label>
          <select
            required={customerMode === "existing"}
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            style={inputStyle}
          >
            <option value="">— Select Customer from Database —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ""} {c.companyName ? `· ${c.companyName}` : ""}
              </option>
            ))}
          </select>
        </div>
      ) : (
        /* Temporary Customer Inline Fields */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Customer Full Name *</label>
            <input
              type="text"
              placeholder="e.g. Rahim Ahmed"
              required={customerMode === "temporary"}
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Phone Number</label>
            <input
              type="text"
              placeholder="+880 17..."
              value={tempPhone}
              onChange={(e) => setTempPhone(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              placeholder="rahim@example.com"
              value={tempEmail}
              onChange={(e) => setTempEmail(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Delivery / Billing Address</label>
            <input
              type="text"
              placeholder="Road #4, Dhanmondi, Dhaka"
              value={tempAddress}
              onChange={(e) => setTempAddress(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      )}
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
