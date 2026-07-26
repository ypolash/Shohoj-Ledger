"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./login.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [useLegacy, setUseLegacy] = useState(false);
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
        if (data.role === "EMPLOYEE") {
          // You could redirect employees elsewhere if needed, but per requirements, 
          // ERP is for ADMIN/OWNER.
          router.push(useLegacy ? "/dashboard" : "/erp"); 
        } else {
          router.push(useLegacy ? "/dashboard" : "/erp"); // Redirect to chosen dashboard on success
        }
        router.refresh(); // Refresh router to ensure middleware and states are updated
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Sign in to Shohoj Ledger</p>

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="admin@shohojsolution.com"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>
            <input 
              type="checkbox" 
              id="useLegacy" 
              checked={useLegacy} 
              onChange={(e) => setUseLegacy(e.target.checked)} 
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="useLegacy" style={{ cursor: 'pointer', userSelect: 'none' }}>
              Open Legacy Dashboard instead of Enterprise ERP
            </label>
          </div>

          <button type="submit" className={styles.button} disabled={isLoading}>
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className={styles.footer}>
          Return to <Link href="/" className={styles.link}>Home</Link>
        </div>
      </div>
    </div>
  );
}
