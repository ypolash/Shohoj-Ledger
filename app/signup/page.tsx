"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

const MODULES = [
  { id: "finance", label: "Finance & Accounting" },
  { id: "hr", label: "HR & Attendance" },
  { id: "payroll", label: "Payroll Processing" },
  { id: "crm", label: "CRM & Projects" },
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{companyName: string, ownerEmail: string} | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    companyName: "",
    companyEmail: "",
    phone: "",
    country: "",
    timezone: "Asia/Dhaka",
    businessType: "Product + Service",
    selectedModules: ["finance", "hr", "payroll", "crm"],
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
    confirmPassword: "",
  });

  const updateForm = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field specific error when typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: "" }));
    }
    setApiError(null);
  };

  const handleModuleToggle = (moduleId: string) => {
    setFormData(prev => {
      const current = prev.selectedModules;
      if (current.includes(moduleId)) {
        return { ...prev, selectedModules: current.filter(id => id !== moduleId) };
      } else {
        return { ...prev, selectedModules: [...current, moduleId] };
      }
    });
    setFieldErrors(prev => ({ ...prev, selectedModules: "" }));
  };

  const validateStep = () => {
    const errors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.companyName.trim()) errors.companyName = "Company Name is required.";
      if (!formData.companyEmail.trim()) {
        errors.companyEmail = "Company Email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.companyEmail)) {
        errors.companyEmail = "Invalid email format.";
      }
    } else if (step === 2) {
      if (!formData.businessType) errors.businessType = "Please select a Business Type.";
    } else if (step === 3) {
      if (formData.selectedModules.length === 0) errors.selectedModules = "Please select at least one module.";
    } else if (step === 5) {
      if (!formData.ownerName.trim()) errors.ownerName = "Owner Name is required.";
      if (!formData.ownerEmail.trim()) {
        errors.ownerEmail = "Owner Email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail)) {
        errors.ownerEmail = "Invalid email format.";
      }
      if (!formData.ownerPassword) {
        errors.ownerPassword = "Password is required.";
      } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(formData.ownerPassword)) {
        errors.ownerPassword = "Password must be at least 8 characters, with 1 uppercase, 1 lowercase, and 1 number.";
      }
      if (formData.ownerPassword !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match.";
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length > 0;
  };

  const handleNext = () => {
    if (validateStep()) return;
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setApiError(null);
    setFieldErrors({});
    setStep(prev => prev - 1);
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
          selectedModules: formData.selectedModules,
          ownerName: formData.ownerName,
          ownerEmail: formData.ownerEmail,
          ownerPasswordRaw: formData.ownerPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 400 || res.status === 409) {
          throw new Error(data.message || "A validation error occurred. Please check your details.");
        }
        if (res.status === 401 || res.status === 403) {
          throw new Error("You are not authorized to perform this action.");
        }
        throw new Error("An unexpected server error occurred. Please try again later.");
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
        <div className={styles.card} style={{ alignItems: 'center', textAlign: 'center' }}>
          <div className={styles.checkIconLarge} />
          <h1 className={styles.title} style={{ marginTop: '1.5rem' }}>Workspace Created!</h1>
          <p className={styles.subtitle} style={{ marginBottom: '2rem' }}>
            Your enterprise environment has been successfully provisioned.
          </p>
          
          <div className={styles.summary} style={{ width: '100%', marginBottom: '2rem' }}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Company Name</span>
              <span className={styles.summaryValue}>{successData.companyName}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Root Admin</span>
              <span className={styles.summaryValue}>{successData.ownerEmail}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
            <Link href="/login" className={styles.btnSecondary} style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
              Go to Login
            </Link>
            <Link href="/dashboard" className={styles.btnPrimary} style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
              Open Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome to Shohoj Ledger</h1>
          <p className={styles.subtitle}>Set up your enterprise workspace in minutes</p>
        </div>

        {/* Progress Bar */}
        <div className={styles.progressContainer}>
          <div className={styles.progressLine} />
          <div 
            className={styles.progressFill} 
            style={{ width: `${((step - 1) / 5) * 100}%` }} 
          />
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div 
              key={i} 
              className={`${styles.stepDot} ${step === i ? styles.active : step > i ? styles.completed : ""}`}
            >
              {step > i ? "✓" : i}
            </div>
          ))}
        </div>

        {apiError && <div className={styles.error}>{apiError}</div>}

        <div className={styles.form}>
          {step === 1 && (
            <>
              <h2 className={styles.stepTitle}>1. Company Information</h2>
              <div className={styles.grid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Company Name *</label>
                  <input 
                    type="text" 
                    className={`${styles.input} ${fieldErrors.companyName ? styles.inputError : ""}`}
                    value={formData.companyName}
                    onChange={(e) => updateForm("companyName", e.target.value)}
                    placeholder="Acme Corp" 
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
                    placeholder="contact@acmecorp.com" 
                  />
                  {fieldErrors.companyEmail && <span className={styles.fieldError}>{fieldErrors.companyEmail}</span>}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Phone</label>
                  <input 
                    type="text" 
                    className={styles.input} 
                    value={formData.phone}
                    onChange={(e) => updateForm("phone", e.target.value)}
                    placeholder="+880 1..." 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Country</label>
                  <input 
                    type="text" 
                    className={styles.input} 
                    value={formData.country}
                    onChange={(e) => updateForm("country", e.target.value)}
                    placeholder="Bangladesh" 
                  />
                </div>
                <div className={`${styles.formGroup} ${styles.full}`}>
                  <label className={styles.label}>Timezone</label>
                  <select 
                    className={styles.select}
                    value={formData.timezone}
                    onChange={(e) => updateForm("timezone", e.target.value)}
                  >
                    <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className={styles.stepTitle}>2. Business Type</h2>
              <div className={styles.formGroup}>
                <label className={styles.label}>What describes your business best?</label>
                <select 
                  className={`${styles.select} ${fieldErrors.businessType ? styles.inputError : ""}`}
                  value={formData.businessType}
                  onChange={(e) => updateForm("businessType", e.target.value)}
                >
                  <option value="Product">Product Based</option>
                  <option value="Service">Service Based</option>
                  <option value="Product + Service">Product & Service (Hybrid)</option>
                </select>
                {fieldErrors.businessType && <span className={styles.fieldError}>{fieldErrors.businessType}</span>}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className={styles.stepTitle}>3. Select Modules</h2>
              <p className={styles.subtitle} style={{marginBottom: "1rem"}}>Enable the ERP modules you need. You can change this later.</p>
              {fieldErrors.selectedModules && <div className={styles.error} style={{marginBottom: "1rem"}}>{fieldErrors.selectedModules}</div>}
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
            </>
          )}

          {step === 4 && (
            <>
              <h2 className={styles.stepTitle}>4. Industry Template</h2>
              <div className={styles.formGroup}>
                <label className={styles.label}>Apply default categories and settings</label>
                <select className={styles.select} disabled>
                  <option>IT Company (Default)</option>
                </select>
                <p className={styles.subtitle} style={{fontSize: "0.8rem", marginTop: "0.5rem"}}>
                  More templates coming soon.
                </p>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h2 className={styles.stepTitle}>5. Owner Account</h2>
              <div className={styles.grid}>
                <div className={`${styles.formGroup} ${styles.full}`}>
                  <label className={styles.label}>Full Name *</label>
                  <input 
                    type="text" 
                    className={`${styles.input} ${fieldErrors.ownerName ? styles.inputError : ""}`}
                    value={formData.ownerName}
                    onChange={(e) => updateForm("ownerName", e.target.value)}
                    placeholder="John Doe" 
                  />
                  {fieldErrors.ownerName && <span className={styles.fieldError}>{fieldErrors.ownerName}</span>}
                </div>
                <div className={`${styles.formGroup} ${styles.full}`}>
                  <label className={styles.label}>Email Address (Login ID) *</label>
                  <input 
                    type="email" 
                    className={`${styles.input} ${fieldErrors.ownerEmail ? styles.inputError : ""}`}
                    value={formData.ownerEmail}
                    onChange={(e) => updateForm("ownerEmail", e.target.value)}
                    placeholder="john@acmecorp.com" 
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
            </>
          )}

          {step === 6 && (
            <>
              <h2 className={styles.stepTitle}>6. Review Details</h2>
              <div className={styles.summary}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Company Name</span>
                  <span className={styles.summaryValue}>{formData.companyName}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Business Type</span>
                  <span className={styles.summaryValue}>{formData.businessType}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Enabled Modules</span>
                  <div>
                    {formData.selectedModules.map(mId => (
                      <span key={mId} className={styles.moduleTag}>
                        {MODULES.find(m => m.id === mId)?.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Owner</span>
                  <span className={styles.summaryValue}>{formData.ownerName} ({formData.ownerEmail})</span>
                </div>
              </div>
            </>
          )}
        </div>

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
          
          {step < 6 ? (
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
              {isLoading ? "Provisioning..." : "Create Company"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
