"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { Canvas3DBackground } from "./components/Canvas3DBackground";
import { Step1CompanyProfile } from "./components/Step1CompanyProfile";
import { Step2IndustryModules } from "./components/Step2IndustryModules";
import { Step3AdminSecurity } from "./components/Step3AdminSecurity";
import { Step4ReviewLaunch } from "./components/Step4ReviewLaunch";
import { 
  Building2, 
  Layers, 
  ShieldCheck, 
  Rocket, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Shield,
  Database,
  Lock
} from "lucide-react";

const STEP_META = [
  {
    step: 1,
    tag: "Phase 01 · Identity",
    title: "Company Identity",
    subtitle: "Define your corporate organization name, brand mark, and primary business operational model.",
    icon: <Building2 size={16} />
  },
  {
    step: 2,
    tag: "Phase 02 · Architecture",
    title: "Industry & ERP Modules",
    subtitle: "Select your industry template preset and tailor active ERP feature modules for your business.",
    icon: <Layers size={16} />
  },
  {
    step: 3,
    tag: "Phase 03 · Security",
    title: "Root Governance & Security",
    subtitle: "Establish the root administrator account and cryptographic security credentials.",
    icon: <ShieldCheck size={16} />
  },
  {
    step: 4,
    tag: "Phase 04 · Launchpad",
    title: "Review & Cloud Launch",
    subtitle: "Verify your architecture configuration and trigger tenant database schema provisioning.",
    icon: <Rocket size={16} />
  }
];

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{ 
    companyName: string; 
    ownerEmail: string;
    verificationCode?: string;
    verificationUrl?: string;
  } | null>(null);

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
          ownerPasswordRaw: formData.ownerPassword,
          logoUrl: formData.logoUrl || null
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "A validation error occurred. Please check your details.");
      }

      setSuccessData({
        companyName: data.data?.companyName || formData.companyName,
        ownerEmail: data.data?.ownerEmail || formData.ownerEmail,
        verificationCode: data.data?.verificationCode,
        verificationUrl: data.data?.verificationUrl,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const activeMeta = STEP_META[currentStep - 1];

  return (
    <main className={styles.viewport}>
      {/* Dynamic 3D Perspective WebGL Canvas */}
      <Canvas3DBackground currentStep={currentStep} />

      {/* Ambient Glow Lights */}
      <div className={styles.glowTopLeft} />
      <div className={styles.glowBottomRight} />

      {/* Floating Error Alert */}
      {apiError && (
        <div className={styles.errorBanner}>
          <AlertCircle size={18} />
          <span>{apiError}</span>
        </div>
      )}

      {/* 2-Column Split Onboarding Grid */}
      <div className={styles.onboardingGrid}>
        
        {/* LEFT COLUMN: Mission Control, Phase Info & Stepper Deck */}
        <aside className={styles.leftSidebar}>
          {/* Phase Information Showcase */}
          <div className={styles.stageHeaderCard}>
            <div className={styles.stageBadge}>
              {activeMeta.icon}
              <span>{activeMeta.tag}</span>
            </div>
            <h1 className={styles.stageTitle}>{activeMeta.title}</h1>
            <p className={styles.stageSubtitle}>{activeMeta.subtitle}</p>

            <div className={styles.telemetryBadge}>
              <span className={styles.telemetryDot} />
              <span>Autonomous Node · Live</span>
            </div>
          </div>

          {/* Vertical Stepper Deck */}
          <div className={styles.verticalStepper}>
            {STEP_META.map((item) => {
              const isActive = currentStep === item.step;
              const isCompleted = currentStep > item.step;

              return (
                <div
                  key={item.step}
                  onClick={() => {
                    if (item.step < currentStep) {
                      setCurrentStep(item.step);
                    } else if (item.step === currentStep + 1 && validateStep(currentStep)) {
                      setCurrentStep(item.step);
                    }
                  }}
                  className={`${styles.stepDeckPill} ${isActive ? styles.stepPillActive : ""} ${isCompleted ? styles.stepPillCompleted : ""}`}
                >
                  <div className={styles.stepPillNumber}>
                    {isCompleted ? <CheckCircle2 size={16} color="#06101e" /> : item.step}
                  </div>
                  <div className={styles.stepPillMeta}>
                    <span className={styles.stepPillTag}>Phase 0{item.step}</span>
                    <span className={styles.stepPillTitle}>{item.title}</span>
                  </div>
                  {isActive && <div className={styles.stepActiveShimmer} />}
                </div>
              );
            })}
          </div>

          {/* Enterprise Security Highlights */}
          <div className={styles.securityHighlights}>
            <div className={styles.highlightItem}>
              <span className={styles.highlightIcon}><Shield size={14} /></span>
              <span>AES-256 Cloud Encrypted Multi-Tenant Storage</span>
            </div>
            <div className={styles.highlightItem}>
              <span className={styles.highlightIcon}><Database size={14} /></span>
              <span>Automated PostgreSQL Schema & Role Isolation</span>
            </div>
            <div className={styles.highlightItem}>
              <span className={styles.highlightIcon}><Lock size={14} /></span>
              <span>Cryptographic OTP Email Verification Active</span>
            </div>
          </div>
        </aside>

        {/* RIGHT COLUMN: Active Field Form Stage */}
        <section className={styles.rightStage}>
          <div className={styles.cardStage3D} key={currentStep}>
            {currentStep === 1 && (
              <Step1CompanyProfile
                formData={formData}
                errors={fieldErrors}
                updateForm={updateForm}
                onNext={handleNext}
              />
            )}

            {currentStep === 2 && (
              <Step2IndustryModules
                formData={formData}
                errors={fieldErrors}
                updateForm={updateForm}
                onBack={handleBack}
                onNext={handleNext}
              />
            )}

            {currentStep === 3 && (
              <Step3AdminSecurity
                formData={formData}
                errors={fieldErrors}
                updateForm={updateForm}
                onBack={handleBack}
                onNext={handleNext}
              />
            )}

            {currentStep === 4 && (
              <Step4ReviewLaunch
                formData={formData}
                isLoading={isLoading}
                onBack={handleBack}
                onSubmit={handleSubmit}
              />
            )}
          </div>
        </section>

      </div>

      {/* Success Modal 3D Overlay */}
      {isSuccess && successData && (
        <div className={styles.successOverlay}>
          <div className={styles.successCard}>
            <div className={styles.checkIconLarge}>
              <CheckCircle2 size={42} />
            </div>
            <h2 style={{ margin: "0 0 8px 0", fontSize: "1.75rem", fontWeight: 800 }}>Workspace Ready!</h2>
            <p style={{ margin: "0 0 24px 0", fontSize: "0.92rem", color: "#94a3b8" }}>
              Enterprise multi-tenant schema and selected modules provisioned successfully.
            </p>

            <div
              style={{
                background: "rgba(0, 0, 0, 0.4)",
                borderRadius: "18px",
                padding: "20px",
                textAlign: "left",
                marginBottom: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                fontSize: "0.9rem",
                border: "1px solid rgba(255, 255, 255, 0.1)"
              }}
            >
              <div>
                <span style={{ color: "#94a3b8" }}>Organization:</span>{" "}
                <strong style={{ color: "#ffffff" }}>{successData.companyName}</strong>
              </div>
              <div>
                <span style={{ color: "#94a3b8" }}>Root Admin Login:</span>{" "}
                <strong style={{ color: "#ffffff" }}>{successData.ownerEmail}</strong>
              </div>
              {successData.verificationCode && (
                <div style={{ marginTop: "6px", paddingTop: "10px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <span style={{ color: "#94a3b8" }}>Email Verification OTP:</span>{" "}
                  <strong style={{ color: "#38bdf8", letterSpacing: "3px", fontFamily: "monospace", fontSize: "1.05rem" }}>
                    {successData.verificationCode}
                  </strong>
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {successData.verificationUrl && (
                <Link
                  href={successData.verificationUrl}
                  style={{
                    padding: "14px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
                    color: "#06101e",
                    textDecoration: "none",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 10px 25px rgba(0, 242, 254, 0.4)"
                  }}
                >
                  <span>Verify Email Address Now</span>
                  <ArrowRight size={16} />
                </Link>
              )}

              <div style={{ display: "flex", gap: "12px" }}>
                <Link
                  href="/login"
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "14px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#ffffff",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "0.9rem"
                  }}
                >
                  Go to Login
                </Link>
                <Link
                  href="/erp"
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "14px",
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "#ffffff",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "0.9rem"
                  }}
                >
                  Open ERP
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
