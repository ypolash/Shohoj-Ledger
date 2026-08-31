"use client";

import React, { useRef } from "react";
import Link from "next/link";

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

/**
 * Step 1: Company Profile (Theme 1: Dark Navy #211f35)
 */
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
    <div
      style={{
        background: "rgba(255, 255, 255, 0.04)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: "24px",
        padding: "40px",
        width: "100%",
        maxWidth: "620px",
        boxShadow: "0 25px 60px rgba(0, 0, 0, 0.6)",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        color: "#ffffff"
      }}
    >
      {/* Logo Picker */}
      <div>
        <label style={labelDark}>Company Logo (Optional)</label>
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            padding: "14px 18px",
            borderRadius: "14px",
            background: "rgba(0, 0, 0, 0.3)",
            border: "1.5px dashed rgba(255, 255, 255, 0.2)",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleLogoChange}
            accept="image/*"
            style={{ display: "none" }}
          />
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
              <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "#38bdf8" }}>
                add_photo_alternate
              </span>
            )}
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff" }}>
              {formData.logoUrl ? "Change Company Logo" : "Upload Company Logo"}
            </div>
            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
              PNG, JPG, or SVG up to 2MB.
            </div>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelDark}>Company Name *</label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => updateForm("companyName", e.target.value)}
            placeholder="e.g. Sarah Calcium Industries Ltd"
            style={{ ...inputDark, borderColor: errors.companyName ? "#ef4444" : "rgba(255,255,255,0.15)" }}
          />
          {errors.companyName && <span style={errorText}>{errors.companyName}</span>}
        </div>

        <div>
          <label style={labelDark}>Company Email *</label>
          <input
            type="email"
            value={formData.companyEmail}
            onChange={(e) => updateForm("companyEmail", e.target.value)}
            placeholder="contact@company.com"
            style={{ ...inputDark, borderColor: errors.companyEmail ? "#ef4444" : "rgba(255,255,255,0.15)" }}
          />
          {errors.companyEmail && <span style={errorText}>{errors.companyEmail}</span>}
        </div>

        <div>
          <label style={labelDark}>Phone Number</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => updateForm("phone", e.target.value)}
            placeholder="+880 17..."
            style={inputDark}
          />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelDark}>Primary Business Model *</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {["Product", "Service"].map((type) => (
              <div
                key={type}
                onClick={() => updateForm("businessType", type)}
                style={{
                  padding: "14px 16px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  border: formData.businessType === type ? "2px solid #38bdf8" : "1px solid rgba(255,255,255,0.12)",
                  background: formData.businessType === type ? "rgba(56, 189, 248, 0.15)" : "rgba(0,0,0,0.25)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  transition: "all 0.2s ease"
                }}
              >
                <span className="material-symbols-outlined" style={{ color: formData.businessType === type ? "#38bdf8" : "#94a3b8" }}>
                  {type === "Product" ? "inventory_2" : "home_repair_service"}
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px" }}>{type} Based</div>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                    {type === "Product" ? "Inventory, Warehouses & Orders" : "Billing, Projects & Timesheets"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <Link href="/login" style={{ color: "#94a3b8", fontSize: "13px", textDecoration: "none" }}>
          Already have an account? <span style={{ color: "#38bdf8", fontWeight: 600 }}>Login</span>
        </Link>
        <button
          type="button"
          onClick={onNext}
          style={{
            background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
            color: "#ffffff",
            border: "none",
            padding: "12px 28px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 10px 25px -5px rgba(79, 172, 254, 0.5)",
            transition: "all 0.2s ease"
          }}
        >
          Continue
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_forward</span>
        </button>
      </div>
    </div>
  );
}

const labelDark: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "#cbd5e1",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.05em"
};

const inputDark: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "12px",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  background: "rgba(0, 0, 0, 0.35)",
  color: "#ffffff",
  fontSize: "14px",
  boxSizing: "border-box",
  outline: "none"
};

const errorText: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  color: "#ef4444",
  marginTop: "4px"
};
