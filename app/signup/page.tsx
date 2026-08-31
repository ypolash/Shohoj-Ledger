"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

const MODULES = [
  { id: "finance", label: "Finance & Accounting" },
  { id: "hr", label: "HR & Attendance" },
  { id: "payroll", label: "Payroll Processing" },
  { id: "crm", label: "CRM & Sales Orders" },
  { id: "inventory", label: "Inventory & Warehouses" },
  { id: "procurement", label: "Procurement & Suppliers" }
];

const INDUSTRY_TEMPLATES = [
  { id: "it", name: "IT & Software Agency", icon: "terminal", desc: "Engineering, QA, Design & Projects" },
  { id: "retail", name: "Retail & E-Commerce", icon: "shopping_cart", desc: "Store Ops, POS, Inventory & Orders" },
  { id: "manufacturing", name: "Manufacturing & Factory", icon: "factory", desc: "Production, Quality, Maintenance & Supply" },
  { id: "wholesale", name: "Wholesale & Distribution", icon: "local_shipping", desc: "Supply Chain, Logistics & Fleet" },
  { id: "healthcare", name: "Healthcare & Pharmacy", icon: "medical_services", desc: "Clinical, Dispensing & Billing" },
  { id: "consulting", name: "Consulting & Services", icon: "business_center", desc: "Advisory, Engagements & Client Billing" }
];

/**
 * Onboarding 2.0 (Signup Wizard)
 * 4-Step streamlined enterprise onboarding flow.
 */
export default function SignupPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{ companyName: string; ownerEmail: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    companyName: "",
    companyEmail: "",
    phone: "",
    logoUrl: "",
    businessType: "Product",
    industryTemplate: "it",
    selectedModules: ["finance", "crm", "inventory", "hr", "payroll"],
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
    confirmPassword: "",
    agreeToRules: false
  });

  const updateForm = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
    setApiError(null);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        updateForm("logoUrl", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleModuleToggle = (moduleId: string) => {
    setFormData((prev) => {
      const current = prev.selectedModules;
      if (current.includes(moduleId)) {
        return { ...prev, selectedModules: current.filter((id) => id !== moduleId) };
      } else {
        return { ...prev, selectedModules: [...current, moduleId] };
      }
    });
    setFieldErrors((prev) => ({ ...prev, selectedModules: "" }));
  };

  // Password Requirement Checks
  const hasLength = formData.ownerPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(formData.ownerPassword);
  const hasLower = /[a-z]/.test(formData.ownerPassword);
  const hasNumber = /\d/.test(formData.ownerPassword);
  const isPasswordValid = hasLength && hasUpper && hasLower && hasNumber;

  const validateStep = () => {
    const errors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.companyName.trim()) errors.companyName = "Company Name is required.";
      if (!formData.companyEmail.trim()) {
        errors.companyEmail = "Company Email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.companyEmail)) {
        errors.companyEmail = "Invalid company email format.";
      }
    } else if (step === 2) {
      if (formData.selectedModules.length === 0) {
        errors.selectedModules = "Please select at least one module.";
      }
    } else if (step === 3) {
      if (!formData.ownerName.trim()) errors.ownerName = "Owner Name is required.";
      if (!formData.ownerEmail.trim()) {
        errors.ownerEmail = "Owner Email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail)) {
        errors.ownerEmail = "Invalid email format.";
      }
      if (!formData.ownerPassword) {
        errors.ownerPassword = "Password is required.";
      } else if (!isPasswordValid) {
        errors.ownerPassword = "Password does not satisfy all security requirements.";
      }
      if (formData.ownerPassword !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match.";
      }
      if (!formData.agreeToRules) {
        errors.agreeToRules = "You must agree to Workspace Rules & Terms.";
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length > 0;
  };

  const handleNext = () => {
    if (validateStep()) return;
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setApiError(null);
    setFieldErrors({});
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setApiError(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: formData.companyName,
          businessType: formData.businessType,
          industryTemplate: formData.industryTemplate,
          selectedModules: formData.selectedModules,
          ownerName: formData.ownerName,
          ownerEmail: formData.ownerEmail,
          ownerPasswordRaw: formData.ownerPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "A validation error occurred. Please check your details.");
      }

      setSuccessData({
        companyName: data.data?.companyName || formData.companyName,
        ownerEmail: data.data?.ownerEmail || formData.ownerEmail
      });
      setIsSuccess(true);
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess && successData) {
    return (
      <main className={styles.container}>
        <div className={styles.card} style={{ alignItems: "center", textAlign: "center" }}>
          <div className={styles.checkIconLarge} />
          <h1 className={styles.title} style={{ marginTop: "1.5rem" }}>Workspace Created!</h1>
          <p className={styles.subtitle} style={{ marginBottom: "2rem" }}>
            Your enterprise environment has been successfully provisioned.
          </p>

          <div className={styles.summary} style={{ width: "100%", marginBottom: "2rem" }}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Company Name</span>
              <span className={styles.summaryValue}>{successData.companyName}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Root Admin</span>
              <span className={styles.summaryValue}>{successData.ownerEmail}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", width: "100%" }}>
            <Link href="/login" className={styles.btnSecondary} style={{ flex: 1, textAlign: "center", textDecoration: "none" }}>
              Go to Login
            </Link>
            <Link href="/erp" className={styles.btnPrimary} style={{ flex: 1, textAlign: "center", textDecoration: "none" }}>
              Open ERP Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const activeTemplate = INDUSTRY_TEMPLATES.find((t) => t.id === formData.industryTemplate) || INDUSTRY_TEMPLATES[0];

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome to Shohoj Ledger</h1>
          <p className={styles.subtitle}>Set up your enterprise workspace in minutes</p>
        </div>

        {/* 4-Step Progress Indicator */}
        <div className={styles.progressContainer}>
          <div className={styles.progressLine} />
          <div
            className={styles.progressFill}
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`${styles.stepDot} ${step === i ? styles.active : step > i ? styles.completed : ""}`}
            >
              {step > i ? "✓" : i}
            </div>
          ))}
        </div>

        {apiError && <div className={styles.error} style={{ marginBottom: "1rem" }}>{apiError}</div>}

        <div className={styles.form}>
          {/* Step 1: Company Info, Logo Picker & Business Type */}
          {step === 1 && (
            <>
              <h2 className={styles.stepTitle}>1. Company Profile & Business Model</h2>
              
              {/* Company Logo Image Picker */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Company Logo (Optional)</label>
                <div
                  className={styles.logoPickerContainer}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    style={{ display: "none" }}
                  />
                  <div className={styles.logoPreviewBox}>
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Logo" className={styles.logoImg} />
                    ) : (
                      <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "var(--text-muted)" }}>
                        add_photo_alternate
                      </span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff" }}>
                      {formData.logoUrl ? "Change Company Logo" : "Upload Company Logo"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                      PNG, JPG, or SVG up to 2MB. Displayed on invoices & reports.
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.grid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Company Name *</label>
                  <input
                    type="text"
                    className={`${styles.input} ${fieldErrors.companyName ? styles.inputError : ""}`}
                    value={formData.companyName}
                    onChange={(e) => updateForm("companyName", e.target.value)}
                    placeholder="e.g. Sarah Calcium Industries"
                  />
                  {fieldErrors.companyName && <span className={styles.fieldError}>{fieldErrors.companyName}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Company Email *</label>
                  <input
                    type="email"
                    className={`${styles.input} ${fieldErrors.companyEmail ? styles.inputError : ""}`}
                    value={formData.companyEmail}
                    onChange={(e) => updateForm("companyEmail", e.target.value)}
                    placeholder="contact@company.com"
                  />
                  {fieldErrors.companyEmail && <span className={styles.fieldError}>{fieldErrors.companyEmail}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Phone Number</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.phone}
                    onChange={(e) => updateForm("phone", e.target.value)}
                    placeholder="+880 17..."
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Business Type *</label>
                  <select
                    className={styles.select}
                    value={formData.businessType}
                    onChange={(e) => updateForm("businessType", e.target.value)}
                  >
                    <option value="Product">Product Based</option>
                    <option value="Service">Service Based</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Step 2: Merged Modules & Prebuilt Industry Templates */}
          {step === 2 && (
            <>
              <h2 className={styles.stepTitle}>2. Industry Template & ERP Modules</h2>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Choose Industry Preset</label>
                <div className={styles.templateGrid}>
                  {INDUSTRY_TEMPLATES.map((tmpl) => (
                    <div
                      key={tmpl.id}
                      className={`${styles.templateCard} ${formData.industryTemplate === tmpl.id ? styles.selected : ""}`}
                      onClick={() => updateForm("industryTemplate", tmpl.id)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "28px", color: formData.industryTemplate === tmpl.id ? "#4facfe" : "#94a3b8" }}>
                        {tmpl.icon}
                      </span>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>{tmpl.name}</div>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>{tmpl.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup} style={{ marginTop: "1rem" }}>
                <label className={styles.label}>Enabled ERP Modules</label>
                {fieldErrors.selectedModules && <div className={styles.error} style={{ marginBottom: "0.5rem" }}>{fieldErrors.selectedModules}</div>}
                <div className={styles.checkboxGrid}>
                  {MODULES.map((mod) => (
                    <label
                      key={mod.id}
                      className={`${styles.checkboxLabel} ${formData.selectedModules.includes(mod.id) ? styles.selected : ""}`}
                    >
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={formData.selectedModules.includes(mod.id)}
                        onChange={() => handleModuleToggle(mod.id)}
                      />
                      {mod.label}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 3: Owner Account, Live Password Rules & Terms Agreement */}
          {step === 3 && (
            <>
              <h2 className={styles.stepTitle}>3. Administrator Account & Security</h2>
              <div className={styles.grid}>
                <div className={`${styles.formGroup} ${styles.full}`}>
                  <label className={styles.label}>Full Name *</label>
                  <input
                    type="text"
                    className={`${styles.input} ${fieldErrors.ownerName ? styles.inputError : ""}`}
                    value={formData.ownerName}
                    onChange={(e) => updateForm("ownerName", e.target.value)}
                    placeholder="e.g. John Doe"
                  />
                  {fieldErrors.ownerName && <span className={styles.fieldError}>{fieldErrors.ownerName}</span>}
                </div>

                <div className={`${styles.formGroup} ${styles.full}`}>
                  <label className={styles.label}>Login Email Address *</label>
                  <input
                    type="email"
                    className={`${styles.input} ${fieldErrors.ownerEmail ? styles.inputError : ""}`}
                    value={formData.ownerEmail}
                    onChange={(e) => updateForm("ownerEmail", e.target.value)}
                    placeholder="john@company.com"
                  />
                  {fieldErrors.ownerEmail && <span className={styles.fieldError}>{fieldErrors.ownerEmail}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Password *</label>
                  <input
                    type="password"
                    className={`${styles.input} ${fieldErrors.ownerPassword ? styles.inputError : ""}`}
                    value={formData.ownerPassword}
                    onChange={(e) => updateForm("ownerPassword", e.target.value)}
                    placeholder="••••••••"
                  />
                  {fieldErrors.ownerPassword && <span className={styles.fieldError}>{fieldErrors.ownerPassword}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Confirm Password *</label>
                  <input
                    type="password"
                    className={`${styles.input} ${fieldErrors.confirmPassword ? styles.inputError : ""}`}
                    value={formData.confirmPassword}
                    onChange={(e) => updateForm("confirmPassword", e.target.value)}
                    placeholder="••••••••"
                  />
                  {fieldErrors.confirmPassword && <span className={styles.fieldError}>{fieldErrors.confirmPassword}</span>}
                </div>
              </div>

              {/* Live Password Rules Checklist */}
              <div className={styles.passwordRules}>
                <div className={`${styles.ruleItem} ${hasLength ? styles.satisfied : ""}`}>
                  <span className={styles.ruleDot} />
                  <span>{hasLength ? "✓ " : ""}8+ Characters</span>
                </div>
                <div className={`${styles.ruleItem} ${hasUpper ? styles.satisfied : ""}`}>
                  <span className={styles.ruleDot} />
                  <span>{hasUpper ? "✓ " : ""}One Uppercase Letter (A-Z)</span>
                </div>
                <div className={`${styles.ruleItem} ${hasLower ? styles.satisfied : ""}`}>
                  <span className={styles.ruleDot} />
                  <span>{hasLower ? "✓ " : ""}One Lowercase Letter (a-z)</span>
                </div>
                <div className={`${styles.ruleItem} ${hasNumber ? styles.satisfied : ""}`}>
                  <span className={styles.ruleDot} />
                  <span>{hasNumber ? "✓ " : ""}One Number (0-9)</span>
                </div>
              </div>

              {/* Workspace Rules & Terms Agreement */}
              <div className={styles.formGroup} style={{ marginTop: "0.5rem" }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", fontSize: "13px", color: "#cbd5e1" }}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={formData.agreeToRules}
                    onChange={(e) => updateForm("agreeToRules", e.target.checked)}
                  />
                  <span>
                    I agree to the Workspace Security Rules, Terms of Service, and Data Privacy Agreement.
                  </span>
                </label>
                {fieldErrors.agreeToRules && <span className={styles.fieldError}>{fieldErrors.agreeToRules}</span>}
              </div>
            </>
          )}

          {/* Step 4: Redesigned Review & Workspace Launch */}
          {step === 4 && (
            <>
              <h2 className={styles.stepTitle}>4. Review & Launch Workspace</h2>
              <div className={styles.summary}>
                {/* Logo & Company Title */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px" }}>
                  <div style={{ width: "52px", height: "52px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span className="material-symbols-outlined" style={{ fontSize: "24px", color: "#4facfe" }}>domain</span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>{formData.companyName}</div>
                    <div style={{ fontSize: "12px", color: "#94a3b8" }}>{formData.businessType} Based · {formData.companyEmail}</div>
                  </div>
                </div>

                <div className={styles.grid}>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Industry Preset</span>
                    <span className={styles.summaryValue}>{activeTemplate.name}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Root Administrator</span>
                    <span className={styles.summaryValue}>{formData.ownerName} ({formData.ownerEmail})</span>
                  </div>
                </div>

                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Active Modules ({formData.selectedModules.length})</span>
                  <div style={{ marginTop: "4px" }}>
                    {formData.selectedModules.map((mId) => (
                      <span key={mId} className={styles.moduleTag}>
                        {MODULES.find((m) => m.id === mId)?.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", fontSize: "12px", color: "#10b981", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>verified_user</span>
                  Workspace isolation and multi-tenant security verification ready.
                </div>
              </div>
            </>
          )}
        </div>

        {/* Navigation Footer */}
        <div className={styles.footer}>
          {step > 1 ? (
            <button
              className={styles.btnSecondary}
              onClick={handleBack}
              disabled={isLoading}
            >
              Back
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              className={styles.btnPrimary}
              onClick={handleNext}
            >
              Continue
            </button>
          ) : (
            <button
              className={styles.btnPrimary}
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Provisioning Workspace..." : "Launch Enterprise Workspace"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
