"use client";

import React, { useState } from "react";
import { 
  ProjectDynamicField, 
  DynamicFieldType 
} from "@/lib/projects/projectPresets";

interface DynamicStageFieldsProps {
  stage: number;
  stageName: string;
  presetColor: string;
  fields: ProjectDynamicField[];
  fieldValues: Record<string, any>;
  onUpdateFieldValue: (fieldId: string, value: any) => void;
  onAddField: (newField: ProjectDynamicField) => void;
  onRemoveField: (fieldId: string) => void;
}

export function DynamicStageFields({
  stage,
  stageName,
  presetColor,
  fields,
  fieldValues,
  onUpdateFieldValue,
  onAddField,
  onRemoveField
}: DynamicStageFieldsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<DynamicFieldType>("text");
  const [newSection, setNewSection] = useState("Stage Specifications");
  const [newPlaceholder, setNewPlaceholder] = useState("");
  const [newOptionsStr, setNewOptionsStr] = useState("");

  const stageFields = fields.filter(f => f.stage === stage);

  const handleCreateField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const options = newType === "select" && newOptionsStr.trim()
      ? newOptionsStr.split(",").map(s => s.trim()).filter(Boolean)
      : undefined;

    const newField: ProjectDynamicField = {
      id: `field_${stage}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label: newLabel.trim(),
      type: newType,
      stage,
      section: newSection.trim() || "Stage Specifications",
      placeholder: newPlaceholder.trim() || undefined,
      options,
      isCustom: true
    };

    onAddField(newField);
    setNewLabel("");
    setNewPlaceholder("");
    setNewOptionsStr("");
    setIsAdding(false);
  };

  return (
    <div style={{
      background: "rgba(15, 23, 42, 0.6)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      borderRadius: "16px",
      padding: "20px 24px",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      marginTop: "20px"
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: `${presetColor}22`,
            color: presetColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>dynamic_form</span>
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>
              Dynamic Specifications &amp; Custom Fields ({stageFields.length})
            </h4>
            <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted, #94a3b8)" }}>
              Custom operational attributes for Stage {stage}: {stageName}. All fields are dynamic and editable.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          style={{
            background: isAdding ? "rgba(239, 68, 68, 0.15)" : "rgba(255, 255, 255, 0.08)",
            color: isAdding ? "#f87171" : "#ffffff",
            border: `1px solid ${isAdding ? "rgba(239, 68, 68, 0.3)" : "rgba(255, 255, 255, 0.12)"}`,
            borderRadius: "8px",
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
            {isAdding ? "close" : "add"}
          </span>
          <span>{isAdding ? "Cancel" : "+ Add Dynamic Field"}</span>
        </button>
      </div>

      {/* Add Field Inline Drawer */}
      {isAdding && (
        <form onSubmit={handleCreateField} style={{
          background: "rgba(0, 0, 0, 0.35)",
          border: `1px dashed ${presetColor}55`,
          borderRadius: "12px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: presetColor }}>
            Configure New Field for Stage {stage}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>
                Field Name / Label *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Server Port / Site Coordinate / Deliverable Spec"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  color: "#ffffff",
                  fontSize: "12px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>
                Field Type
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as DynamicFieldType)}
                style={{
                  width: "100%",
                  background: "#0f172a",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "8px",
                  padding: "8px",
                  color: "#ffffff",
                  fontSize: "12px"
                }}
              >
                <option value="text">Text (Single Line)</option>
                <option value="textarea">Textarea (Multi Line)</option>
                <option value="number">Number</option>
                <option value="currency">Currency (৳ / $)</option>
                <option value="url">URL Web Link</option>
                <option value="date">Date</option>
                <option value="time">Time</option>
                <option value="select">Dropdown Select</option>
                <option value="checklist">Checklist Item</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>
                Section Group
              </label>
              <input
                type="text"
                placeholder="e.g. Technical Specs"
                value={newSection}
                onChange={(e) => setNewSection(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  color: "#ffffff",
                  fontSize: "12px"
                }}
              />
            </div>
          </div>

          {newType === "select" && (
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>
                Select Options (comma separated)
              </label>
              <input
                type="text"
                placeholder="Option 1, Option 2, Option 3"
                value={newOptionsStr}
                onChange={(e) => setNewOptionsStr(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  color: "#ffffff",
                  fontSize: "12px"
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>
              Placeholder Text (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Enter value or link here..."
              value={newPlaceholder}
              onChange={(e) => setNewPlaceholder(e.target.value)}
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "8px",
                padding: "8px 12px",
                color: "#ffffff",
                fontSize: "12px"
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              style={{
                background: "transparent",
                color: "#94a3b8",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "6px 14px",
                fontSize: "12px",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: presetColor,
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "6px 18px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Save Field to Stage
            </button>
          </div>
        </form>
      )}

      {/* Fields Grid */}
      {stageFields.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "24px 0",
          color: "rgba(255, 255, 255, 0.4)",
          fontSize: "12px",
          border: "1px dashed rgba(255, 255, 255, 0.06)",
          borderRadius: "12px"
        }}>
          No dynamic fields added for this stage yet. Click <strong>"+ Add Dynamic Field"</strong> to add customizable inputs.
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "14px"
        }}>
          {stageFields.map((field) => {
            const val = fieldValues[field.id] !== undefined ? fieldValues[field.id] : (field.defaultValue ?? "");

            return (
              <div
                key={field.id}
                style={{
                  background: "rgba(0, 0, 0, 0.25)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  position: "relative"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#cbd5e1",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <span>{field.label}</span>
                    <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", textTransform: "lowercase", fontWeight: 400 }}>
                      ({field.type})
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => onRemoveField(field.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "rgba(239, 68, 68, 0.6)",
                      cursor: "pointer",
                      padding: "2px",
                      display: "flex",
                      alignItems: "center"
                    }}
                    title="Delete Field"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>delete</span>
                  </button>
                </div>

                {/* Render input based on field type */}
                {field.type === "textarea" ? (
                  <textarea
                    rows={3}
                    placeholder={field.placeholder || "Enter notes..."}
                    value={val}
                    onChange={(e) => onUpdateFieldValue(field.id, e.target.value)}
                    style={{
                      width: "100%",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                      padding: "8px 10px",
                      color: "#ffffff",
                      fontSize: "12px",
                      resize: "vertical"
                    }}
                  />
                ) : field.type === "select" ? (
                  <select
                    value={val}
                    onChange={(e) => onUpdateFieldValue(field.id, e.target.value)}
                    style={{
                      width: "100%",
                      background: "#0f172a",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                      padding: "8px 10px",
                      color: "#ffffff",
                      fontSize: "12px"
                    }}
                  >
                    <option value="">-- Select --</option>
                    {(field.options || []).map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === "checklist" ? (
                  <label style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    padding: "6px 0",
                    color: Boolean(val) ? "#34d399" : "#ffffff",
                    fontSize: "12px",
                    fontWeight: 600
                  }}>
                    <input
                      type="checkbox"
                      checked={Boolean(val)}
                      onChange={(e) => onUpdateFieldValue(field.id, e.target.checked)}
                      style={{ width: "16px", height: "16px", accentColor: presetColor }}
                    />
                    <span>{Boolean(val) ? "Completed / Verified ✓" : "Mark as Completed"}</span>
                  </label>
                ) : (
                  <div style={{ position: "relative" }}>
                    <input
                      type={field.type === "number" || field.type === "currency" ? "number" : field.type === "date" ? "date" : field.type === "time" ? "time" : "text"}
                      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                      value={val}
                      onChange={(e) => onUpdateFieldValue(field.id, e.target.value)}
                      style={{
                        width: "100%",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        padding: field.type === "url" ? "8px 32px 8px 10px" : "8px 10px",
                        color: "#ffffff",
                        fontSize: "12px"
                      }}
                    />
                    {field.type === "url" && val && (
                      <a
                        href={val.startsWith("http") ? val : `https://${val}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          position: "absolute",
                          right: "8px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: presetColor,
                          display: "flex",
                          alignItems: "center"
                        }}
                        title="Open Link in New Tab"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>open_in_new</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
