"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff, Server, Layers, KeyRound, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import styles from './login.module.css';

export default function SuperAdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/super-admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid Super Admin credentials');
      }

      // Successful login - direct to Super Admin console
      window.location.href = '/super-admin';
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to authenticate as Super Admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Background Ambient Glows */}
      <div className={styles.ambientGlowLeft} />
      <div className={styles.ambientGlowRight} />

      {/* Main Container Box */}
      <div className={styles.authWrapper}>
        {/* Top Accent Gradient Bar */}
        <div className={styles.topAccentBar} />

        {/* LEFT SIDE: Site Details & Platform Governance */}
        <div className={styles.detailsSection}>
          <div>
            {/* Brand Header */}
            <div className={styles.brandHeader}>
              <div className={styles.logoBadge}>
                <Shield size={28} />
              </div>
              <div className={styles.brandTextGroup}>
                <span className={styles.systemTag}>Master Governance</span>
                <h1 className={styles.brandTitle}>Shohoj Super Admin</h1>
              </div>
            </div>

            <p className={styles.brandTagline}>
              Dedicated multi-tenant control center, system telemetry, and centralized master governance.
            </p>

            {/* Governance Features Highlights */}
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <div className={styles.featureIconBox}>
                  <Layers size={18} />
                </div>
                <div className={styles.featureTextBox}>
                  <span className={styles.featureTitle}>Multi-Tenant Orchestration</span>
                  <span className={styles.featureDesc}>
                    Provision, govern, and monitor company tenants and enterprise workspaces.
                  </span>
                </div>
              </div>

              <div className={styles.featureItem}>
                <div className={styles.featureIconBox}>
                  <Server size={18} />
                </div>
                <div className={styles.featureTextBox}>
                  <span className={styles.featureTitle}>Real-Time Infrastructure Health</span>
                  <span className={styles.featureDesc}>
                    Live telemetry, database operations, background jobs, and error logs.
                  </span>
                </div>
              </div>

              <div className={styles.featureItem}>
                <div className={styles.featureIconBox}>
                  <KeyRound size={18} />
                </div>
                <div className={styles.featureTextBox}>
                  <span className={styles.featureTitle}>Plan & Entitlement Control</span>
                  <span className={styles.featureDesc}>
                    Configure subscription tiers, quotas, feature flags, and custom limits.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Note at Bottom of Left Panel */}
          <div className={styles.securityBadge}>
            <ShieldCheck size={16} style={{ color: '#10b981' }} />
            <span>Zero-Trust Architecture · Cryptographically Audited Sessions</span>
          </div>
        </div>

        {/* VERTICAL DIVIDER */}
        <div className={styles.divider} />

        {/* RIGHT SIDE: Login Box */}
        <div className={styles.formSection}>
          <div className={styles.formHeader}>
            <h2 className={styles.formHeaderTitle}>Super Admin Sign In</h2>
            <p className={styles.formHeaderSubtitle}>
              Enter your administrative credentials to continue.
            </p>
          </div>

          {errorMessage && (
            <div className={styles.alertError}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Email Field */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Super Admin Email
              </label>
              <div className={styles.inputWrapper}>
                <Mail size={16} className={styles.inputIcon} />
                <input
                  required
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.inputField}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field */}
            <div className={styles.formGroup} style={{ marginBottom: '1.75rem' }}>
              <label className={styles.formLabel}>
                Master Security Password
              </label>
              <div className={styles.inputWrapper}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${styles.inputField} ${styles.passwordField}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.passwordToggle}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={styles.submitBtn}
            >
              {loading ? (
                <span>Verifying Credentials...</span>
              ) : (
                <>
                  <span>Enter Super Admin Console</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer Note */}
          <div className={styles.formFooter}>
            <p className={styles.restrictedNote}>
              🔒 <strong>Strictly Restricted Access.</strong> All login attempts and tenant operations are audited.
            </p>
            <Link href="/login" className={styles.switchLink}>
              Switch to Regular Business Login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
