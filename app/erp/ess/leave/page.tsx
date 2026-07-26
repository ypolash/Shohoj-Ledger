"use client";

import React, { useState, useEffect } from 'react';
import styles from "../../income/page.module.css";
import { fetchMyLeaveRequests, applyMyLeave, cancelMyLeave } from './actions';

export default function EssLeavePage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Apply Leave form state
  const [type, setType] = useState('CASUAL');
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
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div className="glass-card" style={{ padding: 'var(--spacing-6)' }}>
        <h2 style={{ margin: '0 0 var(--spacing-6) 0' }}>Apply for Leave</h2>
        <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup}>
              <label className="label">Leave Type</label>
              <select className="input" value={type} onChange={e => setType(e.target.value)} required>
                <option value="CASUAL">Casual Leave</option>
                <option value="SICK">Sick Leave</option>
                <option value="UNPAID">Unpaid Leave</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Start Date</label>
              <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div className={styles.filterGroup}>
              <label className="label">End Date</label>
              <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} required />
            </div>
          </div>
          <div className={styles.filterGroup}>
            <label className="label">Reason</label>
            <textarea className="input" value={reason} onChange={e => setReason(e.target.value)} required style={{ minHeight: '80px', resize: 'vertical' }}></textarea>
          </div>
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={isApplying}>
            {isApplying ? "Submitting..." : "Submit Leave Request"}
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
