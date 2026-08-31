"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { ColorStepIndicator } from "./components/ColorStepIndicator";
import { Step1CompanyProfile } from "./components/Step1CompanyProfile";
import { Step2IndustryModules } from "./components/Step2IndustryModules";
import { Step3AdminSecurity } from "./components/Step3AdminSecurity";
import { Step4ReviewLaunch } from "./components/Step4ReviewLaunch";

/**
 * Onboarding 2.0 (4-Color Animated Sliding Wizard)
 * Features 4 distinct color themes inspired by the reference image
 * with smooth horizontal slide-left animations between steps.
 */
export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{ companyName: string; ownerEmail: string } | null>(null);

  // Unified Form State
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

  const validateStep = (stepNum: number) => {
    const errors: Record<string, string> = {};

    if (stepNum === 1) {
      if (!formData.companyName.trim()) errors.companyName = "Company Name is required.";
      if (!formData.companyEmail.trim()) {
        errors.companyEmail = "Company Email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.companyEmail)) {
        errors.companyEmail = "Invalid company email format.";
      }
    } else if (stepNum === 2) {
      if (formData.selectedModules.length === 0) {
        errors.selectedModules = "Please select at least one module.";
      }
    } else if (stepNum === 3) {
      if (!formData.ownerName.trim()) errors.ownerName = "Admin Full Name is required.";
      if (!formData.ownerEmail.trim()) {
        errors.ownerEmail = "Admin Email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail)) {
        errors.ownerEmail = "Invalid email format.";
      }

      const hasLength = formData.ownerPassword.length >= 8;
      const hasUpper = /[A-Z]/.test(formData.ownerPassword);
      const hasLower = /[a-z]/.test(formData.ownerPassword);
      const hasNumber = /\d/.test(formData.ownerPassword);
      const isValidPass = hasLength && hasUpper && hasLower && hasNumber;

      if (!formData.ownerPassword) {
        errors.ownerPassword = "Password is required.";
      } else if (!isValidPass) {
        errors.ownerPassword = "Password does not satisfy all 4 security rules.";
      }

      if (formData.ownerPassword !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match.";
      }

      if (!formData.agreeToRules) {
        errors.agreeToRules = "You must agree to Workspace Rules & Terms.";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    setApiError(null);
    setCurrentStep((prev) => Math.min(4, prev + 1));
  };

  const handleBack = () => {
    setApiError(null);
    setFieldErrors({});
    setCurrentStep((prev) => Math.max(1, prev - 1));
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

  return (
    <main className={styles.viewport}>
      {/* Floating Error Alert */}
      {apiError && (
        <div className={styles.errorBanner}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>error</span>
          <span>{apiError}</span>
        </div>
      )}

      {/* Panel 1 */}
      <div className={`${styles.accordionPanel} ${styles.bg1} ${currentStep === 1 ? styles.active : ""}`}>
        <div className={styles.unexpandedIndicator}>
          <div className={styles.circleNumber}>1</div>
        </div>
        <div className={styles.panelTitle}>
          <span className={styles.stepBadge} style={{ color: "#38bdf8", background: "rgba(56, 189, 248, 0.12)" }}>
            Step 1 of 4 · Identity
          </span>
          <p style={{ color: "#94a3b8" }}>Set up your organization brand identity and primary business model.</p>
        </div>
        <div className={styles.panelContent}>
          <Step1CompanyProfile
            formData={formData}
            errors={fieldErrors}
            updateForm={updateForm}
            onNext={handleNext}
          />
        </div>
      </div>

      {/* Panel 2 */}
      <div className={`${styles.accordionPanel} ${styles.bg2} ${currentStep === 2 ? styles.active : ""}`}>
        <div className={styles.unexpandedIndicator}>
          <div className={styles.circleNumber} style={{ color: "#0f172a", borderColor: "rgba(15, 23, 42, 0.2)" }}>2</div>
        </div>
        <div className={styles.panelTitle}>
          <span className={styles.stepBadge} style={{ color: "#0284c7", background: "rgba(2, 132, 199, 0.12)" }}>
            Step 2 of 4 · Architecture
          </span>
          <p style={{ color: "#475569" }}>Select a tailored organizational template and activate your required ERP modules.</p>
        </div>
        <div className={styles.panelContent}>
          <Step2IndustryModules
            formData={formData}
            errors={fieldErrors}
            updateForm={updateForm}
            onBack={handleBack}
            onNext={handleNext}
          />
        </div>
      </div>

      {/* Panel 3 */}
      <div className={`${styles.accordionPanel} ${styles.bg3} ${currentStep === 3 ? styles.active : ""}`}>
        <div className={styles.unexpandedIndicator}>
          <div className={styles.circleNumber}>3</div>
        </div>
        <div className={styles.panelTitle}>
          <span className={styles.stepBadge} style={{ color: "#ffffff", background: "rgba(255, 255, 255, 0.2)" }}>
            Step 3 of 4 · Security
          </span>
          <p style={{ color: "rgba(255, 255, 255, 0.85)" }}>Set up your primary root administrator credentials and password security rules.</p>
        </div>
        <div className={styles.panelContent}>
          <Step3AdminSecurity
            formData={formData}
            errors={fieldErrors}
            updateForm={updateForm}
            onBack={handleBack}
            onNext={handleNext}
          />
        </div>
      </div>

      {/* Panel 4 */}
      <div className={`${styles.accordionPanel} ${styles.bg4} ${currentStep === 4 ? styles.active : ""}`}>
        <div className={styles.unexpandedIndicator}>
          <div className={styles.circleNumber} style={{ color: "#0f172a", borderColor: "rgba(15, 23, 42, 0.2)" }}>4</div>
        </div>
        <div className={styles.panelTitle}>
          <span className={styles.stepBadge} style={{ color: "#0f766e", background: "rgba(15, 118, 110, 0.12)" }}>
            Step 4 of 4 · Verification
          </span>
          <p style={{ color: "#475569" }}>Review your environment configuration before provisioning your enterprise database.</p>
        </div>
        <div className={styles.panelContent}>
          <Step4ReviewLaunch
            formData={formData}
            isLoading={isLoading}
            onBack={handleBack}
            onSubmit={handleSubmit}
          />
        </div>
      </div>

      {/* Success Modal Overlay */}
      {isSuccess && successData && (
        <div className={styles.successOverlay}>
          <div className={styles.successCard}>
            <div className={styles.checkIconLarge} />
            <h2 style={{ margin: "0 0 8px 0", fontSize: "24px", fontWeight: 700 }}>Workspace Ready!</h2>
            <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#94a3b8" }}>
              Enterprise database and modules provisioned successfully.
            </p>

            <div
              style={{
                background: "rgba(0, 0, 0, 0.3)",
                borderRadius: "14px",
                padding: "16px",
                textAlign: "left",
                marginBottom: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                fontSize: "13px"
              }}
            >
              <div>
                <span style={{ color: "#94a3b8" }}>Organization:</span>{" "}
                <strong style={{ color: "#ffffff" }}>{successData.companyName}</strong>
              </div>
              <div>
                <span style={{ color: "#94a3b8" }}>Admin Login:</span>{" "}
                <strong style={{ color: "#ffffff" }}>{successData.ownerEmail}</strong>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <Link
                href="/login"
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "14px"
                }}
              >
                Go to Login
              </Link>
              <Link
                href="/erp"
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: "14px"
                }}
              >
                Open ERP
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
