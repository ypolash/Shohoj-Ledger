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
  ChevronRight
} from "lucide-react";
import { 
  PROJECT_PRESETS, 
  ProjectPresetId, 
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
  { id: "consulting", name: "Consulting & Professional", desc: "Retainers, Billable Hours & Audits", icon: <Building2 size={20} /> }
];

export function Step2IndustryModules({ formData, errors, updateForm, onBack, onNext }: Step2Props) {
  const currentPresetId: ProjectPresetId = (formData.projectPreset as ProjectPresetId) || mapIndustryToProjectPreset(formData.industryTemplate);

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

  const allPresets = Object.values(PROJECT_PRESETS);
  const selectedPresetObj = PROJECT_PRESETS[currentPresetId] || PROJECT_PRESETS.video_agency;

  return (
    <div style={cardContainerStyle}>
      {/* Top emerald glow line */}
      <div style={topGlowLine} />

      {/* 1. Industry Presets Grid */}
      <div>
        <label style={labelStyle}>
          1. Industry Template Preset <span style={{ color: "#6ee7b7" }}>· Auto-provisions Chart of Accounts & Roles</span>
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
          {INDUSTRY_TEMPLATES.map((tmpl) => {
            const isSelected = formData.industryTemplate === tmpl.id;
            return (
              <div
                key={tmpl.id}
                onClick={() => handleIndustrySelect(tmpl.id)}
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
                    width: "34px",
                    height: "34px",
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
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", color: isSelected ? "#6ee7b7" : "#ffffff" }}>
                    {tmpl.name}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "2px", lineHeight: 1.3 }}>
                    {tmpl.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Dynamic Project Structure Preset Selector */}
      <div style={{ background: "rgba(0, 0, 0, 0.25)", padding: "18px", borderRadius: "18px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>
            2. Project Structure & Workflow Preset <span style={{ color: "#818cf8" }}>· 7 Industry Pipelines</span>
          </label>
          <span style={{ fontSize: "0.75rem", color: "#a5b4fc", display: "flex", alignItems: "center", gap: "4px" }}>
            <Sparkles size={12} /> Auto-recommended for your business
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "8px", marginBottom: "14px" }}>
          {allPresets.map((preset) => {
            const isPresetSelected = currentPresetId === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => updateForm("projectPreset", preset.id)}
                style={{
                  padding: "10px 12px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  border: isPresetSelected ? `1.5px solid ${preset.color}` : "1px solid rgba(255, 255, 255, 0.08)",
                  background: isPresetSelected ? preset.bg : "rgba(255, 255, 255, 0.03)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  background: isPresetSelected ? preset.color : "rgba(255, 255, 255, 0.08)",
                  color: isPresetSelected ? "#ffffff" : "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  flexShrink: 0
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{preset.icon}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: isPresetSelected ? "#ffffff" : "#cbd5e1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {preset.name.replace(" & Media Agency", "").replace(" & Software Development", "").replace(" & Ad Agency", "").replace(" & Real Estate", "")}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: isPresetSelected ? preset.accentColor : "#64748b" }}>
                    {preset.deliverableSchema.itemTypeName}
                  </div>
                </div>
                {isPresetSelected && <Check size={12} color={preset.color} />}
              </div>
            );
          })}
        </div>

        {/* Active Preset Stage Preview Pill Bar */}
        <div style={{
          background: "rgba(0, 0, 0, 0.4)",
          border: `1px solid ${selectedPresetObj.color}33`,
          borderRadius: "12px",
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: selectedPresetObj.color, textTransform: "uppercase" }}>
              Active Pipeline: {selectedPresetObj.name}
            </span>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
              Role: {selectedPresetObj.deliverableSchema.primaryRoleTitle}
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {[1, 2, 3, 4, 5, 6, 7].map((s) => (
              <span
                key={s}
                style={{
                  fontSize: "0.7rem",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  color: "#e2e8f0"
                }}
              >
                <strong style={{ color: selectedPresetObj.color }}>{s}.</strong> {selectedPresetObj.stages[s]?.shortName || selectedPresetObj.stages[s]?.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Enabled Modules Selection */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <label style={labelStyle}>
            3. Active ERP Modules ({formData.selectedModules.length} selected)
          </label>
          {errors.selectedModules && <span style={{ fontSize: "0.8rem", color: "#f87171", fontWeight: 600 }}>{errors.selectedModules}</span>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "10px" }}>
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
                  padding: "12px 14px",
                  borderRadius: "14px",
                  cursor: "pointer",
                  background: isChecked ? "rgba(16, 185, 129, 0.12)" : "rgba(0, 0, 0, 0.3)",
                  border: isChecked ? "1.5px solid #10b981" : "1px solid rgba(255, 255, 255, 0.1)",
                  fontSize: "0.85rem",
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
                  width: "18px",
                  height: "18px",
                  borderRadius: "6px",
                  border: isChecked ? "none" : "1.5px solid rgba(255,255,255,0.3)",
                  background: isChecked ? "#10b981" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s"
                }}>
                  {isChecked && <Check size={12} color="#06101e" />}
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
  padding: "32px",
  width: "100%",
  maxWidth: "100%",
  margin: "0",
  boxShadow: "0 30px 70px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(16, 185, 129, 0.08)",
  display: "flex",
  flexDirection: "column",
  gap: "22px",
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
  marginBottom: "8px",
  textTransform: "uppercase",
  letterSpacing: "0.08em"
};

const templateCardStyle: React.CSSProperties = {
  padding: "14px",
  borderRadius: "14px",
  cursor: "pointer",
  border: "1.5px solid rgba(255, 255, 255, 0.1)",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
  userSelect: "none"
};

const checkBadgeStyle: React.CSSProperties = {
  width: "18px",
  height: "18px",
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
  paddingTop: "14px",
  borderTop: "1px solid rgba(255, 255, 255, 0.08)"
};

const secondaryButtonStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.05)",
  color: "#ffffff",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  padding: "11px 20px",
  borderRadius: "14px",
  fontSize: "0.9rem",
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
  padding: "12px 26px",
  borderRadius: "14px",
  fontSize: "0.92rem",
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  boxShadow: "0 10px 25px -4px rgba(16, 185, 129, 0.45)",
  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
};
