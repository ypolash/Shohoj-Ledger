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

      {/* Logo Picker */}
      <div>
        <label style={labelStyle}>
          Company Brand Mark <span style={{ color: "#64748b", textTransform: "none", fontWeight: 400 }}>(Optional)</span>
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
              <Upload size={22} color="#38bdf8" />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "#ffffff", display: "flex", alignItems: "center", gap: "6px" }}>
              {formData.logoUrl ? "Change Company Logo" : "Upload Enterprise Logo"}
              <Sparkles size={14} color="#38bdf8" />
            </div>
            <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "2px" }}>
              PNG, JPG, WebP, or SVG up to 5MB. Rendered in high-res invoices & reports.
            </div>
          </div>
        </div>
      </div>

      {/* Inputs Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Legal Organization Name *</label>
          <div style={inputWrapperStyle}>
            <Building2 size={18} color="#64748b" style={inputIconStyle} />
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
            <Mail size={18} color="#64748b" style={inputIconStyle} />
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
            <Phone size={18} color="#64748b" style={inputIconStyle} />
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            {[
              {
                type: "Product",
                title: "Product Based",
                desc: "Warehouses, Inventory, Stock Transfers & Sales Orders",
                icon: <Package size={22} color={formData.businessType === "Product" ? "#00f2fe" : "#94a3b8"} />
              },
              {
                type: "Service",
                title: "Service Based",
                desc: "Client Portals, Time Tracking, Projects & Timesheets",
                icon: <Briefcase size={22} color={formData.businessType === "Service" ? "#00f2fe" : "#94a3b8"} />
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
                    boxShadow: isSelected ? "0 8px 24px -4px rgba(0, 242, 254, 0.25)" : "none",
                    transform: isSelected ? "translateY(-2px)" : "none"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "12px",
                      background: isSelected ? "rgba(0, 242, 254, 0.2)" : "rgba(255, 255, 255, 0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      {item.icon}
                    </div>
                    {isSelected && (
                      <div style={checkBadgeStyle}>
                        <Check size={12} color="#06101e" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: isSelected ? "#38bdf8" : "#ffffff" }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "4px", lineHeight: 1.4 }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div style={footerStyle}>
        <Link href="/login" style={{ color: "#94a3b8", fontSize: "0.88rem", textDecoration: "none" }}>
          Already registered? <span style={{ color: "#38bdf8", fontWeight: 600 }}>Sign In</span>
        </Link>
        <button
          type="button"
          onClick={onNext}
          style={primaryButtonStyle}
        >
          <span>Continue to Architecture</span>
          <ArrowRight size={16} />
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
  boxShadow: "0 30px 70px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(0, 242, 254, 0.08)",
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
  background: "linear-gradient(90deg, transparent, #00f2fe, #4facfe, transparent)",
  boxShadow: "0 0 15px #00f2fe"
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 700,
  color: "#cbd5e1",
  marginBottom: "8px",
  textTransform: "uppercase",
  letterSpacing: "0.08em"
};

const logoDropzoneStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "18px",
  padding: "16px 20px",
  borderRadius: "16px",
  background: "rgba(0, 0, 0, 0.35)",
  border: "1.5px dashed rgba(56, 189, 248, 0.35)",
  cursor: "pointer",
  transition: "all 0.25s ease"
};

const logoThumbnailBox: React.CSSProperties = {
  width: "56px",
  height: "56px",
  borderRadius: "14px",
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
  left: "14px",
  top: "50%",
  transform: "translateY(-50%)",
  pointerEvents: "none"
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px 12px 42px",
  borderRadius: "14px",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  background: "rgba(0, 0, 0, 0.35)",
  color: "#ffffff",
  fontSize: "0.92rem",
  boxSizing: "border-box",
  outline: "none",
  transition: "all 0.2s ease"
};

const errorTextStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.78rem",
  color: "#f87171",
  marginTop: "5px",
  fontWeight: 600
};

const modelCardStyle: React.CSSProperties = {
  padding: "18px",
  borderRadius: "16px",
  cursor: "pointer",
  border: "1.5px solid rgba(255, 255, 255, 0.1)",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
  userSelect: "none"
};

const checkBadgeStyle: React.CSSProperties = {
  width: "20px",
  height: "20px",
  borderRadius: "50%",
  background: "#38bdf8",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: "16px",
  borderTop: "1px solid rgba(255, 255, 255, 0.08)"
};

const primaryButtonStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
  color: "#06101e",
  border: "none",
  padding: "13px 28px",
  borderRadius: "14px",
  fontSize: "0.95rem",
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  boxShadow: "0 10px 25px -4px rgba(0, 242, 254, 0.45)",
  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
};
