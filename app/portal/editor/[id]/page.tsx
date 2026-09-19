"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import styles from './editor-portal.module.css';
import RevisionChat from '@/app/erp/components/RevisionChat';

export default function EditorLivePortalPage() {
  const params = useParams();
  const projectId = (params?.id as string) || '';

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editor Demo Upload State
  const [demoName, setDemoName] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [editorNotes, setEditorNotes] = useState('');
  const [submittingDemo, setSubmittingDemo] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState<string | null>(null);

  const fetchProjectData = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/portal/project/${projectId}`);
      const data = await res.json();
      if (res.ok && data?.project) {
        setProject(data.project);
      } else {
        setError(data.error || 'Unable to load editor workspace');
      }
    } catch (err) {
      setError('Network error connecting to editor workspace');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const handleSubmitEditorDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoName.trim() || !demoUrl.trim()) {
      alert('Please provide both a demo label and a video URL');
      return;
    }

    setSubmittingDemo(true);
    setDemoSuccess(null);
    try {
      const res = await fetch(`/api/portal/project/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SUBMIT_EDITOR_DEMO',
          demoName: demoName.trim(),
          demoUrl: demoUrl.trim(),
          editorNotes: editorNotes.trim(),
          editorName: project?.shootingData?.assignedEditorName || 'Lead Editor'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setDemoSuccess('✓ Completed cut successfully shared! It is now live on CRM Stage 6 and the Customer Portal.');
        setDemoName('');
        setDemoUrl('');
        setEditorNotes('');
        fetchProjectData();
      } else {
        alert(data.error || 'Failed to submit demo link');
      }
    } catch (err) {
      alert('Network error submitting demo cut');
    } finally {
      setSubmittingDemo(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.portalContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#6366f1', animation: 'spin 1.5s linear infinite' }}>
            hourglass_top
          </span>
          <h3 style={{ color: '#f8fafc', marginTop: '12px' }}>Loading Editor Live Workspace...</h3>
          <p style={{ fontSize: '13px' }}>Syncing project assets, instructions and timeline</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className={styles.portalContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', background: 'rgba(30,41,59,0.7)', padding: '40px', borderRadius: '20px', maxWidth: '440px', border: '1px solid rgba(239,68,68,0.3)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#ef4444' }}>error</span>
          <h2 style={{ color: '#f8fafc', marginTop: '12px' }}>Project Not Found</h2>
          <p style={{ color: '#94a3b8', fontSize: '13px' }}>{error || 'This editor link is invalid or has expired.'}</p>
        </div>
      </div>
    );
  }

  const currentStage = project.currentStage || 4;
  const stageNames = project.stageNames || {};
  const productData = project.productData || {};
  const shootingData = project.shootingData || {};
  const editingData = project.editingData || {};
  const demoData = project.demoData || {};
  const reviewData = project.reviewData || null;
  const editorRating = project.editorRating || null;
  const revisions = project.revisions || [];

  // Parse multi-links or legacy string
  const workingFiles: Array<{ id: string; label: string; url: string }> = 
    Array.isArray(editingData.workingFiles) && editingData.workingFiles.length > 0
      ? editingData.workingFiles
      : editingData.workingFileUrl
      ? [{ id: '1', label: 'Cloud Repository', url: editingData.workingFileUrl }]
      : [];

  return (
    <div className={styles.portalContainer}>
      <div className={styles.portalInner}>
        {/* Brand & Header Bar */}
        <header className={styles.portalHeader}>
          <div className={styles.headerTop}>
            <div className={styles.brandInfo}>
              <div className={styles.brandLogo}>
                <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>movie_edit</span>
              </div>
              <div className={styles.brandText}>
                <h1>{project.company?.name || 'Studio Production Hub'}</h1>
                <p>Editor Production & Delivery Workspace</p>
              </div>
            </div>

            <div className={styles.editorBadge}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>badge</span>
              Assigned Editor: <strong style={{ color: '#ffffff' }}>{shootingData.assignedEditorName || 'Lead Editor'}</strong>
            </div>
          </div>

          <div className={styles.projectMetaRow}>
            <div className={styles.projectNameGroup}>
              <h2>{project.name}</h2>
              <div className={styles.pillRow}>
                <span className={styles.codeBadge}>{project.projectCode || 'PROJ'}</span>
                <span className={styles.clientBadge}>Client: {project.clientName || 'Direct Client'}</span>
                <span className={styles.stageBadge}>Stage {currentStage}: {stageNames[currentStage] || 'Editing'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ textAlign: 'right', fontSize: '12px', color: '#94a3b8' }}>
                <span>Expected Delivery:</span>
                <strong style={{ display: 'block', color: '#f8fafc', fontSize: '13px' }}>
                  {shootingData.expectedEditDelivery ? new Date(shootingData.expectedEditDelivery).toLocaleDateString() : 'As Scheduled'}
                </strong>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Banner: Post-Production Focus */}
        <div className={styles.heroBanner}>
          <div className={styles.heroLeft}>
            <div className={styles.heroIcon} style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>handyman</span>
            </div>
            <div className={styles.heroText}>
              <h3>Editor Handover & Work Instructions</h3>
              <p>{shootingData.editorInstructions || 'Review raw assets, apply color grade, sync audio, and export master deliverables.'}</p>
            </div>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#818cf8', padding: '6px 14px', borderRadius: '10px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
            Status: {editingData.status || 'In Progress'}
          </span>
        </div>

        {/* 2-Column Core Layout */}
        <div className={styles.portalGrid2}>
          {/* LEFT COLUMN: Specifications, Raw Assets & Working Repositories */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Deliverable Specifications Card */}
            <div className={styles.portalCard}>
              <div className={styles.cardHeader}>
                <h4 className={styles.cardTitle}>
                  <span className="material-symbols-outlined" style={{ color: '#818cf8' }}>aspect_ratio</span>
                  Deliverable Specifications & Formats
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Target Format Specs</span>
                  <span className={styles.infoValue} style={{ color: '#a5b4fc' }}>
                    {editingData.deliverableSpecs || '1080x1920 (9:16 Reels) + 4K ProRes Master'}
                  </span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Assigned Model / Talent</span>
                  <span className={styles.infoValue}>{productData.assignedModelName || 'None'}</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Studio Location</span>
                  <span className={styles.infoValue}>{productData.studioLocation || 'Studio Main Floor'}</span>
                </div>

                {shootingData.shootingNotes && (
                  <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '12px' }}>
                    <span style={{ display: 'block', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>Shoot Log & Camera Notes:</span>
                    <p style={{ margin: 0, color: '#f8fafc', whiteSpace: 'pre-line' }}>{shootingData.shootingNotes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Raw Assets & Cloud Repositories Multi-Links Card */}
            <div className={styles.portalCard}>
              <div className={styles.cardHeader}>
                <h4 className={styles.cardTitle}>
                  <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>folder_open</span>
                  Project Assets & Cloud Repositories ({workingFiles.filter(f => f.url).length + (shootingData.rawFootageUrl ? 1 : 0)})
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Raw Footage Link from Stage 4 */}
                {shootingData.rawFootageUrl ? (
                  <div className={styles.linkItem}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="material-symbols-outlined" style={{ color: '#f472b6', fontSize: '20px' }}>cloud_download</span>
                      <div>
                        <strong style={{ fontSize: '13px', color: '#f8fafc' }}>Raw Shoot Footage Repository</strong>
                        <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8' }}>Camera footage & audio takes from Stage 4</span>
                      </div>
                    </div>
                    <a href={shootingData.rawFootageUrl} target="_blank" rel="noopener noreferrer" className={styles.linkBtn} style={{ background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' }}>
                      Open Raw Assets ↗
                    </a>
                  </div>
                ) : (
                  <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '12px', color: '#94a3b8' }}>
                    No raw footage cloud link logged yet.
                  </div>
                )}

                {/* Stage 5 Working Cloud Multi-Links */}
                {workingFiles.length > 0 && workingFiles.some(f => f.url) ? (
                  workingFiles.filter(f => f.url).map((file, idx) => (
                    <div key={file.id || idx} className={styles.linkItem}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="material-symbols-outlined" style={{ color: '#6366f1', fontSize: '20px' }}>link</span>
                        <div>
                          <strong style={{ fontSize: '13px', color: '#f8fafc' }}>{file.label || `Working Repository #${idx + 1}`}</strong>
                          <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {file.url}
                          </span>
                        </div>
                      </div>
                      <a href={file.url} target="_blank" rel="noopener noreferrer" className={styles.linkBtn}>
                        Open Link ↗
                      </a>
                    </div>
                  ))
                ) : null}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Upload Completed Demo Cut, Live Revisions & Ratings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Share Completed Video Cut Box */}
            <div className={styles.portalCard}>
              <div className={styles.cardHeader}>
                <h4 className={styles.cardTitle}>
                  <span className="material-symbols-outlined" style={{ color: '#10b981' }}>cloud_upload</span>
                  Share Completed Cut / Master Video Link
                </h4>
              </div>

              <form onSubmit={handleSubmitEditorDemo} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>
                  Paste your completed video export or review link below (e.g. Frame.io, Google Drive, Dropbox, Vimeo). It will immediately sync to CRM Stage 6 and the Customer Portal.
                </p>

                {demoSuccess && (
                  <div className={styles.successBanner}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check_circle</span>
                    <span>{demoSuccess}</span>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                    Demo / Export Label *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hero Video v1.0 (Color Graded & Sound Mastered)"
                    value={demoName}
                    onChange={(e) => setDemoName(e.target.value)}
                    className={styles.inputField}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                    Completed File / Video URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="e.g. https://frame.io/project/review-link"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    className={styles.inputField}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                    Editor Technical Notes & Changelog (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Applied film LUT #3, dialogue cleaned, subtitles synced. Ready for client review."
                    value={editorNotes}
                    onChange={(e) => setEditorNotes(e.target.value)}
                    className={styles.textareaField}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingDemo}
                  className={styles.submitBtn}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    {submittingDemo ? 'hourglass_empty' : 'send'}
                  </span>
                  {submittingDemo ? 'Submitting to CRM & Client...' : '🚀 Submit Cut to Review Pipeline'}
                </button>
              </form>

              {/* Previously Shared Cuts List */}
              {demoData.demoFiles && demoData.demoFiles.length > 0 && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                    Delivered Cuts in Pipeline ({demoData.demoFiles.length})
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                    {demoData.demoFiles.map((file: any) => (
                      <div key={file.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', fontSize: '12px' }}>
                        <div>
                          <strong style={{ color: '#f8fafc', display: 'block' }}>{file.name}</strong>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Uploaded {file.date} {file.uploadedBy ? `by ${file.uploadedBy}` : ''}</span>
                        </div>
                        <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(56,189,248,0.15)', color: '#38bdf8', textDecoration: 'none', fontWeight: 600, fontSize: '11px' }}>
                          View ↗
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Live Customer & Studio Revision Chat Thread (Stage 6) */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <RevisionChat
                projectId={projectId}
                currentUserRole="EDITOR"
                currentUserName={shootingData.assignedEditorName || "Lead Editor"}
                messages={project.revisionChat || []}
                demoFiles={demoData.demoFiles || []}
                onRefresh={fetchProjectData}
              />
            </div>

            {/* Performance Rating & Review (Stage 7 / Completion) */}
            {(reviewData || editorRating || currentStage === 7) && (
              <div className={styles.portalCard} style={{ background: 'rgba(251, 191, 36, 0.05)', borderColor: 'rgba(251, 191, 36, 0.25)' }}>
                <div className={styles.cardHeader}>
                  <h4 className={styles.cardTitle}>
                    <span className="material-symbols-outlined" style={{ color: '#fbbf24' }}>star</span>
                    Project Feedback & Editor Rating
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {reviewData && (
                    <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ color: '#fbbf24', fontSize: '14px' }}>
                          {'★'.repeat(reviewData.rating || 5)}{'☆'.repeat(5 - (reviewData.rating || 5))}
                        </span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Client Review</span>
                      </div>
                      {reviewData.reviewText && <p style={{ margin: 0, fontSize: '12px', color: '#f8fafc', fontStyle: 'italic' }}>"{reviewData.reviewText}"</p>}
                    </div>
                  )}

                  {editorRating && (
                    <div style={{ padding: '10px 14px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ color: '#a5b4fc', fontSize: '12px' }}>Studio Performance Score: {editorRating.rating}/5 Stars</strong>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>{editorRating.ratedBy || 'Studio Team'}</span>
                      </div>
                      {editorRating.feedback && <p style={{ margin: 0, fontSize: '12px', color: '#f8fafc' }}>{editorRating.feedback}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
