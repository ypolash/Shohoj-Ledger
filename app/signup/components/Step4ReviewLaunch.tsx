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
        background: "rgba(255, 255, 255, 0.04)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: "24px",
        padding: "40px",
        width: "100%",
        maxWidth: "640px",
        boxShadow: "0 25px 60px rgba(0, 0, 0, 0.6)",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        color: "#ffffff"
      }}
    >
      {/* Review Card */}
      <div
        style={{
          background: "rgba(0, 0, 0, 0.25)",
          borderRadius: "16px",
          padding: "20px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}
      >
        {/* Brand Banner */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "14px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
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
              <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "#3b82f6" }}>
                domain
              </span>
            )}
          </div>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff" }}>{formData.companyName}</div>
            <div style={{ fontSize: "13px", color: "#94a3b8" }}>
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
                  background: "rgba(59, 130, 246, 0.15)",
                  color: "#93c5fd",
                  fontSize: "12px",
                  fontWeight: 700,
                  border: "1px solid rgba(59, 130, 246, 0.3)"
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
            background: "rgba(59, 130, 246, 0.12)",
            border: "1px solid rgba(59, 130, 246, 0.25)",
            fontSize: "12px",
            color: "#bfdbfe",
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            padding: "11px 22px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "all 0.2s ease"
          }}
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading}
          style={{
            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
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
            boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.5)",
            opacity: isLoading ? 0.7 : 1,
            transition: "all 0.2s ease"
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
  color: "#cbd5e1",
  letterSpacing: "0.05em"
};

const reviewValue: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  color: "#ffffff",
  marginTop: "2px"
};
