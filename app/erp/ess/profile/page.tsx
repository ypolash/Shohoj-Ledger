"use client";

import React, { useState, useEffect } from 'react';
import styles from "../../income/page.module.css";
import { fetchMyProfile, updateMyProfile } from './actions';

export default function EssProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Editable state
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState(""); // UI only
  const [emergencyContact, setEmergencyContact] = useState(""); // UI only
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await fetchMyProfile();
      setProfile(data);
      if (data) {
        setPhone(data.phone || "");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateMyProfile({ phone });
      alert("Profile updated successfully!");
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>Loading your profile...</div>;
  if (!profile) return <div className="glass-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--danger)' }}>Profile not found. Contact HR.</div>;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-card" style={{ padding: 'var(--spacing-6)' }}>
        <h2 style={{ margin: '0 0 var(--spacing-6) 0' }}>My Profile</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Full Name</div>
            <div style={{ fontWeight: 500 }}>{profile.firstName} {profile.lastName}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Employee ID</div>
            <div style={{ fontWeight: 500 }}>{profile.employeeId}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Email</div>
            <div style={{ fontWeight: 500 }}>{profile.email}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Department</div>
            <div style={{ fontWeight: 500 }}>{profile.department || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Designation</div>
            <div style={{ fontWeight: 500 }}>{profile.designation}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Joining Date</div>
            <div style={{ fontWeight: 500 }}>{new Date(profile.joinDate).toLocaleDateString()}</div>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ margin: 0 }}>Editable Information</h3>
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup}>
              <label className="label">Phone Number</label>
              <input type="text" className="input" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Address (Simulated)</label>
              <input type="text" className="input" value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Emergency Contact (Simulated)</label>
              <input type="text" className="input" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
