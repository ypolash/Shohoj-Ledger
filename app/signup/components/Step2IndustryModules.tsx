"use client";

import React from "react";

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
  { id: "finance", label: "Finance & Accounts", icon: "account_balance" },
  { id: "hr", label: "HR & Attendance", icon: "badge" },
  { id: "payroll", label: "Payroll Processing", icon: "payments" },
  { id: "crm", label: "CRM & Sales Orders", icon: "handshake" },
  { id: "inventory", label: "Inventory & Warehouses", icon: "inventory_2" },
  { id: "procurement", label: "Procurement & Suppliers", icon: "shopping_cart" }
];

const INDUSTRY_TEMPLATES = [
  { id: "it", name: "IT & Software", icon: "terminal", desc: "Engineering & Sprints" },
  { id: "retail", name: "Retail & E-Commerce", icon: "storefront", desc: "POS, Orders & Stock" },
  { id: "manufacturing", name: "Manufacturing", icon: "factory", desc: "Plant & Production" },
  { id: "wholesale", name: "Wholesale & Logistics", icon: "local_shipping", desc: "Supply Chain & Fleet" },
  { id: "healthcare", name: "Healthcare & Pharma", icon: "medical_services", desc: "Clinical & Dispensing" },
  { id: "consulting", name: "Consulting Services", icon: "business_center", desc: "Advisory & Billing" }
];

/**
 * Step 2: Industry Template & Modules (Theme 2: Pastel Sky Blue #bce0fd)
 */
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
    <div
      style={{
        background: "rgba(255, 255, 255, 0.04)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: "24px",
        padding: "40px",
        width: "100%",
        maxWidth: "680px",
        boxShadow: "0 25px 60px rgba(0, 0, 0, 0.6)",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        color: "#ffffff"
      }}
    >
      {/* Industry Presets Grid */}
      <div>
        <label style={labelDark}>Industry Template Preset</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "10px" }}>
          {INDUSTRY_TEMPLATES.map((tmpl) => {
            const isSelected = formData.industryTemplate === tmpl.id;
            return (
              <div
                key={tmpl.id}
                onClick={() => updateForm("industryTemplate", tmpl.id)}
                style={{
                  padding: "14px",
                  borderRadius: "14px",
                  cursor: "pointer",
                  border: isSelected ? "2px solid #6ee7b7" : "1px solid rgba(255, 255, 255, 0.12)",
                  background: isSelected ? "rgba(110, 231, 183, 0.15)" : "rgba(0, 0, 0, 0.25)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "22px", color: isSelected ? "#6ee7b7" : "#94a3b8" }}>
                    {tmpl.icon}
                  </span>
                  <div style={{ fontWeight: 700, fontSize: "13px", color: "#ffffff" }}>{tmpl.name}</div>
                </div>
                <div style={{ fontSize: "11px", color: "#94a3b8", paddingLeft: "30px" }}>{tmpl.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enabled Modules Selection */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <label style={labelDark}>Enabled ERP Modules ({formData.selectedModules.length})</label>
          {errors.selectedModules && <span style={{ fontSize: "12px", color: "#ef4444" }}>{errors.selectedModules}</span>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
          {MODULES.map((mod) => {
            const isChecked = formData.selectedModules.includes(mod.id);
            return (
              <label
                key={mod.id}
                onClick={() => handleModuleToggle(mod.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  background: isChecked ? "rgba(110, 231, 183, 0.15)" : "rgba(0, 0, 0, 0.25)",
                  border: isChecked ? "1.5px solid #6ee7b7" : "1px solid rgba(255, 255, 255, 0.12)",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#ffffff",
                  userSelect: "none",
                  transition: "all 0.2s ease"
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}}
                  style={{ width: "16px", height: "16px", accentColor: "#6ee7b7" }}
                />
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: isChecked ? "#6ee7b7" : "#94a3b8" }}>
                  {mod.icon}
                </span>
                {mod.label}
              </label>
            );
          })}
        </div>
      </div>

      {/* Navigation Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            padding: "11px 22px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          style={{
            background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
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
            boxShadow: "0 10px 25px -5px rgba(5, 150, 105, 0.5)",
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
