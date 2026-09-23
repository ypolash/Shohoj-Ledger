"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  KeyRound, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Send, 
  Lock, 
  Copy, 
  Check, 
  ShieldCheck 
} from "lucide-react";
import styles from "./forgot-password.module.css";

type RecoveryStep = "REQUEST_CODE" | "SET_NEW_PASSWORD" | "SUCCESS";

export default function ForgotPasswordPage() {
  const router = useRouter();
  
  // Step State
  const [step, setStep] = useState<RecoveryStep>("REQUEST_CODE");
  
  // Form Inputs
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Telemetry & Preview
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [copied, setCopied] = useState(false);
  
  // UI Status
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Calculate simple password strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = getPasswordStrength(newPassword);

  // 1. Handle Requesting Reset Code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          identifier: identifier.trim(),
          email: identifier.trim() 
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Failed to process password reset request.");
      } else {
        setUserEmail(data.email || identifier);
        setUserName(data.userName || "User");
        setToken(data.token || "");
        setGeneratedCode(data.code || "");
        setCode(data.code || ""); // Pre-fill convenience code for immediate verification
        setSuccessMsg(data.message || "Reset code generated successfully.");
        setStep("SET_NEW_PASSWORD");
      }
    } catch (err) {
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Reset Password Submission
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim() || undefined,
          code: code.trim() || undefined,
          email: userEmail || identifier.trim(),
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Failed to reset password.");
      } else {
        setStep("SUCCESS");
      }
    } catch (err) {
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyCodeToClipboard = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={styles.container}>
      {/* Ambient glows */}
      <div className={styles.ambientGlowLeft} />
      <div className={styles.ambientGlowRight} />

      <div className={styles.authWrapper}>
        {/* Left Side: Brand Header & Step Guide */}
        <div className={styles.brandSection}>
          <div>
            <div className={styles.brandHeader}>
              <div className={styles.logoBadge}>
                <div className={styles.logoIcon} />
              </div>
              <div className={styles.brandTextGroup}>
                <span className={styles.systemTag}>Account Security</span>
                <h1 className={styles.brandTitle}>Shohoj Recovery</h1>
              </div>
            </div>

            <p className={styles.brandDescription}>
              Secure self-service password recovery for Enterprise Admins, Managers, and Staff Personnel.
            </p>

            <div className={styles.stepGuide}>
              <div className={styles.stepItem}>
                <div className={`${styles.stepNumber} ${step === "REQUEST_CODE" ? styles.stepNumberActive : ""}`}>
                  1
                </div>
                <div>
                  <div className={styles.stepTitle}>Identify Account</div>
                  <div className={styles.stepDesc}>Enter your registered email address or Employee ID</div>
                </div>
              </div>

              <div className={styles.stepItem}>
                <div className={`${styles.stepNumber} ${step === "SET_NEW_PASSWORD" ? styles.stepNumberActive : ""}`}>
                  2
                </div>
                <div>
                  <div className={styles.stepTitle}>Verify & Set Password</div>
                  <div className={styles.stepDesc}>Provide the 6-digit recovery code and choose a new password</div>
                </div>
              </div>

              <div className={styles.stepItem}>
                <div className={`${styles.stepNumber} ${step === "SUCCESS" ? styles.stepNumberActive : ""}`}>
                  3
                </div>
                <div>
                  <div className={styles.stepTitle}>Instant Sign In</div>
                  <div className={styles.stepDesc}>Sign in immediately to access your workspace</div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.brandFooter}>
            <span className={styles.statusDot} />
            <span>End-to-End Cryptographic Verification · Active</span>
          </div>
        </div>

        {/* Center Divider */}
        <div className={styles.divider} />

        {/* Right Side: Step Interactive Form */}
        <div className={styles.formSection}>
          <div className={styles.cardContent}>
            
            {/* STEP 1: REQUEST CODE */}
            {step === "REQUEST_CODE" && (
              <>
                <div className={styles.iconBadge}>
                  <KeyRound size={22} />
                </div>
                <h2 className={styles.title}>Forgot Password?</h2>
                <p className={styles.subtitle}>
                  No worries! Enter your email or Employee ID and we’ll initiate your secure password recovery.
                </p>

                <form onSubmit={handleRequestCode} className={styles.form}>
                  <div className={styles.formGroup}>
                    <label htmlFor="identifier" className={styles.label}>
                      Email or Employee ID
                    </label>
                    <input
                      id="identifier"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className={styles.input}
                      placeholder="e.g. user@shohojsolution.com or EMP-101"
                      required
                      autoFocus
                    />
                  </div>

                  {error && (
                    <div className={styles.error}>
                      <AlertCircle size={16} />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    id="btn-request-reset"
                    className={styles.button}
                    disabled={isLoading || !identifier.trim()}
                  >
                    <Send size={16} />
                    {isLoading ? "Validating Account..." : "Continue to Recovery"}
                  </button>
                </form>

                <div className={styles.footer}>
                  <Link href="/login" className={styles.link}>
                    <ArrowLeft size={16} /> Return to Login
                  </Link>
                </div>
              </>
            )}

            {/* STEP 2: ENTER CODE & SET NEW PASSWORD */}
            {step === "SET_NEW_PASSWORD" && (
              <>
                <div className={styles.iconBadge}>
                  <Lock size={22} />
                </div>
                <h2 className={styles.title}>Set New Password</h2>
                <p className={styles.subtitle}>
                  Enter the 6-digit recovery code and create a new secure password for <strong style={{ color: '#38bdf8' }}>{userEmail || identifier}</strong>.
                </p>

                {generatedCode && (
                  <div className={styles.infoPill}>
                    <span>Recovery Code: <strong style={{ letterSpacing: '2px', color: '#38bdf8' }}>{generatedCode}</strong></span>
                    <button type="button" onClick={copyCodeToClipboard} className={styles.copyCodeBtn}>
                      {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy Code"}
                    </button>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className={styles.form}>
                  <div className={styles.formGroup}>
                    <label htmlFor="code" className={styles.label}>
                      6-Digit Recovery Code
                    </label>
                    <input
                      id="code"
                      type="text"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className={`${styles.input} ${styles.codeInput}`}
                      placeholder="••••••"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="newPassword" className={styles.label}>
                      New Password
                    </label>
                    <div className={styles.passwordWrapper}>
                      <input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={styles.passwordInput}
                        placeholder="Min 6 characters..."
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={styles.eyeButton}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {/* Password strength indicator */}
                    {newPassword && (
                      <div className={styles.strengthBar}>
                        <div className={`${styles.strengthSegment} ${strength >= 1 ? (strength === 1 ? styles.strengthWeak : strength >= 3 ? styles.strengthStrong : styles.strengthMedium) : ""}`} />
                        <div className={`${styles.strengthSegment} ${strength >= 2 ? (strength >= 3 ? styles.strengthStrong : styles.strengthMedium) : ""}`} />
                        <div className={`${styles.strengthSegment} ${strength >= 3 ? styles.strengthStrong : ""}`} />
                        <div className={`${styles.strengthSegment} ${strength >= 4 ? styles.strengthStrong : ""}`} />
                      </div>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="confirmPassword" className={styles.label}>
                      Confirm New Password
                    </label>
                    <div className={styles.passwordWrapper}>
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={styles.passwordInput}
                        placeholder="Re-enter password..."
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className={styles.eyeButton}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className={styles.error}>
                      <AlertCircle size={16} />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    id="btn-update-password"
                    className={styles.button}
                    disabled={isLoading || !code.trim() || !newPassword || !confirmPassword}
                  >
                    <ShieldCheck size={16} />
                    {isLoading ? "Updating Password..." : "Update Password"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep("REQUEST_CODE")}
                    className={styles.secondaryButton}
                  >
                    Request Different Code
                  </button>
                </form>

                <div className={styles.footer}>
                  <Link href="/login" className={styles.link}>
                    <ArrowLeft size={16} /> Cancel and Back to Login
                  </Link>
                </div>
              </>
            )}

            {/* STEP 3: SUCCESS */}
            {step === "SUCCESS" && (
              <div className={styles.successContainer}>
                <div className={styles.successIconBadge}>
                  <CheckCircle2 size={36} />
                </div>
                <h2 className={styles.title}>Password Reset Complete!</h2>
                <p className={styles.subtitle}>
                  Your password has been successfully updated. You can now sign in with your new credentials.
                </p>

                <div style={{ width: "100%", marginTop: "1rem" }}>
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className={styles.button}
                    style={{ width: "100%" }}
                  >
                    Sign In Now
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
