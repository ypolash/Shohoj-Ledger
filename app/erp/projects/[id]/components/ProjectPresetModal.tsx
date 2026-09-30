"use client";

import React, { useState } from "react";
import { 
  PROJECT_PRESETS, 
  ProjectPresetId, 
  getPresetById 
} from "@/lib/projects/projectPresets";

interface ProjectPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePresetId: ProjectPresetId;
  stageNames: Record<number, string>;
  onSavePresetAndStages: (newPresetId: ProjectPresetId, newStageNames: Record<number, string>) => void;
}

export function ProjectPresetModal({
  isOpen,
  onClose,
  activePresetId,
  stageNames,
  onSavePresetAndStages
}: ProjectPresetModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<ProjectPresetId>(activePresetId);
  const [localStageNames, setLocalStageNames] = useState<Record<number, string>>(stageNames);

  if (!isOpen) return null;

  const handleSelectPreset = (pId: ProjectPresetId) => {
    setSelectedPreset(pId);
    const def = getPresetById(pId);
    const newNames: Record<number, string> = {};
    for (let s = 1; s <= 7; s++) {
      newNames[s] = def.stages[s]?.name || `Stage ${s}`;
    }
    setLocalStageNames(newNames);
  };

  const handleSave = () => {
    onSavePresetAndStages(selectedPreset, localStageNames);
    onClose();
  };

  const currentDef = getPresetById(selectedPreset);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0, 0, 0, 0.75)",
      backdropFilter: "blur(8px)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }} onClick={onClose}>
      <div style={{
        background: "#0f172a",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: "20px",
        width: "100%",
        maxWidth: "840px",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.75)"
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: currentDef.bg,
              color: currentDef.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <span className="material-symbols-outlined">{currentDef.icon}</span>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#ffffff", fontWeight: 700 }}>
                Project Structure Preset &amp; Workflow
              </h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
                Switch structure preset or customize stage titles for this project.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
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

        {/* Body */}
        <div style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Preset Selector Grid */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#cbd5e1", marginBottom: "8px", textTransform: "uppercase" }}>
              Select Industry Project Preset
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "8px" }}>
              {Object.values(PROJECT_PRESETS).map((p) => {
                const isSel = selectedPreset === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPreset(p.id)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      cursor: "pointer",
                      border: isSel ? `1.5px solid ${p.color}` : "1px solid rgba(255,255,255,0.08)",
                      background: isSel ? p.bg : "rgba(255,255,255,0.03)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "20px", color: p.color }}>
                      {p.icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: isSel ? "#ffffff" : "#cbd5e1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.name.replace(" & Media Agency", "").replace(" & Software Development", "").replace(" & Ad Agency", "").replace(" & Real Estate", "")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Preset Overview */}
          <div style={{
            background: "rgba(0,0,0,0.3)",
            border: `1px solid ${currentDef.color}44`,
            borderRadius: "12px",
            padding: "14px 16px"
          }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: currentDef.color, marginBottom: "4px" }}>
              {currentDef.name} — {currentDef.tagline}
            </div>
            <div style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.4 }}>
              {currentDef.description}
            </div>
          </div>

          {/* Stage Names Editable List */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#cbd5e1", marginBottom: "8px", textTransform: "uppercase" }}>
              Customize 7-Stage Workflow Titles
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.25)", padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: currentDef.color, width: "50px" }}>
                    Stage {s}:
                  </span>
                  <input
                    type="text"
                    value={localStageNames[s] || ""}
                    onChange={(e) => setLocalStageNames({ ...localStageNames, [s]: e.target.value })}
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "6px",
                      padding: "6px 10px",
                      color: "#ffffff",
                      fontSize: "12px"
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
          background: "rgba(0, 0, 0, 0.2)"
        }}>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "10px",
              padding: "10px 18px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              background: currentDef.color,
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "10px 22px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: `0 4px 15px ${currentDef.color}44`
            }}
          >
            Apply Preset &amp; Stages
          </button>
        </div>
      </div>
    </div>
  );
}
