"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ShieldCheck, Zap, BarChart3 } from "lucide-react";
import styles from "./login.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Invalid credentials. Please try again.");
      } else {
        router.push("/erp");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Background ambient light effects */}
      <div className={styles.ambientGlowLeft} />
      <div className={styles.ambientGlowRight} />

      <div className={styles.authWrapper}>
        {/* Left Side: Brand Header & Feature Highlights */}
        <div className={styles.brandSection}>
          <div>
            <div className={styles.brandHeader}>
              <div className={styles.logoBadge}>
                <div className={styles.logoIcon} />
              </div>
              <div className={styles.brandTextGroup}>
                <span className={styles.systemTag}>Enterprise Platform</span>
                <h1 className={styles.brandTitle}>Shohoj Ledger</h1>
              </div>
            </div>

            <p className={styles.brandDescription}>
              The unified intelligence platform for Financial Ledgers, Corporate Reserves, HR Operations, and Enterprise Governance.
            </p>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <div className={styles.featureIconWrap}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className={styles.featureTitle}>Multi-Tenant Security</div>
                  <div className={styles.featureDesc}>Role-based access & comprehensive audit trail logging</div>
                </div>
              </div>

              <div className={styles.featureItem}>
                <div className={styles.featureIconWrap}>
                  <Zap size={18} />
                </div>
                <div>
                  <div className={styles.featureTitle}>Real-Time Ledger Settlement</div>
                  <div className={styles.featureDesc}>Instant receivables, outlays & corporate cashflow reconciliation</div>
                </div>
              </div>

              <div className={styles.featureItem}>
                <div className={styles.featureIconWrap}>
                  <BarChart3 size={18} />
                </div>
                <div>
                  <div className={styles.featureTitle}>Autonomous Operations</div>
                  <div className={styles.featureDesc}>One-click payroll distribution, CRM pipelines & stock control</div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.brandFooter}>
            <span className={styles.statusDot} />
            <span>Operational · v2.5.0 Enterprise</span>
          </div>
        </div>

        {/* Center Divider */}
        <div className={styles.divider} />

        {/* Right Side: Login Box */}
        <div className={styles.loginSection}>
          <div className={styles.loginCard}>
            <h2 className={styles.title}>Welcome Back</h2>
            <p className={styles.subtitle}>Sign in to your Shohoj Ledger workspace</p>

            <form onSubmit={handleLogin} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  placeholder="Enter Your Email..."
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>
                  Password
                </label>
                <div className={styles.passwordWrapper}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.passwordInput}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    id="toggle-password-visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.eyeButton}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff size={18} className={styles.eyeIcon} />
                    ) : (
                      <Eye size={18} className={styles.eyeIcon} />
                    )}
                  </button>
                </div>
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <button type="submit" id="btn-login-submit" className={styles.button} disabled={isLoading}>
                {isLoading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <div className={styles.footer}>
              Return to <Link href="/" className={styles.link}>Home</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

