"use client";

import React, { useState } from "react";
import { 
  Terminal, 
  Store, 
  Factory, 
  Truck, 
  HeartPulse, 
  Building2, 
  Layers, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Wallet, 
  Users, 
  CreditCard, 
  Package, 
  ShoppingCart, 
  Handshake,
  Video,
  Sparkles,
  ChevronRight,
  GraduationCap
} from "lucide-react";
import { 
  mapIndustryToProjectPreset 
} from "@/lib/projects/projectPresets";

interface Step2Props {
  formData: {
    industryTemplate: string;
    projectPreset?: string;
    selectedModules: string[];
  };
  errors: Record<string, string>;
  updateForm: (field: string, value: any) => void;
  onBack: () => void;
  onNext: () => void;
}

const MODULES = [
  { id: "finance", label: "Finance & Accounts", icon: <Wallet size={18} /> },
  { id: "hr", label: "HR & Attendance", icon: <Users size={18} /> },
  { id: "payroll", label: "Payroll Processing", icon: <CreditCard size={18} /> },
  { id: "crm", label: "CRM & Sales Orders", icon: <Handshake size={18} /> },
  { id: "inventory", label: "Inventory & Warehouses", icon: <Package size={18} /> },
  { id: "procurement", label: "Procurement & Suppliers", icon: <ShoppingCart size={18} /> }
];

const INDUSTRY_TEMPLATES = [
  { id: "it", name: "IT & Software Agency", desc: "Sprints, Milestones & Engineering", icon: <Terminal size={20} /> },
  { id: "media", name: "Video & Media Agency", desc: "Shoots, Talent & Multi-Cut Edits", icon: <Video size={20} /> },
  { id: "retail", name: "Retail & E-Commerce", desc: "POS, Cart Orders & Fast Dispatch", icon: <Store size={20} /> },
  { id: "manufacturing", name: "Manufacturing & Plant", desc: "BOM, Assembly & Batch Control", icon: <Factory size={20} /> },
  { id: "wholesale", name: "Wholesale & Logistics", desc: "Warehouses, Fleet & Distributions", icon: <Truck size={20} /> },
  { id: "healthcare", name: "Healthcare & Pharma", desc: "Clinical Ledgers & Inventory Safety", icon: <HeartPulse size={20} /> },
  { id: "consulting", name: "Consulting & Professional", desc: "Retainers, Billable Hours & Audits", icon: <Building2 size={20} /> },
  { id: "education", name: "Education & Academy", desc: "Curriculum, Cohorts & Certifications", icon: <GraduationCap size={20} /> }
];

export function Step2IndustryModules({ formData, errors, updateForm, onBack, onNext }: Step2Props) {
  const handleIndustrySelect = (tmplId: string) => {
    updateForm("industryTemplate", tmplId);
    const recommendedPreset = mapIndustryToProjectPreset(tmplId);
    updateForm("projectPreset", recommendedPreset);
  };

  const handleModuleToggle = (modId: string) => {
    const current = formData.selectedModules;
    if (current.includes(modId)) {
      updateForm("selectedModules", current.filter((id) => id !== modId));
    } else {
      updateForm("selectedModules", [...current, modId]);
    }
  };

  return (
    <div style={cardContainerStyle}>
      {/* Top emerald glow line */}
      <div style={topGlowLine} />

      {/* 1. Industry Presets Grid */}
      <div>
        <label style={labelStyle}>
          1. Industry Template Preset <span style={{ color: "#6ee7b7", textTransform: "none", fontWeight: 400 }}>· Provisions Chart of Accounts & Roles</span>
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px" }}>
          {INDUSTRY_TEMPLATES.map((tmpl, index) => {
            const isSelected = formData.industryTemplate === tmpl.id;
            const isLastRow = index >= 6; // Place last 2 items symmetrically on the downside row
            return (
              <div
                key={tmpl.id}
                onClick={() => handleIndustrySelect(tmpl.id)}
                style={{
                  ...templateCardStyle,
                  gridColumn: isLastRow ? "span 3" : "span 2",
                  borderColor: isSelected ? "#10b981" : "rgba(255, 255, 255, 0.08)",
                  background: isSelected ? "rgba(16, 185, 129, 0.14)" : "rgba(0, 0, 0, 0.3)",
                  boxShadow: isSelected ? "0 4px 14px -2px rgba(16, 185, 129, 0.3)" : "none",
                  transform: isSelected ? "translateY(-1px)" : "none"
                }}
              >
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "7px",
                  background: isSelected ? "rgba(16, 185, 129, 0.25)" : "rgba(255, 255, 255, 0.06)",
                  color: isSelected ? "#34d399" : "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  {tmpl.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.8rem", color: isSelected ? "#6ee7b7" : "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {tmpl.name}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {tmpl.desc}
                  </div>
                </div>
                {isSelected && (
                  <div style={checkBadgeStyle}>
                    <Check size={10} color="#06101e" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Enabled Modules Selection */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>
            2. Active ERP Modules ({formData.selectedModules.length} selected)
          </label>
          {errors.selectedModules && <span style={{ fontSize: "0.74rem", color: "#f87171", fontWeight: 600 }}>{errors.selectedModules}</span>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
          {MODULES.map((mod) => {
            const isChecked = formData.selectedModules.includes(mod.id);
            return (
              <div
                key={mod.id}
                onClick={() => handleModuleToggle(mod.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  background: isChecked ? "rgba(16, 185, 129, 0.12)" : "rgba(0, 0, 0, 0.3)",
                  border: isChecked ? "1.5px solid #10b981" : "1px solid rgba(255, 255, 255, 0.08)",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#ffffff",
                  userSelect: "none",
                  transition: "all 0.15s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ color: isChecked ? "#34d399" : "#94a3b8" }}>
                    {mod.icon}
                  </div>
                  <span>{mod.label}</span>
                </div>
                <div style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "5px",
                  border: isChecked ? "none" : "1.5px solid rgba(255,255,255,0.3)",
                  background: isChecked ? "#10b981" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s"
                }}>
                  {isChecked && <Check size={11} color="#06101e" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Footer */}
      <div style={footerStyle}>
        <button
          type="button"
          onClick={onBack}
          style={secondaryButtonStyle}
        >
          <ArrowLeft size={15} />
          <span>Back</span>
        </button>
        <button
          type="button"
          onClick={onNext}
          style={primaryButtonStyle}
        >
          <span>Continue to Security</span>
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
  padding: "16px 22px",
  width: "100%",
  maxWidth: "100%",
  margin: "0",
  boxShadow: "0 16px 40px -10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(16, 185, 129, 0.05)",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
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
  background: "linear-gradient(90deg, transparent, #10b981, #6ee7b7, transparent)",
  boxShadow: "0 0 15px #10b981"
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

const templateCardStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: "10px",
  cursor: "pointer",
  border: "1.5px solid rgba(255, 255, 255, 0.1)",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
  userSelect: "none"
};

const checkBadgeStyle: React.CSSProperties = {
  width: "16px",
  height: "16px",
  borderRadius: "50%",
  background: "#10b981",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: "10px",
  borderTop: "1px solid rgba(255, 255, 255, 0.08)"
};

const secondaryButtonStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.05)",
  color: "#ffffff",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  padding: "9px 18px",
  borderRadius: "12px",
  fontSize: "0.86rem",
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  transition: "all 0.2s ease"
};

const primaryButtonStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  color: "#ffffff",
  border: "none",
  padding: "10px 22px",
  borderRadius: "12px",
  fontSize: "0.88rem",
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  boxShadow: "0 8px 20px -4px rgba(16, 185, 129, 0.45)",
  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
};
