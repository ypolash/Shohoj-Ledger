"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function SuperAdminLoginPage() {
  const [email, setEmail] = useState('team@shohoj.com');
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top, #1e1b4b 0%, #09090b 100%)',
      padding: '24px',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(24, 24, 27, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(168, 85, 247, 0.25)',
        borderRadius: '20px',
        padding: '40px 36px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(168, 85, 247, 0.15)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Top Glow Accent */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #8b5cf6, #ec4899, #6366f1)',
        }} />

        {/* Brand Shield Icon */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(99, 102, 241, 0.25))',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#c084fc',
          margin: '0 auto 20px',
          boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)',
        }}>
          <Shield size={28} />
        </div>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
            Shohoj Super Admin
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
            Dedicated multi-tenant control center & master governance.
          </p>
        </div>

        {errorMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontSize: '13px',
            marginBottom: '20px',
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* Email Field */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
              Super Admin Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                required
                type="email"
                placeholder="team@shohoj.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  borderRadius: '10px',
                  background: 'rgba(9, 9, 11, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
              Master Security Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                required
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter Super Admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 42px',
                  borderRadius: '10px',
                  background: 'rgba(9, 9, 11, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
              transition: 'transform 0.15s ease, opacity 0.15s ease',
              opacity: loading ? 0.7 : 1,
            }}
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

        {/* Security Footer Note */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
            🔒 <strong>Strictly Restricted Access.</strong> All login events and tenant management actions are audited.
          </p>
          <Link
            href="/login"
            style={{
              fontSize: '12px',
              color: '#a855f7',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Switch to Regular Business Login →
          </Link>
        </div>
      </div>
    </div>
  );
}
