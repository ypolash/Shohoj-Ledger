"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  ShieldCheck, 
  ArrowLeft, 
  RefreshCw, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import styles from "../forgot-password/forgot-password.module.css";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tokenParam = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  // Automatic token verification if token is present in URL
  useEffect(() => {
    if (tokenParam && emailParam) {
      handleAutoVerify(tokenParam, emailParam);
    }
  }, [tokenParam, emailParam]);

  const handleAutoVerify = async (token: string, emailStr: string) => {
    setIsVerifying(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email: emailStr }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Email verification failed or link has expired.");
      } else {
        setIsSuccess(true);
      }
    } catch {
      setError("Network error while verifying email. Please enter your 6-digit code manually.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setIsVerifying(true);
    setError("");
    setInfoMsg("");

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          email: email.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Invalid or expired verification code.");
      } else {
        setIsSuccess(true);
      }
    } catch {
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!email.trim()) {
      setError("Please enter your registered email address to resend the code.");
      return;
    }

    setIsResending(true);
    setError("");
    setInfoMsg("");

    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Failed to resend verification code.");
      } else {
        setInfoMsg(data.message || "A new 6-digit verification code has been dispatched to your email.");
      }
    } catch {
      setError("Network error while resending verification code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Ambient glowing orbs */}
      <div className={styles.ambientGlowLeft} />
      <div className={styles.ambientGlowRight} />

      <div className={styles.authWrapper}>
        {/* Left Side: Branding */}
        <div className={styles.brandSection}>
          <div>
            <div className={styles.brandHeader}>
              <div className={styles.logoBadge}>
                <div className={styles.logoIcon} />
              </div>
              <div className={styles.brandTextGroup}>
                <span className={styles.systemTag}>Account Verification</span>
                <h1 className={styles.brandTitle}>Shohoj Ledger</h1>
              </div>
            </div>

            <p className={styles.brandDescription}>
              Confirm ownership of your registered business email address to unlock enterprise privileges and secure password recovery.
            </p>

            <div className={styles.stepGuide}>
              <div className={styles.stepItem}>
                <div className={`${styles.stepNumber} ${!isSuccess ? styles.stepNumberActive : ""}`}>
                  1
                </div>
                <div>
                  <div className={styles.stepTitle}>Receive 6-Digit OTP</div>
                  <div className={styles.stepDesc}>Check your inbox or corporate mailbox for the verification code</div>
                </div>
              </div>

              <div className={styles.stepItem}>
                <div className={`${styles.stepNumber} ${isSuccess ? styles.stepNumberActive : ""}`}>
                  2
                </div>
                <div>
                  <div className={styles.stepTitle}>Instant Verification</div>
                  <div className={styles.stepDesc}>Activate your ledger workspace and multi-tenant security</div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.brandFooter}>
            <span className={styles.statusDot} />
            <span>Cryptographic Verification Gate · Active</span>
          </div>
        </div>

        {/* Central Divider */}
        <div className={styles.divider} />

        {/* Right Side: Interactive Form */}
        <div className={styles.formSection}>
          <div className={styles.cardContent}>
            {isVerifying ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#94a3b8" }}>
                <RefreshCw size={36} className="animate-spin" style={{ color: "#38bdf8", margin: "0 auto 1.5rem" }} />
                <h3 style={{ color: "#ffffff", marginBottom: "0.5rem" }}>Verifying Authorization...</h3>
                <p style={{ fontSize: "0.9rem" }}>Confirming your security token with Shohoj Cryptographic Authority.</p>
              </div>
            ) : isSuccess ? (
              <div className={styles.successContainer}>
                <div className={styles.successIconBadge}>
                  <CheckCircle2 size={38} />
                </div>
                <h2 className={styles.title}>Email Verified!</h2>
                <p className={styles.subtitle}>
                  Your email address <strong style={{ color: "#38bdf8" }}>{email || emailParam}</strong> has been successfully authenticated.
                </p>

                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
                  <button
                    type="button"
                    onClick={() => router.push("/erp")}
                    className={styles.button}
                    style={{ width: "100%" }}
                  >
                    Open ERP Workspace <ArrowRight size={16} />
                  </button>

                  <Link href="/login" className={styles.secondaryButton}>
                    Return to Login
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.iconBadge}>
                  <Mail size={22} />
                </div>
                <h2 className={styles.title}>Verify Email Address</h2>
                <p className={styles.subtitle}>
                  Enter the 6-digit security code dispatched to <strong style={{ color: "#38bdf8" }}>{email || "your registered email"}</strong>.
                </p>

                {infoMsg && (
                  <div className={styles.successAlert}>
                    <Sparkles size={16} style={{ display: "inline", marginRight: "6px" }} />
                    {infoMsg}
                  </div>
                )}

                <form onSubmit={handleManualVerify} className={styles.form}>
                  {!emailParam && (
                    <div className={styles.formGroup}>
                      <label htmlFor="email" className={styles.label}>
                        Registered Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={styles.input}
                        placeholder="user@shohojsolution.com"
                        required
                      />
                    </div>
                  )}

                  <div className={styles.formGroup}>
                    <label htmlFor="code" className={styles.label}>
                      6-Digit Security Code
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
                    id="btn-submit-verification"
                    className={styles.button}
                    disabled={isVerifying || !code.trim()}
                  >
                    <ShieldCheck size={16} />
                    {isVerifying ? "Verifying..." : "Verify & Continue"}
                  </button>

                  <button
                    type="button"
                    onClick={handleResendCode}
                    className={styles.secondaryButton}
                    disabled={isResending}
                  >
                    <RefreshCw size={14} style={{ display: "inline", marginRight: "6px" }} />
                    {isResending ? "Resending Code..." : "Resend Verification Code"}
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0c182a" }} />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
