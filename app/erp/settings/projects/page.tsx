"use client";

import React, { useState, useEffect } from "react";
import styles from "./projects.module.css";
import { 
  PROJECT_PRESETS, 
  ProjectPreset, 
  ProjectPresetId,
  ProjectDynamicField,
  mergeCustomPresetConfig
} from "@/lib/projects/projectPresets";

export default function ProjectSettingsPage() {
  const [defaultPreset, setDefaultPreset] = useState<ProjectPresetId>("video_agency");
  const [customConfigs, setCustomConfigs] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingPresetId, setSavingPresetId] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Customization Modal State
  const [customizingPreset, setCustomizingPreset] = useState<ProjectPreset | null>(null);
  const [customStageNames, setCustomStageNames] = useState<Record<number, string>>({});
  const [customFields, setCustomFields] = useState<ProjectDynamicField[]>([]);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<any>("text");
  const [newFieldStage, setNewFieldStage] = useState<number>(1);
  const [newFieldSection, setNewFieldSection] = useState("Custom Fields");
  const [isSavingCustom, setIsSavingCustom] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/settings/project-presets", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setDefaultPreset(json.defaultPreset || "video_agency");
        setCustomConfigs(json.customConfigs || {});
      }
    } catch {
      setError("Failed to load project presets settings.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (presetId: ProjectPresetId) => {
    setSavingPresetId(presetId);
    setSuccess("");
    setError("");

    try {
      const res = await fetch("/api/settings/project-presets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultPreset: presetId })
      });
      const json = await res.json();
      if (json.success) {
        setDefaultPreset(presetId);
        setSuccess(`Default project structure preset changed to "${PROJECT_PRESETS[presetId]?.name}" successfully.`);
        setTimeout(() => setSuccess(""), 4500);
      } else {
        setError(json.error || "Failed to update default preset.");
      }
    } catch {
      setError("Network error updating default preset.");
    } finally {
      setSavingPresetId(null);
    }
  };

  const handleOpenCustomize = (preset: ProjectPreset) => {
    const existingCustom = customConfigs[preset.id] || {};
    const merged = mergeCustomPresetConfig(preset, existingCustom);
    setCustomizingPreset(merged);
    
    const initialNames: Record<number, string> = {};
    for (let s = 1; s <= 7; s++) {
      initialNames[s] = merged.stages[s]?.name || preset.stages[s]?.name;
    }
    setCustomStageNames(initialNames);
    setCustomFields(merged.defaultFields || []);
  };

  const handleAddCustomField = () => {
    if (!newFieldName.trim()) return;
    const newField: ProjectDynamicField = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label: newFieldName.trim(),
      type: newFieldType,
      stage: newFieldStage,
      section: newFieldSection.trim() || "Custom Fields",
      isCustom: true
    };
    setCustomFields(prev => [...prev, newField]);
    setNewFieldName("");
  };

  const handleRemoveField = (fieldId: string) => {
    setCustomFields(prev => prev.filter(f => f.id !== fieldId));
  };

  const handleSaveCustomConfig = async () => {
    if (!customizingPreset) return;
    setIsSavingCustom(true);
    setError("");
    setSuccess("");

    const updatedConfig = {
      stageNames: customStageNames,
      customFields: customFields
    };

    try {
      const res = await fetch("/api/settings/project-presets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presetId: customizingPreset.id,
          customConfig: updatedConfig
        })
      });
      const json = await res.json();
      if (json.success) {
        setCustomConfigs(prev => ({
          ...prev,
          [customizingPreset.id]: updatedConfig
        }));
        setSuccess(`Custom configuration for "${customizingPreset.name}" saved successfully!`);
        setTimeout(() => setSuccess(""), 4500);
        setCustomizingPreset(null);
      } else {
        setError(json.error || "Failed to save preset configuration.");
      }
    } catch {
      setError("Network error while saving preset configuration.");
    } finally {
      setIsSavingCustom(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!customizingPreset) return;
    if (!confirm(`Reset all custom stages and fields for "${customizingPreset.name}" to factory defaults?`)) return;

    setIsSavingCustom(true);
    try {
      const res = await fetch("/api/settings/project-presets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presetId: customizingPreset.id,
          customConfig: null
        })
      });
      const json = await res.json();
      if (json.success) {
        setCustomConfigs(prev => {
          const next = { ...prev };
          delete next[customizingPreset.id];
          return next;
        });
        setSuccess(`Reset "${customizingPreset.name}" to original template defaults.`);
        setTimeout(() => setSuccess(""), 4000);
        setCustomizingPreset(null);
      }
    } catch {
      setError("Failed to reset preset.");
    } finally {
      setIsSavingCustom(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted, #94a3b8)" }}>
        Loading Project Structure Presets...
      </div>
    );
  }

  const presetsList = Object.values(PROJECT_PRESETS);
  const activePresetDef = PROJECT_PRESETS[defaultPreset] || PROJECT_PRESETS.video_agency;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.headerBadge}>
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>schema</span>
            <span>Dynamic Architecture Engine</span>
          </div>
          <h1 className={styles.title}>Project Workflow & Structure Presets</h1>
          <p className={styles.subtitle}>
            Choose your organization's default project structure and 7-stage workflow. Every preset adapts deliverables, contractor roles, milestone checklists, and dynamic fields for any industry.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div style={{
          padding: "14px 18px",
          borderRadius: "12px",
          background: "rgba(16, 185, 129, 0.15)",
          border: "1px solid rgba(16, 185, 129, 0.4)",
          color: "#34d399",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "14px",
          fontWeight: 600
        }}>
          <span className="material-symbols-outlined">check_circle</span>
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div style={{
          padding: "14px 18px",
          borderRadius: "12px",
          background: "rgba(239, 68, 68, 0.15)",
          border: "1px solid rgba(239, 68, 68, 0.4)",
          color: "#f87171",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "14px",
          fontWeight: 600
        }}>
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Active Default Banner */}
      <div className={styles.activeDefaultBanner}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "52px",
            height: "52px",
            borderRadius: "14px",
            background: activePresetDef.bg,
            border: `1px solid ${activePresetDef.color}`,
            color: activePresetDef.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>{activePresetDef.icon}</span>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#818cf8" }}>
                Active Company Default
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-muted, #94a3b8)" }}>• Auto-applies to new projects</span>
            </div>
            <h3 style={{ margin: "2px 0 0 0", fontSize: "19px", fontWeight: 800, color: "#ffffff" }}>
              {activePresetDef.name}
            </h3>
            <p style={{ margin: "3px 0 0 0", fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
              {activePresetDef.tagline}
            </p>
          </div>
        </div>

        <button
          onClick={() => handleOpenCustomize(activePresetDef)}
          className={styles.btnSecondary}
          style={{ padding: "10px 18px", fontSize: "13px" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>tune</span>
          <span>Customize Active Workflow</span>
        </button>
      </div>

      {/* 7 Presets Grid */}
      <div className={styles.grid}>
        {presetsList.map((preset) => {
          const isDefault = defaultPreset === preset.id;
          const hasCustomConfig = Boolean(customConfigs[preset.id]);
          const effectivePreset = mergeCustomPresetConfig(preset, customConfigs[preset.id]);

          return (
            <div
              key={preset.id}
              className={`${styles.presetCard} ${isDefault ? styles.presetCardActive : ""}`}
              style={{
                "--preset-color": preset.color,
                "--preset-glow": preset.bg
              } as React.CSSProperties}
            >
              {isDefault && (
                <div className={styles.activeRibbon}>
                  <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>check_circle</span>
                  <span>Active Default</span>
                </div>
              )}

              <div>
                <div className={styles.cardTop}>
                  <div
                    className={styles.iconBox}
                    style={{
                      background: preset.bg,
                      color: preset.color,
                      border: `1px solid ${preset.color}33`
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>
                      {preset.icon}
                    </span>
                  </div>
                  <div style={{ flex: 1, paddingRight: isDefault ? "80px" : "0" }}>
                    <div className={styles.presetCategory}>{preset.category}</div>
                    <h3 className={styles.presetName}>{preset.name}</h3>
                    <div style={{ fontSize: "12px", color: preset.color, fontWeight: 600 }}>
                      {preset.tagline}
                    </div>
                  </div>
                </div>

                <p className={styles.presetDesc} style={{ marginTop: "12px" }}>
                  {preset.description}
                </p>

                {/* 7-Stage Chips */}
                <div className={styles.stageChipsContainer} style={{ marginTop: "14px" }}>
                  <div className={styles.stageChipsHeader}>
                    <span>7-Stage Workflow Pipeline</span>
                    {hasCustomConfig && (
                      <span style={{ color: "#fbbf24", fontSize: "10px" }}>★ Custom Config Active</span>
                    )}
                  </div>
                  <div className={styles.stageChipList}>
                    {[1, 2, 3, 4, 5, 6, 7].map((sNum) => {
                      const st = effectivePreset.stages[sNum];
                      return (
                        <div key={sNum} className={styles.stageChip}>
                          <span style={{ color: preset.color, fontWeight: 700 }}>{sNum}.</span>
                          <span>{st?.shortName || st?.name || `Stage ${sNum}`}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Deliverables Info */}
                <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div className={styles.deliverablesInfo}>
                    <span className="material-symbols-outlined" style={{ fontSize: "15px", color: preset.color }}>
                      view_kanban
                    </span>
                    <span><strong>Deliverable Unit:</strong> {preset.deliverableSchema.itemTypeName}</span>
                  </div>
                  <div className={styles.deliverablesInfo}>
                    <span className="material-symbols-outlined" style={{ fontSize: "15px", color: preset.color }}>
                      person_pin
                    </span>
                    <span><strong>Lead Specialist:</strong> {preset.deliverableSchema.primaryRoleTitle}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className={styles.cardActions}>
                {!isDefault && (
                  <button
                    onClick={() => handleSetDefault(preset.id)}
                    className={styles.btnPrimary}
                    disabled={savingPresetId === preset.id}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                      {savingPresetId === preset.id ? "hourglass_empty" : "done_all"}
                    </span>
                    <span>{savingPresetId === preset.id ? "Setting..." : "Set as Default"}</span>
                  </button>
                )}
                <button
                  onClick={() => handleOpenCustomize(preset)}
                  className={styles.btnSecondary}
                  style={{ flex: isDefault ? 1 : undefined }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>tune</span>
                  <span>{isDefault ? "Customize Workflow & Fields" : "Customize"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Customization Modal */}
      {customizingPreset && (
        <div className={styles.modalOverlay} onClick={() => setCustomizingPreset(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: customizingPreset.bg,
                  color: customizingPreset.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <span className="material-symbols-outlined">{customizingPreset.icon}</span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#ffffff", fontWeight: 700 }}>
                    Customize: {customizingPreset.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
                    Configure custom stage names, dynamic custom fields, and operational deliverables.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCustomizingPreset(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: "20px"
                }}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* 1. Stage Names Customizer */}
              <div>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#ffffff", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "18px", color: customizingPreset.color }}>edit_note</span>
                  Rename 7-Stage Workflow Titles
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                    <div key={s} style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.3)", padding: "8px 12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: customizingPreset.color, width: "55px" }}>
                        Stage {s}:
                      </span>
                      <input
                        type="text"
                        value={customStageNames[s] || ""}
                        onChange={(e) => setCustomStageNames({ ...customStageNames, [s]: e.target.value })}
                        style={{
                          flex: 1,
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "6px",
                          padding: "6px 10px",
                          color: "#ffffff",
                          fontSize: "13px"
                        }}
                        placeholder={`Stage ${s} name`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Dynamic Custom Fields */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "18px" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#ffffff", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "18px", color: customizingPreset.color }}>dynamic_form</span>
                  Active & Custom Dynamic Fields ({customFields.length})
                </h4>

                {/* Existing Fields List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                  {customFields.map((field) => (
                    <div
                      key={field.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "10px"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "3px 7px",
                          borderRadius: "4px",
                          background: "rgba(255,255,255,0.08)",
                          color: "#818cf8"
                        }}>
                          STAGE {field.stage}
                        </span>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>
                          {field.label}
                        </span>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                          ({field.type} • {field.section})
                        </span>
                        {field.isCustom && (
                          <span style={{ fontSize: "10px", background: "#f59e0b22", color: "#fbbf24", padding: "2px 6px", borderRadius: "4px" }}>
                            User Custom
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleRemoveField(field.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#f87171",
                          cursor: "pointer",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center"
                        }}
                        title="Remove Field"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Field Box */}
                <div style={{
                  background: "rgba(99, 102, 241, 0.08)",
                  border: "1px dashed rgba(99, 102, 241, 0.3)",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px"
                }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#c7d2fe" }}>
                    + Add New Dynamic Field to this Preset
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: "8px", alignItems: "center" }}>
                    <input
                      type="text"
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      placeholder="Field Label (e.g. Server Port / Site GPS)"
                      style={{
                        background: "rgba(0,0,0,0.4)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        color: "#ffffff",
                        fontSize: "13px"
                      }}
                    />
                    <select
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value)}
                      style={{
                        background: "#0f172a",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "8px",
                        padding: "8px",
                        color: "#ffffff",
                        fontSize: "12px"
                      }}
                    >
                      <option value="text">Text (Single Line)</option>
                      <option value="textarea">Textarea (Multi Line)</option>
                      <option value="number">Number</option>
                      <option value="currency">Currency (BDT/USD)</option>
                      <option value="url">URL Link</option>
                      <option value="date">Date</option>
                      <option value="time">Time</option>
                      <option value="checklist">Checklist</option>
                    </select>
                    <select
                      value={newFieldStage}
                      onChange={(e) => setNewFieldStage(Number(e.target.value))}
                      style={{
                        background: "#0f172a",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "8px",
                        padding: "8px",
                        color: "#ffffff",
                        fontSize: "12px"
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                        <option key={s} value={s}>Stage {s}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={newFieldSection}
                      onChange={(e) => setNewFieldSection(e.target.value)}
                      placeholder="Section Header"
                      style={{
                        background: "rgba(0,0,0,0.4)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        color: "#ffffff",
                        fontSize: "12px"
                      }}
                    />
                    <button
                      onClick={handleAddCustomField}
                      style={{
                        background: "#6366f1",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        padding: "8px 14px",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Add Field
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={handleResetDefaults}
                style={{
                  background: "transparent",
                  color: "#f87171",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "10px",
                  padding: "10px 16px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  marginRight: "auto"
                }}
                disabled={isSavingCustom}
              >
                Reset to Defaults
              </button>

              <button
                onClick={() => setCustomizingPreset(null)}
                className={styles.btnSecondary}
                disabled={isSavingCustom}
              >
                Cancel
              </button>

              <button
                onClick={handleSaveCustomConfig}
                className={styles.btnPrimary}
                disabled={isSavingCustom}
                style={{ flex: "none", minWidth: "140px" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>save</span>
                <span>{isSavingCustom ? "Saving..." : "Save Customization"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
