"use client";

import React, { useState, useEffect } from 'react';
import styles from "../../income/page.module.css";
import { fetchMyLeaveRequests, applyMyLeave, cancelMyLeave } from './actions';

export default function EssLeavePage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [availableLeaveTypes, setAvailableLeaveTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Apply Leave form state
  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await fetchMyLeaveRequests();
      setLeaves(data);
      const res = await fetch("/api/ess/leave");
      if (res.ok) {
        const json = await res.json();
        const types = json.leaveTypes?.length > 0 ? json.leaveTypes : (json.balances || []);
        setAvailableLeaveTypes(types);
        if (types.length > 0) {
          setType(prev => prev || types[0].name);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) {
      alert("No leave type selected or configured.");
      return;
    }
    setIsApplying(true);
    try {
      await applyMyLeave({ type, startDate, endDate, reason });
      alert('Leave request submitted successfully.');
      setStartDate('');
      setEndDate('');
      setReason('');
      await loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsApplying(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this leave request?")) return;
    try {
      await cancelMyLeave(id);
      await loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const selectedTypeDetails = availableLeaveTypes.find(t => t.name === type || t.id === type);
  const isShortBreakSelected = Boolean(
    selectedTypeDetails?.isShortBreak ||
    selectedTypeDetails?.quotaModel === 'SHORT_BREAK' ||
    type.toLowerCase().includes('short break') ||
    type.toLowerCase().includes('break')
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div className="glass-card" style={{ padding: 'var(--spacing-6)' }}>
        <h2 style={{ margin: '0 0 var(--spacing-6) 0' }}>
          {isShortBreakSelected ? "Request Short Break (Instant Start)" : "Apply for Leave"}
        </h2>
        <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup}>
              <label className="label">Leave / Break Category</label>
              <select className="input" value={type} onChange={e => setType(e.target.value)} required>
                {availableLeaveTypes.length > 0 ? (
                  availableLeaveTypes.map(lt => (
                    <option key={lt.id || lt.name} value={lt.name}>
                      {lt.name} {lt.isShortBreak || lt.quotaModel === 'SHORT_BREAK' ? '(⏱️ Short Break)' : ''}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No leave types configured</option>
                )}
              </select>
            </div>

            {!isShortBreakSelected && (
              <>
                <div className={styles.filterGroup}>
                  <label className="label">Start Date</label>
                  <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                </div>
                <div className={styles.filterGroup}>
                  <label className="label">End Date</label>
                  <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                </div>
              </>
            )}
          </div>

          {/* Short Break Details & Warning Card */}
          {isShortBreakSelected && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.06) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>timer</span>
                Short Break Rules & Live Countdown Telemetry
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Duration:</span>
                  <strong style={{ color: 'var(--text-main)', fontSize: '14px' }}>
                    {selectedTypeDetails?.breakDurationMinutes || 30} Minutes
                  </strong>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Grace Period:</span>
                  <strong style={{ color: '#fbbf24', fontSize: '14px' }}>
                    +{selectedTypeDetails?.gracePeriodMinutes || 5} Min Tolerance
                  </strong>
                </div>
              </div>

              {/* Overstay Fine Warning */}
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '8px',
                padding: '12px 14px',
                color: '#fca5a5',
                fontSize: '12px',
                lineHeight: 1.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#ef4444', flexShrink: 0, marginTop: '1px' }}>warning</span>
                <div>
                  <strong>Overstay Fine Warning:</strong> If you exceed your allocated break duration (+ grace tolerance), an automatic fine of <strong>৳{selectedTypeDetails?.fineAmount || 50}</strong> will be immediately issued to your employee salary ledger.
                </div>
              </div>

              <div style={{ fontSize: '11.5px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>bolt</span>
                Instant Start: No HR approval required. Live countdown starts automatically upon clicking Request Break.
              </div>
            </div>
          )}

          <div className={styles.filterGroup}>
            <label className="label">
              {isShortBreakSelected ? "Break Reason / Note (Optional)" : "Reason *"}
            </label>
            <textarea
              className="input"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={isShortBreakSelected ? "e.g. Lunch, tea, personal errand..." : "Detailed reason for leave..."}
              required={!isShortBreakSelected}
              style={{ minHeight: isShortBreakSelected ? '60px' : '80px', resize: 'vertical' }}
            />
          </div>

          <button
            type="submit"
            className="btn"
            style={{
              alignSelf: 'flex-start',
              background: isShortBreakSelected ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'var(--primary)',
              color: '#ffffff',
              fontWeight: 700,
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer'
            }}
            disabled={isApplying}
          >
            {isApplying
              ? "Submitting..."
              : isShortBreakSelected
              ? "⚡ Start Short Break Now (Auto-Approved)"
              : "Submit Leave Request"}
          </button>
        </form>
      </div>

      <div className="glass-card" style={{ padding: 'var(--spacing-6)' }}>
        <h2 style={{ margin: '0 0 var(--spacing-6) 0' }}>My Leave History</h2>
        {isLoading ? (
          <div style={{ textAlign: 'center' }}>Loading leaves...</div>
        ) : leaves.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No leave history found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {leaves.map((leave) => (
              <div key={leave.id} style={{ 
                background: 'rgba(255,255,255,0.02)', 
                border: '1px solid rgba(255,255,255,0.05)', 
                borderRadius: '12px', 
                padding: '20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ 
                      fontSize: '12px', padding: '4px 10px', borderRadius: '99px', fontWeight: '500',
                      background: leave.type === 'SICK' ? 'rgba(239,68,68,0.1)' : leave.type === 'CASUAL' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)',
                      color: leave.type === 'SICK' ? '#f87171' : leave.type === 'CASUAL' ? '#60a5fa' : '#fbbf24'
                    }}>
                      {leave.type} LEAVE
                    </span>
                    <span style={{ 
                      fontSize: '12px', padding: '4px 10px', borderRadius: '99px', fontWeight: '500',
                      background: leave.status === 'APPROVED' ? 'rgba(16,185,129,0.1)' : leave.status === 'REJECTED' ? 'rgba(239,68,68,0.1)' : 'rgba(148,163,184,0.1)',
                      color: leave.status === 'APPROVED' ? '#34d399' : leave.status === 'REJECTED' ? '#f87171' : '#cbd5e1'
                    }}>
                      {leave.status}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
                    <div><strong style={{ color: '#cbd5e1' }}>From:</strong> {formatDate(leave.startDate)}</div>
                    <div><strong style={{ color: '#cbd5e1' }}>To:</strong> {formatDate(leave.endDate)}</div>
                  </div>
                  
                  <div style={{ fontSize: '14px', color: '#e2e8f0', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                    <strong style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Reason</strong>
                    {leave.reason}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {leave.status === 'PENDING' && (
                     <button onClick={() => handleCancel(leave.id)} className="btn" style={{ background: 'rgba(255,255,255,0.05)' }}>Cancel</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
