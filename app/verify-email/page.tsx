"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
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
  Sparkles,
  ClipboardCheck,
  Edit3
} from "lucide-react";
import styles from "./verify-email.module.css";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tokenParam = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";
  const codeParam = searchParams.get("code") || "";

  const [email, setEmail] = useState(emailParam);
  const [isEditingEmail, setIsEditingEmail] = useState(!emailParam);
  
  // 6-Digit OTP State
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  // Initialize from codeParam if present
  useEffect(() => {
    if (codeParam) {
      const clean = codeParam.replace(/\D/g, "").slice(0, 6);
      if (clean) {
        const newDigits = clean.padEnd(6, "").split("").slice(0, 6);
        setDigits(newDigits);
        if (clean.length === 6) {
          executeVerification(clean, emailParam);
        }
      }
    }
  }, [codeParam, emailParam]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0] && !codeParam) {
      inputRefs.current[0]?.focus();
    }
  }, [codeParam]);

  const executeVerification = async (otpCode: string, targetEmail?: string) => {
    setIsVerifying(true);
    setError("");
    setInfoMsg("");

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: otpCode.trim(),
          token: tokenParam || undefined,
          email: (targetEmail || email).trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Invalid or expired 6-digit verification code.");
      } else {
        setIsSuccess(true);
      }
    } catch {
      setError("An unexpected network error occurred. Please check your connection.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDigitChange = (index: number, val: string) => {
    // If user pasted or typed multiple digits in one cell
    const digitsOnly = val.replace(/\D/g, "");
    if (digitsOnly.length > 1) {
      applyPastedCode(digitsOnly);
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = digitsOnly;
    setDigits(newDigits);
    setError("");

    if (digitsOnly && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto verify if all 6 digits are complete
    const fullCode = newDigits.join("");
    if (fullCode.length === 6 && !newDigits.includes("")) {
      executeVerification(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        setDigits(newDigits);
      } else {
        const newDigits = [...digits];
        newDigits[index] = "";
        setDigits(newDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const applyPastedCode = (pastedText: string) => {
    const cleanDigits = pastedText.replace(/\D/g, "").slice(0, 6);
    if (!cleanDigits) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = cleanDigits[i] || "";
    }
    setDigits(newDigits);
    setError("");

    // Focus last filled box
    const focusIndex = Math.min(cleanDigits.length, 5);
    inputRefs.current[focusIndex]?.focus();

    if (cleanDigits.length === 6) {
      executeVerification(cleanDigits);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    applyPastedCode(pasted);
  };

  const handleOneClickPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        applyPastedCode(text);
      }
    } catch {
      setError("Please paste the 6-digit code directly into the boxes using Ctrl+V.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = digits.join("");
    if (fullCode.length < 6) {
      setError("Please enter all 6 digits of your verification code.");
      return;
    }
    executeVerification(fullCode);
  };

  const handleResendCode = async () => {
    if (!email.trim()) {
      setError("Please enter your registered email address.");
      setIsEditingEmail(true);
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
        setInfoMsg(data.message || `A fresh 6-digit OTP code has been dispatched to ${email}.`);
        setResendCooldown(60);
      }
    } catch {
      setError("Network error while resending code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const isComplete = digits.join("").length === 6;

  return (
    <div className={styles.container}>
      {/* Ambient glowing neon orbs */}
      <div className={styles.ambientGlowLeft} />
      <div className={styles.ambientGlowRight} />

      <div className={styles.authWrapper}>
        {/* Left Side: Instructions & Telemetry */}
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
                  <div className={styles.stepTitle}>Paste &amp; Instant Verification</div>
                  <div className={styles.stepDesc}>Paste the code to activate your ledger workspace and cloud isolation</div>
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

        {/* Right Side: Interactive 6-Digit OTP Form */}
        <div className={styles.formSection}>
          <div className={styles.cardContent}>
            {isSuccess ? (
              <div className={styles.successContainer}>
                <div className={styles.successIconBadge}>
                  <CheckCircle2 size={38} />
                </div>
                <h2 className={styles.title}>Email Verified!</h2>
                <p className={styles.subtitle}>
                  Your email address <strong style={{ color: "#38bdf8" }}>{email || emailParam}</strong> has been successfully authenticated.
                </p>

                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1.25rem" }}>
                  <button
                    type="button"
                    onClick={() => router.push("/erp")}
                    className={styles.button}
                  >
                    <span>Open ERP Workspace</span>
                    <ArrowRight size={16} />
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
                <h2 className={styles.title}>Enter Verification Code</h2>
                <p className={styles.subtitle}>
                  Please paste or enter the 6-digit security OTP code sent to your email.
                </p>

                {/* Email Address Indicator / Editor */}
                {isEditingEmail ? (
                  <div style={{ marginBottom: "1.25rem", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Registered Email Address
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@shohojsolution.com"
                        style={{
                          flex: 1,
                          background: "rgba(0, 0, 0, 0.35)",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          padding: "10px 14px",
                          borderRadius: "12px",
                          color: "#ffffff",
                          fontSize: "0.9rem",
                          outline: "none"
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (email.trim()) setIsEditingEmail(false);
                        }}
                        style={{
                          background: "rgba(56, 189, 248, 0.15)",
                          border: "1px solid rgba(56, 189, 248, 0.3)",
                          color: "#38bdf8",
                          padding: "0 14px",
                          borderRadius: "12px",
                          fontWeight: 600,
                          fontSize: "0.85rem",
                          cursor: "pointer"
                        }}
                      >
                        Set
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.emailPillBox}>
                    <div className={styles.emailPillText}>
                      <Mail size={15} color="#38bdf8" />
                      <span>Sent to: <strong style={{ color: "#ffffff" }}>{email}</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingEmail(true)}
                      className={styles.emailPillEditBtn}
                    >
                      <Edit3 size={13} style={{ display: "inline", marginRight: "4px" }} />
                      Change
                    </button>
                  </div>
                )}

                {infoMsg && (
                  <div className={styles.successAlert}>
                    <Sparkles size={16} />
                    <span>{infoMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className={styles.otpContainer}>
                  {/* 6-Cell OTP Input Row with Paste Handler */}
                  <div className={styles.otpInputRow} onPaste={handlePaste}>
                    {digits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          inputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        onPaste={handlePaste}
                        className={`${styles.otpCell} ${digit ? styles.otpCellFilled : ""}`}
                        autoComplete="one-time-code"
                        aria-label={`Digit ${idx + 1}`}
                      />
                    ))}
                  </div>

                  {/* Paste helper bar */}
                  <div className={styles.pasteHelperRow}>
                    <span>Tip: Copy the code from your email and press Ctrl+V</span>
                    <button
                      type="button"
                      onClick={handleOneClickPaste}
                      className={styles.pasteBtn}
                    >
                      <ClipboardCheck size={14} />
                      <span>Paste Code</span>
                    </button>
                  </div>

                  {error && (
                    <div className={styles.error}>
                      <AlertCircle size={16} />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    id="btn-verify-otp"
                    className={styles.button}
                    disabled={isVerifying || !isComplete}
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Verifying Security Code...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        <span>Verify &amp; Activate Account</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleResendCode}
                    className={styles.secondaryButton}
                    disabled={isResending || resendCooldown > 0}
                  >
                    <RefreshCw size={14} style={{ display: "inline", marginRight: "6px" }} />
                    {isResending
                      ? "Resending Code..."
                      : resendCooldown > 0
                      ? `Resend Code in ${resendCooldown}s`
                      : "Resend Verification Code"}
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
