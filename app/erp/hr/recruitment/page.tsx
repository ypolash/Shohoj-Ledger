"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import styles from './recruitment.module.css';

interface Department {
  id: string;
  name: string;
}

interface Designation {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId?: string;
  designation?: { name: string } | string;
}

interface JobOpening {
  id: string;
  title: string;
  jobCode?: string;
  vacancies: number;
  status: 'OPEN' | 'PAUSED' | 'CLOSED' | string;
  openingDate: string;
  closingDate?: string;
  department?: Department;
  designation?: Designation;
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
  status?: string;
}

interface InterviewFeedback {
  id: string;
  technicalScore: number;
  communicationScore: number;
  cultureScore: number;
  overallScore: number;
  recommendation: 'STRONG_HIRE' | 'HIRE' | 'NEUTRAL' | 'DO_NOT_HIRE' | string;
  comments?: string;
  createdAt?: string;
}

interface Interview {
  id: string;
  type: string;
  date: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | string;
  location?: string;
  onlineLink?: string;
  interviewer?: Employee;
  feedbacks?: InterviewFeedback[];
}

interface JobOffer {
  id: string;
  salary: number;
  joiningDate: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | string;
  createdAt?: string;
}

interface Application {
  id: string;
  jobOpeningId: string;
  applicantId: string;
  currentStage: 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED' | string;
  source?: string;
  appliedAt: string;
  applicant: Applicant;
  jobOpening: JobOpening;
  interviews?: Interview[];
  jobOffers?: JobOffer[];
}

const STAGES = [
  { key: 'APPLIED', label: 'Applied', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.25)', icon: 'inbox' },
  { key: 'SCREENING', label: 'Screening', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.25)', icon: 'filter_list' },
  { key: 'INTERVIEW', label: 'Interview', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)', border: 'rgba(251, 191, 36, 0.25)', icon: 'record_voice_over' },
  { key: 'OFFER', label: 'Job Offer', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.12)', border: 'rgba(192, 132, 252, 0.25)', icon: 'workspace_premium' },
  { key: 'HIRED', label: 'Hired', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)', border: 'rgba(52, 211, 153, 0.25)', icon: 'verified' },
  { key: 'REJECTED', label: 'Archived', color: '#f87171', bg: 'rgba(248, 113, 113, 0.12)', border: 'rgba(248, 113, 113, 0.25)', icon: 'archive' },
];

export default function RecruitmentPage() {
  const [jobOpenings, setJobOpenings] = useState<JobOpening[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  // Filters & View Mode
  const [selectedJob, setSelectedJob] = useState('ALL');
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'pipeline' | 'table' | 'jobs' | 'analytics'>('pipeline');

  // Modals & Dossier Drawer
  const [showJobModal, setShowJobModal] = useState(false);
  const [showApplicantModal, setShowApplicantModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showScorecardModal, setShowScorecardModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [activeInterview, setActiveInterview] = useState<Interview | null>(null);

  // Forms
  const [jobForm, setJobForm] = useState({
    title: '',
    jobCode: '',
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
    source: 'LinkedIn Talent Solutions',
  });

  const [interviewForm, setInterviewForm] = useState({
    type: 'Technical & System Architecture Round',
    date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
    interviewerId: '',
    location: 'Virtual Conference (Google Meet)',
    onlineLink: 'https://meet.google.com/shohoj-ats-interview',
  });

  const [scorecardForm, setScorecardForm] = useState({
    technicalScore: 5,
    communicationScore: 4,
    cultureScore: 5,
    overallScore: 5,
    recommendation: 'STRONG_HIRE',
    comments: '',
  });

  const [offerForm, setOfferForm] = useState({
    salary: '75000',
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

  // Keep selectedApp in sync with latest applications data
  useEffect(() => {
    if (selectedApp) {
      const refreshed = applications.find(a => a.id === selectedApp.id);
      if (refreshed) setSelectedApp(refreshed);
    }
  }, [applications, selectedApp]);

  // Create Job Opening
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
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'Failed to create job');
        return;
      }
      showToast('Requisition published to Talent Pipeline!');
      setShowJobModal(false);
      setJobForm({
        title: '',
        jobCode: '',
        departmentId: '',
        designationId: '',
        vacancies: '1',
        openingDate: new Date().toISOString().slice(0, 10),
        closingDate: '',
      });
      await loadData();
    } catch {
      setError('Network communication error');
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
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'Failed to add candidate');
        return;
      }
      showToast('Candidate onboarded into talent pipeline!');
      setShowApplicantModal(false);
      setApplicantForm({
        fullName: '',
        email: '',
        phone: '',
        jobOpeningId: '',
        resume: '',
        linkedin: '',
        portfolio: '',
        currentStage: 'APPLIED',
        source: 'LinkedIn Talent Solutions',
      });
      await loadData();
    } catch {
      setError('Network communication error');
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
        await loadData();
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
        showToast('Interview round scheduled & calendar sync initiated!');
        setShowInterviewModal(false);
        await loadData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Scorecard
  const handleSubmitScorecard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInterview || !employees.length) return;
    setSubmitting(true);
    try {
      const interviewerId = activeInterview.interviewer?.id || employees[0]?.id;
      const res = await fetch('/api/hr/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SUBMIT_FEEDBACK',
          interviewId: activeInterview.id,
          interviewerId,
          ...scorecardForm,
        }),
      });
      if (res.ok) {
        showToast('Interview Scorecard & Rubric successfully submitted!');
        setShowScorecardModal(false);
        await loadData();
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
        showToast('Job offer package generated & stage set to OFFER!');
        setShowOfferModal(false);
        await loadData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Job Opening Status
  const handleToggleJobStatus = async (jobId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'OPEN' ? 'PAUSED' : currentStatus === 'PAUSED' ? 'CLOSED' : 'OPEN';
    try {
      const res = await fetch('/api/hr/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_JOB_STATUS',
          jobOpeningId: jobId,
          status: nextStatus
        }),
      });
      if (res.ok) {
        showToast(`Requisition status updated to ${nextStatus}!`);
        await loadData();
      }
    } catch {
      showToast('Failed to toggle job status');
    }
  };

  // Delete Application
  const handleDeleteApplication = async (appId: string) => {
    if (!confirm('Are you sure you want to remove this candidate from the ATS pipeline?')) return;
    try {
      const res = await fetch('/api/hr/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_APPLICATION', applicationId: appId }),
      });
      if (res.ok) {
        showToast('Candidate removed from pipeline');
        if (selectedApp?.id === appId) setSelectedApp(null);
        await loadData();
      }
    } catch {
      showToast('Failed to remove candidate');
    }
  };

  // Seed Demo Enterprise Candidates
  const handleSeedDemoData = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/hr/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SEED_DEMO_DATA' })
      });
      if (res.ok) {
        showToast('Enterprise requisitions & candidate pipelines loaded!');
        await loadData();
      } else {
        showToast('Failed to load demo data');
      }
    } catch {
      showToast('Network communication error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Applications
  const filteredApps = useMemo(() => {
    return applications.filter(a => {
      const matchesJob = selectedJob === 'ALL' || a.jobOpening?.id === selectedJob;
      const matchesStage = selectedStage === 'ALL' || a.currentStage === selectedStage;
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        a.applicant?.fullName?.toLowerCase().includes(q) ||
        a.applicant?.email?.toLowerCase().includes(q) ||
        a.jobOpening?.title?.toLowerCase().includes(q) ||
        a.source?.toLowerCase().includes(q);
      return matchesJob && matchesStage && matchesSearch;
    });
  }, [applications, selectedJob, selectedStage, search]);

  // Funnel calculations
  const totalAppsCount = applications.length;
  const stageStats = useMemo(() => {
    const counts: Record<string, number> = {};
    STAGES.forEach(s => {
      counts[s.key] = applications.filter(a => a.currentStage === s.key).length;
    });
    return counts;
  }, [applications]);

  const activeJobsCount = jobOpenings.filter(j => j.status === 'OPEN').length;

  return (
    <div className={styles.container}>
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          padding: '12px 22px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#ffffff', fontWeight: 700, fontSize: '13.5px', boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeIn 0.2s ease'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
          <span>{toast}</span>
        </div>
      )}

      {/* ----------------------------------------------------------------------
          Executive Header
          ---------------------------------------------------------------------- */}
      <div className={styles.headerCard}>
        <div className={styles.titleGroup}>
          <div className={styles.pageTitleRow}>
            <div className={styles.badgeATS}>
              <div className={styles.statusDotPulse} />
              <span>Enterprise ATS • Live Pipeline</span>
            </div>
          </div>
          <h1 className={styles.pageTitle}>Talent Acquisition & ATS Pipeline</h1>
          <p className={styles.pageSubtitle}>
            Manage job requisitions, candidate scoring rubrics, multi-round interview calendars, and automated job offers.
          </p>
        </div>

        <div className={styles.headerActions}>
          {applications.length === 0 && (
            <button
              className={styles.btnDemoSeed}
              onClick={handleSeedDemoData}
              disabled={submitting}
              title="Populate realistic enterprise candidates & requisitions"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>auto_awesome</span>
              <span>{submitting ? 'Generating...' : 'Seed Sample Candidates'}</span>
            </button>
          )}

          <button
            className={styles.btnSecondary}
            onClick={() => { setShowApplicantModal(true); setError(''); }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#60a5fa' }}>person_add</span>
            <span>Add Candidate</span>
          </button>

          <button
            className={styles.btnPrimary}
            onClick={() => { setShowJobModal(true); setError(''); }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
            <span>Post Job Opening</span>
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------------
          KPI Metric Cards Strip
          ---------------------------------------------------------------------- */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <span className={styles.kpiLabel}>Active Openings</span>
            <div className={styles.kpiIconWrapper} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>campaign</span>
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>{activeJobsCount}</span>
            <span className={styles.kpiHint}>of {jobOpenings.length} Total</span>
          </div>
          <div className={styles.kpiFooter}>
            <span>Requisitions Online</span>
            <span style={{ color: '#34d399', fontWeight: 600 }}>Active</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <span className={styles.kpiLabel}>Talent Pool</span>
            <div className={styles.kpiIconWrapper} style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>groups</span>
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>{totalAppsCount}</span>
            <span className={styles.kpiHint}>Applicants</span>
          </div>
          <div className={styles.kpiFooter}>
            <span>In Pipeline</span>
            <span style={{ color: '#a78bfa' }}>All Stages</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <span className={styles.kpiLabel}>In Interviews</span>
            <div className={styles.kpiIconWrapper} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>record_voice_over</span>
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>{stageStats['INTERVIEW'] || 0}</span>
            <span className={styles.kpiHint}>Candidates</span>
          </div>
          <div className={styles.kpiFooter}>
            <span>Active Rounds</span>
            <span style={{ color: '#fbbf24' }}>Technical / HR</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <span className={styles.kpiLabel}>Offers Extended</span>
            <div className={styles.kpiIconWrapper} style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>workspace_premium</span>
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>{stageStats['OFFER'] || 0}</span>
            <span className={styles.kpiHint}>Pending</span>
          </div>
          <div className={styles.kpiFooter}>
            <span>Compensation Packages</span>
            <span style={{ color: '#f472b6' }}>Offer Stage</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <span className={styles.kpiLabel}>Hired Candidates</span>
            <div className={styles.kpiIconWrapper} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>verified</span>
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>{stageStats['HIRED'] || 0}</span>
            <span className={styles.kpiHint}>Staff</span>
          </div>
          <div className={styles.kpiFooter}>
            <span>Onboarded to Company</span>
            <span style={{ color: '#34d399' }}>Completed</span>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------------
          Pipeline Velocity Funnel Strip
          ---------------------------------------------------------------------- */}
      <div className={styles.funnelStrip}>
        <div className={styles.funnelTitle}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#38bdf8' }}>analytics</span>
          <span>ATS Pipeline Conversion Funnel:</span>
        </div>

        <div className={styles.funnelStages}>
          {STAGES.map((s, idx) => {
            const count = stageStats[s.key] || 0;
            const pct = totalAppsCount > 0 ? Math.round((count / totalAppsCount) * 100) : 0;
            return (
              <React.Fragment key={s.key}>
                <div className={styles.funnelStagePill} title={`${s.label}: ${count} (${pct}%)`}>
                  <span style={{ color: s.color }}>{s.label}</span>
                  <span className={styles.funnelCount} style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                    {count}
                  </span>
                </div>
                {idx < STAGES.length - 1 && (
                  <span className={`material-symbols-outlined ${styles.funnelArrow}`}>chevron_right</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ----------------------------------------------------------------------
          Filter & View Toggles Toolbar
          ---------------------------------------------------------------------- */}
      <div className={styles.toolbarCard}>
        <div className={styles.toolbarLeft}>
          <div className={styles.searchBox}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#64748b' }}>search</span>
            <input
              type="text"
              placeholder="Search candidate name, email, skills..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={selectedJob}
            onChange={e => setSelectedJob(e.target.value)}
            className={styles.jobSelect}
          >
            <option value="ALL">All Requisitions ({jobOpenings.length})</option>
            {jobOpenings.map(j => (
              <option key={j.id} value={j.id}>{j.title} ({j.vacancies} vacancies)</option>
            ))}
          </select>

          {viewMode === 'table' && (
            <select
              value={selectedStage}
              onChange={e => setSelectedStage(e.target.value)}
              className={styles.jobSelect}
            >
              <option value="ALL">All Pipeline Stages</option>
              {STAGES.map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          )}
        </div>

        <div className={styles.viewModeGroup}>
          {[
            { mode: 'pipeline', label: 'Kanban Pipeline', icon: 'view_kanban' },
            { mode: 'table', label: 'Candidates Table', icon: 'table_rows' },
            { mode: 'jobs', label: 'Job Positions', icon: 'work' },
            { mode: 'analytics', label: 'ATS Analytics', icon: 'insights' },
          ].map(btn => (
            <button
              key={btn.mode}
              onClick={() => setViewMode(btn.mode as any)}
              className={`${styles.viewTabBtn} ${viewMode === btn.mode ? styles.viewTabBtnActive : ''}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{btn.icon}</span>
              <span>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ----------------------------------------------------------------------
          VIEW 1: KANBAN PIPELINE BOARD
          ---------------------------------------------------------------------- */}
      {viewMode === 'pipeline' && (
        <div className={styles.kanbanGrid}>
          {STAGES.map(st => {
            const stageApps = filteredApps.filter(a => a.currentStage === st.key);
            return (
              <div
                key={st.key}
                className={styles.kanbanColumn}
                style={{ '--col-color': st.color, '--col-bg': st.bg } as React.CSSProperties}
              >
                <div className={styles.kanbanColHeader}>
                  <div className={styles.kanbanColTitle}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: st.color }}>{st.icon}</span>
                    <span>{st.label}</span>
                  </div>
                  <span className={styles.kanbanColBadge}>
                    {stageApps.length}
                  </span>
                </div>

                <div className={styles.kanbanCardsList}>
                  {stageApps.length === 0 ? (
                    <div className={styles.kanbanEmpty}>
                      <span className="material-symbols-outlined" style={{ fontSize: '24px', opacity: 0.6 }}>folder_open</span>
                      <span>No candidates in {st.label}</span>
                    </div>
                  ) : (
                    stageApps.map(app => {
                      const initials = (app.applicant?.fullName || 'Candidate')
                        .split(' ')
                        .map(n => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();

                      const latestInterview = app.interviews && app.interviews.length > 0
                        ? app.interviews[app.interviews.length - 1]
                        : null;

                      const latestOffer = app.jobOffers && app.jobOffers.length > 0
                        ? app.jobOffers[app.jobOffers.length - 1]
                        : null;

                      return (
                        <div
                          key={app.id}
                          className={styles.candidateCard}
                          onClick={() => setSelectedApp(app)}
                        >
                          <div className={styles.cardTopRow}>
                            <div className={styles.candidateInfo}>
                              <div className={styles.avatarCircle}>
                                {initials}
                              </div>
                              <div>
                                <div className={styles.candidateName}>
                                  {app.applicant?.fullName}
                                </div>
                                <div className={styles.candidatePosition}>
                                  {app.jobOpening?.title}
                                </div>
                              </div>
                            </div>
                            <span className={styles.sourcePill}>
                              {app.source || 'Direct'}
                            </span>
                          </div>

                          {/* Interview / Offer Pill */}
                          {latestInterview && st.key === 'INTERVIEW' && (
                            <div className={styles.interviewTag}>
                              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>event</span>
                              <span>{latestInterview.status}: {new Date(latestInterview.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                            </div>
                          )}

                          {latestOffer && (st.key === 'OFFER' || st.key === 'HIRED') && (
                            <div className={styles.offerTag}>
                              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>paid</span>
                              <span>৳{Number(latestOffer.salary).toLocaleString()}/mo ({latestOffer.status})</span>
                            </div>
                          )}

                          <div className={styles.cardMetaRow}>
                            <span>Applied: {new Date(app.appliedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                            {app.applicant?.resume && (
                              <a
                                href={app.applicant.resume}
                                target="_blank"
                                rel="noreferrer"
                                onClick={e => e.stopPropagation()}
                                style={{ color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }}
                                title="Open Resume Link"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>description</span>
                                <span>CV</span>
                              </a>
                            )}
                          </div>

                          {/* Footer Stage Switcher */}
                          <div className={styles.cardFooter} onClick={e => e.stopPropagation()}>
                            <select
                              value={app.currentStage}
                              onChange={e => handleStageChange(app.id, e.target.value)}
                              className={styles.stageDropdown}
                            >
                              {STAGES.map(s => (
                                <option key={s.key} value={s.key}>{s.label}</option>
                              ))}
                            </select>

                            <div className={styles.cardActions}>
                              <button
                                className={styles.actionIconBtn}
                                onClick={() => { setSelectedApp(app); setShowInterviewModal(true); }}
                                title="Schedule Interview Round"
                                style={{ color: '#fbbf24' }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>event</span>
                              </button>

                              <button
                                className={styles.actionIconBtn}
                                onClick={() => { setSelectedApp(app); setShowOfferModal(true); }}
                                title="Extend Job Offer"
                                style={{ color: '#34d399' }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified</span>
                              </button>

                              <button
                                className={styles.actionIconBtn}
                                onClick={() => setSelectedApp(app)}
                                title="View Dossier"
                                style={{ color: '#60a5fa' }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ----------------------------------------------------------------------
          VIEW 2: CANDIDATES DATA TABLE
          ---------------------------------------------------------------------- */}
      {viewMode === 'table' && (
        <div className={styles.tableCard}>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Position Requisition</th>
                  <th>Contact Information</th>
                  <th>Source</th>
                  <th>Stage</th>
                  <th>Applied On</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No candidate records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredApps.map(app => {
                    const stageObj = STAGES.find(s => s.key === app.currentStage) || STAGES[0];
                    const initials = (app.applicant?.fullName || 'Candidate')
                      .split(' ')
                      .map(n => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    return (
                      <tr key={app.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className={styles.avatarCircle} style={{ width: '32px', height: '32px', fontSize: '11px' }}>
                              {initials}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#ffffff' }}>{app.applicant?.fullName}</div>
                              {app.applicant?.resume && (
                                <a
                                  href={app.applicant.resume}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ fontSize: '11px', color: '#38bdf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>description</span>
                                  Resume CV
                                </a>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          <div style={{ fontWeight: 600, color: '#60a5fa' }}>{app.jobOpening?.title}</div>
                          <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                            {app.jobOpening?.department?.name || 'Enterprise'} · <span style={{ color: '#cbd5e1' }}>{app.jobOpening?.jobCode}</span>
                          </div>
                        </td>

                        <td>
                          <div style={{ fontSize: '12.5px', color: '#e2e8f0' }}>{app.applicant?.email}</div>
                          <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>{app.applicant?.phone || '—'}</div>
                        </td>

                        <td>
                          <span className={styles.sourcePill}>{app.source || 'Direct'}</span>
                        </td>

                        <td>
                          <span
                            className={styles.stageBadge}
                            style={{ background: stageObj.bg, color: stageObj.color, border: `1px solid ${stageObj.border}` }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>{stageObj.icon}</span>
                            <span>{stageObj.label}</span>
                          </span>
                        </td>

                        <td style={{ color: '#94a3b8', fontSize: '12px' }}>
                          {new Date(app.appliedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              className={styles.btnSecondary}
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={() => setSelectedApp(app)}
                            >
                              Dossier
                            </button>
                            <button
                              className={styles.actionIconBtn}
                              style={{ color: '#f87171' }}
                              onClick={() => handleDeleteApplication(app.id)}
                              title="Delete Application"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------
          VIEW 3: JOB POSITIONS / REQUISITIONS
          ---------------------------------------------------------------------- */}
      {viewMode === 'jobs' && (
        <div className={styles.jobsGrid}>
          {jobOpenings.map(job => {
            const appsCount = applications.filter(a => a.jobOpeningId === job.id).length;
            const interviewCount = applications.filter(a => a.jobOpeningId === job.id && a.currentStage === 'INTERVIEW').length;
            const offerCount = applications.filter(a => a.jobOpeningId === job.id && (a.currentStage === 'OFFER' || a.currentStage === 'HIRED')).length;

            return (
              <div key={job.id} className={styles.jobCard}>
                <div className={styles.jobCardHeader}>
                  <div>
                    <div className={styles.jobTitle}>{job.title}</div>
                    <div className={styles.jobMeta}>
                      {job.department?.name || 'Department'} · <span style={{ color: '#60a5fa', fontWeight: 600 }}>{job.jobCode}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleJobStatus(job.id, job.status)}
                    className={styles.jobStatusBadge}
                    style={{
                      background: job.status === 'OPEN' ? 'rgba(16, 185, 129, 0.15)' : job.status === 'PAUSED' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: job.status === 'OPEN' ? '#34d399' : job.status === 'PAUSED' ? '#fbbf24' : '#f87171',
                      border: '1px solid currentColor',
                      cursor: 'pointer'
                    }}
                    title="Click to toggle status (OPEN / PAUSED / CLOSED)"
                  >
                    ● {job.status}
                  </button>
                </div>

                <div className={styles.jobMetricsRow}>
                  <div className={styles.jobMetricItem}>
                    <span className={styles.jobMetricLabel}>Vacancies</span>
                    <span className={styles.jobMetricVal}>{job.vacancies}</span>
                  </div>
                  <div className={styles.jobMetricItem}>
                    <span className={styles.jobMetricLabel}>Applicants</span>
                    <span className={styles.jobMetricVal}>{appsCount}</span>
                  </div>
                  <div className={styles.jobMetricItem}>
                    <span className={styles.jobMetricLabel}>Interviewing</span>
                    <span className={styles.jobMetricVal} style={{ color: '#fbbf24' }}>{interviewCount}</span>
                  </div>
                  <div className={styles.jobMetricItem}>
                    <span className={styles.jobMetricLabel}>Offered/Hired</span>
                    <span className={styles.jobMetricVal} style={{ color: '#34d399' }}>{offerCount}</span>
                  </div>
                </div>

                <div className={styles.jobActionsRow}>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Opened: {new Date(job.openingDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>

                  <button
                    className={styles.btnSecondary}
                    style={{ padding: '5px 12px', fontSize: '12px' }}
                    onClick={() => {
                      setSelectedJob(job.id);
                      setViewMode('pipeline');
                    }}
                  >
                    View Pipeline
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ----------------------------------------------------------------------
          VIEW 4: ATS ANALYTICS & INSIGHTS
          ---------------------------------------------------------------------- */}
      {viewMode === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
          <div className={styles.kpiCard} style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>leaderboard</span>
              <span>Stage Distribution Breakdown</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {STAGES.map(s => {
                const count = stageStats[s.key] || 0;
                const pct = totalAppsCount > 0 ? (count / totalAppsCount) * 100 : 0;
                return (
                  <div key={s.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 600 }}>
                      <span style={{ color: s.color }}>{s.label}</span>
                      <span style={{ color: '#ffffff' }}>{count} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: s.color, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.kpiCard} style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: '#34d399' }}>share</span>
              <span>Candidate Sourcing Channels</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {['LinkedIn Talent Solutions', 'Direct Portal', 'Employee Referral', 'BDJobs', 'GitHub Outreach'].map(src => {
                const count = applications.filter(a => a.source === src).length;
                const pct = totalAppsCount > 0 ? (count / totalAppsCount) * 100 : 0;
                return (
                  <div key={src} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 600 }}>
                      <span style={{ color: '#cbd5e1' }}>{src}</span>
                      <span style={{ color: '#ffffff' }}>{count} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', borderRadius: '4px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------
          CANDIDATE DOSSIER SLIDE-OVER DRAWER
          ---------------------------------------------------------------------- */}
      {selectedApp && !showInterviewModal && !showScorecardModal && !showOfferModal && (
        <div className={styles.drawerOverlay} onClick={() => setSelectedApp(null)}>
          <div className={styles.drawerContent} onClick={e => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className={styles.avatarCircle} style={{ width: '48px', height: '48px', fontSize: '18px' }}>
                  {(selectedApp.applicant.fullName || 'Candidate').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                    {selectedApp.applicant.fullName}
                  </h2>
                  <div style={{ fontSize: '12.5px', color: '#60a5fa', fontWeight: 600, marginTop: '2px' }}>
                    {selectedApp.jobOpening.title}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={selectedApp.currentStage}
                  onChange={e => handleStageChange(selectedApp.id, e.target.value)}
                  className={styles.stageDropdown}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  {STAGES.map(s => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>

                <button
                  onClick={() => setSelectedApp(null)}
                  className={styles.actionIconBtn}
                  style={{ width: '32px', height: '32px' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
                </button>
              </div>
            </div>

            <div className={styles.drawerBody}>
              {/* Candidate Info Section */}
              <div className={styles.drawerSection}>
                <div className={styles.sectionTitle}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person</span>
                  <span>Contact & Overview</span>
                </div>

                <div className={styles.dossierGrid}>
                  <div className={styles.dossierItem}>
                    <span className={styles.dossierLabel}>Email Address</span>
                    <span className={styles.dossierVal}>{selectedApp.applicant.email}</span>
                  </div>
                  <div className={styles.dossierItem}>
                    <span className={styles.dossierLabel}>Phone Number</span>
                    <span className={styles.dossierVal}>{selectedApp.applicant.phone || 'Not provided'}</span>
                  </div>
                  <div className={styles.dossierItem}>
                    <span className={styles.dossierLabel}>Sourcing Channel</span>
                    <span className={styles.dossierVal}>{selectedApp.source || 'Direct Portal'}</span>
                  </div>
                  <div className={styles.dossierItem}>
                    <span className={styles.dossierLabel}>Application Date</span>
                    <span className={styles.dossierVal}>{new Date(selectedApp.appliedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* External links */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                  {selectedApp.applicant.resume && (
                    <a
                      href={selectedApp.applicant.resume}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.btnSecondary}
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#38bdf8' }}>description</span>
                      <span>Review Resume (PDF)</span>
                    </a>
                  )}

                  {selectedApp.applicant.linkedin && (
                    <a
                      href={selectedApp.applicant.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.btnSecondary}
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#60a5fa' }}>link</span>
                      <span>LinkedIn Profile</span>
                    </a>
                  )}

                  {selectedApp.applicant.portfolio && (
                    <a
                      href={selectedApp.applicant.portfolio}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.btnSecondary}
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#c084fc' }}>palette</span>
                      <span>Design Portfolio</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Multi-round Interview Rounds & Scorecards */}
              <div className={styles.drawerSection}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className={styles.sectionTitle}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>calendar_month</span>
                    <span>Interview Rounds & Scorecards</span>
                  </div>
                  <button
                    className={styles.btnSecondary}
                    style={{ padding: '4px 10px', fontSize: '11.5px' }}
                    onClick={() => setShowInterviewModal(true)}
                  >
                    + Schedule Round
                  </button>
                </div>

                {(!selectedApp.interviews || selectedApp.interviews.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b', fontSize: '12.5px' }}>
                    No interview rounds scheduled yet. Click "+ Schedule Round" to assign an interviewer.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedApp.interviews.map((iv, i) => (
                      <div
                        key={iv.id}
                        style={{
                          background: 'rgba(15, 23, 42, 0.65)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '13px' }}>
                            Round {i + 1}: {iv.type}
                          </span>
                          <span style={{
                            padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                            background: iv.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: iv.status === 'COMPLETED' ? '#34d399' : '#fbbf24'
                          }}>
                            {iv.status}
                          </span>
                        </div>

                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          📅 {new Date(iv.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} · Interviewer: <strong style={{ color: '#ffffff' }}>{iv.interviewer?.firstName} {iv.interviewer?.lastName}</strong>
                        </div>

                        {iv.onlineLink && (
                          <div style={{ fontSize: '11.5px' }}>
                            <a href={iv.onlineLink} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>
                              🔗 Join Conference Meeting
                            </a>
                          </div>
                        )}

                        {/* Interview Feedbacks */}
                        {iv.feedbacks && iv.feedbacks.length > 0 && (
                          <div style={{ marginTop: '6px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            {iv.feedbacks.map((fb, fbIdx) => (
                              <div key={fbIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                                  <span>Recommendation: <strong style={{ color: fb.recommendation === 'STRONG_HIRE' ? '#34d399' : '#fbbf24' }}>{fb.recommendation}</strong></span>
                                  <span>Overall Score: <strong>{fb.overallScore} / 5</strong></span>
                                </div>
                                <div style={{ fontSize: '11.5px', color: '#94a3b8', fontStyle: 'italic' }}>
                                  "{fb.comments}"
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {iv.status !== 'COMPLETED' && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                            <button
                              className={styles.btnSecondary}
                              style={{ padding: '4px 10px', fontSize: '11.5px', color: '#fbbf24' }}
                              onClick={() => {
                                setActiveInterview(iv);
                                setShowScorecardModal(true);
                              }}
                            >
                              Grade Scorecard
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Compensation & Job Offer */}
              <div className={styles.drawerSection}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className={styles.sectionTitle}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified</span>
                    <span>Job Offer & Compensation</span>
                  </div>
                  <button
                    className={styles.btnPrimary}
                    style={{ padding: '4px 12px', fontSize: '11.5px' }}
                    onClick={() => setShowOfferModal(true)}
                  >
                    Extend Offer
                  </button>
                </div>

                {(!selectedApp.jobOffers || selectedApp.jobOffers.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b', fontSize: '12.5px' }}>
                    No offer extended yet.
                  </div>
                ) : (
                  selectedApp.jobOffers.map((off, oIdx) => (
                    <div
                      key={oIdx}
                      style={{
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        borderRadius: '12px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '15px', color: '#34d399' }}>
                          BDT {Number(off.salary).toLocaleString()} / month
                        </span>
                        <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                          Status: {off.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                        Expected Joining Date: <strong>{new Date(off.joiningDate).toLocaleDateString([], { dateStyle: 'medium' })}</strong>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={styles.drawerFooter}>
              <button
                className={styles.btnSecondary}
                style={{ color: '#f87171' }}
                onClick={() => handleDeleteApplication(selectedApp.id)}
              >
                Archive Candidate
              </button>
              <button
                className={styles.btnSecondary}
                onClick={() => setSelectedApp(null)}
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------
          MODAL: POST JOB REQUISITION
          ---------------------------------------------------------------------- */}
      {showJobModal && (
        <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) setShowJobModal(false); }}>
          <div className={styles.modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className={styles.modalTitle}>Post Job Requisition</h2>
              <button onClick={() => setShowJobModal(false)} className={styles.actionIconBtn}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {error && <div className={styles.errorBanner}>⚠ {error}</div>}

            <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Position Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Lead Full-Stack Architect"
                  value={jobForm.title}
                  onChange={e => setJobForm(f => ({ ...f, title: e.target.value }))}
                  required
                  className={styles.formInput}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Requisition Code</label>
                  <input
                    type="text"
                    placeholder="REQ-1045"
                    value={jobForm.jobCode}
                    onChange={e => setJobForm(f => ({ ...f, jobCode: e.target.value }))}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Vacancies *</label>
                  <input
                    type="number"
                    min="1"
                    value={jobForm.vacancies}
                    onChange={e => setJobForm(f => ({ ...f, vacancies: e.target.value }))}
                    required
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Department</label>
                  <select
                    value={jobForm.departmentId}
                    onChange={e => setJobForm(f => ({ ...f, departmentId: e.target.value }))}
                    className={styles.formInput}
                  >
                    <option value="">— Select Department —</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Designation</label>
                  <select
                    value={jobForm.designationId}
                    onChange={e => setJobForm(f => ({ ...f, designationId: e.target.value }))}
                    className={styles.formInput}
                  >
                    <option value="">— Select Designation —</option>
                    {designations.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Opening Date *</label>
                  <input
                    type="date"
                    value={jobForm.openingDate}
                    onChange={e => setJobForm(f => ({ ...f, openingDate: e.target.value }))}
                    required
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Closing Date</label>
                  <input
                    type="date"
                    value={jobForm.closingDate}
                    onChange={e => setJobForm(f => ({ ...f, closingDate: e.target.value }))}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className={styles.btnSecondary} onClick={() => setShowJobModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                  {submitting ? 'Publishing...' : 'Publish Requisition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------
          MODAL: ADD CANDIDATE
          ---------------------------------------------------------------------- */}
      {showApplicantModal && (
        <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) setShowApplicantModal(false); }}>
          <div className={styles.modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className={styles.modalTitle}>Register Candidate</h2>
              <button onClick={() => setShowApplicantModal(false)} className={styles.actionIconBtn}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {error && <div className={styles.errorBanner}>⚠ {error}</div>}

            <form onSubmit={handleAddApplicant} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Candidate Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Tanvir Ahmed"
                  value={applicantForm.fullName}
                  onChange={e => setApplicantForm(f => ({ ...f, fullName: e.target.value }))}
                  required
                  className={styles.formInput}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email Address *</label>
                  <input
                    type="email"
                    placeholder="tanvir@gmail.com"
                    value={applicantForm.email}
                    onChange={e => setApplicantForm(f => ({ ...f, email: e.target.value }))}
                    required
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Phone Number</label>
                  <input
                    type="text"
                    placeholder="+880 1700 000000"
                    value={applicantForm.phone}
                    onChange={e => setApplicantForm(f => ({ ...f, phone: e.target.value }))}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Target Job Requisition *</label>
                <select
                  value={applicantForm.jobOpeningId}
                  onChange={e => setApplicantForm(f => ({ ...f, jobOpeningId: e.target.value }))}
                  required
                  className={styles.formInput}
                >
                  <option value="">— Select Position —</option>
                  {jobOpenings.map(j => (
                    <option key={j.id} value={j.id}>{j.title} ({j.jobCode || 'Open'})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Initial Pipeline Stage</label>
                  <select
                    value={applicantForm.currentStage}
                    onChange={e => setApplicantForm(f => ({ ...f, currentStage: e.target.value }))}
                    className={styles.formInput}
                  >
                    {STAGES.map(s => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Sourcing Channel</label>
                  <select
                    value={applicantForm.source}
                    onChange={e => setApplicantForm(f => ({ ...f, source: e.target.value }))}
                    className={styles.formInput}
                  >
                    <option value="LinkedIn Talent Solutions">LinkedIn Talent Solutions</option>
                    <option value="Direct Portal">Direct Portal</option>
                    <option value="Employee Referral">Employee Referral</option>
                    <option value="BDJobs">BDJobs</option>
                    <option value="GitHub Outreach">GitHub Outreach</option>
                    <option value="Headhunter Agency">Headhunter Agency</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Resume URL / Drive Document</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={applicantForm.resume}
                  onChange={e => setApplicantForm(f => ({ ...f, resume: e.target.value }))}
                  className={styles.formInput}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className={styles.btnSecondary} onClick={() => setShowApplicantModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                  {submitting ? 'Adding...' : 'Onboard to ATS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------
          MODAL: SCHEDULE INTERVIEW ROUND
          ---------------------------------------------------------------------- */}
      {showInterviewModal && selectedApp && (
        <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) setShowInterviewModal(false); }}>
          <div className={styles.modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className={styles.modalTitle}>Schedule Interview Round</h2>
              <button onClick={() => setShowInterviewModal(false)} className={styles.actionIconBtn}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p style={{ margin: '-6px 0 10px', fontSize: '13px', color: '#94a3b8' }}>
              Candidate: <strong style={{ color: '#ffffff' }}>{selectedApp.applicant.fullName}</strong> ({selectedApp.jobOpening.title})
            </p>

            <form onSubmit={handleScheduleInterview} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Interview Round Type *</label>
                <input
                  type="text"
                  value={interviewForm.type}
                  onChange={e => setInterviewForm(f => ({ ...f, type: e.target.value }))}
                  placeholder="e.g. Technical & System Architecture Round"
                  required
                  className={styles.formInput}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Scheduled Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={interviewForm.date}
                    onChange={e => setInterviewForm(f => ({ ...f, date: e.target.value }))}
                    required
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Interviewer (Staff) *</label>
                  <select
                    value={interviewForm.interviewerId}
                    onChange={e => setInterviewForm(f => ({ ...f, interviewerId: e.target.value }))}
                    required
                    className={styles.formInput}
                  >
                    <option value="">— Select Interviewer —</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Online Meeting Link (Google Meet / Zoom)</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={interviewForm.onlineLink}
                  onChange={e => setInterviewForm(f => ({ ...f, onlineLink: e.target.value }))}
                  className={styles.formInput}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className={styles.btnSecondary} onClick={() => setShowInterviewModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                  {submitting ? 'Scheduling...' : 'Confirm & Sync Calendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------
          MODAL: SUBMIT INTERVIEW SCORECARD & RUBRIC
          ---------------------------------------------------------------------- */}
      {showScorecardModal && activeInterview && (
        <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) setShowScorecardModal(false); }}>
          <div className={styles.modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className={styles.modalTitle}>Interview Scorecard & Rubric</h2>
              <button onClick={() => setShowScorecardModal(false)} className={styles.actionIconBtn}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p style={{ margin: '-6px 0 10px', fontSize: '13px', color: '#94a3b8' }}>
              Evaluating Round: <strong style={{ color: '#ffffff' }}>{activeInterview.type}</strong>
            </p>

            <form onSubmit={handleSubmitScorecard} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Technical Competency (1 - 5)</label>
                  <select
                    value={scorecardForm.technicalScore}
                    onChange={e => setScorecardForm(f => ({ ...f, technicalScore: Number(e.target.value) }))}
                    className={styles.formInput}
                  >
                    {[5, 4, 3, 2, 1].map(n => (
                      <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Communication & Clarity (1 - 5)</label>
                  <select
                    value={scorecardForm.communicationScore}
                    onChange={e => setScorecardForm(f => ({ ...f, communicationScore: Number(e.target.value) }))}
                    className={styles.formInput}
                  >
                    {[5, 4, 3, 2, 1].map(n => (
                      <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Culture Fit & Alignment (1 - 5)</label>
                  <select
                    value={scorecardForm.cultureScore}
                    onChange={e => setScorecardForm(f => ({ ...f, cultureScore: Number(e.target.value) }))}
                    className={styles.formInput}
                  >
                    {[5, 4, 3, 2, 1].map(n => (
                      <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Overall Recommendation *</label>
                  <select
                    value={scorecardForm.recommendation}
                    onChange={e => setScorecardForm(f => ({ ...f, recommendation: e.target.value }))}
                    className={styles.formInput}
                  >
                    <option value="STRONG_HIRE">★ Strong Hire</option>
                    <option value="HIRE">✓ Hire</option>
                    <option value="NEUTRAL">~ Neutral / Leaning</option>
                    <option value="DO_NOT_HIRE">✕ Do Not Hire</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Interviewer Qualitative Notes & Feedback</label>
                <textarea
                  rows={3}
                  placeholder="Detail key strengths, technical edge, and potential reservations..."
                  value={scorecardForm.comments}
                  onChange={e => setScorecardForm(f => ({ ...f, comments: e.target.value }))}
                  className={styles.formInput}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className={styles.btnSecondary} onClick={() => setShowScorecardModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------
          MODAL: EXTEND JOB OFFER
          ---------------------------------------------------------------------- */}
      {showOfferModal && selectedApp && (
        <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) setShowOfferModal(false); }}>
          <div className={styles.modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className={styles.modalTitle}>Extend Job Offer Package</h2>
              <button onClick={() => setShowOfferModal(false)} className={styles.actionIconBtn}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p style={{ margin: '-6px 0 10px', fontSize: '13px', color: '#94a3b8' }}>
              Candidate: <strong style={{ color: '#ffffff' }}>{selectedApp.applicant.fullName}</strong> ({selectedApp.jobOpening.title})
            </p>

            <form onSubmit={handleMakeOffer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Offered Monthly Salary (BDT) *</label>
                <input
                  type="number"
                  value={offerForm.salary}
                  onChange={e => setOfferForm(f => ({ ...f, salary: e.target.value }))}
                  required
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Expected Joining Date *</label>
                <input
                  type="date"
                  value={offerForm.joiningDate}
                  onChange={e => setOfferForm(f => ({ ...f, joiningDate: e.target.value }))}
                  required
                  className={styles.formInput}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className={styles.btnSecondary} onClick={() => setShowOfferModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                  {submitting ? 'Generating...' : 'Generate & Send Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
