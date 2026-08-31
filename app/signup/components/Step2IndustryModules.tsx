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
        background: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(20px)",
        border: "1.5px solid rgba(15, 23, 42, 0.15)",
        borderRadius: "24px",
        padding: "40px",
        width: "100%",
        maxWidth: "680px",
        boxShadow: "0 25px 60px rgba(15, 23, 42, 0.25)",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        color: "#0f172a"
      }}
    >
      <div>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#0369a1",
            background: "rgba(3, 105, 161, 0.12)",
            padding: "4px 10px",
            borderRadius: "20px"
          }}
        >
          Step 2 of 4 · Architecture
        </span>
        <h2 style={{ fontSize: "26px", fontWeight: 700, margin: "12px 0 6px 0", color: "#0f172a" }}>
          Industry Preset & Modules
        </h2>
        <p style={{ margin: 0, fontSize: "14px", color: "#475569" }}>
          Select a tailored organizational template and activate your required ERP modules.
        </p>
      </div>

      {/* Industry Presets Grid */}
      <div>
        <label style={labelLight}>Industry Template Preset</label>
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
                  border: isSelected ? "2px solid #0284c7" : "1px solid rgba(15, 23, 42, 0.12)",
                  background: isSelected ? "rgba(2, 132, 199, 0.12)" : "rgba(255, 255, 255, 0.7)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "22px", color: isSelected ? "#0284c7" : "#64748b" }}>
                    {tmpl.icon}
                  </span>
                  <div style={{ fontWeight: 700, fontSize: "13px", color: "#0f172a" }}>{tmpl.name}</div>
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", paddingLeft: "30px" }}>{tmpl.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enabled Modules Selection */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <label style={labelLight}>Enabled ERP Modules ({formData.selectedModules.length})</label>
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
                  background: isChecked ? "rgba(2, 132, 199, 0.1)" : "rgba(255, 255, 255, 0.7)",
                  border: isChecked ? "1.5px solid #0284c7" : "1px solid rgba(15, 23, 42, 0.12)",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#0f172a",
                  userSelect: "none"
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}}
                  style={{ width: "16px", height: "16px", accentColor: "#0284c7" }}
                />
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: isChecked ? "#0284c7" : "#64748b" }}>
                  {mod.icon}
                </span>
                {mod.label}
              </label>
            );
          })}
        </div>
      </div>

      {/* Navigation Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid rgba(15, 23, 42, 0.1)" }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: "transparent",
            color: "#475569",
            border: "1px solid rgba(15, 23, 42, 0.2)",
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
            background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
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
            boxShadow: "0 10px 25px -5px rgba(2, 132, 199, 0.4)"
          }}
        >
          Continue
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_forward</span>
        </button>
      </div>
    </div>
  );
}

const labelLight: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 700,
  color: "#334155",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.05em"
};
