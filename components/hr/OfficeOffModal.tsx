"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Moon, Calendar, AlertTriangle, CheckCircle2, History, X, Loader2, Users, DollarSign, Building } from "lucide-react";

interface OfficeOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: any) => void;
}

export function OfficeOffModal({ isOpen, onClose, onSuccess }: OfficeOffModalProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [targetDate, setTargetDate] = useState<string>("");
  const [includeBackfill, setIncludeBackfill] = useState<boolean>(true);
  const [backfillDays, setBackfillDays] = useState<number>(30);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<any>(null);

  // Set today's date in local ISO YYYY-MM-DD
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      setTargetDate(`${yyyy}-${mm}-${dd}`);
      setResult(null);
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExecute = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/hr/attendance/office-off", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetDate: targetDate || undefined,
          backfillPastDays: includeBackfill ? Number(backfillDays) || 30 : 0,
          source: "MANUAL"
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to execute Office Off procedure.");
      } else {
        setResult(data);
        if (onSuccess) onSuccess(data);

        // If currently on attendance page, notify window or trigger refresh
        if (pathname?.includes("/erp/hr/attendance")) {
          window.dispatchEvent(new CustomEvent("attendance-refetch"));
        }
      }
    } catch (err: any) {
      setError(err?.message || "Network communication error while executing Office Off.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToAttendance = () => {
    onClose();
    if (!pathname?.includes("/erp/hr/attendance")) {
      router.push("/erp/hr/attendance");
    } else {
      window.location.reload();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "16px"
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "540px",
          backgroundColor: "var(--surface-main, #14171f)",
          border: "1px solid var(--border-main, rgba(255, 255, 255, 0.12))",
          borderRadius: "16px",
          boxShadow: "0 24px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(245, 158, 11, 0.15)",
          color: "var(--text-main, #ffffff)",
          overflow: "hidden",
          animation: "scaleIn 0.2s ease-out"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-main, rgba(255, 255, 255, 0.08))",
            background: "linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, transparent 100%)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "rgba(245, 158, 11, 0.15)",
                border: "1px solid rgba(245, 158, 11, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#f59e0b"
              }}
            >
              <Moon size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, letterSpacing: "-0.01em" }}>
                Office Off (Day Closure)
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-muted, #94a3b8)" }}>
                Close working hours, mark absences, and assess penalty fines
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted, #94a3b8)",
              padding: "4px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "20px 24px" }}>
          {error && (
            <div
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#f87171",
                padding: "12px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "16px"
              }}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {!result ? (
            <>
              {/* Form Controls */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Target Date */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--text-muted, #cbd5e1)",
                      marginBottom: "6px"
                    }}
                  >
                    Office Closure Date
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid var(--border-main, rgba(255, 255, 255, 0.15))",
                        borderRadius: "8px",
                        color: "#ffffff",
                        fontSize: "14px",
                        outline: "none"
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted, #94a3b8)", marginTop: "4px", display: "block" }}>
                    Employees with no check-in and no approved leave on this date will be marked Absent.
                  </span>
                </div>

                {/* Historical Backfill Toggle */}
                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "10px",
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                  }}
                >
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={includeBackfill}
                      onChange={(e) => setIncludeBackfill(e.target.checked)}
                      style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "#f59e0b" }}
                    />
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>
                        Scan & Backfill Previous Unrecorded Duty Days
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted, #94a3b8)", marginTop: "2px" }}>
                        Evaluate past working days where staff did not check in and had no leave request, recording their absence and fines in past data.
                      </div>
                    </div>
                  </label>

                  {includeBackfill && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingLeft: "26px" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-muted, #cbd5e1)" }}>Past Scan Range:</span>
                      <select
                        value={backfillDays}
                        onChange={(e) => setBackfillDays(Number(e.target.value))}
                        style={{
                          padding: "6px 10px",
                          backgroundColor: "rgba(255, 255, 255, 0.08)",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          borderRadius: "6px",
                          color: "#ffffff",
                          fontSize: "12px",
                          outline: "none"
                        }}
                      >
                        <option value={7} style={{ backgroundColor: "#1e293b" }}>Past 7 Days</option>
                        <option value={15} style={{ backgroundColor: "#1e293b" }}>Past 15 Days</option>
                        <option value={30} style={{ backgroundColor: "#1e293b" }}>Past 30 Days (Recommended)</option>
                        <option value={60} style={{ backgroundColor: "#1e293b" }}>Past 60 Days</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Explanation Card */}
                <div
                  style={{
                    backgroundColor: "rgba(245, 158, 11, 0.06)",
                    border: "1px solid rgba(245, 158, 11, 0.2)",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    fontSize: "12px",
                    lineHeight: 1.5,
                    color: "rgba(255, 255, 255, 0.85)"
                  }}
                >
                  <strong style={{ color: "#f59e0b", display: "block", marginBottom: "4px" }}>
                    How Absence & Fines are Processed:
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: "16px", color: "var(--text-muted, #cbd5e1)" }}>
                    <li><strong>Only Stops Current Work Day:</strong> Closes today's office hours and marks unexcused staff as Absent with fines.</li>
                    <li><strong>Automatic Next Work Day:</strong> When the next scheduled office time begins, the system automatically resumes as an active working day without any manual reset.</li>
                    <li><strong>Protected Leaves:</strong> Staff on approved leave remain recorded as LEAVE with ৳0 fine.</li>
                    <li><strong>Historical Backfill:</strong> Unrecorded past duty days without check-in or leave are populated in past data.</li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            /* Results Breakdown */
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  borderRadius: "10px",
                  padding: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}
              >
                <CheckCircle2 size={24} style={{ color: "#10b981", flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#10b981" }}>
                    Office Off Audit Completed
                  </h4>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-muted, #cbd5e1)" }}>
                    Duty closed for {result.targetDate}. Attendance and fines have been synchronized.
                  </p>
                </div>
              </div>

              {/* Statistics Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "10px",
                    padding: "12px",
                    textAlign: "center"
                  }}
                >
                  <div style={{ fontSize: "11px", color: "var(--text-muted, #94a3b8)", textTransform: "uppercase" }}>
                    Today's Absences
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: "#ef4444", marginTop: "4px" }}>
                    {result.todayAbsentCount} Staff
                  </div>
                  <div style={{ fontSize: "11px", color: "#f59e0b", marginTop: "2px" }}>
                    ৳{result.todayPenalties.toLocaleString()} Fines
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "10px",
                    padding: "12px",
                    textAlign: "center"
                  }}
                >
                  <div style={{ fontSize: "11px", color: "var(--text-muted, #94a3b8)", textTransform: "uppercase" }}>
                    Past Backfill ({result.pastDaysScanned} Days)
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: "#f59e0b", marginTop: "4px" }}>
                    {result.pastAbsentCount} Records
                  </div>
                  <div style={{ fontSize: "11px", color: "#10b981", marginTop: "2px" }}>
                    ৳{result.pastPenalties.toLocaleString()} Fines
                  </div>
                </div>
              </div>

              {/* Today's Absent Employee List */}
              {result.todayAbsentEmployees && result.todayAbsentEmployees.length > 0 && (
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted, #cbd5e1)", marginBottom: "8px" }}>
                    Employees Marked Absent for Today ({result.targetDate}):
                  </div>
                  <div
                    style={{
                      maxHeight: "130px",
                      overflowY: "auto",
                      backgroundColor: "rgba(0, 0, 0, 0.2)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      borderRadius: "8px",
                      padding: "6px"
                    }}
                  >
                    {result.todayAbsentEmployees.map((emp: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 10px",
                          borderBottom: idx !== result.todayAbsentEmployees.length - 1 ? "1px solid rgba(255, 255, 255, 0.04)" : "none",
                          fontSize: "12px"
                        }}
                      >
                        <span style={{ fontWeight: 500, color: "#ffffff" }}>
                          {emp.name} <span style={{ color: "#94a3b8", fontSize: "11px" }}>({emp.dutyTime})</span>
                        </span>
                        <span style={{ color: "#ef4444", fontWeight: 600 }}>
                          ৳{emp.penalty} Fine
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "10px",
            padding: "16px 24px",
            borderTop: "1px solid var(--border-main, rgba(255, 255, 255, 0.08))",
            backgroundColor: "rgba(0, 0, 0, 0.2)"
          }}
        >
          {!result ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                style={{
                  padding: "9px 16px",
                  backgroundColor: "transparent",
                  border: "1px solid var(--border-main, rgba(255, 255, 255, 0.15))",
                  borderRadius: "8px",
                  color: "var(--text-muted, #cbd5e1)",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: isLoading ? "not-allowed" : "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecute}
                disabled={isLoading}
                style={{
                  padding: "9px 18px",
                  backgroundColor: "#f59e0b",
                  backgroundImage: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#000000",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: isLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 2px 10px rgba(245, 158, 11, 0.35)"
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                    <span>Processing Office Off...</span>
                  </>
                ) : (
                  <>
                    <Moon size={16} />
                    <span>Turn Office Off Now</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "9px 16px",
                  backgroundColor: "transparent",
                  border: "1px solid var(--border-main, rgba(255, 255, 255, 0.15))",
                  borderRadius: "8px",
                  color: "#cbd5e1",
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={handleGoToAttendance}
                style={{
                  padding: "9px 18px",
                  backgroundColor: "#10b981",
                  backgroundImage: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <span>View Attendance Register</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
