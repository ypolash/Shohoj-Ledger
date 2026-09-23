"use client";

import React from "react";
import { 
  Building2, 
  User, 
  Terminal, 
  Layers, 
  ShieldCheck, 
  Rocket, 
  ArrowLeft, 
  Check, 
  Sparkles,
  Server,
  Database,
  Cpu
} from "lucide-react";

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
  manufacturing: "Manufacturing & Plant",
  wholesale: "Wholesale & Logistics",
  healthcare: "Healthcare & Pharma",
  consulting: "Consulting & Professional"
};

export function Step4ReviewLaunch({ formData, isLoading, onBack, onSubmit }: Step4Props) {
  return (
    <div style={cardContainerStyle}>
      {/* Top indigo glow line */}
      <div style={topGlowLine} />

      {/* Review Card */}
      <div style={reviewCardBox}>
        {/* Brand Banner */}
        <div style={brandBannerStyle}>
          <div style={logoWrapper}>
            {formData.logoUrl ? (
              <img src={formData.logoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Building2 size={24} color="#60a5fa" />
            )}
          </div>
          <div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
              {formData.companyName || "Your Enterprise"}
              <Sparkles size={16} color="#38bdf8" />
            </div>
            <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "2px" }}>
              <span style={{ color: "#38bdf8", fontWeight: 600 }}>{formData.businessType} Based</span> · {formData.companyEmail}
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={summaryTileStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", marginBottom: "4px" }}>
              <Terminal size={14} color="#60a5fa" />
              <span style={summaryLabelStyle}>Industry Architecture</span>
            </div>
            <div style={summaryValueStyle}>
              {TEMPLATE_LABELS[formData.industryTemplate] || formData.industryTemplate}
            </div>
          </div>

          <div style={summaryTileStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", marginBottom: "4px" }}>
              <User size={14} color="#60a5fa" />
              <span style={summaryLabelStyle}>Root Workspace Owner</span>
            </div>
            <div style={summaryValueStyle}>
              {formData.ownerName} <span style={{ color: "#94a3b8", fontWeight: 400 }}>({formData.ownerEmail})</span>
            </div>
          </div>
        </div>

        {/* Active Modules */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <Layers size={14} color="#60a5fa" />
            <span style={summaryLabelStyle}>Active ERP Modules ({formData.selectedModules.length})</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {formData.selectedModules.map((mId) => (
              <span key={mId} style={moduleChipStyle}>
                <Check size={12} color="#38bdf8" />
                {MODULE_LABELS[mId] || mId}
              </span>
            ))}
          </div>
        </div>

        {/* Infrastructure Guarantee Banner */}
        <div style={infraBannerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Database size={18} color="#38bdf8" />
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ffffff" }}>
                Multi-Tenant Sharding & Role-Based Access Control Ready
              </div>
              <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "2px" }}>
                Instant schema migration, AES-256 encrypted storage, and email verification dispatch.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div style={footerStyle}>
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          style={secondaryButtonStyle}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading}
          style={launchButtonStyle}
        >
          <Rocket size={18} />
          <span>{isLoading ? "Provisioning Cloud Workspace..." : "Launch Enterprise Workspace"}</span>
        </button>
      </div>
    </div>
  );
}

/* Styles */
const cardContainerStyle: React.CSSProperties = {
  position: "relative",
  background: "rgba(15, 23, 42, 0.75)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  borderRadius: "28px",
  padding: "36px 32px",
  width: "100%",
  maxWidth: "100%",
  margin: "0",
  boxShadow: "0 30px 70px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(99, 102, 241, 0.1)",
  display: "flex",
  flexDirection: "column",
  gap: "26px",
  color: "#ffffff",
  overflow: "hidden"
};

const topGlowLine: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: "10%",
  right: "10%",
  height: "2px",
  background: "linear-gradient(90deg, transparent, #6366f1, #38bdf8, transparent)",
  boxShadow: "0 0 15px #6366f1"
};

const reviewCardBox: React.CSSProperties = {
  background: "rgba(0, 0, 0, 0.3)",
  borderRadius: "20px",
  padding: "24px",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  display: "flex",
  flexDirection: "column",
  gap: "18px"
};

const brandBannerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  paddingBottom: "16px"
};

const logoWrapper: React.CSSProperties = {
  width: "56px",
  height: "56px",
  borderRadius: "14px",
  background: "rgba(99, 102, 241, 0.15)",
  border: "1px solid rgba(99, 102, 241, 0.3)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  flexShrink: 0
};

const summaryTileStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.03)",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(255, 255, 255, 0.06)"
};

const summaryLabelStyle: React.CSSProperties = {
  fontSize: "0.72rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#94a3b8"
};

const summaryValueStyle: React.CSSProperties = {
  fontSize: "0.92rem",
  fontWeight: 700,
  color: "#ffffff"
};

const moduleChipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "6px 12px",
  borderRadius: "20px",
  background: "rgba(56, 189, 248, 0.12)",
  color: "#bae6fd",
  fontSize: "0.8rem",
  fontWeight: 600,
  border: "1px solid rgba(56, 189, 248, 0.3)"
};

const infraBannerStyle: React.CSSProperties = {
  padding: "14px 16px",
  borderRadius: "14px",
  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(56, 189, 248, 0.12) 100%)",
  border: "1px solid rgba(99, 102, 241, 0.3)"
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: "16px",
  borderTop: "1px solid rgba(255, 255, 255, 0.08)"
};

const secondaryButtonStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.05)",
  color: "#ffffff",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  padding: "12px 22px",
  borderRadius: "14px",
  fontSize: "0.92rem",
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  transition: "all 0.2s ease"
};

const launchButtonStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 50%, #00f2fe 100%)",
  color: "#ffffff",
  border: "none",
  padding: "14px 34px",
  borderRadius: "14px",
  fontSize: "0.98rem",
  fontWeight: 800,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  boxShadow: "0 12px 30px -5px rgba(99, 102, 241, 0.5), 0 0 20px rgba(0, 242, 254, 0.3)",
  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
};
