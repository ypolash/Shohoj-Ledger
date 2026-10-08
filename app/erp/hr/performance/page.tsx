"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';

interface PerformanceReview {
  id: string;
  period: string;
  overallRating: number;
  reviewDate: string;
  strengths?: string;
  improvements?: string;
  feedback?: string;
  status: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    designation?: string;
    departmentRef?: { name: string };
    designationRef?: { name: string };
  };
  reviewer: {
    firstName: string;
    lastName: string;
  };
}

interface PerformanceGoal {
  id: string;
  title: string;
  description?: string;
  progress: number;
  weight: number;
  status: string;
  targetDate: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  };
}

interface PIP {
  id: string;
  startDate: string;
  endDate: string;
  objectives: string;
  status: string;
  outcome?: string;
  employee: {
    firstName: string;
    lastName: string;
    employeeId: string;
  };
}

export default function PerformancePage() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [pips, setPips] = useState<PIP[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'reviews' | 'goals' | 'pips'>('reviews');
  const [search, setSearch] = useState('');

  // Modals
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showPipModal, setShowPipModal] = useState(false);

  // Forms
  const [reviewForm, setReviewForm] = useState({
    employeeId: '',
    reviewerId: '',
    period: '2026 Q3 Annual Appraisal',
    overallRating: '5',
    strengths: '',
    improvements: '',
    feedback: '',
  });

  const [goalForm, setGoalForm] = useState({
    employeeId: '',
    title: '',
    description: '',
    targetDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    weight: '20',
  });

  const [pipForm, setPipForm] = useState({
    employeeId: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
    objectives: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/hr/performance');
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setGoals(data.goals || []);
        setPips(data.pips || []);
        setEmployees(data.employees || []);
        setStats(data.stats || {});
      }
    } catch (e) {
      console.error('Failed to load performance data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Submit Review
  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/hr/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_REVIEW', ...reviewForm }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Failed to submit review');
        return;
      }
      showToast('Appraisal review recorded successfully!');
      setShowReviewModal(false);
      loadData();
    } catch {
      setError('Network connection error');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Goal
  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/hr/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_GOAL', ...goalForm }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Failed to create goal');
        return;
      }
      showToast('KPI objective goal assigned!');
      setShowGoalModal(false);
      loadData();
    } catch {
      setError('Network connection error');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit PIP
  const handleCreatePip = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/hr/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_PIP', ...pipForm }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Failed to start PIP');
        return;
      }
      showToast('Performance Improvement Plan activated.');
      setShowPipModal(false);
      loadData();
    } catch {
      setError('Network connection error');
    } finally {
      setSubmitting(false);
    }
  };

  // Update Goal Progress Slider
  const handleGoalProgressChange = async (goalId: string, newProgress: number) => {
    try {
      await fetch('/api/hr/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_GOAL', goalId, progress: newProgress }),
      });
      loadData();
    } catch {
      showToast('Failed to update progress');
    }
  };

  // Filtered Reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      const q = search.toLowerCase();
      const emp = `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.toLowerCase();
      const id = (r.employee?.employeeId || '').toLowerCase();
      return !q || emp.includes(q) || id.includes(q);
    });
  }, [reviews, search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          padding: '12px 20px', borderRadius: '10px', background: '#10b981', color: '#fff',
          fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
        }}>
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>
            Performance & Appraisals Hub
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            360 appraisals, quantifiable KPI goal tracking, and structured Performance Improvement Plans (PIP).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => { setShowGoalModal(true); setError(''); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>flag</span>
            Assign Goal
          </button>

          <button
            className="btn btn-primary"
            onClick={() => { setShowReviewModal(true); setError(''); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            New Appraisal Review
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Average Appraisal Rating', value: `${stats.avgRating ?? '5.0'} / 5.0`, icon: 'star', color: '#f59e0b' },
          { label: 'Completed Reviews', value: stats.totalReviews ?? 0, icon: 'fact_check', color: '#3b82f6' },
          { label: 'Active KPI Goals', value: stats.activeGoals ?? 0, icon: 'trending_up', color: '#8b5cf6' },
          { label: 'Goals Achieved', value: stats.achievedGoals ?? 0, icon: 'emoji_events', color: '#10b981' },
          { label: 'Active PIPs', value: stats.activePips ?? 0, icon: 'healing', color: '#ef4444' },
        ].map((kpi, i) => (
          <div key={i} className="glass-card" style={{ padding: '16px 20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{kpi.label}</span>
              <span className="material-symbols-outlined" style={{ color: kpi.color, fontSize: '20px' }}>{kpi.icon}</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs & Filter Bar */}
      <div className="glass-card" style={{ padding: '14px 20px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {[
            { key: 'reviews', label: 'Appraisal Reviews', icon: 'rate_review', count: reviews.length },
            { key: 'goals', label: 'KPI Goals & Targets', icon: 'track_changes', count: goals.length },
            { key: 'pips', label: 'Improvement Plans (PIP)', icon: 'rule', count: pips.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                border: '1px solid',
                borderColor: activeTab === tab.key ? 'var(--primary)' : 'transparent',
                background: activeTab === tab.key ? 'var(--primary-subtle)' : 'transparent',
                color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{tab.icon}</span>
              {tab.label}
              <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '10px', background: 'var(--surface-hover)', color: 'var(--text-muted)' }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-input)', border: '1px solid var(--border-main)', borderRadius: '10px', padding: '6px 12px', minWidth: '220px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-muted)' }}>search</span>
          <input
            type="text"
            placeholder="Search employee..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '13px', outline: 'none', width: '100%' }}
          />
        </div>
      </div>

      {/* TAB 1: REVIEWS TABLE */}
      {activeTab === 'reviews' && (
        <div className="glass-card" style={{ borderRadius: '16px', overflow: 'hidden', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
                {['Employee', 'Appraisal Period', 'Rating', 'Reviewer', 'Key Strengths & Feedback', 'Date'].map(h => (
                  <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                    No appraisal reviews recorded. Click "New Appraisal Review" to create one.
                  </td>
                </tr>
              ) : (
                filteredReviews.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border-main)' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {r.employee?.firstName} {r.employee?.lastName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {r.employee?.designationRef?.name || r.employee?.designation || 'Staff'} · <span style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>{r.employee?.employeeId}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {r.period}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', fontWeight: 700 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>star</span>
                        {r.overallRating} / 5.0
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                      {r.reviewer ? `${r.reviewer.firstName} ${r.reviewer.lastName}` : 'HR Manager'}
                    </td>
                    <td style={{ padding: '14px 18px', maxWidth: '300px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '12px' }}>{r.strengths || 'Consistent execution'}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{r.feedback || 'Exceeds role expectations'}</div>
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                      {new Date(r.reviewDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: GOALS TRACKER */}
      {activeTab === 'goals' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {goals.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              No active goals assigned yet.
            </div>
          ) : (
            goals.map(g => (
              <div key={g.id} className="glass-card" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>{g.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Assigned to: <strong>{g.employee?.firstName} {g.employee?.lastName}</strong> ({g.employee?.employeeId})
                    </div>
                  </div>
                  <span style={{
                    padding: '3px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                    background: g.status === 'ACHIEVED' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                    color: g.status === 'ACHIEVED' ? '#10b981' : '#3b82f6'
                  }}>
                    {g.status}
                  </span>
                </div>

                {g.description && (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{g.description}</div>
                )}

                {/* Progress Bar & Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span>Progress</span>
                    <span>{g.progress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={g.progress}
                    onChange={e => handleGoalProgressChange(g.id, Number(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', paddingTop: '8px', borderTop: '1px solid var(--border-main)' }}>
                  <span>Weightage: {Number(g.weight)}%</span>
                  <span>Target Due: {new Date(g.targetDate).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: PIPS LIST */}
      {activeTab === 'pips' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-secondary"
              onClick={() => { setShowPipModal(true); setError(''); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
              Initiate PIP Plan
            </button>
          </div>

          <div className="glass-card" style={{ borderRadius: '16px', overflow: 'hidden', padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
                  {['Employee', 'Timeline', 'Objectives & Target Milestones', 'Status'].map(h => (
                    <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pips.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                      No active Performance Improvement Plans.
                    </td>
                  </tr>
                ) : (
                  pips.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-main)' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-main)' }}>
                        {p.employee?.firstName} {p.employee?.lastName} ({p.employee?.employeeId})
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                        {new Date(p.startDate).toLocaleDateString()} ➔ {new Date(p.endDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-main)' }}>
                        {p.objectives}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Review Modal */}
      {showReviewModal && (
        <div style={modalOverlayStyle} onClick={e => { if (e.target === e.currentTarget) setShowReviewModal(false); }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '540px', borderRadius: '20px', padding: '28px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>Record Appraisal Review</h2>
            {error && <div style={errorBannerStyle}>⚠ {error}</div>}
            <form onSubmit={handleCreateReview} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Employee *</label>
                <select
                  value={reviewForm.employeeId}
                  onChange={e => setReviewForm(f => ({ ...f, employeeId: e.target.value }))}
                  required
                  style={inputStyle}
                >
                  <option value="">— Select Employee —</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeId})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Reviewer *</label>
                  <select
                    value={reviewForm.reviewerId}
                    onChange={e => setReviewForm(f => ({ ...f, reviewerId: e.target.value }))}
                    required
                    style={inputStyle}
                  >
                    <option value="">— Select Reviewer —</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Rating (1-5 Stars) *</label>
                  <select
                    value={reviewForm.overallRating}
                    onChange={e => setReviewForm(f => ({ ...f, overallRating: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="5">⭐⭐⭐⭐⭐ 5.0 - Exceptional</option>
                    <option value="4">⭐⭐⭐⭐ 4.0 - Exceeds Expectations</option>
                    <option value="3">⭐⭐⭐ 3.0 - Meets Expectations</option>
                    <option value="2">⭐⭐ 2.0 - Needs Improvement</option>
                    <option value="1">⭐ 1.0 - Unsatisfactory</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Appraisal Period *</label>
                <input
                  type="text"
                  value={reviewForm.period}
                  onChange={e => setReviewForm(f => ({ ...f, period: e.target.value }))}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Key Strengths</label>
                <input
                  type="text"
                  placeholder="e.g. Excellent system architecture, team mentoring"
                  value={reviewForm.strengths}
                  onChange={e => setReviewForm(f => ({ ...f, strengths: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Evaluation Feedback & Comments</label>
                <textarea
                  rows={3}
                  placeholder="Detailed appraisal notes..."
                  value={reviewForm.feedback}
                  onChange={e => setReviewForm(f => ({ ...f, feedback: e.target.value }))}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowReviewModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  Save Appraisal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Goal Modal */}
      {showGoalModal && (
        <div style={modalOverlayStyle} onClick={e => { if (e.target === e.currentTarget) setShowGoalModal(false); }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', borderRadius: '20px', padding: '28px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>Assign KPI Target Goal</h2>
            <form onSubmit={handleCreateGoal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Employee *</label>
                <select
                  value={goalForm.employeeId}
                  onChange={e => setGoalForm(f => ({ ...f, employeeId: e.target.value }))}
                  required
                  style={inputStyle}
                >
                  <option value="">— Select Employee —</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Goal Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Reduce client response time below 15 mins"
                  value={goalForm.title}
                  onChange={e => setGoalForm(f => ({ ...f, title: e.target.value }))}
                  required
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Weightage (%)</label>
                  <input
                    type="number"
                    value={goalForm.weight}
                    onChange={e => setGoalForm(f => ({ ...f, weight: e.target.value }))}
                    min="1"
                    max="100"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Target Due Date *</label>
                  <input
                    type="date"
                    value={goalForm.targetDate}
                    onChange={e => setGoalForm(f => ({ ...f, targetDate: e.target.value }))}
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowGoalModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  Assign Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Start PIP Modal */}
      {showPipModal && (
        <div style={modalOverlayStyle} onClick={e => { if (e.target === e.currentTarget) setShowPipModal(false); }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', borderRadius: '20px', padding: '28px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>Initiate Improvement Plan</h2>
            <form onSubmit={handleCreatePip} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Employee *</label>
                <select
                  value={pipForm.employeeId}
                  onChange={e => setPipForm(f => ({ ...f, employeeId: e.target.value }))}
                  required
                  style={inputStyle}
                >
                  <option value="">— Select Employee —</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeId})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Start Date *</label>
                  <input
                    type="date"
                    value={pipForm.startDate}
                    onChange={e => setPipForm(f => ({ ...f, startDate: e.target.value }))}
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>End Date *</label>
                  <input
                    type="date"
                    value={pipForm.endDate}
                    onChange={e => setPipForm(f => ({ ...f, endDate: e.target.value }))}
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Measurable Objectives & Action Items *</label>
                <textarea
                  rows={3}
                  placeholder="Define concrete targets required for successful completion..."
                  value={pipForm.objectives}
                  onChange={e => setPipForm(f => ({ ...f, objectives: e.target.value }))}
                  required
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPipModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  Activate Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.65)',
  backdropFilter: 'blur(6px)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: '6px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid var(--border-main)',
  background: 'var(--surface-input)',
  color: 'var(--text-main)',
  fontSize: '14px',
  boxSizing: 'border-box',
};

const errorBannerStyle: React.CSSProperties = {
  marginBottom: '16px',
  padding: '12px 16px',
  borderRadius: '10px',
  background: 'var(--danger-subtle)',
  color: 'var(--danger)',
  fontSize: '13px',
  fontWeight: 500,
};
