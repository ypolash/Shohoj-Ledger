"use client";

import React, { useState, useEffect, useCallback } from "react";
import styles from "./settings.module.css";

interface AttendanceConfig {
  id?: string;
  shiftStart: string;
  shiftEnd: string;
  gracePeriod: number;
  fridayOff: boolean;
  enablePunishmentDeduction: boolean;
}

interface CompanySetting {
  id?: string;
  currency: string;
  timezone: string;
  shiftStartTime: string;
  shiftEndTime: string;
  gracePeriodMinutes: number;
  workingDays: string[];
  weeklyHolidays: string[];
}

interface WorkShift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  gracePeriod: number;
  breakTime: number;
  nightShift: boolean;
  isActive: boolean;
  _count?: { employees: number };
}

interface PunishmentSetting {
  id: string;
  type: string;
  fromMinutes: number;
  toMinutes: number;
  amount: number | string;
  active: boolean;
}

interface AllowedNetwork {
  id: string;
  name: string;
  ssid?: string | null;
  bssid?: string | null;
  ipAddress?: string | null;
  isActive: boolean;
}

interface LeavePolicy {
  id: string;
  accrualRate: number;
  maxBalance: number;
  carryForward: boolean;
  carryForwardLimit?: number | null;
  approvalLevels: number;
}

interface LeaveType {
  id: string;
  name: string;
  description?: string | null;
  isPaid: boolean;
  leavePolicies?: LeavePolicy[];
}

const ALL_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

export default function HRSettingsPage() {
  const [activeTab, setActiveTab] = useState<"office_time" | "geofence" | "penalties" | "leaves" | "general">("office_time");

  // Global Config States
  const [attendanceConfig, setAttendanceConfig] = useState<AttendanceConfig>({
    shiftStart: "09:00",
    shiftEnd: "18:00",
    gracePeriod: 15,
    fridayOff: true,
    enablePunishmentDeduction: false
  });

  const [companySetting, setCompanySetting] = useState<CompanySetting>({
    currency: "BDT",
    timezone: "Asia/Dhaka",
    shiftStartTime: "09:00",
    shiftEndTime: "18:00",
    gracePeriodMinutes: 15,
    workingDays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
    weeklyHolidays: ["Friday", "Saturday"]
  });

  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [punishmentRules, setPunishmentRules] = useState<PunishmentSetting[]>([]);
  const [networks, setNetworks] = useState<AllowedNetwork[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);

  // Telemetry & Extra Policies
  const [halfDayHours, setHalfDayHours] = useState<number>(4);
  const [fullDayHours, setFullDayHours] = useState<number>(8);
  const [autoCheckoutTime, setAutoCheckoutTime] = useState<string>("23:59");
  const [overtimeThresholdMins, setOvertimeThresholdMins] = useState<number>(30);
  const [geofenceRadius, setGeofenceRadius] = useState<number>(100);
  const [enforceWifi, setEnforceWifi] = useState<boolean>(true);
  const [payrollCutoffDay, setPayrollCutoffDay] = useState<number>(25);
  const [salaryDisbursalDay, setSalaryDisbursalDay] = useState<number>(1);
  const [probationMonths, setProbationMonths] = useState<number>(3);
  const [noticePeriodDays, setNoticePeriodDays] = useState<number>(30);
  const [onboardingMode, setOnboardingMode] = useState<"BASIC" | "PROFESSIONAL">("PROFESSIONAL");

  // Status & Feedback States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string>("");
  const [saveError, setSaveError] = useState<string>("");

  // Modals
  const [showShiftModal, setShowShiftModal] = useState<boolean>(false);
  const [shiftForm, setShiftForm] = useState({
    name: "",
    startTime: "09:00",
    endTime: "18:00",
    gracePeriod: 15,
    breakTime: 60,
    nightShift: false,
    isActive: true
  });
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);

  const [showNetworkModal, setShowNetworkModal] = useState<boolean>(false);
  const [networkForm, setNetworkForm] = useState({
    name: "",
    ssid: "",
    bssid: "",
    ipAddress: "",
    isActive: true
  });

  const [showRuleModal, setShowRuleModal] = useState<boolean>(false);
  const [isSavingRule, setIsSavingRule] = useState<boolean>(false);
  const [ruleError, setRuleError] = useState<string>("");
  const [ruleForm, setRuleForm] = useState({
    type: "LATE",
    fromMinutes: 16,
    toMinutes: 30,
    amount: 100,
    active: true
  });

  const [showLeaveModal, setShowLeaveModal] = useState<boolean>(false);
  const [leaveForm, setLeaveForm] = useState({
    name: "",
    description: "",
    isPaid: true,
    accrualRate: 12,
    maxBalance: 12,
    carryForward: false,
    carryForwardLimit: 0
  });

  // Fetch initial settings
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setSaveError("");
    try {
      const res = await fetch("/api/hr/settings", { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.data) {
        const { attendanceConfig: ac, companySetting: cs, workShifts: ws, punishmentSettings: ps, allowedNetworks: an, leaveTypes: lt, onboardingMode: om } = json.data;
        if (ac) setAttendanceConfig(ac);
        if (cs) {
          setCompanySetting({
            ...cs,
            workingDays: Array.isArray(cs.workingDays) ? cs.workingDays : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
            weeklyHolidays: Array.isArray(cs.weeklyHolidays) ? cs.weeklyHolidays : ["Friday", "Saturday"]
          });
        }
        if (ws) setWorkShifts(ws);
        if (ps) setPunishmentRules(ps);
        if (an) setNetworks(an);
        if (lt) setLeaveTypes(lt);
        if (om) setOnboardingMode(om);
      } else {
        setSaveError(json.error || "Failed to load HR settings.");
      }
    } catch (err: any) {
      setSaveError("Failed to communicate with HR settings server.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Handle Working Days Toggle
  const toggleWorkingDay = (day: string) => {
    const current = companySetting.workingDays || [];
    let updated: string[];
    if (current.includes(day)) {
      updated = current.filter(d => d !== day);
    } else {
      updated = [...current, day];
    }
    setCompanySetting(prev => ({ ...prev, workingDays: updated }));
  };

  // Handle Weekly Holidays Toggle
  const toggleWeeklyHoliday = (day: string) => {
    const current = companySetting.weeklyHolidays || [];
    let updated: string[];
    if (current.includes(day)) {
      updated = current.filter(d => d !== day);
    } else {
      updated = [...current, day];
    }
    const isFridayOff = updated.includes("Friday");
    setCompanySetting(prev => ({ ...prev, weeklyHolidays: updated }));
    setAttendanceConfig(prev => ({ ...prev, fridayOff: isFridayOff }));
  };

  // Save All Core Settings
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveSuccess("");
    setSaveError("");

    try {
      const payload = {
        shiftStart: attendanceConfig.shiftStart,
        shiftEnd: attendanceConfig.shiftEnd,
        gracePeriod: attendanceConfig.gracePeriod,
        fridayOff: attendanceConfig.fridayOff,
        enablePunishmentDeduction: attendanceConfig.enablePunishmentDeduction,
        currency: companySetting.currency,
        timezone: companySetting.timezone,
        workingDays: companySetting.workingDays,
        weeklyHolidays: companySetting.weeklyHolidays,
        onboardingMode
      };

      const res = await fetch("/api/hr/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        setSaveSuccess("HR and Office Timing configurations updated and synchronized successfully across system!");
        setTimeout(() => setSaveSuccess(""), 4500);
      } else {
        setSaveError(json.error || "Failed to update configurations.");
      }
    } catch {
      setSaveError("Network error while persisting settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- WORK SHIFTS HANDLERS ---
  const handleOpenShiftModal = (shift?: WorkShift) => {
    if (shift) {
      setEditingShiftId(shift.id);
      setShiftForm({
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        gracePeriod: shift.gracePeriod,
        breakTime: shift.breakTime,
        nightShift: shift.nightShift,
        isActive: shift.isActive
      });
    } else {
      setEditingShiftId(null);
      setShiftForm({
        name: "",
        startTime: attendanceConfig.shiftStart || "09:00",
        endTime: attendanceConfig.shiftEnd || "18:00",
        gracePeriod: attendanceConfig.gracePeriod || 15,
        breakTime: 60,
        nightShift: false,
        isActive: true
      });
    }
    setShowShiftModal(true);
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftForm.name.trim()) return;

    try {
      let res;
      if (editingShiftId) {
        res = await fetch(`/api/hr/shifts/${editingShiftId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(shiftForm)
        });
      } else {
        res = await fetch("/api/hr/shifts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(shiftForm)
        });
      }

      const json = await res.json();
      if (json.success) {
        setShowShiftModal(false);
        fetchSettings();
        setSaveSuccess(editingShiftId ? "Work shift modified." : "New work shift added successfully.");
        setTimeout(() => setSaveSuccess(""), 4000);
      } else {
        alert(json.error || "Failed to save shift");
      }
    } catch {
      alert("Error saving shift");
    }
  };

  const handleDeleteShift = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove the shift "${name}"?`)) return;
    try {
      const res = await fetch(`/api/hr/shifts/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchSettings();
      } else {
        alert(json.error || "Failed to delete shift");
      }
    } catch {
      alert("Error deleting shift");
    }
  };

  const handleToggleShiftActive = async (shift: WorkShift) => {
    try {
      const res = await fetch(`/api/hr/shifts/${shift.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !shift.isActive })
      });
      const json = await res.json();
      if (json.success) fetchSettings();
    } catch {
      alert("Failed to toggle shift status");
    }
  };

  // --- NETWORK HANDLERS ---
  const handleSaveNetwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!networkForm.name && !networkForm.ssid && !networkForm.ipAddress) {
      alert("Please provide at least a Network Name, SSID, or IP Address");
      return;
    }

    try {
      const res = await fetch("/api/attendance/networks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(networkForm)
      });
      const json = await res.json();
      if (json.success) {
        setShowNetworkModal(false);
        setNetworkForm({ name: "", ssid: "", bssid: "", ipAddress: "", isActive: true });
        fetchSettings();
        setSaveSuccess("Office Wi-Fi network registered.");
        setTimeout(() => setSaveSuccess(""), 4000);
      } else {
        alert(json.message || json.error || "Failed to save network");
      }
    } catch {
      alert("Error registering network");
    }
  };

  const handleDeleteNetwork = async (id: string) => {
    if (!confirm("Are you sure you want to delete this authorized network?")) return;
    try {
      const res = await fetch(`/api/attendance/networks/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) fetchSettings();
    } catch {
      alert("Error deleting network");
    }
  };

  const handleToggleNetworkActive = async (net: AllowedNetwork) => {
    try {
      await fetch(`/api/attendance/networks/${net.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !net.isActive })
      });
      fetchSettings();
    } catch {
      alert("Failed to update network status");
    }
  };

  // --- PUNISHMENT SLAB HANDLERS ---
  const handleOpenRuleModal = () => {
    setRuleForm({
      type: "LATE",
      fromMinutes: 16,
      toMinutes: 30,
      amount: 100,
      active: true
    });
    setRuleError("");
    setShowRuleModal(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingRule(true);
    setRuleError("");

    if (ruleForm.fromMinutes > ruleForm.toMinutes) {
      setRuleError("From Delay (Minutes) cannot be greater than To Delay (Minutes).");
      setIsSavingRule(false);
      return;
    }

    try {
      const res = await fetch("/api/staff/settings/punishments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ruleForm)
      });
      const json = await res.json();
      if (res.ok) {
        setShowRuleModal(false);
        const created = json.data || json;
        if (created && created.id) {
          setPunishmentRules(prev => {
            const filtered = prev.filter(r => r.id !== created.id);
            return [...filtered, created].sort((a, b) => (Number(a.fromMinutes) || 0) - (Number(b.fromMinutes) || 0));
          });
        }
        await fetchSettings();
        setSaveSuccess("Penalty deduction slab registered successfully.");
        setTimeout(() => setSaveSuccess(""), 4000);
      } else {
        setRuleError(json.error || "Failed to save penalty rule");
      }
    } catch (err: any) {
      setRuleError("Error saving penalty rule: " + (err.message || "Network error"));
    } finally {
      setIsSavingRule(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this penalty slab?")) return;
    try {
      setPunishmentRules(prev => prev.filter(r => r.id !== id));
      const res = await fetch(`/api/staff/settings/punishments/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSaveSuccess("Penalty slab deleted.");
        setTimeout(() => setSaveSuccess(""), 3000);
        fetchSettings();
      } else {
        const json = await res.json();
        alert(json.error || "Failed to delete rule");
        fetchSettings();
      }
    } catch {
      alert("Error deleting rule");
      fetchSettings();
    }
  };

  const handleToggleRuleActive = async (rule: PunishmentSetting) => {
    try {
      setPunishmentRules(prev => prev.map(r => r.id === rule.id ? { ...r, active: !r.active } : r));
      const res = await fetch(`/api/staff/settings/punishments/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !rule.active })
      });
      if (res.ok) {
        fetchSettings();
      } else {
        const json = await res.json();
        alert(json.error || "Failed to update rule status");
        fetchSettings();
      }
    } catch {
      alert("Error updating rule");
      fetchSettings();
    }
  };

  // --- LEAVE TYPE HANDLERS ---
  const handleSaveLeaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.name.trim()) return;

    try {
      const res = await fetch("/api/hr/settings/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leaveForm)
      });
      const json = await res.json();
      if (json.success) {
        setShowLeaveModal(false);
        setLeaveForm({ name: "", description: "", isPaid: true, accrualRate: 12, maxBalance: 12, carryForward: false, carryForwardLimit: 0 });
        fetchSettings();
        setSaveSuccess("New leave entitlement added.");
        setTimeout(() => setSaveSuccess(""), 4000);
      } else {
        alert(json.error || "Failed to save leave type");
      }
    } catch {
      alert("Error saving leave type");
    }
  };

  // Quick helper to format display hours
  const formatTimeDisplay = (timeStr: string) => {
    if (!timeStr) return "";
    const parts = timeStr.split(":");
    let h = parseInt(parts[0], 10);
    const m = parts[1] || "00";
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
  };

  return (
    <div className={styles.container}>
      {/* Executive Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerTopRow}>
          <div className={styles.titleGroup}>
            <div className={styles.liveBadgeRow}>
              <span className={styles.livePulseDot} />
              <span className={styles.categoryTag}>HR & Workforce Governance</span>
            </div>
            <h1 className={styles.pageTitle}>HR & Operational Settings</h1>
            <p className={styles.subtitle}>
              Configure master office time, daily work shifts, geofencing, punch penalty slabs, and annual leave quotas.
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              onClick={fetchSettings}
              className={styles.secondaryBtn}
              title="Refresh settings from server"
              disabled={isLoading || isSaving}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>sync</span>
              Refresh
            </button>

            <button
              onClick={handleSaveSettings}
              className={styles.primaryBtn}
              disabled={isLoading || isSaving}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                {isSaving ? "hourglass_empty" : "save"}
              </span>
              {isSaving ? "Saving Settings..." : "Save All Configurations"}
            </button>
          </div>
        </div>

        {/* Live Operational Schedule Telemetry Box */}
        <div className={styles.telemetryBox}>
          <div className={styles.telemetryLeft}>
            <span className={`material-symbols-outlined ${styles.telemetryIcon}`}>schedule</span>
            <div>
              <div className={styles.telemetryTextTitle}>
                Active Office Schedule: {formatTimeDisplay(attendanceConfig.shiftStart)} &ndash; {formatTimeDisplay(attendanceConfig.shiftEnd)}
              </div>
              <div className={styles.telemetryTextDesc}>
                {attendanceConfig.gracePeriod} min check-in grace period &bull; {companySetting.workingDays?.length || 5} Working Days / Week &bull; Weekly Off: {companySetting.weeklyHolidays?.join(", ") || "Friday"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span className={`${styles.badge} ${attendanceConfig.fridayOff ? styles.badgeActive : styles.badgeInactive}`}>
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                {attendanceConfig.fridayOff ? "verified" : "cancel"}
              </span>
              Friday Off: {attendanceConfig.fridayOff ? "Yes" : "No"}
            </span>
            <span className={`${styles.badge} ${attendanceConfig.enablePunishmentDeduction ? styles.badgeActive : styles.badgeInactive}`}>
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                {attendanceConfig.enablePunishmentDeduction ? "gavel" : "info"}
              </span>
              Late Deductions: {attendanceConfig.enablePunishmentDeduction ? "Active" : "Disabled"}
            </span>
            <span
              className={`${styles.badge} ${onboardingMode === "PROFESSIONAL" ? styles.badgeActive : ""}`}
              style={{
                background: onboardingMode === "BASIC" ? "rgba(245, 158, 11, 0.12)" : undefined,
                color: onboardingMode === "BASIC" ? "#f59e0b" : undefined,
                borderColor: onboardingMode === "BASIC" ? "rgba(245, 158, 11, 0.35)" : undefined,
                fontWeight: 700
              }}
              title="Current employee onboarding system mode"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                {onboardingMode === "BASIC" ? "bolt" : "workspace_premium"}
              </span>
              Intake Mode: {onboardingMode === "BASIC" ? "Basic (7 Fields)" : "Professional"}
            </span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {saveSuccess && (
        <div className={styles.alertSuccess}>
          <span className="material-symbols-outlined">check_circle</span>
          <span>{saveSuccess}</span>
        </div>
      )}
      {saveError && (
        <div className={styles.alertError}>
          <span className="material-symbols-outlined">error</span>
          <span>{saveError}</span>
        </div>
      )}

      {/* Segmented Sub-Navigation Tabs */}
      <div className={styles.tabsStrip}>
        <button
          className={`${styles.tabBtn} ${activeTab === "office_time" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("office_time")}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>schedule</span>
          Office Timings & Shifts
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === "geofence" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("geofence")}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>wifi_tethering</span>
          Geofencing & Networks
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === "penalties" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("penalties")}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>gavel</span>
          Penalty & Late Slabs
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === "leaves" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("leaves")}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>beach_access</span>
          Leave Policies & Quotas
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === "general" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("general")}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>tune</span>
          General HR & Payroll
        </button>
      </div>

      {/* =========================================================================
          TAB 1: OFFICE TIMINGS & SHIFTS (Office Time Set)
          ========================================================================= */}
      {activeTab === "office_time" && (
        <>
          {/* Default Office Hours Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleGroup}>
                <div className={styles.cardIcon}>
                  <span className="material-symbols-outlined">alarm</span>
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Master Office Timings & Punctuality</h2>
                  <p className={styles.cardSubtitle}>
                    Configure standard working shift hours, late arrival grace buffer, and half-day thresholds.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.grid3}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Office Start Time (HH:mm)
                  <span className={styles.labelHint}>{formatTimeDisplay(attendanceConfig.shiftStart)}</span>
                </label>
                <input
                  type="time"
                  className={styles.input}
                  value={attendanceConfig.shiftStart}
                  onChange={(e) => setAttendanceConfig({ ...attendanceConfig, shiftStart: e.target.value })}
                />
                <span className={styles.inputHelper}>Punctuality benchmark for all company employees</span>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Office End Time (HH:mm)
                  <span className={styles.labelHint}>{formatTimeDisplay(attendanceConfig.shiftEnd)}</span>
                </label>
                <input
                  type="time"
                  className={styles.input}
                  value={attendanceConfig.shiftEnd}
                  onChange={(e) => setAttendanceConfig({ ...attendanceConfig, shiftEnd: e.target.value })}
                />
                <span className={styles.inputHelper}>Shift completion time before overtime applies</span>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Grace Period (Minutes)
                  <span className={styles.labelHint}>+{attendanceConfig.gracePeriod}m allowed</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  className={styles.input}
                  value={attendanceConfig.gracePeriod}
                  onChange={(e) => setAttendanceConfig({ ...attendanceConfig, gracePeriod: parseInt(e.target.value) || 0 })}
                />
                <span className={styles.inputHelper}>Arrivals within grace period are marked On-Time</span>
              </div>
            </div>

            <div className={styles.grid3} style={{ marginTop: "4px" }}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Half-Day Minimum Hours</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  className={styles.input}
                  value={halfDayHours}
                  onChange={(e) => setHalfDayHours(parseInt(e.target.value) || 4)}
                />
                <span className={styles.inputHelper}>Under this threshold marked as Absent</span>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Full-Day Target Hours</label>
                <input
                  type="number"
                  min="4"
                  max="16"
                  className={styles.input}
                  value={fullDayHours}
                  onChange={(e) => setFullDayHours(parseInt(e.target.value) || 8)}
                />
                <span className={styles.inputHelper}>Standard expected logged operational hours</span>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Auto Check-Out Cutoff</label>
                <input
                  type="time"
                  className={styles.input}
                  value={autoCheckoutTime}
                  onChange={(e) => setAutoCheckoutTime(e.target.value)}
                />
                <span className={styles.inputHelper}>Auto-close open attendance shifts at midnight</span>
              </div>
            </div>
          </div>

          {/* Working Days & Weekly Holidays Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleGroup}>
                <div className={styles.cardIcon}>
                  <span className="material-symbols-outlined">calendar_month</span>
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Working Days & Weekly Holidays</h2>
                  <p className={styles.cardSubtitle}>
                    Select weekly office operating days. Attendance punches on weekly holidays will be logged as Off-Day Duty.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Company Working Days
                <span className={styles.labelHint}>{companySetting.workingDays?.length || 0} days active</span>
              </label>
              <div className={styles.dayPillGrid}>
                {ALL_DAYS.map((day) => {
                  const isWorking = companySetting.workingDays?.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWorkingDay(day)}
                      className={`${styles.dayPill} ${isWorking ? styles.dayPillActive : ""}`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                        {isWorking ? "check_circle" : "radio_button_unchecked"}
                      </span>
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.fieldGroup} style={{ marginTop: "12px" }}>
              <label className={styles.label}>
                Weekly Holidays (Off-Days)
                <span className={styles.labelHint}>{companySetting.weeklyHolidays?.join(", ") || "None"}</span>
              </label>
              <div className={styles.dayPillGrid}>
                {ALL_DAYS.map((day) => {
                  const isHoliday = companySetting.weeklyHolidays?.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWeeklyHoliday(day)}
                      className={`${styles.dayPill} ${isHoliday ? styles.dayPillActive : ""}`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                        {isHoliday ? "weekend" : "radio_button_unchecked"}
                      </span>
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Work Shifts Directory Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleGroup}>
                <div className={styles.cardIcon}>
                  <span className="material-symbols-outlined">badge</span>
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Custom Departmental Work Shifts</h2>
                  <p className={styles.cardSubtitle}>
                    Assign distinct shift schedules (Morning, General, Evening, Night) to departments or individual employees.
                  </p>
                </div>
              </div>

              <button onClick={() => handleOpenShiftModal()} className={styles.primaryBtn}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                Create Work Shift
              </button>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Shift Name</th>
                    <th className={styles.th}>Operating Timing</th>
                    <th className={styles.th}>Grace Buffer</th>
                    <th className={styles.th}>Break Duration</th>
                    <th className={styles.th}>Assigned Staff</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th} style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workShifts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={styles.td} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                        No customized shifts created yet. System defaults to the Master Office Timings above.
                      </td>
                    </tr>
                  ) : (
                    workShifts.map((shift) => (
                      <tr key={shift.id}>
                        <td className={styles.td}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontWeight: 700 }}>{shift.name}</span>
                            {shift.nightShift && (
                              <span className={`${styles.badge} ${styles.badgeNight}`}>
                                <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>bedtime</span>
                                Night Shift
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={styles.td} style={{ fontFamily: "monospace", color: "var(--primary)" }}>
                          {formatTimeDisplay(shift.startTime)} &ndash; {formatTimeDisplay(shift.endTime)}
                        </td>
                        <td className={styles.td}>{shift.gracePeriod} mins</td>
                        <td className={styles.td}>{shift.breakTime} mins</td>
                        <td className={styles.td}>
                          <span style={{ fontWeight: 600 }}>{shift._count?.employees || 0} employees</span>
                        </td>
                        <td className={styles.td}>
                          <button
                            onClick={() => handleToggleShiftActive(shift)}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                            title="Click to toggle status"
                          >
                            <span className={`${styles.badge} ${shift.isActive ? styles.badgeActive : styles.badgeInactive}`}>
                              {shift.isActive ? "Active" : "Disabled"}
                            </span>
                          </button>
                        </td>
                        <td className={styles.td} style={{ textAlign: "right" }}>
                          <div className={styles.actionBtnGroup} style={{ justifyContent: "flex-end" }}>
                            <button
                              onClick={() => handleOpenShiftModal(shift)}
                              className={styles.iconBtn}
                              title="Edit shift details"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteShift(shift.id, shift.name)}
                              className={`${styles.iconBtn} ${styles.deleteBtn}`}
                              title="Delete shift"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          TAB 2: GEOFENCING & ALLOWED NETWORKS
          ========================================================================= */}
      {activeTab === "geofence" && (
        <>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleGroup}>
                <div className={styles.cardIcon}>
                  <span className="material-symbols-outlined">wifi_lock</span>
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Mobile App Attendance & Geofencing</h2>
                  <p className={styles.cardSubtitle}>
                    Control whether staff can clock-in remotely via the Android app or only inside designated office boundaries.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className={styles.toggleRow} onClick={() => setEnforceWifi(!enforceWifi)}>
                <div className={styles.toggleInfo}>
                  <span className={styles.toggleTitle}>Enforce Office Wi-Fi Geofencing</span>
                  <span className={styles.toggleDesc}>
                    Require employees to be connected to an authorized office Wi-Fi network (SSID/BSSID) before check-in is approved.
                  </span>
                </div>
                <label className={styles.switch} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={enforceWifi}
                    onChange={(e) => setEnforceWifi(e.target.checked)}
                  />
                  <span className={styles.slider} />
                </label>
              </div>
            </div>

            <div className={styles.grid2} style={{ marginTop: "8px" }}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>GPS Geofence Radius (Meters)</label>
                <input
                  type="number"
                  min="20"
                  max="1000"
                  className={styles.input}
                  value={geofenceRadius}
                  onChange={(e) => setGeofenceRadius(parseInt(e.target.value) || 100)}
                />
                <span className={styles.inputHelper}>Maximum physical distance from office coordinates allowed for mobile punch</span>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Overtime Qualification Buffer (Minutes)</label>
                <input
                  type="number"
                  min="0"
                  max="180"
                  className={styles.input}
                  value={overtimeThresholdMins}
                  onChange={(e) => setOvertimeThresholdMins(parseInt(e.target.value) || 30)}
                />
                <span className={styles.inputHelper}>Minutes worked past shift end before overtime tracking starts</span>
              </div>
            </div>
          </div>

          {/* Allowed Networks Table */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleGroup}>
                <div className={styles.cardIcon}>
                  <span className="material-symbols-outlined">router</span>
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Authorized Office Wi-Fi & IP Networks</h2>
                  <p className={styles.cardSubtitle}>
                    Office Wi-Fi routers and static public IP addresses recognized by the mobile app telemetry engine.
                  </p>
                </div>
              </div>

              <button onClick={() => setShowNetworkModal(true)} className={styles.primaryBtn}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                Register Network
              </button>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Network Name</th>
                    <th className={styles.th}>SSID (Wi-Fi Name)</th>
                    <th className={styles.th}>BSSID (Router MAC)</th>
                    <th className={styles.th}>Public IP Address</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th} style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {networks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.td} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                        No authorized office networks registered. Staff can clock in from any connection if enforcement is disabled.
                      </td>
                    </tr>
                  ) : (
                    networks.map((net) => (
                      <tr key={net.id}>
                        <td className={styles.td} style={{ fontWeight: 600 }}>{net.name}</td>
                        <td className={styles.td}>
                          <span style={{ fontFamily: "monospace", color: "var(--primary)" }}>{net.ssid || "&mdash;"}</span>
                        </td>
                        <td className={styles.td} style={{ fontFamily: "monospace", fontSize: "12px" }}>
                          {net.bssid || "&mdash;"}
                        </td>
                        <td className={styles.td} style={{ fontFamily: "monospace" }}>
                          {net.ipAddress || "&mdash;"}
                        </td>
                        <td className={styles.td}>
                          <button
                            onClick={() => handleToggleNetworkActive(net)}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                            title="Click to toggle status"
                          >
                            <span className={`${styles.badge} ${net.isActive ? styles.badgeActive : styles.badgeInactive}`}>
                              {net.isActive ? "Authorized" : "Disabled"}
                            </span>
                          </button>
                        </td>
                        <td className={styles.td} style={{ textAlign: "right" }}>
                          <button
                            onClick={() => handleDeleteNetwork(net.id)}
                            className={`${styles.iconBtn} ${styles.deleteBtn}`}
                            title="Remove network"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          TAB 3: PENALTY & LATE FINES
          ========================================================================= */}
      {activeTab === "penalties" && (
        <>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleGroup}>
                <div className={styles.cardIcon}>
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Monetary Penalty Governance</h2>
                  <p className={styles.cardSubtitle}>
                    Enforce automatic disciplinary deductions during monthly payroll calculation based on punch telemetry.
                  </p>
                </div>
              </div>
            </div>

            <div
              className={styles.toggleRow}
              onClick={() => setAttendanceConfig({ ...attendanceConfig, enablePunishmentDeduction: !attendanceConfig.enablePunishmentDeduction })}
            >
              <div className={styles.toggleInfo}>
                <span className={styles.toggleTitle}>Enable Automated Payroll Deductions</span>
                <span className={styles.toggleDesc}>
                  When enabled, unexcused delays and absenteeism generate fine records applied to the monthly payslip.
                </span>
              </div>
              <label className={styles.switch} onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={attendanceConfig.enablePunishmentDeduction}
                  onChange={(e) => setAttendanceConfig({ ...attendanceConfig, enablePunishmentDeduction: e.target.checked })}
                />
                <span className={styles.slider} />
              </label>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleGroup}>
                <div className={styles.cardIcon}>
                  <span className="material-symbols-outlined">rule</span>
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Configured Penalty Slabs</h2>
                  <p className={styles.cardSubtitle}>
                    Tiered financial fines applied depending on minutes of arrival delay or unexcused departure.
                  </p>
                </div>
              </div>

              <button onClick={handleOpenRuleModal} className={styles.primaryBtn}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                Add Penalty Slab
              </button>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Violation Category</th>
                    <th className={styles.th}>Delay Range</th>
                    <th className={styles.th} style={{ textAlign: "right" }}>Fine Amount (৳)</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th} style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {punishmentRules.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={styles.td} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                        No penalty slabs defined yet. Click "+ Add Penalty Slab" to create tiered fine rules.
                      </td>
                    </tr>
                  ) : (
                    punishmentRules.map((rule) => (
                      <tr key={rule.id}>
                        <td className={styles.td}>
                          <span style={{ fontWeight: 600 }}>{rule.type.replace("_", " ")}</span>
                        </td>
                        <td className={styles.td}>
                          {rule.fromMinutes} to {rule.toMinutes} minutes delay
                        </td>
                        <td className={styles.td} style={{ textAlign: "right", fontWeight: 700, color: "var(--danger, #ef4444)" }}>
                          ৳{Number(rule.amount).toLocaleString()}
                        </td>
                        <td className={styles.td}>
                          <button
                            onClick={() => handleToggleRuleActive(rule)}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                          >
                            <span className={`${styles.badge} ${rule.active ? styles.badgeActive : styles.badgeInactive}`}>
                              {rule.active ? "Active" : "Disabled"}
                            </span>
                          </button>
                        </td>
                        <td className={styles.td} style={{ textAlign: "right" }}>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className={`${styles.iconBtn} ${styles.deleteBtn}`}
                            title="Delete rule"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          TAB 4: LEAVE POLICIES & QUOTAS
          ========================================================================= */}
      {activeTab === "leaves" && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleGroup}>
              <div className={styles.cardIcon}>
                <span className="material-symbols-outlined">event_available</span>
              </div>
              <div>
                <h2 className={styles.cardTitle}>Annual Leave Types & Quotas</h2>
                <p className={styles.cardSubtitle}>
                  Configure standard yearly leave allowances (Casual, Sick, Annual) and rollover policies.
                </p>
              </div>
            </div>

            <button onClick={() => setShowLeaveModal(true)} className={styles.primaryBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
              Add Leave Type
            </button>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Leave Category</th>
                  <th className={styles.th}>Compensation</th>
                  <th className={styles.th}>Yearly Allowance</th>
                  <th className={styles.th}>Max Balance</th>
                  <th className={styles.th}>Carry Forward</th>
                  <th className={styles.th}>Approval Chain</th>
                </tr>
              </thead>
              <tbody>
                {leaveTypes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.td} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                      No leave types configured.
                    </td>
                  </tr>
                ) : (
                  leaveTypes.map((type) => {
                    const policy = type.leavePolicies?.[0];
                    return (
                      <tr key={type.id}>
                        <td className={styles.td}>
                          <div>
                            <span style={{ fontWeight: 700 }}>{type.name}</span>
                            {type.description && (
                              <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "var(--text-muted)" }}>{type.description}</p>
                            )}
                          </div>
                        </td>
                        <td className={styles.td}>
                          <span className={`${styles.badge} ${type.isPaid ? styles.badgeActive : styles.badgeInactive}`}>
                            {type.isPaid ? "Paid Leave" : "Unpaid (LOP)"}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <span style={{ fontWeight: 700 }}>{policy ? Number(policy.accrualRate) : 0} days</span> / year
                        </td>
                        <td className={styles.td}>
                          {policy?.maxBalance ? `${Number(policy.maxBalance)} days max` : "Unlimited"}
                        </td>
                        <td className={styles.td}>
                          {policy?.carryForward ? (
                            <span className={`${styles.badge} ${styles.badgeActive}`}>
                              Up to {Number(policy.carryForwardLimit || 0)} days
                            </span>
                          ) : (
                            <span className={`${styles.badge} ${styles.badgeInactive}`}>Disabled</span>
                          )}
                        </td>
                        <td className={styles.td}>
                          <span>{policy?.approvalLevels || 1} Level (Manager &rarr; HR)</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: GENERAL HR & PREFERENCES
          ========================================================================= */}
      {activeTab === "general" && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleGroup}>
              <div className={styles.cardIcon}>
                <span className="material-symbols-outlined">settings_suggest</span>
              </div>
              <div>
                <h2 className={styles.cardTitle}>General HR & Payroll Preferences</h2>
                <p className={styles.cardSubtitle}>
                  Set platform timezone, default transaction currency, standard probation timeline, and monthly payroll cutoff date.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.grid2}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Base Currency</label>
              <select
                className={styles.input}
                value={companySetting.currency}
                onChange={(e) => setCompanySetting({ ...companySetting, currency: e.target.value })}
              >
                <option value="BDT">BDT &ndash; Bangladeshi Taka (৳)</option>
                <option value="USD">USD &ndash; US Dollar ($)</option>
                <option value="EUR">EUR &ndash; Euro (&euro;)</option>
                <option value="GBP">GBP &ndash; British Pound (&pound;)</option>
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Timezone</label>
              <select
                className={styles.input}
                value={companySetting.timezone}
                onChange={(e) => setCompanySetting({ ...companySetting, timezone: e.target.value })}
              >
                <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                <option value="UTC">UTC / GMT</option>
                <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
                <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
              </select>
            </div>
          </div>

          <div className={styles.grid3} style={{ marginTop: "6px" }}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Monthly Payroll Cutoff Day</label>
              <input
                type="number"
                min="1"
                max="31"
                className={styles.input}
                value={payrollCutoffDay}
                onChange={(e) => setPayrollCutoffDay(parseInt(e.target.value) || 25)}
              />
              <span className={styles.inputHelper}>Day of the month attendance is locked for salary computation</span>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Salary Disbursement Day</label>
              <input
                type="number"
                min="1"
                max="31"
                className={styles.input}
                value={salaryDisbursalDay}
                onChange={(e) => setSalaryDisbursalDay(parseInt(e.target.value) || 1)}
              />
              <span className={styles.inputHelper}>Target date for bank disbursements of previous month payroll</span>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Default Notice Period (Days)</label>
              <input
                type="number"
                min="0"
                max="180"
                className={styles.input}
                value={noticePeriodDays}
                onChange={(e) => setNoticePeriodDays(parseInt(e.target.value) || 30)}
              />
              <span className={styles.inputHelper}>Standard contractual resignation notice requirement</span>
            </div>
          </div>

          {/* Employee Data Collection System Switcher */}
          <div style={{ marginTop: "28px", paddingTop: "24px", borderTop: "1px solid var(--border-main)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>how_to_reg</span>
                  Employee Data Collection System Architecture
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
                  Choose how detailed new employee intake is across HR and Staff Management forms.
                </p>
              </div>
              <span style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "12px", background: "var(--surface-hover)", border: "1px solid var(--border-main)", color: "var(--text-muted)" }}>
                Active in: /erp/hr/employees/new
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              {/* BASIC CARD */}
              <div
                onClick={() => setOnboardingMode("BASIC")}
                style={{
                  padding: "20px",
                  borderRadius: "16px",
                  border: onboardingMode === "BASIC" ? "2px solid #f59e0b" : "1px solid var(--border-main)",
                  background: onboardingMode === "BASIC" ? "rgba(245, 158, 11, 0.05)" : "var(--surface-hover)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  position: "relative"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>bolt</span>
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text-main)" }}>Basic Mode</h4>
                      <span style={{ fontSize: "11px", color: "#f59e0b", fontWeight: 600 }}>Fast Onboarding (7 Fields)</span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="hr_onboarding_mode"
                    checked={onboardingMode === "BASIC"}
                    onChange={() => setOnboardingMode("BASIC")}
                    style={{ accentColor: "#f59e0b", width: "18px", height: "18px" }}
                  />
                </div>
                <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                  Collects only essential operational data to get a staff member working immediately.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {["Full Name", "Phone", "Email", "Address", "Salary", "Join Date", "Staff App PIN"].map((field) => (
                    <span key={field} style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "6px", background: "var(--surface-card)", border: "1px solid var(--border-main)", color: "var(--text-main)", fontWeight: 500 }}>
                      {field}
                    </span>
                  ))}
                </div>
              </div>

              {/* PROFESSIONAL CARD */}
              <div
                onClick={() => setOnboardingMode("PROFESSIONAL")}
                style={{
                  padding: "20px",
                  borderRadius: "16px",
                  border: onboardingMode === "PROFESSIONAL" ? "2px solid var(--primary)" : "1px solid var(--border-main)",
                  background: onboardingMode === "PROFESSIONAL" ? "rgba(37, 99, 235, 0.05)" : "var(--surface-hover)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  position: "relative"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(37, 99, 235, 0.15)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>workspace_premium</span>
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text-main)" }}>Professional Mode</h4>
                      <span style={{ fontSize: "11px", color: "var(--primary)", fontWeight: 600 }}>Enterprise Dossier (Complete)</span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="hr_onboarding_mode"
                    checked={onboardingMode === "PROFESSIONAL"}
                    onChange={() => setOnboardingMode("PROFESSIONAL")}
                    style={{ accentColor: "var(--primary)", width: "18px", height: "18px" }}
                  />
                </div>
                <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                  Full enterprise HR profile with academic degrees, prior work history, bank accounts, and family nominees.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {["Personal & Identity", "Demographics", "Bank & Payouts", "Education History", "Work Experience", "Emergency & Nominees"].map((field) => (
                    <span key={field} style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "6px", background: "var(--surface-card)", border: "1px solid var(--border-main)", color: "var(--text-main)", fontWeight: 500 }}>
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS
          ========================================================================= */}

      {/* 1. Work Shift Modal */}
      {showShiftModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowShiftModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingShiftId ? "Edit Work Shift Schedule" : "Create Work Shift Schedule"}
              </h3>
              <button
                type="button"
                onClick={() => setShowShiftModal(false)}
                className={styles.iconBtn}
                style={{ border: "none" }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveShift}>
              <div className={styles.modalBody}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Shift Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Morning Shift, Night Shift, General"
                    className={styles.input}
                    value={shiftForm.name}
                    onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                  />
                </div>

                <div className={styles.grid2}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Start Time (HH:mm) *</label>
                    <input
                      type="time"
                      required
                      className={styles.input}
                      value={shiftForm.startTime}
                      onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>End Time (HH:mm) *</label>
                    <input
                      type="time"
                      required
                      className={styles.input}
                      value={shiftForm.endTime}
                      onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.grid2}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Grace Buffer (Minutes)</label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      className={styles.input}
                      value={shiftForm.gracePeriod}
                      onChange={(e) => setShiftForm({ ...shiftForm, gracePeriod: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Break Duration (Minutes)</label>
                    <input
                      type="number"
                      min="0"
                      max="240"
                      className={styles.input}
                      value={shiftForm.breakTime}
                      onChange={(e) => setShiftForm({ ...shiftForm, breakTime: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "20px", marginTop: "8px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={shiftForm.nightShift}
                      onChange={(e) => setShiftForm({ ...shiftForm, nightShift: e.target.checked })}
                      style={{ width: "18px", height: "18px", accentColor: "var(--primary)" }}
                    />
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>Overnight / Crosses Midnight</span>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={shiftForm.isActive}
                      onChange={(e) => setShiftForm({ ...shiftForm, isActive: e.target.checked })}
                      style={{ width: "18px", height: "18px", accentColor: "var(--primary)" }}
                    />
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>Active for Scheduling</span>
                  </label>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowShiftModal(false)} className={styles.secondaryBtn}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  Save Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Office Wi-Fi / IP Modal */}
      {showNetworkModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowNetworkModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Register Authorized Office Wi-Fi</h3>
              <button
                type="button"
                onClick={() => setShowNetworkModal(false)}
                className={styles.iconBtn}
                style={{ border: "none" }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveNetwork}>
              <div className={styles.modalBody}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Location / Router Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Headquarters 4th Floor Wi-Fi"
                    className={styles.input}
                    value={networkForm.name}
                    onChange={(e) => setNetworkForm({ ...networkForm, name: e.target.value })}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>SSID (Wi-Fi Name)</label>
                  <input
                    type="text"
                    placeholder="e.g. Shohoj-Office-5G"
                    className={styles.input}
                    value={networkForm.ssid}
                    onChange={(e) => setNetworkForm({ ...networkForm, ssid: e.target.value })}
                  />
                  <span className={styles.inputHelper}>Exact Wi-Fi broadcast name matched by the mobile app</span>
                </div>

                <div className={styles.grid2}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>BSSID (Router MAC)</label>
                    <input
                      type="text"
                      placeholder="e.g. 00:1A:2B:3C:4D:5E"
                      className={styles.input}
                      value={networkForm.bssid}
                      onChange={(e) => setNetworkForm({ ...networkForm, bssid: e.target.value })}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Public IP Address</label>
                    <input
                      type="text"
                      placeholder="e.g. 103.114.22.5"
                      className={styles.input}
                      value={networkForm.ipAddress}
                      onChange={(e) => setNetworkForm({ ...networkForm, ipAddress: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowNetworkModal(false)} className={styles.secondaryBtn}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  Authorize Network
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Penalty Slab Modal */}
      {showRuleModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowRuleModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add Penalty Deduction Slab</h3>
              <button
                type="button"
                onClick={() => setShowRuleModal(false)}
                className={styles.iconBtn}
                style={{ border: "none" }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveRule}>
              <div className={styles.modalBody}>
                {ruleError && (
                  <div style={{
                    padding: "10px 14px",
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "8px",
                    color: "#f87171",
                    fontSize: "13px",
                    marginBottom: "14px"
                  }}>
                    {ruleError}
                  </div>
                )}

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Violation Type</label>
                  <select
                    className={styles.input}
                    value={ruleForm.type}
                    onChange={(e) => setRuleForm({ ...ruleForm, type: e.target.value })}
                  >
                    <option value="LATE">Late Arrival</option>
                    <option value="EARLY_LEAVE">Early Departure</option>
                    <option value="HALF_DAY">Half-Day Deduction</option>
                    <option value="ABSENT">Unexcused Absence (AWOL)</option>
                  </select>
                </div>

                <div className={styles.grid2}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>From Delay (Minutes)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      className={styles.input}
                      value={ruleForm.fromMinutes}
                      onChange={(e) => setRuleForm({ ...ruleForm, fromMinutes: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>To Delay (Minutes)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      className={styles.input}
                      value={ruleForm.toMinutes}
                      onChange={(e) => setRuleForm({ ...ruleForm, toMinutes: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Deduction Amount (৳) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 100"
                    className={styles.input}
                    value={ruleForm.amount}
                    onChange={(e) => setRuleForm({ ...ruleForm, amount: parseInt(e.target.value) || 0 })}
                  />
                  <span className={styles.inputHelper}>Monetary fine deducted from monthly salary</span>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowRuleModal(false)} className={styles.secondaryBtn} disabled={isSavingRule}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn} disabled={isSavingRule}>
                  {isSavingRule ? "Saving..." : "Save Penalty Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Leave Type Modal */}
      {showLeaveModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowLeaveModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add Leave Type & Quota</h3>
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className={styles.iconBtn}
                style={{ border: "none" }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveLeaveType}>
              <div className={styles.modalBody}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Category Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Study Leave, Paternity Leave"
                    className={styles.input}
                    value={leaveForm.name}
                    onChange={(e) => setLeaveForm({ ...leaveForm, name: e.target.value })}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Description</label>
                  <input
                    type="text"
                    placeholder="Brief guidelines for staff"
                    className={styles.input}
                    value={leaveForm.description}
                    onChange={(e) => setLeaveForm({ ...leaveForm, description: e.target.value })}
                  />
                </div>

                <div className={styles.grid2}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Annual Allowance (Days)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      className={styles.input}
                      value={leaveForm.accrualRate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, accrualRate: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Max Accumulation (Days)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      className={styles.input}
                      value={leaveForm.maxBalance}
                      onChange={(e) => setLeaveForm({ ...leaveForm, maxBalance: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={leaveForm.isPaid}
                      onChange={(e) => setLeaveForm({ ...leaveForm, isPaid: e.target.checked })}
                      style={{ width: "18px", height: "18px", accentColor: "var(--primary)" }}
                    />
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>Paid Leave (Staff receives full salary)</span>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={leaveForm.carryForward}
                      onChange={(e) => setLeaveForm({ ...leaveForm, carryForward: e.target.checked })}
                      style={{ width: "18px", height: "18px", accentColor: "var(--primary)" }}
                    />
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>Allow Carry-Forward to Next Year</span>
                  </label>

                  {leaveForm.carryForward && (
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Max Carry-Forward Days</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        className={styles.input}
                        value={leaveForm.carryForwardLimit}
                        onChange={(e) => setLeaveForm({ ...leaveForm, carryForwardLimit: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowLeaveModal(false)} className={styles.secondaryBtn}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  Add Leave Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
