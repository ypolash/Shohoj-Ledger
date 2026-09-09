"use client";

import React, { useState, useEffect } from 'react';
import styles from './onboarding.module.css';

export default function OnboardingSettingsPage() {
  const [mode, setMode] = useState<'BASIC' | 'PROFESSIONAL'>('PROFESSIONAL');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMode();
  }, []);

  const fetchMode = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/settings/onboarding', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && json.mode) {
        setMode(json.mode);
      }
    } catch {
      setError('Failed to load employee collection mode.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (newMode?: 'BASIC' | 'PROFESSIONAL') => {
    const selectedMode = newMode || mode;
    setIsSaving(true);
    setSuccess('');
    setError('');

    try {
      const res = await fetch('/api/settings/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: selectedMode })
      });
      const json = await res.json();
      if (json.success) {
        setMode(json.mode);
        setSuccess(`Employee Data Collection system set to ${json.mode === 'BASIC' ? 'Basic (Fast Onboarding)' : 'Professional (Enterprise Dossier)'} successfully.`);
        setTimeout(() => setSuccess(''), 4500);
      } else {
        setError(json.error || 'Failed to save settings.');
      }
    } catch {
      setError('Network error while saving onboarding system mode.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading Onboarding Settings...
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className={styles.badge}>Workforce Architecture</span>
            <span className={`${styles.statusBadge} ${mode === 'BASIC' ? styles.statusBasic : styles.statusPro}`}>
              ACTIVE: {mode} MODE
            </span>
          </div>
          <h1 className={styles.title}>Employee Data Collection System</h1>
          <p className={styles.subtitle}>
            Choose how employee data is collected across the platform. Switch between lightweight fast-entry or comprehensive enterprise dossiers.
          </p>
        </div>

        <button
          onClick={() => handleSave()}
          className={styles.saveBtn}
          disabled={isSaving}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            {isSaving ? 'hourglass_empty' : 'save'}
          </span>
          {isSaving ? 'Saving...' : 'Apply Default System'}
        </button>
      </div>

      {/* Alerts */}
      {success && (
        <div className={styles.alertSuccess}>
          <span className="material-symbols-outlined">check_circle</span>
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className={styles.alertError}>
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* System Selection Cards */}
      <div className={styles.cardsGrid}>
        {/* Basic Mode Card */}
        <div
          className={`${styles.modeCard} ${mode === 'BASIC' ? styles.modeCardActive : ''}`}
          onClick={() => {
            setMode('BASIC');
            handleSave('BASIC');
          }}
        >
          <div className={styles.modeCardHeader}>
            <div className={`${styles.iconCircle} ${styles.iconBasic}`}>
              <span className="material-symbols-outlined">speed</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className={styles.modeCardTitle}>Basic Collection System</h3>
                <input
                  type="radio"
                  name="onboardingMode"
                  checked={mode === 'BASIC'}
                  onChange={() => {}}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                />
              </div>
              <span className={styles.modeCardTag}>Fast &bull; 7 Core Attributes</span>
            </div>
          </div>

          <p className={styles.modeDesc}>
            Ideal for quick onboarding, hourly workers, retail staff, and rapid roster creation without bureaucratic friction.
          </p>

          <div className={styles.fieldsList}>
            <div className={styles.fieldsHeader}>Included Fields:</div>
            <div className={styles.fieldItem}><span className="material-symbols-outlined">check</span> Full Name (First &amp; Last)</div>
            <div className={styles.fieldItem}><span className="material-symbols-outlined">check</span> Primary Phone Number</div>
            <div className={styles.fieldItem}><span className="material-symbols-outlined">check</span> Official Email Address</div>
            <div className={styles.fieldItem}><span className="material-symbols-outlined">check</span> Residential / Present Address</div>
            <div className={styles.fieldItem}><span className="material-symbols-outlined">check</span> Basic Salary (BDT ৳)</div>
            <div className={styles.fieldItem}><span className="material-symbols-outlined">check</span> Date of Joining</div>
            <div className={styles.fieldItem}><span className="material-symbols-outlined">check</span> Staff App Credentials (PIN &amp; ID)</div>
          </div>

          <div className={styles.skipNote}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>info</span>
            Skips NID, academic degrees, past job history, and nominee records.
          </div>
        </div>

        {/* Professional Mode Card */}
        <div
          className={`${styles.modeCard} ${mode === 'PROFESSIONAL' ? styles.modeCardActive : ''}`}
          onClick={() => {
            setMode('PROFESSIONAL');
            handleSave('PROFESSIONAL');
          }}
        >
          <div className={styles.modeCardHeader}>
            <div className={`${styles.iconCircle} ${styles.iconPro}`}>
              <span className="material-symbols-outlined">workspace_premium</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className={styles.modeCardTitle}>Professional Enterprise System</h3>
                <input
                  type="radio"
                  name="onboardingMode"
                  checked={mode === 'PROFESSIONAL'}
                  onChange={() => {}}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                />
              </div>
              <span className={styles.modeCardTag} style={{ color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.08)' }}>
                Comprehensive &bull; Full Personnel Dossier
              </span>
            </div>
          </div>

          <p className={styles.modeDesc}>
            Full enterprise personnel governance. Captures legal identity, academic certificates, past experience, banking, and nominees.
          </p>

          <div className={styles.fieldsList}>
            <div className={styles.fieldsHeader}>Included Fields:</div>
            <div className={styles.fieldItem}><span className="material-symbols-outlined">check</span> All Basic Information &amp; App Login</div>
            <div className={styles.fieldItem}><span className="material-symbols-outlined">check</span> Department, Designation &amp; Shift Assignment</div>
            <div className={styles.fieldItem}><span className="material-symbols-outlined">check</span> National ID (NID), DOB, Blood Group &amp; Gender</div>
            <div className={styles.fieldItem}><span className="material-symbols-outlined">check</span> Permanent &amp; Present Addresses + Secondary Phone</div>
            <div className={styles.fieldItem}><span className="material-symbols-outlined">check</span> Bank Name, Account Holder &amp; Account Number</div>
            <div className={styles.fieldItem}><span className="material-symbols-outlined">check</span> Family &amp; Nominee Details (NID &amp; Photo)</div>
            <div className={styles.fieldItem}><span className="material-symbols-outlined">check</span> Academic Degrees &amp; Prior Work History Repeaters</div>
          </div>

          <div className={styles.skipNote} style={{ background: 'rgba(139, 92, 246, 0.06)', color: '#7c3aed' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified</span>
            Features Live Digital Employee ID Badge preview and readiness meter.
          </div>
        </div>
      </div>
    </div>
  );
}
