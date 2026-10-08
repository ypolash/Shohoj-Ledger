"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';

interface JobOpening {
  id: string;
  title: string;
  jobCode?: string;
  vacancies: number;
  status: string;
  openingDate: string;
  closingDate?: string;
  department?: { id: string; name: string };
  designation?: { id: string; name: string };
  _count?: { applications: number };
}

interface Applicant {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  resume?: string;
  linkedin?: string;
  portfolio?: string;
}

interface Application {
  id: string;
  currentStage: string;
  appliedAt: string;
  applicant: Applicant;
  jobOpening: JobOpening;
  interviews?: {
    id: string;
    type: string;
    date: string;
    status: string;
    interviewer?: { firstName: string; lastName: string };
    feedbacks?: any[];
  }[];
  jobOffers?: {
    id: string;
    salary: number;
    joiningDate: string;
    status: string;
  }[];
}

const STAGES = [
  { key: 'APPLIED', label: 'Applied', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)' },
  { key: 'SCREENING', label: 'Screening', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' },
  { key: 'INTERVIEW', label: 'Interview', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)' },
  { key: 'OFFER', label: 'Job Offer', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
  { key: 'HIRED', label: 'Hired', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  { key: 'REJECTED', label: 'Rejected', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
];

export default function RecruitmentPage() {
  const [jobOpenings, setJobOpenings] = useState<JobOpening[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [designations, setDesignations] = useState<{ id: string; name: string }[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  // Filters & View Mode
  const [selectedJob, setSelectedJob] = useState('ALL');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'pipeline' | 'table' | 'jobs'>('pipeline');

  // Modals
  const [showJobModal, setShowJobModal] = useState(false);
  const [showApplicantModal, setShowApplicantModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Forms
  const [jobForm, setJobForm] = useState({
    title: '',
    departmentId: '',
    designationId: '',
    vacancies: '1',
    openingDate: new Date().toISOString().slice(0, 10),
    closingDate: '',
  });

  const [applicantForm, setApplicantForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    jobOpeningId: '',
    resume: '',
    linkedin: '',
    portfolio: '',
    currentStage: 'APPLIED',
  });

  const [interviewForm, setInterviewForm] = useState({
    type: 'Technical & System Design',
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    interviewerId: '',
    location: 'Office HQ / Room 2B',
    onlineLink: '',
  });

  const [offerForm, setOfferForm] = useState({
    salary: '45000',
    joiningDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    departmentId: '',
    designationId: '',
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
      const res = await fetch('/api/hr/recruitment');
      if (res.ok) {
        const data = await res.json();
        setJobOpenings(data.jobOpenings || []);
        setApplications(data.applications || []);
        setDepartments(data.departments || []);
        setDesignations(data.designations || []);
        setEmployees(data.employees || []);
        setStats(data.stats || {});
      }
    } catch (e) {
      console.error('Failed to load recruitment data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create Job
  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/hr/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_JOB', ...jobForm }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Failed to create job');
        return;
      }
      showToast('Job opening posted successfully!');
      setShowJobModal(false);
      loadData();
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  // Add Candidate
  const handleAddApplicant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/hr/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ADD_APPLICANT', ...applicantForm }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Failed to add candidate');
        return;
      }
      showToast('Candidate registered into talent pipeline!');
      setShowApplicantModal(false);
      loadData();
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  // Update Candidate Stage
  const handleStageChange = async (appId: string, newStage: string) => {
    try {
      const res = await fetch('/api/hr/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_STAGE', applicationId: appId, newStage }),
      });
      if (res.ok) {
        showToast(`Candidate moved to ${newStage}`);
        loadData();
      }
    } catch {
      showToast('Failed to update stage');
    }
  };

  // Schedule Interview
  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/hr/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SCHEDULE_INTERVIEW',
          applicationId: selectedApp.id,
          ...interviewForm,
        }),
      });
      if (res.ok) {
        showToast('Interview scheduled & synchronized with calendar!');
        setShowInterviewModal(false);
        loadData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Make Offer
  const handleMakeOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/hr/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'MAKE_OFFER',
          applicationId: selectedApp.id,
          ...offerForm,
        }),
      });
      if (res.ok) {
        showToast('Job offer created & candidate updated to OFFER stage!');
        setShowOfferModal(false);
        loadData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Applications
  const filteredApps = useMemo(() => {
    return applications.filter(a => {
      const matchesJob = selectedJob === 'ALL' || a.jobOpening?.id === selectedJob;
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        a.applicant?.fullName?.toLowerCase().includes(q) ||
        a.applicant?.email?.toLowerCase().includes(q);
      return matchesJob && matchesSearch;
    });
  }, [applications, selectedJob, search]);

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
            Talent Acquisition & ATS Pipeline
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            Manage requisitions, applicant pipelines, multi-round interview scoring, and automated job offers.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => { setShowApplicantModal(true); setError(''); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
            Add Candidate
          </button>

          <button
            className="btn btn-primary"
            onClick={() => { setShowJobModal(true); setError(''); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            Post Job Opening
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Active Openings', value: stats.openJobs ?? 0, icon: 'campaign', color: '#3b82f6' },
          { label: 'Total Applicants', value: stats.totalApplicants ?? 0, icon: 'groups', color: '#8b5cf6' },
          { label: 'In Interviews', value: stats.stageCounts?.INTERVIEW ?? 0, icon: 'record_voice_over', color: '#fbbf24' },
          { label: 'Offers Extended', value: stats.stageCounts?.OFFER ?? 0, icon: 'workspace_premium', color: '#ec4899' },
          { label: 'Hired Candidates', value: stats.stageCounts?.HIRED ?? 0, icon: 'verified', color: '#10b981' },
        ].map((kpi, i) => (
          <div key={i} className="glass-card" style={{ padding: '16px 20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{kpi.label}</span>
              <span className="material-symbols-outlined" style={{ color: kpi.color, fontSize: '20px' }}>{kpi.icon}</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)' }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Filter and View Toggles */}
      <div className="glass-card" style={{ padding: '16px 20px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-input)', border: '1px solid var(--border-main)', borderRadius: '10px', padding: '6px 12px', minWidth: '220px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-muted)' }}>search</span>
            <input
              type="text"
              placeholder="Search candidate name, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '13px', outline: 'none', width: '100%' }}
            />
          </div>

          <select
            value={selectedJob}
            onChange={e => setSelectedJob(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '13px' }}
          >
            <option value="ALL">All Job Openings ({jobOpenings.length})</option>
            {jobOpenings.map(j => (
              <option key={j.id} value={j.id}>{j.title} ({j.vacancies} vacancies)</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {[
            { mode: 'pipeline', label: 'Kanban Pipeline', icon: 'view_kanban' },
            { mode: 'table', label: 'Candidates Table', icon: 'table_rows' },
            { mode: 'jobs', label: 'Job Positions', icon: 'work' },
          ].map(btn => (
            <button
              key={btn.mode}
              onClick={() => setViewMode(btn.mode as any)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid',
                borderColor: viewMode === btn.mode ? 'var(--primary)' : 'var(--border-main)',
                background: viewMode === btn.mode ? 'var(--primary-subtle)' : 'transparent',
                color: viewMode === btn.mode ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{btn.icon}</span>
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW MODE 1: KANBAN PIPELINE */}
      {viewMode === 'pipeline' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', alignItems: 'start' }}>
          {STAGES.map(st => {
            const stageApps = filteredApps.filter(a => a.currentStage === st.key);
            return (
              <div key={st.key} className="glass-card" style={{ padding: '16px', borderRadius: '16px', minHeight: '380px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${st.color}`, paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)' }}>{st.label}</span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: st.bg, color: st.color }}>
                    {stageApps.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
                  {stageApps.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                      No candidates in this stage
                    </div>
                  ) : (
                    stageApps.map(app => (
                      <div
                        key={app.id}
                        style={{
                          background: 'var(--surface-hover)',
                          border: '1px solid var(--border-main)',
                          borderRadius: '12px',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
                          {app.applicant?.fullName}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>
                          {app.jobOpening?.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {app.applicant?.email}
                        </div>

                        {app.applicant?.resume && (
                          <a
                            href={app.applicant.resume}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: '11px', color: '#38bdf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>description</span>
                            View Resume
                          </a>
                        )}

                        {/* Stage Actions */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-main)' }}>
                          <select
                            value={app.currentStage}
                            onChange={e => handleStageChange(app.id, e.target.value)}
                            style={{ padding: '4px 6px', borderRadius: '6px', fontSize: '11px', background: 'var(--surface-input)', color: 'var(--text-main)', border: '1px solid var(--border-main)' }}
                          >
                            {STAGES.map(s => (
                              <option key={s.key} value={s.key}>{s.label}</option>
                            ))}
                          </select>

                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => { setSelectedApp(app); setShowInterviewModal(true); }}
                              title="Schedule Interview"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fbbf24', padding: '2px' }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>event</span>
                            </button>

                            <button
                              onClick={() => { setSelectedApp(app); setShowOfferModal(true); }}
                              title="Make Job Offer"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', padding: '2px' }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>verified</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: CANDIDATES TABLE */}
      {viewMode === 'table' && (
        <div className="glass-card" style={{ borderRadius: '16px', overflow: 'hidden', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
                {['Candidate', 'Position Applied', 'Contact', 'Applied Date', 'Stage', 'Actions'].map((h, i) => (
                  <th key={h} style={{ padding: '14px 18px', textAlign: i === 5 ? 'right' : 'left', fontWeight: 600, color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredApps.map(app => (
                <tr key={app.id} style={{ borderBottom: '1px solid var(--border-main)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-main)' }}>
                    {app.applicant?.fullName}
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--primary)', fontWeight: 500 }}>
                    {app.jobOpening?.title}
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                    <div>{app.applicant?.email}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{app.applicant?.phone || '—'}</div>
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                    {new Date(app.appliedAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '16px', fontSize: '11px', fontWeight: 700, background: 'var(--surface-hover)', color: 'var(--text-main)' }}>
                      {app.currentStage}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <button
                      onClick={() => { setSelectedApp(app); setShowInterviewModal(true); }}
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      Interview
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW MODE 3: JOB OPENINGS LIST */}
      {viewMode === 'jobs' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {jobOpenings.map(job => (
            <div key={job.id} className="glass-card" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>{job.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {job.department?.name || 'General'} · <span style={{ color: 'var(--primary)' }}>{job.jobCode}</span>
                  </div>
                </div>
                <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                  {job.status}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', paddingTop: '8px', borderTop: '1px solid var(--border-main)' }}>
                <span>Vacancies: <strong>{job.vacancies}</strong></span>
                <span>Applications: <strong>{job._count?.applications ?? 0}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Job Modal */}
      {showJobModal && (
        <div style={modalOverlayStyle} onClick={e => { if (e.target === e.currentTarget) setShowJobModal(false); }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '520px', borderRadius: '20px', padding: '28px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>Post Job Requisition</h2>
            {error && <div style={errorBannerStyle}>⚠ {error}</div>}
            <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Job Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Fullstack Engineer"
                  value={jobForm.title}
                  onChange={e => setJobForm(f => ({ ...f, title: e.target.value }))}
                  required
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Department</label>
                  <select
                    value={jobForm.departmentId}
                    onChange={e => setJobForm(f => ({ ...f, departmentId: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="">— Select —</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Vacancies *</label>
                  <input
                    type="number"
                    value={jobForm.vacancies}
                    onChange={e => setJobForm(f => ({ ...f, vacancies: e.target.value }))}
                    min="1"
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowJobModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Posting…' : 'Publish Opening'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {showApplicantModal && (
        <div style={modalOverlayStyle} onClick={e => { if (e.target === e.currentTarget) setShowApplicantModal(false); }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '520px', borderRadius: '20px', padding: '28px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>Register Candidate</h2>
            {error && <div style={errorBannerStyle}>⚠ {error}</div>}
            <form onSubmit={handleAddApplicant} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Candidate Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Shakib Al Hasan"
                  value={applicantForm.fullName}
                  onChange={e => setApplicantForm(f => ({ ...f, fullName: e.target.value }))}
                  required
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Email Address *</label>
                  <input
                    type="email"
                    placeholder="shakib@gmail.com"
                    value={applicantForm.email}
                    onChange={e => setApplicantForm(f => ({ ...f, email: e.target.value }))}
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input
                    type="text"
                    placeholder="+8801700000000"
                    value={applicantForm.phone}
                    onChange={e => setApplicantForm(f => ({ ...f, phone: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Position Applied For *</label>
                <select
                  value={applicantForm.jobOpeningId}
                  onChange={e => setApplicantForm(f => ({ ...f, jobOpeningId: e.target.value }))}
                  required
                  style={inputStyle}
                >
                  <option value="">— Select Job Opening —</option>
                  {jobOpenings.map(j => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Resume / CV Link</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... or portfolio link"
                  value={applicantForm.resume}
                  onChange={e => setApplicantForm(f => ({ ...f, resume: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowApplicantModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Registering…' : 'Add to Pipeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showInterviewModal && selectedApp && (
        <div style={modalOverlayStyle} onClick={e => { if (e.target === e.currentTarget) setShowInterviewModal(false); }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', borderRadius: '20px', padding: '28px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>Schedule Interview</h2>
            <p style={{ margin: '-10px 0 16px', fontSize: '13px', color: 'var(--text-muted)' }}>
              Candidate: <strong>{selectedApp.applicant.fullName}</strong> ({selectedApp.jobOpening.title})
            </p>
            <form onSubmit={handleScheduleInterview} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Interview Round / Type</label>
                <input
                  type="text"
                  value={interviewForm.type}
                  onChange={e => setInterviewForm(f => ({ ...f, type: e.target.value }))}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Date & Time *</label>
                <input
                  type="datetime-local"
                  value={interviewForm.date}
                  onChange={e => setInterviewForm(f => ({ ...f, date: e.target.value }))}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Interviewer (Staff) *</label>
                <select
                  value={interviewForm.interviewerId}
                  onChange={e => setInterviewForm(f => ({ ...f, interviewerId: e.target.value }))}
                  required
                  style={inputStyle}
                >
                  <option value="">— Select Interviewer —</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.designation || 'Staff'})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowInterviewModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  Schedule Interview
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Make Offer Modal */}
      {showOfferModal && selectedApp && (
        <div style={modalOverlayStyle} onClick={e => { if (e.target === e.currentTarget) setShowOfferModal(false); }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', borderRadius: '20px', padding: '28px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>Extend Job Offer</h2>
            <form onSubmit={handleMakeOffer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Offered Monthly Salary (BDT) *</label>
                <input
                  type="number"
                  value={offerForm.salary}
                  onChange={e => setOfferForm(f => ({ ...f, salary: e.target.value }))}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Expected Joining Date *</label>
                <input
                  type="date"
                  value={offerForm.joiningDate}
                  onChange={e => setOfferForm(f => ({ ...f, joiningDate: e.target.value }))}
                  required
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowOfferModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  Generate Offer Letter
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
