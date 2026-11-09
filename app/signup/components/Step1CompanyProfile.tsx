"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { 
  Building2, 
  Mail, 
  Phone, 
  Package, 
  Briefcase, 
  Upload, 
  ArrowRight, 
  Check, 
  Sparkles 
} from "lucide-react";

interface Step1Props {
  formData: {
    companyName: string;
    companyEmail: string;
    phone: string;
    logoUrl: string;
    businessType: string;
  };
  errors: Record<string, string>;
  updateForm: (field: string, value: any) => void;
  onNext: () => void;
}

export function Step1CompanyProfile({ formData, errors, updateForm, onNext }: Step1Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        updateForm("logoUrl", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={cardContainerStyle}>
      {/* Glow highlight line */}
      <div style={topGlowLine} />

      {/* 1. Brand Mark / Logo (Placed First) */}
      <div>
        <label style={labelStyle}>
          Brand Mark / Company Logo <span style={{ color: "#64748b", textTransform: "none", fontWeight: 400 }}>(Optional)</span>
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          style={logoDropzoneStyle}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleLogoChange}
            accept="image/*"
            style={{ display: "none" }}
          />
          <div style={logoThumbnailBox}>
            {formData.logoUrl ? (
              <img src={formData.logoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Upload size={16} color="#38bdf8" />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "#ffffff", display: "flex", alignItems: "center", gap: "6px" }}>
                {formData.logoUrl ? "Company Logo Selected" : "Upload Enterprise Logo"}
                <Sparkles size={12} color="#38bdf8" />
              </div>
              <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "1px" }}>
                PNG, JPG, WebP, or SVG up to 5MB · Rendered on invoices & official reports
              </div>
            </div>
            <span style={{
              fontSize: "0.74rem",
              color: "#38bdf8",
              fontWeight: 600,
              background: "rgba(56, 189, 248, 0.1)",
              padding: "4px 10px",
              borderRadius: "8px",
              border: "1px solid rgba(56, 189, 248, 0.25)"
            }}>
              {formData.logoUrl ? "Change" : "Browse File"}
            </span>
          </div>
        </div>
      </div>

      {/* Inputs Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Legal Organization Name *</label>
          <div style={inputWrapperStyle}>
            <Building2 size={16} color="#64748b" style={inputIconStyle} />
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => updateForm("companyName", e.target.value)}
              placeholder="e.g. Apex Global Industrial Ltd"
              style={{
                ...inputStyle,
                borderColor: errors.companyName ? "#ef4444" : "rgba(255,255,255,0.12)"
              }}
            />
          </div>
          {errors.companyName && <span style={errorTextStyle}>{errors.companyName}</span>}
        </div>

        <div>
          <label style={labelStyle}>Official Corporate Email *</label>
          <div style={inputWrapperStyle}>
            <Mail size={16} color="#64748b" style={inputIconStyle} />
            <input
              type="email"
              value={formData.companyEmail}
              onChange={(e) => updateForm("companyEmail", e.target.value)}
              placeholder="contact@company.com"
              style={{
                ...inputStyle,
                borderColor: errors.companyEmail ? "#ef4444" : "rgba(255,255,255,0.12)"
              }}
            />
          </div>
          {errors.companyEmail && <span style={errorTextStyle}>{errors.companyEmail}</span>}
        </div>

        <div>
          <label style={labelStyle}>Corporate Telephone</label>
          <div style={inputWrapperStyle}>
            <Phone size={16} color="#64748b" style={inputIconStyle} />
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => updateForm("phone", e.target.value)}
              placeholder="+880 1700 000000"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Business Model 3D Selector */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Primary Business Model *</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {[
              {
                type: "Product",
                title: "Product Based",
                desc: "Warehouses, Inventory, Stock & Sales Orders",
                icon: <Package size={18} color={formData.businessType === "Product" ? "#00f2fe" : "#94a3b8"} />
              },
              {
                type: "Service",
                title: "Service Based",
                desc: "Client Portals, Time Tracking & Projects",
                icon: <Briefcase size={18} color={formData.businessType === "Service" ? "#00f2fe" : "#94a3b8"} />
              }
            ].map((item) => {
              const isSelected = formData.businessType === item.type;
              return (
                <div
                  key={item.type}
                  onClick={() => updateForm("businessType", item.type)}
                  style={{
                    ...modelCardStyle,
                    borderColor: isSelected ? "#38bdf8" : "rgba(255,255,255,0.1)",
                    background: isSelected ? "rgba(56, 189, 248, 0.12)" : "rgba(0, 0, 0, 0.35)",
                    boxShadow: isSelected ? "0 6px 18px -4px rgba(0, 242, 254, 0.2)" : "none",
                    transform: isSelected ? "translateY(-1px)" : "none"
                  }}
                >
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "10px",
                    background: isSelected ? "rgba(0, 242, 254, 0.2)" : "rgba(255, 255, 255, 0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.86rem", color: isSelected ? "#38bdf8" : "#ffffff" }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "1px", lineHeight: 1.3 }}>
                      {item.desc}
                    </div>
                  </div>
                  {isSelected && (
                    <div style={checkBadgeStyle}>
                      <Check size={11} color="#06101e" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div style={footerStyle}>
        <Link href="/login" style={{ color: "#94a3b8", fontSize: "0.84rem", textDecoration: "none" }}>
          Already registered? <span style={{ color: "#38bdf8", fontWeight: 600 }}>Sign In</span>
        </Link>
        <button
          type="button"
          onClick={onNext}
          style={primaryButtonStyle}
        >
          <span>Continue to Architecture</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

/* Styles */
const cardContainerStyle: React.CSSProperties = {
  position: "relative",
  background: "rgba(15, 23, 42, 0.88)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  borderRadius: "18px",
  padding: "18px 24px",
  width: "100%",
  maxWidth: "100%",
  margin: "0",
  boxShadow: "0 16px 40px -10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 242, 254, 0.05)",
  display: "flex",
  flexDirection: "column",
  gap: "14px",
  color: "#ffffff",
  overflow: "hidden",
  transform: "translateZ(0)"
};

const topGlowLine: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: "10%",
  right: "10%",
  height: "2px",
  background: "linear-gradient(90deg, transparent, #00f2fe, #4facfe, transparent)",
  boxShadow: "0 0 15px #00f2fe"
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.72rem",
  fontWeight: 700,
  color: "#cbd5e1",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.08em"
};

const logoDropzoneStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "6px 14px",
  borderRadius: "12px",
  background: "rgba(0, 0, 0, 0.35)",
  border: "1.5px dashed rgba(56, 189, 248, 0.35)",
  cursor: "pointer",
  transition: "all 0.25s ease",
  height: "48px",
  boxSizing: "border-box"
};

const logoThumbnailBox: React.CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "8px",
  background: "rgba(56, 189, 248, 0.1)",
  border: "1px solid rgba(56, 189, 248, 0.25)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  flexShrink: 0
};

const inputWrapperStyle: React.CSSProperties = {
  position: "relative",
  width: "100%"
};

const inputIconStyle: React.CSSProperties = {
  position: "absolute",
  left: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  pointerEvents: "none"
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px 10px 38px",
  borderRadius: "12px",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  background: "rgba(0, 0, 0, 0.35)",
  color: "#ffffff",
  fontSize: "0.88rem",
  boxSizing: "border-box",
  outline: "none",
  transition: "all 0.2s ease"
};

const errorTextStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.74rem",
  color: "#f87171",
  marginTop: "4px",
  fontWeight: 600
};

const modelCardStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "14px",
  cursor: "pointer",
  border: "1.5px solid rgba(255, 255, 255, 0.1)",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
  userSelect: "none"
};

const checkBadgeStyle: React.CSSProperties = {
  width: "18px",
  height: "18px",
  borderRadius: "50%",
  background: "#38bdf8",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: "12px",
  borderTop: "1px solid rgba(255, 255, 255, 0.08)"
};

const primaryButtonStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
  color: "#06101e",
  border: "none",
  padding: "10px 22px",
  borderRadius: "12px",
  fontSize: "0.9rem",
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  boxShadow: "0 8px 20px -4px rgba(0, 242, 254, 0.45)",
  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
};
