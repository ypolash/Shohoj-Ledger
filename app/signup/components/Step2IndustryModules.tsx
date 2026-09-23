"use client";

import React from "react";
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
  Handshake 
} from "lucide-react";

interface Step2Props {
  formData: {
    industryTemplate: string;
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
  { id: "retail", name: "Retail & E-Commerce", desc: "POS, Cart Orders & Fast Dispatch", icon: <Store size={20} /> },
  { id: "manufacturing", name: "Manufacturing & Plant", desc: "BOM, Assembly & Batch Control", icon: <Factory size={20} /> },
  { id: "wholesale", name: "Wholesale & Logistics", desc: "Warehouses, Fleet & Distributions", icon: <Truck size={20} /> },
  { id: "healthcare", name: "Healthcare & Pharma", desc: "Clinical Ledgers & Inventory Safety", icon: <HeartPulse size={20} /> },
  { id: "consulting", name: "Consulting & Professional", desc: "Retainers, Billable Hours & Audits", icon: <Building2 size={20} /> }
];

export function Step2IndustryModules({ formData, errors, updateForm, onBack, onNext }: Step2Props) {
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

      {/* Industry Presets Grid */}
      <div>
        <label style={labelStyle}>
          Industry Template Preset <span style={{ color: "#6ee7b7" }}>· Auto-provisions Chart of Accounts</span>
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "12px" }}>
          {INDUSTRY_TEMPLATES.map((tmpl) => {
            const isSelected = formData.industryTemplate === tmpl.id;
            return (
              <div
                key={tmpl.id}
                onClick={() => updateForm("industryTemplate", tmpl.id)}
                style={{
                  ...templateCardStyle,
                  borderColor: isSelected ? "#10b981" : "rgba(255, 255, 255, 0.1)",
                  background: isSelected ? "rgba(16, 185, 129, 0.14)" : "rgba(0, 0, 0, 0.3)",
                  boxShadow: isSelected ? "0 8px 24px -4px rgba(16, 185, 129, 0.3)" : "none",
                  transform: isSelected ? "translateY(-2px)" : "none"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: isSelected ? "rgba(16, 185, 129, 0.25)" : "rgba(255, 255, 255, 0.06)",
                    color: isSelected ? "#34d399" : "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    {tmpl.icon}
                  </div>
                  {isSelected && (
                    <div style={checkBadgeStyle}>
                      <Check size={12} color="#06101e" />
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: isSelected ? "#6ee7b7" : "#ffffff" }}>
                    {tmpl.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "3px", lineHeight: 1.35 }}>
                    {tmpl.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enabled Modules Selection */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <label style={labelStyle}>
            Active ERP Modules ({formData.selectedModules.length} selected)
          </label>
          {errors.selectedModules && <span style={{ fontSize: "0.8rem", color: "#f87171", fontWeight: 600 }}>{errors.selectedModules}</span>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "12px" }}>
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
                  padding: "14px 16px",
                  borderRadius: "14px",
                  cursor: "pointer",
                  background: isChecked ? "rgba(16, 185, 129, 0.12)" : "rgba(0, 0, 0, 0.3)",
                  border: isChecked ? "1.5px solid #10b981" : "1px solid rgba(255, 255, 255, 0.1)",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  color: "#ffffff",
                  userSelect: "none",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ color: isChecked ? "#34d399" : "#94a3b8" }}>
                    {mod.icon}
                  </div>
                  <span>{mod.label}</span>
                </div>
                <div style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "6px",
                  border: isChecked ? "none" : "1.5px solid rgba(255,255,255,0.3)",
                  background: isChecked ? "#10b981" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s"
                }}>
                  {isChecked && <Check size={14} color="#06101e" />}
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
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <button
          type="button"
          onClick={onNext}
          style={primaryButtonStyle}
        >
          <span>Continue to Security</span>
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
  boxShadow: "0 30px 70px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(16, 185, 129, 0.08)",
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
  background: "linear-gradient(90deg, transparent, #10b981, #6ee7b7, transparent)",
  boxShadow: "0 0 15px #10b981"
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 700,
  color: "#cbd5e1",
  marginBottom: "10px",
  textTransform: "uppercase",
  letterSpacing: "0.08em"
};

const templateCardStyle: React.CSSProperties = {
  padding: "16px",
  borderRadius: "16px",
  cursor: "pointer",
  border: "1.5px solid rgba(255, 255, 255, 0.1)",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
  userSelect: "none"
};

const checkBadgeStyle: React.CSSProperties = {
  width: "20px",
  height: "20px",
  borderRadius: "50%",
  background: "#10b981",
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
  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
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
  boxShadow: "0 10px 25px -4px rgba(16, 185, 129, 0.45)",
  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
};
