"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Sliders,
  Shield,
  Mail,
  CreditCard,
  Radio,
  RefreshCw,
  Save,
  Download,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Globe,
  DollarSign,
  Clock,
  Key,
  Server,
  Sparkles,
  Layers,
  Zap,
} from "lucide-react";
import styles from "./settings.module.css";

export default function SuperAdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [initialSettings, setInitialSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"GENERAL" | "SECURITY" | "EMAIL" | "PAYMENTS" | "API">("GENERAL");

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/system/settings");
      if (res.status === 401) {
        window.location.href = "/super-admin/login";
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch platform settings");
      }
      const data = await res.json();
      setSettings(data.settings || {});
      setInitialSettings(data.settings || {});
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Error loading settings", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggle = (key: string) => {
    setSettings((prev) => {
      const current = prev[key] === "true";
      return { ...prev, [key]: current ? "false" : "true" };
    });
  };

  const isDirty = JSON.stringify(settings) !== JSON.stringify(initialSettings);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/system/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save configuration settings");
      }

      setInitialSettings({ ...settings });
      showToast("Platform configurations saved and propagated successfully");
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setSettings({ ...initialSettings });
    showToast("Unsaved changes discarded");
  };

  const handleExportConfig = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `shohoj_platform_config_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Platform configuration snapshot exported as JSON");
  };

  return (
    <div className={styles.pageContainer}>
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={styles.toast}
          style={{
            background:
              toastMessage.type === "success"
                ? "linear-gradient(135deg, #059669 0%, #10b981 100%)"
                : "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
            border: `1px solid ${toastMessage.type === "success" ? "#34d399" : "#f87171"}`,
          }}
        >
          {toastMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Executive Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.liveBadgeRow}>
            <span className={styles.livePulseDot}></span>
            <span className={styles.liveBadgeText}>GLOBAL PLATFORM CONFIGURATION &amp; GOVERNANCE</span>
          </div>
          <h1 className={styles.pageTitle}>
            <Settings size={28} color="#818cf8" />
            Platform Settings &amp; Governance
          </h1>
          <p className={styles.pageSubtitle}>
            Global multi-tenant platform configurations, security policies, authentication gateways, email SMTP, API rate limits, and compliance parameters.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            onClick={fetchSettings}
            disabled={loading}
            className={styles.refreshBtn}
            title="Refresh Settings"
          >
            <RefreshCw size={15} className={loading ? styles.spinning : ""} />
            Refresh
          </button>

          <button
            onClick={handleExportConfig}
            className={styles.refreshBtn}
            title="Export JSON Configuration"
          >
            <Download size={15} />
            Export Config
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving || !isDirty}
            className={styles.primaryActionBtn}
          >
            <Save size={16} />
            {saving ? "Propagating..." : isDirty ? "Save Configurations *" : "Saved & Synced"}
          </button>
        </div>
      </div>

      {/* 2. KPI Metric Cards Grid */}
      <div className={styles.kpiGrid}>
        {/* System SLA Status */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div
              className={styles.kpiIconBox}
              style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)" }}
            >
              <Zap size={22} color="#34d399" />
            </div>
            <span
              className={styles.kpiBadge}
              style={{ background: "rgba(16, 185, 129, 0.12)", color: "#a7f3d0" }}
            >
              <CheckCircle2 size={12} /> 99.98%
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>System Operational SLA</span>
            <span className={styles.kpiValue}>Production Live</span>
          </div>
        </div>

        {/* Security Posture */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div
              className={styles.kpiIconBox}
              style={{ background: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.3)" }}
            >
              <Shield size={22} color="#818cf8" />
            </div>
            <span
              className={styles.kpiBadge}
              style={{ background: "rgba(99, 102, 241, 0.12)", color: "#c7d2fe" }}
            >
              <Lock size={12} /> Hardened
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Security Policy</span>
            <span className={styles.kpiValue}>
              {settings.MFA_POLICY === "MANDATORY_ALL" ? "Strict MFA (All)" : "MFA Super Admin"}
            </span>
          </div>
        </div>

        {/* Global Rate Limit */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div
              className={styles.kpiIconBox}
              style={{ background: "rgba(6, 182, 212, 0.15)", border: "1px solid rgba(6, 182, 212, 0.3)" }}
            >
              <Radio size={22} color="#22d3ee" />
            </div>
            <span
              className={styles.kpiBadge}
              style={{ background: "rgba(6, 182, 212, 0.12)", color: "#a5f3fc" }}
            >
              <Server size={12} /> Protected
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Global Rate Limit</span>
            <span className={styles.kpiValue}>
              {settings.API_GLOBAL_RATE_LIMIT || "1000"} req/min
            </span>
          </div>
        </div>

        {/* Gateways Status */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div
              className={styles.kpiIconBox}
              style={{ background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.3)" }}
            >
              <CreditCard size={22} color="#fbbf24" />
            </div>
            <span
              className={styles.kpiBadge}
              style={{ background: "rgba(245, 158, 11, 0.12)", color: "#fef3c7" }}
            >
              <Sparkles size={12} /> Integrated
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Connected Gateways</span>
            <span className={styles.kpiValue}>4 Gateways Live</span>
          </div>
        </div>
      </div>

      {/* 3. Main Settings Governance Matrix */}
      <div className={styles.mainCard}>
        {/* Navigation Tabs */}
        <div className={styles.filterTabsRow}>
          <button
            onClick={() => setActiveTab("GENERAL")}
            className={`${styles.filterTabBtn} ${activeTab === "GENERAL" ? styles.filterTabBtnActive : ""}`}
          >
            <Globe size={15} />
            General &amp; Branding
          </button>
          <button
            onClick={() => setActiveTab("SECURITY")}
            className={`${styles.filterTabBtn} ${activeTab === "SECURITY" ? styles.filterTabBtnActive : ""}`}
          >
            <Shield size={15} />
            Security &amp; MFA
          </button>
          <button
            onClick={() => setActiveTab("EMAIL")}
            className={`${styles.filterTabBtn} ${activeTab === "EMAIL" ? styles.filterTabBtnActive : ""}`}
          >
            <Mail size={15} />
            Email &amp; Notifications
          </button>
          <button
            onClick={() => setActiveTab("PAYMENTS")}
            className={`${styles.filterTabBtn} ${activeTab === "PAYMENTS" ? styles.filterTabBtnActive : ""}`}
          >
            <CreditCard size={15} />
            Payment Gateways
          </button>
          <button
            onClick={() => setActiveTab("API")}
            className={`${styles.filterTabBtn} ${activeTab === "API" ? styles.filterTabBtnActive : ""}`}
          >
            <Radio size={15} />
            API &amp; Telemetry
          </button>
        </div>

        {/* Tab 1: General & Platform Identity */}
        {activeTab === "GENERAL" && (
          <div className={styles.settingsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Globe size={18} color="#818cf8" />
                Platform Identity &amp; Regional Defaults
              </h2>
              <p className={styles.sectionDesc}>
                Configure canonical endpoints, multi-tenant branding names, default currencies, and global maintenance states.
              </p>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Platform Brand Name</label>
                <input
                  type="text"
                  value={settings.PLATFORM_NAME || ""}
                  onChange={(e) => handleChange("PLATFORM_NAME", e.target.value)}
                  className={styles.formInput}
                />
                <span className={styles.formHelper}>Displayed in tenant dashboards and invoices.</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Primary Canonical URL</label>
                <input
                  type="text"
                  value={settings.PLATFORM_URL || ""}
                  onChange={(e) => handleChange("PLATFORM_URL", e.target.value)}
                  className={styles.formInput}
                />
                <span className={styles.formHelper}>Root production domain for OAuth callbacks and links.</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Global Support Contact Email</label>
                <input
                  type="email"
                  value={settings.SUPPORT_EMAIL || ""}
                  onChange={(e) => handleChange("SUPPORT_EMAIL", e.target.value)}
                  className={styles.formInput}
                />
                <span className={styles.formHelper}>Public point of contact for customer escalations.</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Default Platform Currency</label>
                <select
                  value={settings.DEFAULT_CURRENCY || "BDT"}
                  onChange={(e) => handleChange("DEFAULT_CURRENCY", e.target.value)}
                  className={styles.formInput}
                >
                  <option value="BDT">BDT - Bangladeshi Taka (৳)</option>
                  <option value="USD">USD - US Dollar ($)</option>
                  <option value="EUR">EUR - Euro (€)</option>
                  <option value="GBP">GBP - British Pound (£)</option>
                  <option value="AED">AED - UAE Dirham (د.إ)</option>
                  <option value="SAR">SAR - Saudi Riyal (﷼)</option>
                  <option value="INR">INR - Indian Rupee (₹)</option>
                </select>
                <span className={styles.formHelper}>Default fallback currency for unassigned tenant ledgers.</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>System Timezone</label>
                <select
                  value={settings.TIMEZONE || "Asia/Dhaka"}
                  onChange={(e) => handleChange("TIMEZONE", e.target.value)}
                  className={styles.formInput}
                >
                  <option value="Asia/Dhaka">Asia/Dhaka (GMT+6:00)</option>
                  <option value="UTC">UTC (GMT+0:00)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                </select>
                <span className={styles.formHelper}>Used for automated cron jobs and ledger period closures.</span>
              </div>
            </div>

            <div className={styles.formSwitchRow}>
              <div className={styles.switchInfo}>
                <span className={styles.switchTitle}>Platform Maintenance Mode</span>
                <span className={styles.switchDesc}>
                  Locks out tenant users while allowing Super Admin access during emergency database migrations.
                </span>
              </div>
              <label className={styles.switchToggle}>
                <input
                  type="checkbox"
                  checked={settings.MAINTENANCE_MODE === "true"}
                  onChange={() => handleToggle("MAINTENANCE_MODE")}
                />
                <span className={styles.switchSlider}></span>
              </label>
            </div>

            {settings.MAINTENANCE_MODE === "true" && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Maintenance Notice Banner Message</label>
                <textarea
                  rows={2}
                  value={settings.MAINTENANCE_NOTICE || ""}
                  onChange={(e) => handleChange("MAINTENANCE_NOTICE", e.target.value)}
                  className={styles.formInput}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Security & Authentication */}
        {activeTab === "SECURITY" && (
          <div className={styles.settingsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Shield size={18} color="#818cf8" />
                Security Policies &amp; Access Controls
              </h2>
              <p className={styles.sectionDesc}>
                Configure multi-factor authentication requirements, session expiry, brute-force protection, and isolation boundaries.
              </p>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>MFA Enforcement Policy</label>
                <select
                  value={settings.MFA_POLICY || "MANDATORY_SUPER_ADMIN"}
                  onChange={(e) => handleChange("MFA_POLICY", e.target.value)}
                  className={styles.formInput}
                >
                  <option value="MANDATORY_ALL">Mandatory for All Users (Enterprise Strict)</option>
                  <option value="MANDATORY_SUPER_ADMIN">Mandatory for Super Admins Only</option>
                  <option value="OPTIONAL">Optional / User Discretion</option>
                </select>
                <span className={styles.formHelper}>Requires TOTP Authenticator app on authentication.</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Inactive Session Timeout (Minutes)</label>
                <input
                  type="number"
                  min="15"
                  max="1440"
                  value={settings.SESSION_TIMEOUT_MINUTES || "60"}
                  onChange={(e) => handleChange("SESSION_TIMEOUT_MINUTES", e.target.value)}
                  className={styles.formInput}
                />
                <span className={styles.formHelper}>Automatically invalidates idle JWT tokens.</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Max Login Attempts Before Lockout</label>
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={settings.MAX_LOGIN_ATTEMPTS || "5"}
                  onChange={(e) => handleChange("MAX_LOGIN_ATTEMPTS", e.target.value)}
                  className={styles.formInput}
                />
                <span className={styles.formHelper}>Temporary 15-minute IP lock on consecutive credential failures.</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Minimum Password Length</label>
                <input
                  type="number"
                  min="8"
                  max="32"
                  value={settings.PASSWORD_MIN_LENGTH || "10"}
                  onChange={(e) => handleChange("PASSWORD_MIN_LENGTH", e.target.value)}
                  className={styles.formInput}
                />
                <span className={styles.formHelper}>Enforces strong passwords with uppercase, numbers, and symbols.</span>
              </div>
            </div>

            <div className={styles.formSwitchRow}>
              <div className={styles.switchInfo}>
                <span className={styles.switchTitle}>Multi-Tenant Strict Schema Isolation</span>
                <span className={styles.switchDesc}>
                  Enforces strict tenant boundary verification on all Prisma database queries to prevent data leaks.
                </span>
              </div>
              <label className={styles.switchToggle}>
                <input
                  type="checkbox"
                  checked={settings.MULTI_TENANT_STRICT_ISOLATION === "true"}
                  onChange={() => handleToggle("MULTI_TENANT_STRICT_ISOLATION")}
                />
                <span className={styles.switchSlider}></span>
              </label>
            </div>
          </div>
        )}

        {/* Tab 3: Email & Communication */}
        {activeTab === "EMAIL" && (
          <div className={styles.settingsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Mail size={18} color="#818cf8" />
                Transactional Email &amp; WhatsApp Gateways
              </h2>
              <p className={styles.sectionDesc}>
                Configure outbound SMTP credentials, sender addresses, and WhatsApp Business API integrations.
              </p>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>SMTP Host Relay</label>
                <input
                  type="text"
                  placeholder="e.g. smtp.sendgrid.net"
                  value={settings.SMTP_HOST || ""}
                  onChange={(e) => handleChange("SMTP_HOST", e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>SMTP Port</label>
                <input
                  type="text"
                  placeholder="587"
                  value={settings.SMTP_PORT || "587"}
                  onChange={(e) => handleChange("SMTP_PORT", e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>SMTP Username / API Key</label>
                <input
                  type="text"
                  placeholder="apikey"
                  value={settings.SMTP_USER || ""}
                  onChange={(e) => handleChange("SMTP_USER", e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Sender Display Name</label>
                <input
                  type="text"
                  placeholder="Shohoj Ledger Notifications"
                  value={settings.SMTP_SENDER_NAME || ""}
                  onChange={(e) => handleChange("SMTP_SENDER_NAME", e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Outbound Sender Email Address</label>
                <input
                  type="email"
                  placeholder="noreply@shohojledger.com"
                  value={settings.SMTP_SENDER_EMAIL || ""}
                  onChange={(e) => handleChange("SMTP_SENDER_EMAIL", e.target.value)}
                  className={styles.formInput}
                />
              </div>
            </div>

            <div className={styles.formSwitchRow}>
              <div className={styles.switchInfo}>
                <span className={styles.switchTitle}>WhatsApp Business API Notifications</span>
                <span className={styles.switchDesc}>
                  Enables automated invoice dispatch and customer payment reminders via verified WhatsApp channels.
                </span>
              </div>
              <label className={styles.switchToggle}>
                <input
                  type="checkbox"
                  checked={settings.WHATSAPP_ENABLED === "true"}
                  onChange={() => handleToggle("WHATSAPP_ENABLED")}
                />
                <span className={styles.switchSlider}></span>
              </label>
            </div>
          </div>
        )}

        {/* Tab 4: Payment Gateways */}
        {activeTab === "PAYMENTS" && (
          <div className={styles.settingsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <CreditCard size={18} color="#818cf8" />
                Payment Gateways &amp; Merchant Webhooks
              </h2>
              <p className={styles.sectionDesc}>
                Manage active subscription billing gateways for Bangladesh and international credit cards.
              </p>
            </div>

            <div className={styles.formSwitchRow}>
              <div className={styles.switchInfo}>
                <span className={styles.switchTitle}>bKash Merchant Checkout API</span>
                <span className={styles.switchDesc}>
                  Direct bKash tokenized payment integration for automated invoice settlement.
                </span>
              </div>
              <label className={styles.switchToggle}>
                <input
                  type="checkbox"
                  checked={settings.BKASH_MERCHANT_ENABLED === "true"}
                  onChange={() => handleToggle("BKASH_MERCHANT_ENABLED")}
                />
                <span className={styles.switchSlider}></span>
              </label>
            </div>

            <div className={styles.formSwitchRow}>
              <div className={styles.switchInfo}>
                <span className={styles.switchTitle}>Nagad Direct Merchant Gateway</span>
                <span className={styles.switchDesc}>
                  Direct Nagad digital payment processor for enterprise subscriptions.
                </span>
              </div>
              <label className={styles.switchToggle}>
                <input
                  type="checkbox"
                  checked={settings.NAGAD_MERCHANT_ENABLED === "true"}
                  onChange={() => handleToggle("NAGAD_MERCHANT_ENABLED")}
                />
                <span className={styles.switchSlider}></span>
              </label>
            </div>

            <div className={styles.formSwitchRow}>
              <div className={styles.switchInfo}>
                <span className={styles.switchTitle}>Stripe Global Credit Card Processor</span>
                <span className={styles.switchDesc}>
                  International Visa, MasterCard, and Amex multi-currency subscription processor.
                </span>
              </div>
              <label className={styles.switchToggle}>
                <input
                  type="checkbox"
                  checked={settings.STRIPE_BILLING_ENABLED === "true"}
                  onChange={() => handleToggle("STRIPE_BILLING_ENABLED")}
                />
                <span className={styles.switchSlider}></span>
              </label>
            </div>
          </div>
        )}

        {/* Tab 5: API & Telemetry */}
        {activeTab === "API" && (
          <div className={styles.settingsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Radio size={18} color="#818cf8" />
                API Rate Limiting &amp; Telemetry Retention
              </h2>
              <p className={styles.sectionDesc}>
                Configure global throughput thresholds, WebSocket streaming, and compliance data retention periods.
              </p>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Global Rate Limit (Requests / Min / IP)</label>
                <input
                  type="number"
                  min="100"
                  max="10000"
                  step="100"
                  value={settings.API_GLOBAL_RATE_LIMIT || "1000"}
                  onChange={(e) => handleChange("API_GLOBAL_RATE_LIMIT", e.target.value)}
                  className={styles.formInput}
                />
                <span className={styles.formHelper}>Enforces DDoS resilience and noisy neighbor mitigation.</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Audit Log Retention Period</label>
                <select
                  value={settings.AUDIT_RETENTION_DAYS || "365"}
                  onChange={(e) => handleChange("AUDIT_RETENTION_DAYS", e.target.value)}
                  className={styles.formInput}
                >
                  <option value="90">90 Days</option>
                  <option value="180">180 Days</option>
                  <option value="365">1 Year (Standard Enterprise)</option>
                  <option value="1095">3 Years</option>
                  <option value="2555">7 Years (Financial Compliance)</option>
                </select>
                <span className={styles.formHelper}>Audit trail entries older than this window are compressed into cold storage.</span>
              </div>
            </div>

            <div className={styles.formSwitchRow}>
              <div className={styles.switchInfo}>
                <span className={styles.switchTitle}>Real-Time WebSocket Telemetry Broadcasting</span>
                <span className={styles.switchDesc}>
                  Streams live server health, cashier transaction events, and audit logs to the Super Admin mission control.
                </span>
              </div>
              <label className={styles.switchToggle}>
                <input
                  type="checkbox"
                  checked={settings.TELEMETRY_STREAMING === "true"}
                  onChange={() => handleToggle("TELEMETRY_STREAMING")}
                />
                <span className={styles.switchSlider}></span>
              </label>
            </div>
          </div>
        )}

        {/* Sticky Save Bar */}
        {isDirty && (
          <div className={styles.saveBarSticky}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Sparkles size={18} color="#818cf8" />
              <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#ffffff" }}>
                You have unsaved configuration changes.
              </span>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleDiscard}
                className={styles.refreshBtn}
                style={{ padding: "8px 14px", fontSize: "12.5px" }}
              >
                Discard
              </button>
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className={styles.primaryActionBtn}
                style={{ padding: "8px 18px", fontSize: "12.5px" }}
              >
                <Save size={14} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
