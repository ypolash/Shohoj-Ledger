"use client";

import React from "react";

interface Step3Props {
  formData: {
    ownerName: string;
    ownerEmail: string;
    ownerPassword: string;
    confirmPassword: string;
    agreeToRules: boolean;
  };
  errors: Record<string, string>;
  updateForm: (field: string, value: any) => void;
  onBack: () => void;
  onNext: () => void;
}

/**
 * Step 3: Admin Account & Security (Theme 3: Vibrant Coral Red #f04938)
 */
export function Step3AdminSecurity({ formData, errors, updateForm, onBack, onNext }: Step3Props) {
  // Live Password Checklist
  const hasLength = formData.ownerPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(formData.ownerPassword);
  const hasLower = /[a-z]/.test(formData.ownerPassword);
  const hasNumber = /\d/.test(formData.ownerPassword);

  return (
    <div
      style={{
        background: "rgba(30, 10, 10, 0.45)",
        backdropFilter: "blur(24px)",
        border: "1.5px solid rgba(255, 255, 255, 0.25)",
        borderRadius: "24px",
        padding: "40px",
        width: "100%",
        maxWidth: "620px",
        boxShadow: "0 25px 60px rgba(0, 0, 0, 0.5)",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        color: "#ffffff"
      }}
    >
      <div>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#ffffff",
            background: "rgba(255, 255, 255, 0.2)",
            padding: "4px 10px",
            borderRadius: "20px"
          }}
        >
          Step 3 of 4 · Security
        </span>
        <h2 style={{ fontSize: "26px", fontWeight: 700, margin: "12px 0 6px 0", color: "#ffffff" }}>
          Administrator Account
        </h2>
        <p style={{ margin: 0, fontSize: "14px", color: "rgba(255, 255, 255, 0.85)" }}>
          Set up your primary root administrator credentials and password security rules.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelRed}>Admin Full Name *</label>
          <input
            type="text"
            value={formData.ownerName}
            onChange={(e) => updateForm("ownerName", e.target.value)}
            placeholder="e.g. John Doe"
            style={{ ...inputRed, borderColor: errors.ownerName ? "#fef08a" : "rgba(255,255,255,0.25)" }}
          />
          {errors.ownerName && <span style={errorTextRed}>{errors.ownerName}</span>}
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelRed}>Admin Email (Login Username) *</label>
          <input
            type="email"
            value={formData.ownerEmail}
            onChange={(e) => updateForm("ownerEmail", e.target.value)}
            placeholder="john@company.com"
            style={{ ...inputRed, borderColor: errors.ownerEmail ? "#fef08a" : "rgba(255,255,255,0.25)" }}
          />
          {errors.ownerEmail && <span style={errorTextRed}>{errors.ownerEmail}</span>}
        </div>

        <div>
          <label style={labelRed}>Password *</label>
          <input
            type="password"
            value={formData.ownerPassword}
            onChange={(e) => updateForm("ownerPassword", e.target.value)}
            placeholder="••••••••"
            style={{ ...inputRed, borderColor: errors.ownerPassword ? "#fef08a" : "rgba(255,255,255,0.25)" }}
          />
          {errors.ownerPassword && <span style={errorTextRed}>{errors.ownerPassword}</span>}
        </div>

        <div>
          <label style={labelRed}>Confirm Password *</label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => updateForm("confirmPassword", e.target.value)}
            placeholder="••••••••"
            style={{ ...inputRed, borderColor: errors.confirmPassword ? "#fef08a" : "rgba(255,255,255,0.25)" }}
          />
          {errors.confirmPassword && <span style={errorTextRed}>{errors.confirmPassword}</span>}
        </div>
      </div>

      {/* Live Password Rules Checklist */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          padding: "14px 16px",
          borderRadius: "14px",
          background: "rgba(0, 0, 0, 0.3)",
          border: "1px solid rgba(255, 255, 255, 0.15)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: hasLength ? "#86efac" : "rgba(255,255,255,0.6)", fontWeight: hasLength ? 700 : 500 }}>
          <span>{hasLength ? "✓" : "○"}</span>
          <span>8+ Characters</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: hasUpper ? "#86efac" : "rgba(255,255,255,0.6)", fontWeight: hasUpper ? 700 : 500 }}>
          <span>{hasUpper ? "✓" : "○"}</span>
          <span>Uppercase Letter (A-Z)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: hasLower ? "#86efac" : "rgba(255,255,255,0.6)", fontWeight: hasLower ? 700 : 500 }}>
          <span>{hasLower ? "✓" : "○"}</span>
          <span>Lowercase Letter (a-z)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: hasNumber ? "#86efac" : "rgba(255,255,255,0.6)", fontWeight: hasNumber ? 700 : 500 }}>
          <span>{hasNumber ? "✓" : "○"}</span>
          <span>Number (0-9)</span>
        </div>
      </div>

      {/* Workspace Rules & Terms Agreement */}
      <div>
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            cursor: "pointer",
            fontSize: "13px",
            color: "#ffffff"
          }}
        >
          <input
            type="checkbox"
            checked={formData.agreeToRules}
            onChange={(e) => updateForm("agreeToRules", e.target.checked)}
            style={{ width: "18px", height: "18px", marginTop: "2px", accentColor: "#ffffff" }}
          />
          <span>
            I agree to the Workspace Security Rules, Service Terms, and Enterprise Isolation Policy.
          </span>
        </label>
        {errors.agreeToRules && <span style={errorTextRed}>{errors.agreeToRules}</span>}
      </div>

      {/* Navigation Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: "transparent",
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.4)",
            padding: "11px 22px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          style={{
            background: "#ffffff",
            color: "#b91c1c",
            border: "none",
            padding: "12px 28px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)"
          }}
        >
          Continue
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_forward</span>
        </button>
      </div>
    </div>
  );
}

const labelRed: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 700,
  color: "#ffffff",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.05em"
};

const inputRed: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "12px",
  border: "1px solid rgba(255, 255, 255, 0.25)",
  background: "rgba(0, 0, 0, 0.35)",
  color: "#ffffff",
  fontSize: "14px",
  boxSizing: "border-box",
  outline: "none"
};

const errorTextRed: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  color: "#fef08a",
  marginTop: "4px",
  fontWeight: 600
};
