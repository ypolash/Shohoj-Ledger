"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  KeyRound, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Lock, 
  ShieldCheck 
} from "lucide-react";
import styles from "../forgot-password/forgot-password.module.css";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tokenParam = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";
  const codeParam = searchParams.get("code") || "";

  const [token, setToken] = useState(tokenParam);
  const [code, setCode] = useState(codeParam);
  const [email, setEmail] = useState(emailParam);
  const [userName, setUserName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  // If token is provided in URL, automatically verify it on load
  useEffect(() => {
    if (tokenParam || codeParam) {
      verifyToken(tokenParam, codeParam, emailParam);
    }
  }, [tokenParam, codeParam, emailParam]);

  const verifyToken = async (t: string, c: string, e: string) => {
    if (!t && !c) return;
    setIsVerifying(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-reset-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t, code: c, email: e }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        setTokenValid(false);
        setError(data.message || "This password reset session is invalid or has expired.");
      } else {
        setTokenValid(true);
        if (data.email) setEmail(data.email);
        if (data.userName) setUserName(data.userName);
      }
    } catch (err) {
      setTokenValid(false);
      setError("Unable to verify reset token. Please check your connection.");
    } finally {
      setIsVerifying(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim() || undefined,
          code: code.trim() || undefined,
          email: email.trim() || undefined,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Failed to reset password.");
      } else {
        setIsSuccess(true);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.ambientGlowLeft} />
      <div className={styles.ambientGlowRight} />

      <div className={styles.authWrapper}>
        <div className={styles.brandSection}>
          <div>
            <div className={styles.brandHeader}>
              <div className={styles.logoBadge}>
                <div className={styles.logoIcon} />
              </div>
              <div className={styles.brandTextGroup}>
                <span className={styles.systemTag}>Account Security</span>
                <h1 className={styles.brandTitle}>Shohoj Ledger</h1>
              </div>
            </div>

            <p className={styles.brandDescription}>
              Reset your account password to regain full access to your financial & ERP workspace.
            </p>
          </div>

          <div className={styles.brandFooter}>
            <span className={styles.statusDot} />
            <span>End-to-End Cryptographic Verification · Active</span>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.formSection}>
          <div className={styles.cardContent}>
            {isVerifying ? (
              <div style={{ textAlign: "center", padding: "2rem 0", color: "#94a3b8" }}>
                <p>Verifying secure reset authorization...</p>
              </div>
            ) : isSuccess ? (
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
            ) : (
              <>
                <div className={styles.iconBadge}>
                  <Lock size={22} />
                </div>
                <h2 className={styles.title}>Create New Password</h2>
                <p className={styles.subtitle}>
                  {userName ? `Welcome, ${userName}. ` : ""}Enter your reset credentials and select a strong new password.
                </p>

                <form onSubmit={handleSubmit} className={styles.form}>
                  {/* If no token was in URL, show code input */}
                  {!token && (
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
                  )}

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
                    id="btn-submit-reset"
                    className={styles.button}
                    disabled={isSubmitting || !newPassword || !confirmPassword || (!token && !code)}
                  >
                    <ShieldCheck size={16} />
                    {isSubmitting ? "Updating Password..." : "Reset Password"}
                  </button>
                </form>

                <div className={styles.footer}>
                  <Link href="/login" className={styles.link}>
                    <ArrowLeft size={16} /> Return to Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0c182a" }} />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
