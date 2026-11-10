"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Shield,
  Database,
  Lock
} from "lucide-react";
import { mapIndustryToProjectPreset } from "@/lib/projects/projectPresets";

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
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Unified Form State
  const [formData, setFormData] = useState({
    companyName: "",
    companyEmail: "",
    phone: "",
    logoUrl: "",
    businessType: "Product",
    industryTemplate: "goods_consumer",
    projectPreset: "manufacturing_engineering",
    selectedModules: ["finance", "crm", "inventory", "hr", "payroll"],
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
    confirmPassword: "",
    agreeToRules: false
  });

  const updateForm = (field: string, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "businessType") {
        if (value === "Product") {
          const productTemplateIds = ["goods_consumer", "hotel_restaurant", "pharmacy", "electronic_gadget", "beauty_cosmetics"];
          if (!productTemplateIds.includes(prev.industryTemplate)) {
            next.industryTemplate = "goods_consumer";
            next.projectPreset = mapIndustryToProjectPreset("goods_consumer");
          }
        } else if (value === "Service") {
          const serviceTemplateIds = ["it", "media", "consulting", "education", "retail", "manufacturing", "wholesale", "healthcare"];
          if (!serviceTemplateIds.includes(prev.industryTemplate)) {
            next.industryTemplate = "it";
            next.projectPreset = mapIndustryToProjectPreset("it");
          }
        }
      }
      return next;
    });
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

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    // When moving from Step 3 (Admin Security) to Step 4 (Launchpad):
    // Pre-check email availability so the user doesn't hit a wall at Phase 4!
    if (currentStep === 3) {
      try {
        const emailToCheck = formData.ownerEmail.trim().toLowerCase();
        const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(emailToCheck)}`);
        const data = await res.json();
        if (data && data.available === false) {
          setFieldErrors((prev) => ({
            ...prev,
            ownerEmail: "This email address is already registered to an account."
          }));
          setApiError("This email address is already registered. Please log in or use a different email.");
          return;
        }
      } catch (e) {
        // Continue if offline or network error
      }
    }

    setApiError(null);
    setDirection("forward");
    setCurrentStep((prev) => Math.min(4, prev + 1));
  };

  const handleBack = () => {
    setApiError(null);
    setFieldErrors({});
    setDirection("backward");
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
          projectPreset: formData.projectPreset,
          selectedModules: formData.selectedModules,
          ownerName: formData.ownerName,
          ownerEmail: formData.ownerEmail,
          ownerPasswordRaw: formData.ownerPassword,
          logoUrl: formData.logoUrl || null
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "EMAIL_ALREADY_EXISTS" || (data.message && data.message.toLowerCase().includes("already registered"))) {
          setFieldErrors((prev) => ({
            ...prev,
            ownerEmail: "This email address is already registered to an account."
          }));
        }
        throw new Error(data.message || data.error || "A validation error occurred. Please check your details.");
      }

      // Automatically launch directly into the provisioned ERP workspace
      window.location.href = "/erp";
    } catch (err: any) {
      setApiError(err.message);
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
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", justifyContent: "space-between", width: "100%" }}>
            <span>{apiError}</span>
            {(apiError.toLowerCase().includes("already registered") || apiError.toLowerCase().includes("log in") || apiError.toLowerCase().includes("sign in")) && (
              <a
                href="/login"
                style={{
                  color: "#38bdf8",
                  textDecoration: "underline",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  marginLeft: "auto"
                }}
              >
                Sign in to your account →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Main Centered Onboarding Flow */}
      <div className={styles.onboardingContainer}>
        
        {/* TOP: Horizontal Stepper Showing Step Numbers & Names */}
        <div className={styles.horizontalStepperWrapper}>
          <div className={styles.stepperProgressTrack}>
            <div
              className={styles.stepperProgressFill}
              style={{ width: `${((currentStep - 1) / (STEP_META.length - 1)) * 100}%` }}
            />
          </div>

          <div className={styles.horizontalStepper}>
            {STEP_META.map((item) => {
              const isActive = currentStep === item.step;
              const isCompleted = currentStep > item.step;

              return (
                <div
                  key={item.step}
                  onClick={() => {
                    if (item.step < currentStep) {
                      setDirection("backward");
                      setCurrentStep(item.step);
                    } else if (item.step === currentStep + 1 && validateStep(currentStep)) {
                      setDirection("forward");
                      setCurrentStep(item.step);
                    }
                  }}
                  className={`${styles.stepNode} ${isActive ? styles.stepNodeActive : ""} ${isCompleted ? styles.stepNodeCompleted : ""}`}
                >
                  <div className={styles.stepBadge}>
                    {isCompleted ? <CheckCircle2 size={18} /> : item.step}
                  </div>
                  <div className={styles.stepInfo}>
                    <span className={styles.stepNumberLabel}>Step 0{item.step}</span>
                    <span className={styles.stepNameLabel}>{item.title}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TOP: Step Identity & Purpose Header */}
        <div className={styles.stepBannerCard} key={`header-${currentStep}`}>
          <div className={styles.stepBannerHeader}>
            <div className={styles.stageBadge}>
              {activeMeta.icon}
              <span>{activeMeta.tag}</span>
            </div>
            <div className={styles.stepCounterPill}>
              <span>Step {currentStep} of {STEP_META.length}</span>
            </div>
          </div>
          <h1 className={styles.stageTitle}>{activeMeta.title}</h1>
          <p className={styles.stageSubtitle}>{activeMeta.subtitle}</p>
        </div>

        {/* MIDDLE: Active Information Form Card with Impressive Animation */}
        <div
          key={`step-card-${currentStep}`}
          className={`${styles.cardStage3D} ${direction === "forward" ? styles.slideForward : styles.slideBackward}`}
        >
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

        {/* Security & Reliability Badges at Bottom */}
        <div className={styles.onboardingFooterBadges}>
          <div className={styles.badgeItem}>
            <Shield size={14} color="#38bdf8" />
            <span>AES-256 Multi-Tenant Cloud Encryption</span>
          </div>
          <div className={styles.badgeItem}>
            <Database size={14} color="#38bdf8" />
            <span>PostgreSQL Automated Tenant Schema Isolation</span>
          </div>
          <div className={styles.badgeItem}>
            <Lock size={14} color="#38bdf8" />
            <span>Cryptographic OTP Email Verification Active</span>
          </div>
        </div>

      </div>
    </main>
  );
}
