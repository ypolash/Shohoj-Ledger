"use client";

import React from "react";

interface ColorStepIndicatorProps {
  currentStep: number;
  onSelectStep?: (step: number) => void;
}

const STEPS = [
  { step: 1, name: "Company", color: "#211f35", textDark: false },
  { step: 2, name: "Modules", color: "#bce0fd", textDark: true },
  { step: 3, name: "Admin", color: "#f04938", textDark: false },
  { step: 4, name: "Launch", color: "#b5eff2", textDark: true }
];

/**
 * ColorStepIndicator Component
 * Displays the 4-color palette strip inspired by the reference image.
 * Active step expands with animated glow and label.
 */
export function ColorStepIndicator({ currentStep, onSelectStep }: ColorStepIndicatorProps) {
  return (
    <div
      style={{
        position: "fixed",
        top: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(12px)",
        padding: "6px 10px",
        borderRadius: "30px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
        border: "1px solid rgba(255, 255, 255, 0.15)"
      }}
    >
      {STEPS.map((s) => {
        const isActive = currentStep === s.step;
        const isCompleted = currentStep > s.step;

        return (
          <button
            key={s.step}
            type="button"
            onClick={() => isCompleted && onSelectStep && onSelectStep(s.step)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: isActive ? "6px 14px" : "6px 10px",
              borderRadius: "20px",
              background: s.color,
              border: isActive ? "2px solid #fff" : "1px solid rgba(255,255,255,0.2)",
              color: s.textDark ? "#0f172a" : "#ffffff",
              cursor: isCompleted ? "pointer" : "default",
              transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
              transform: isActive ? "scale(1.05)" : "scale(1)",
              boxShadow: isActive ? `0 0 15px ${s.color}` : "none",
              fontWeight: 700,
              fontSize: "12px",
              outline: "none"
            }}
          >
            <span
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                background: s.textDark ? "rgba(15, 23, 42, 0.15)" : "rgba(255, 255, 255, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontWeight: 800
              }}
            >
              {isCompleted ? "✓" : s.step}
            </span>
            {isActive && <span>{s.name}</span>}
          </button>
        );
      })}
    </div>
  );
}
