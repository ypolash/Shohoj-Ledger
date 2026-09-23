"use client";

import React, { useState } from "react";
import { 
  User, 
  Mail, 
  Lock, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  KeyRound,
  CheckCircle2
} from "lucide-react";

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

export function Step3AdminSecurity({ formData, errors, updateForm, onBack, onNext }: Step3Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Live Password Checklist
  const hasLength = formData.ownerPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(formData.ownerPassword);
  const hasLower = /[a-z]/.test(formData.ownerPassword);
  const hasNumber = /\d/.test(formData.ownerPassword);

  const strengthScore = [hasLength, hasUpper, hasLower, hasNumber].filter(Boolean).length;

  // Live Password Match Check
  const hasConfirmText = formData.confirmPassword.length > 0;
  const passwordsMatch = hasConfirmText && formData.ownerPassword === formData.confirmPassword;
  const passwordsMismatch = hasConfirmText && formData.ownerPassword !== formData.confirmPassword;

  return (
    <div style={cardContainerStyle}>
      {/* Top coral/rose glow line */}
      <div style={topGlowLine} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Root Administrator Full Name *</label>
          <div style={inputWrapperStyle}>
            <User size={18} color="#94a3b8" style={inputIconStyle} />
            <input
              type="text"
              value={formData.ownerName}
              onChange={(e) => updateForm("ownerName", e.target.value)}
              placeholder="e.g. Sarah Chowdhury"
              style={{
                ...inputStyle,
                borderColor: errors.ownerName ? "#f43f5e" : "rgba(255,255,255,0.12)"
              }}
            />
          </div>
          {errors.ownerName && <span style={errorTextStyle}>{errors.ownerName}</span>}
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Root Administrator Login Email *</label>
          <div style={inputWrapperStyle}>
            <Mail size={18} color="#94a3b8" style={inputIconStyle} />
            <input
              type="email"
              value={formData.ownerEmail}
              onChange={(e) => updateForm("ownerEmail", e.target.value)}
              placeholder="sarah@apexindustrial.com"
              style={{
                ...inputStyle,
                borderColor: errors.ownerEmail ? "#f43f5e" : "rgba(255,255,255,0.12)"
              }}
            />
          </div>
          {errors.ownerEmail && <span style={errorTextStyle}>{errors.ownerEmail}</span>}
        </div>

        <div>
          <label style={labelStyle}>Master Password *</label>
          <div style={inputWrapperStyle}>
            <Lock size={18} color="#94a3b8" style={inputIconStyle} />
            <input
              type={showPassword ? "text" : "password"}
              value={formData.ownerPassword}
              onChange={(e) => updateForm("ownerPassword", e.target.value)}
              placeholder="••••••••••••"
              style={{
                ...inputStyle,
                paddingRight: "44px",
                borderColor: errors.ownerPassword ? "#f43f5e" : "rgba(255,255,255,0.12)"
              }}
            />
            <button
              type="button"
              id="toggle-owner-password"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={eyeBtnStyle}
            >
              {showPassword ? <EyeOff size={18} color="#cbd5e1" /> : <Eye size={18} color="#cbd5e1" />}
            </button>
          </div>
          {errors.ownerPassword && <span style={errorTextStyle}>{errors.ownerPassword}</span>}
        </div>

        <div>
          <label style={labelStyle}>Confirm Master Password *</label>
          <div style={inputWrapperStyle}>
            <KeyRound size={18} color="#94a3b8" style={inputIconStyle} />
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => updateForm("confirmPassword", e.target.value)}
              placeholder="••••••••••••"
              style={{
                ...inputStyle,
                paddingRight: "44px",
                borderColor: passwordsMismatch
                  ? "#f43f5e"
                  : passwordsMatch
                  ? "#10b981"
                  : errors.confirmPassword
                  ? "#f43f5e"
                  : "rgba(255,255,255,0.12)"
              }}
            />
            <button
              type="button"
              id="toggle-confirm-password"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              style={eyeBtnStyle}
            >
              {showConfirmPassword ? <EyeOff size={18} color="#cbd5e1" /> : <Eye size={18} color="#cbd5e1" />}
            </button>
          </div>
          {passwordsMismatch ? (
            <span style={errorTextStyle}>Passwords do not match</span>
          ) : passwordsMatch ? (
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "#34d399", marginTop: "5px", fontWeight: 600 }}>
              <CheckCircle2 size={13} /> Passwords match perfectly
            </span>
          ) : errors.confirmPassword ? (
            <span style={errorTextStyle}>{errors.confirmPassword}</span>
          ) : null}
        </div>
      </div>

      {/* Real-time 3D Password Strength & Rule Badges */}
      <div style={ruleBoxStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Cryptographic Security Strength
          </span>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: strengthScore === 4 ? "#34d399" : strengthScore >= 2 ? "#fbbf24" : "#94a3b8" }}>
            {strengthScore === 4 ? "EXCELLENT" : strengthScore >= 2 ? "MODERATE" : "MINIMAL"}
          </span>
        </div>

        {/* Strength Progress Segments */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
          {[1, 2, 3, 4].map((level) => {
            const isFilled = strengthScore >= level;
            const barColor = strengthScore === 4 ? "#10b981" : strengthScore >= 2 ? "#f59e0b" : "#f43f5e";
            return (
              <div
                key={level}
                style={{
                  flex: 1,
                  height: "4px",
                  borderRadius: "2px",
                  background: isFilled ? barColor : "rgba(255,255,255,0.1)",
                  boxShadow: isFilled ? `0 0 8px ${barColor}` : "none",
                  transition: "all 0.3s ease"
                }}
              />
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {[
            { label: "8+ Characters", valid: hasLength },
            { label: "Uppercase (A-Z)", valid: hasUpper },
            { label: "Lowercase (a-z)", valid: hasLower },
            { label: "Numeric Digit (0-9)", valid: hasNumber }
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: r.valid ? "#34d399" : "#64748b" }}>
              <div style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: r.valid ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.05)",
                border: r.valid ? "1px solid #10b981" : "1px solid rgba(255, 255, 255, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                {r.valid ? <Check size={10} color="#34d399" /> : <span style={{ fontSize: "8px", color: "#64748b" }}>•</span>}
              </div>
              <span style={{ fontWeight: r.valid ? 600 : 400 }}>{r.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rules & Policy Checkbox */}
      <div>
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            cursor: "pointer",
            fontSize: "0.88rem",
            color: "#e2e8f0",
            lineHeight: 1.45
          }}
        >
          <input
            type="checkbox"
            checked={formData.agreeToRules}
            onChange={(e) => updateForm("agreeToRules", e.target.checked)}
            style={{ width: "18px", height: "18px", marginTop: "2px", accentColor: "#f43f5e" }}
          />
          <span>
            I agree to the <strong style={{ color: "#ffffff" }}>Enterprise Tenant Isolation Policy</strong>, Data Sovereignty Standards, and Service Terms.
          </span>
        </label>
        {errors.agreeToRules && <span style={errorTextStyle}>{errors.agreeToRules}</span>}
      </div>

      {/* Navigation Footer */}
      <div style={footerStyle}>
        <button
          type="button"
          onClick={onBack}
          style={secondaryButtonStyle}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <button
          type="button"
          onClick={onNext}
          style={primaryButtonStyle}
        >
          <span>Review & Launch</span>
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
  boxShadow: "0 30px 70px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(244, 63, 94, 0.08)",
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
  background: "linear-gradient(90deg, transparent, #f43f5e, #fb7185, transparent)",
  boxShadow: "0 0 15px #f43f5e"
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

const eyeBtnStyle: React.CSSProperties = {
  position: "absolute",
  right: "14px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "transparent",
  border: "none",
  padding: "4px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "6px",
  outline: "none"
};

const errorTextStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.78rem",
  color: "#f87171",
  marginTop: "5px",
  fontWeight: 600
};

const ruleBoxStyle: React.CSSProperties = {
  padding: "18px 20px",
  borderRadius: "18px",
  background: "rgba(0, 0, 0, 0.35)",
  border: "1px solid rgba(255, 255, 255, 0.1)"
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

const primaryButtonStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
  color: "#ffffff",
  border: "none",
  padding: "13px 28px",
  borderRadius: "14px",
  fontSize: "0.95rem",
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  boxShadow: "0 10px 25px -4px rgba(244, 63, 94, 0.45)",
  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
};
