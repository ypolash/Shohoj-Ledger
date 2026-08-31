"use client";

import React from "react";

interface Step4Props {
  formData: {
    companyName: string;
    companyEmail: string;
    phone: string;
    logoUrl: string;
    businessType: string;
    industryTemplate: string;
    selectedModules: string[];
    ownerName: string;
    ownerEmail: string;
  };
  isLoading: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

const MODULE_LABELS: Record<string, string> = {
  finance: "Finance & Accounts",
  hr: "HR & Attendance",
  payroll: "Payroll Processing",
  crm: "CRM & Sales Orders",
  inventory: "Inventory & Warehouses",
  procurement: "Procurement & Suppliers"
};

const TEMPLATE_LABELS: Record<string, string> = {
  it: "IT & Software Agency",
  retail: "Retail & E-Commerce",
  manufacturing: "Manufacturing & Factory",
  wholesale: "Wholesale & Distribution",
  healthcare: "Healthcare & Pharmacy",
  consulting: "Consulting & Services"
};

/**
 * Step 4: Review & Launch (Theme 4: Pastel Aqua Mint #b5eff2)
 */
export function Step4ReviewLaunch({ formData, isLoading, onBack, onSubmit }: Step4Props) {
  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(20px)",
        border: "1.5px solid rgba(15, 23, 42, 0.15)",
        borderRadius: "24px",
        padding: "40px",
        width: "100%",
        maxWidth: "640px",
        boxShadow: "0 25px 60px rgba(15, 23, 42, 0.25)",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        color: "#0f172a"
      }}
    >
      <div>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#0f766e",
            background: "rgba(15, 118, 110, 0.12)",
            padding: "4px 10px",
            borderRadius: "20px"
          }}
        >
          Step 4 of 4 · Verification
        </span>
        <h2 style={{ fontSize: "26px", fontWeight: 700, margin: "12px 0 6px 0", color: "#0f172a" }}>
          Review & Launch Workspace
        </h2>
        <p style={{ margin: 0, fontSize: "14px", color: "#475569" }}>
          Review your environment configuration before provisioning your enterprise database.
        </p>
      </div>

      {/* Review Card */}
      <div
        style={{
          background: "rgba(241, 245, 249, 0.8)",
          borderRadius: "16px",
          padding: "20px",
          border: "1px solid rgba(15, 23, 42, 0.1)",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}
      >
        {/* Brand Banner */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", borderBottom: "1px solid rgba(15, 23, 42, 0.1)", paddingBottom: "14px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "12px",
              background: "#ffffff",
              border: "1px solid rgba(15, 23, 42, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              flexShrink: 0
            }}
          >
            {formData.logoUrl ? (
              <img src={formData.logoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "#0f766e" }}>
                domain
              </span>
            )}
          </div>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>{formData.companyName}</div>
            <div style={{ fontSize: "13px", color: "#64748b" }}>
              {formData.businessType} Based · {formData.companyEmail}
            </div>
          </div>
        </div>

        {/* Template & Admin Details */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <div style={reviewLabel}>Industry Template</div>
            <div style={reviewValue}>{TEMPLATE_LABELS[formData.industryTemplate] || formData.industryTemplate}</div>
          </div>
          <div>
            <div style={reviewLabel}>Root Administrator</div>
            <div style={reviewValue}>{formData.ownerName} ({formData.ownerEmail})</div>
          </div>
        </div>

        {/* Active Modules */}
        <div>
          <div style={reviewLabel}>Active ERP Modules ({formData.selectedModules.length})</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
            {formData.selectedModules.map((mId) => (
              <span
                key={mId}
                style={{
                  padding: "4px 10px",
                  borderRadius: "20px",
                  background: "rgba(15, 118, 110, 0.12)",
                  color: "#0f766e",
                  fontSize: "12px",
                  fontWeight: 700,
                  border: "1px solid rgba(15, 118, 110, 0.25)"
                }}
              >
                {MODULE_LABELS[mId] || mId}
              </span>
            ))}
          </div>
        </div>

        <div
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            background: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            fontSize: "12px",
            color: "#065f46",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: 600
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>verified_user</span>
          Tenant isolation & automated database schema provisioning ready.
        </div>
      </div>

      {/* Navigation Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid rgba(15, 23, 42, 0.1)" }}>
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          style={{
            background: "transparent",
            color: "#475569",
            border: "1px solid rgba(15, 23, 42, 0.2)",
            padding: "11px 22px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: isLoading ? "not-allowed" : "pointer"
          }}
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading}
          style={{
            background: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)",
            color: "#ffffff",
            border: "none",
            padding: "13px 32px",
            borderRadius: "12px",
            fontSize: "15px",
            fontWeight: 700,
            cursor: isLoading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 10px 25px -5px rgba(15, 118, 110, 0.5)",
            opacity: isLoading ? 0.7 : 1
          }}
        >
          {isLoading ? "Provisioning..." : "Launch Enterprise Workspace"}
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>rocket_launch</span>
        </button>
      </div>
    </div>
  );
}

const reviewLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  color: "#64748b",
  letterSpacing: "0.05em"
};

const reviewValue: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  color: "#0f172a",
  marginTop: "2px"
};
