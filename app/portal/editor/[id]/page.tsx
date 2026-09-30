"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import styles from './editor-portal.module.css';

export default function EditorLivePortalPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = (params?.id as string) || '';
  const editorParam = searchParams?.get('editor') || '';

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload Mode Tab: 'DEMO' | 'MASTER'
  const [activeUploadTab, setActiveUploadTab] = useState<'DEMO' | 'MASTER'>('DEMO');

  // Editor Demo Upload State (Stage 6 Review Pipeline)
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<string>('ALL');
  const [selectedEditorFilter, setSelectedEditorFilter] = useState<string>(editorParam || 'ALL');
  const [demoName, setDemoName] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [editorNotes, setEditorNotes] = useState('');
  const [submittingDemo, setSubmittingDemo] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState<string | null>(null);

  // Stage 7 Complete Master Video Upload State (CRM Only)
  const [finalDeliverableId, setFinalDeliverableId] = useState<string>('ALL');
  const [finalVideoUrl, setFinalVideoUrl] = useState('');
  const [finalVideoNotes, setFinalVideoNotes] = useState('');
  const [submittingFinalVideo, setSubmittingFinalVideo] = useState(false);
  const [finalVideoSuccess, setFinalVideoSuccess] = useState<string | null>(null);

  // Quick Deliverable Inline Submit State
  const [activeDeliverableSubmitId, setActiveDeliverableSubmitId] = useState<string | null>(null);
  const [activeDeliverableSubmitType, setActiveDeliverableSubmitType] = useState<'DEMO' | 'MASTER'>('DEMO');
  const [deliverableSubmitUrl, setDeliverableSubmitUrl] = useState('');
  const [deliverableNotes, setDeliverableNotes] = useState('');
  const [submittingDeliverable, setSubmittingDeliverable] = useState(false);
  const [deliverableSuccessMsg, setDeliverableSuccessMsg] = useState<{ [id: string]: string }>({});

  // Script Copy State
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);

  const handleCopyScript = (id: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedScriptId(id);
    setTimeout(() => setCopiedScriptId(null), 2000);
  };

  const fetchProjectData = useCallback(async (isInitial: boolean = false) => {
    if (!projectId) return;
    try {
      if (isInitial) {
        setLoading(true);
      }
      const res = await fetch(`/api/portal/project/${projectId}`);
      const data = await res.json();
      if (res.ok && data?.project) {
        setProject(data.project);
        if (data.project.finalVideoUrl) {
          setFinalVideoUrl(data.project.finalVideoUrl);
        }
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
    fetchProjectData(true);
  }, [fetchProjectData]);

  const handleSubmitDeliverableAction = async (deliverableId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!deliverableSubmitUrl.trim()) {
      alert(`Please enter a valid ${activeDeliverableSubmitType === 'DEMO' ? 'demo / cut' : 'master video'} URL`);
      return;
    }

    setSubmittingDeliverable(true);
    try {
      if (activeDeliverableSubmitType === 'DEMO') {
        const res = await fetch(`/api/portal/project/${projectId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SUBMIT_VIDEO_DEMO',
            deliverableId,
            demoUrl: deliverableSubmitUrl.trim(),
            notes: deliverableNotes.trim(),
            status: 'Review Ready'
          })
        });
        const data = await res.json();
        if (res.ok) {
          setDeliverableSuccessMsg(prev => ({ ...prev, [deliverableId]: '🎬 Review Cut submitted!' }));
          setActiveDeliverableSubmitId(null);
          setDeliverableSubmitUrl('');
          setDeliverableNotes('');
          fetchProjectData();
          setTimeout(() => {
            setDeliverableSuccessMsg(prev => {
              const copy = { ...prev };
              delete copy[deliverableId];
              return copy;
            });
          }, 4000);
        } else {
          alert(data.error || 'Failed to submit demo cut');
        }
      } else {
        // MASTER VIDEO
        const res = await fetch(`/api/portal/project/${projectId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SUBMIT_FINAL_VIDEO',
            deliverableId,
            finalVideoUrl: deliverableSubmitUrl.trim(),
            notes: deliverableNotes.trim()
          })
        });
        const data = await res.json();
        if (res.ok) {
          setDeliverableSuccessMsg(prev => ({ ...prev, [deliverableId]: '💎 Master Video saved to CRM!' }));
          setActiveDeliverableSubmitId(null);
          setDeliverableSubmitUrl('');
          setDeliverableNotes('');
          fetchProjectData();
          setTimeout(() => {
            setDeliverableSuccessMsg(prev => {
              const copy = { ...prev };
              delete copy[deliverableId];
              return copy;
            });
          }, 4000);
        } else {
          alert(data.error || 'Failed to save master video link');
        }
      }
    } catch (err) {
      alert('Network error submitting video deliverable update');
    } finally {
      setSubmittingDeliverable(false);
    }
  };

  const handleSubmitFinalVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalVideoUrl.trim()) {
      alert('Please enter the final master video URL');
      return;
    }

    setSubmittingFinalVideo(true);
    setFinalVideoSuccess(null);
    try {
      const res = await fetch(`/api/portal/project/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SUBMIT_FINAL_VIDEO',
          deliverableId: finalDeliverableId,
          finalVideoUrl: finalVideoUrl.trim(),
          notes: finalVideoNotes.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        setFinalVideoSuccess('✓ Final master video delivery link saved! (Synced directly to CRM)');
        fetchProjectData();
      } else {
        alert(data.error || 'Failed to submit final video link');
      }
    } catch (err) {
      alert('Network error submitting final video link');
    } finally {
      setSubmittingFinalVideo(false);
    }
  };

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
          deliverableId: selectedDeliverableId,
          selectedDeliverableId,
          demoName: demoName.trim(),
          demoUrl: demoUrl.trim(),
          editorNotes: editorNotes.trim(),
          editorName: editorParam || project?.shootingData?.assignedEditorName || 'Lead Editor'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setDemoSuccess('✓ Demo cut successfully shared! Live on CRM Stage 6 & Client Portal.');
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

  if (loading && !project) {
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
  // Parse Stage 4 Raw Footage multi-links or legacy string
  const rawFootageLinks: Array<{ id: string; label: string; url: string }> =
    Array.isArray(shootingData.rawFootageLinks) && shootingData.rawFootageLinks.length > 0
      ? shootingData.rawFootageLinks
      : shootingData.rawFootageUrl
      ? [{ id: '1', label: 'Raw Shoot Footage', url: shootingData.rawFootageUrl }]
      : [];

  // Parse multi-links or legacy string
  const workingFiles: Array<{ id: string; label: string; url: string }> = 
    Array.isArray(editingData.workingFiles) && editingData.workingFiles.length > 0
      ? editingData.workingFiles
      : editingData.workingFileUrl
      ? [{ id: '1', label: 'Cloud Repository', url: editingData.workingFileUrl }]
      : [];

  const isMasterCutApproved = demoData.approvalStatus === 'Approved' || currentStage >= 7;

  const scriptsList: Array<{ id: string; title: string; content?: string; url?: string }> =
    Array.isArray(productData.scripts) && productData.scripts.length > 0
      ? productData.scripts
      : productData.script
      ? [{ id: '1', title: 'Main Creative Script', content: productData.script }]
      : [];

  const videoDeliverables: Array<{
    id: string;
    title: string;
    aspectRatio: string;
    assignedEditorId?: string;
    assignedEditorName?: string;
    editorFee?: string;
    editorPaid?: boolean;
    editorPaidAmount?: number;
    editorInstructions?: string;
    rawFootageUrl?: string;
    workingFileUrl?: string;
    demoUrl?: string;
    finalVideoUrl?: string;
    status?: string;
    notes?: string;
    dueDate?: string;
  }> = (Array.isArray(editingData.videoDeliverables) && editingData.videoDeliverables.length > 0)
    ? editingData.videoDeliverables
    : (Array.isArray(project.videoDeliverables) && project.videoDeliverables.length > 0)
    ? project.videoDeliverables
    : [];

  const uniqueEditors = Array.from(
    new Set(videoDeliverables.map(v => v.assignedEditorName?.trim()).filter(Boolean))
  ) as string[];

  // If ?editor=Name is in the URL, lock the view to that editor only.
  // This prevents editors from seeing each other's deliverables on their shared short link.
  const isLockedToEditor = Boolean(editorParam);

  const filteredDeliverables = isLockedToEditor
    ? videoDeliverables.filter(v => v.assignedEditorName?.trim().toLowerCase() === editorParam.trim().toLowerCase())
    : selectedEditorFilter === 'ALL'
    ? videoDeliverables
    : videoDeliverables.filter(v => v.assignedEditorName?.trim().toLowerCase() === selectedEditorFilter.trim().toLowerCase());

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
              Assigned Editor: <strong style={{ color: '#ffffff' }}>{editorParam || shootingData.assignedEditorName || 'Lead Editor'}</strong>
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

        {/* MULTI-VIDEO DELIVERABLES & MULTI-EDITOR ASSIGNMENT MATRIX */}
        {videoDeliverables.length > 0 && (
          <div className={styles.deliverablesSection}>
            <div className={styles.deliverablesHeaderBar}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#818cf8' }}>video_library</span>
                  {isLockedToEditor
                    ? `Your Assigned Deliverables (${filteredDeliverables.length} Videos)`
                    : `Assigned Video Deliverables (${videoDeliverables.length} Videos)`}
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                  {isLockedToEditor
                    ? `Showing deliverables assigned to you (${editorParam}). Review assets and submit review cuts below.`
                    : 'Filter by assigned editor to view individual cuts, requirements, assets, and submit review demos.'}
                </p>
              </div>

              {/* Editor Filter Tabs — only shown when NO specific editor is locked via URL */}
              {!isLockedToEditor && uniqueEditors.length > 1 && (
                <div className={styles.deliverableFilterTabs}>
                  <button
                    type="button"
                    onClick={() => setSelectedEditorFilter('ALL')}
                    className={`${styles.deliverableTabBtn} ${selectedEditorFilter === 'ALL' ? styles.deliverableTabBtnActive : ''}`}
                  >
                    All Deliverables ({videoDeliverables.length})
                  </button>
                  {uniqueEditors.map((edName) => {
                    const count = videoDeliverables.filter(v => v.assignedEditorName?.trim().toLowerCase() === edName.toLowerCase()).length;
                    return (
                      <button
                        key={edName}
                        type="button"
                        onClick={() => setSelectedEditorFilter(edName)}
                        className={`${styles.deliverableTabBtn} ${selectedEditorFilter === edName ? styles.deliverableTabBtnActive : ''}`}
                      >
                        👤 {edName} ({count})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Deliverables Cards Grid */}
            <div className={styles.deliverablesGrid}>
              {filteredDeliverables.map((deliv, index) => {
                const status = deliv.status || 'Assigned';
                const statusClass = 
                  status === 'Approved' ? styles.statusApproved :
                  status === 'Completed' ? styles.statusCompleted :
                  status === 'Review Ready' ? styles.statusReviewReady :
                  status === 'In Progress' ? styles.statusInProgress :
                  styles.statusAssigned;

                const isFormOpen = activeDeliverableSubmitId === deliv.id;

                return (
                  <div key={deliv.id || index} className={styles.deliverableCard}>
                    <div className={styles.deliverableTop}>
                      <div className={styles.deliverableTitleGroup}>
                        <span className={styles.deliverableTitle}>
                          <span className="material-symbols-outlined" style={{ color: '#818cf8', fontSize: '18px' }}>movie</span>
                          {deliv.title || `Video #${index + 1}`}
                        </span>
                        <span className={styles.aspectBadge}>
                          📐 {deliv.aspectRatio || '9:16 Reel'}
                        </span>
                      </div>
                      <span className={`${styles.statusBadge} ${statusClass}`}>
                        {status}
                      </span>
                    </div>

                    <div className={styles.deliverableMetaRow}>
                      <span style={{ color: '#94a3b8' }}>
                        Editor: <strong style={{ color: '#f8fafc' }}>{deliv.assignedEditorName || 'Unassigned'}</strong>
                      </span>
                      {deliv.editorFee && (
                        <span className={styles.editorFeeTag}>
                          Fee: {deliv.editorFee} BDT {deliv.editorPaid ? '✓ (Paid)' : ''}
                        </span>
                      )}
                    </div>

                    {deliv.editorInstructions && (
                      <div className={styles.deliverableInstructions}>
                        <strong style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: '#a5b4fc', marginBottom: '2px' }}>
                          Custom Instructions:
                        </strong>
                        {deliv.editorInstructions}
                      </div>
                    )}

                    {/* Links row */}
                    <div className={styles.deliverableLinks}>
                      {deliv.rawFootageUrl && (
                        <a href={deliv.rawFootageUrl} target="_blank" rel="noopener noreferrer" className={styles.deliverableLinkBtn} style={{ background: 'rgba(236,72,153,0.15)', color: '#f472b6', borderColor: 'rgba(236,72,153,0.3)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>download</span>
                          Raw Assets ↗
                        </a>
                      )}
                      {deliv.workingFileUrl && (
                        <a href={deliv.workingFileUrl} target="_blank" rel="noopener noreferrer" className={styles.deliverableLinkBtn}>
                          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>folder</span>
                          Bin / Project ↗
                        </a>
                      )}
                      {deliv.demoUrl && (
                        <a href={deliv.demoUrl} target="_blank" rel="noopener noreferrer" className={styles.deliverableLinkBtn} style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', borderColor: 'rgba(56,189,248,0.3)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>play_circle</span>
                          Review Cut ↗
                        </a>
                      )}
                      {deliv.finalVideoUrl && (
                        <a href={deliv.finalVideoUrl} target="_blank" rel="noopener noreferrer" className={styles.deliverableLinkBtn} style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', borderColor: 'rgba(16,185,129,0.3)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>verified</span>
                          Master ↗
                        </a>
                      )}
                    </div>

                    {/* Client Revision Requests for this deliverable */}
                    {(() => {
                      const allRevisions = Array.isArray(project?.revisions) ? project.revisions : [];
                      const delivRevs = allRevisions.filter((r: any) => 
                        r.targetDeliverableId === deliv.id || 
                        r.targetDeliverableTitle?.includes(deliv.title) ||
                        (!r.targetDeliverableId && r.targetDeliverableTitle === undefined)
                      );

                      if (delivRevs.length === 0) return null;

                      return (
                        <div style={{
                          padding: '10px 12px',
                          background: 'rgba(245, 158, 11, 0.08)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          borderRadius: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          marginTop: '4px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>rate_review</span>
                              Revision Instructions ({delivRevs.length})
                            </span>
                            <span style={{ fontSize: '10px', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.2)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                              Action Needed
                            </span>
                          </div>

                          {delivRevs.map((r: any, idx: number) => (
                            <div key={r.id || idx} style={{ padding: '8px 10px', background: 'rgba(0, 0, 0, 0.35)', borderRadius: '6px', fontSize: '11px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <strong style={{ color: '#fbbf24' }}>
                                  #{r.roundNumber || idx + 1}: {r.title || 'Revision Request'}
                                </strong>
                                {r.timecode && (
                                  <span style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '10px', background: 'rgba(56, 189, 248, 0.15)', padding: '1px 5px', borderRadius: '4px' }}>
                                    ⏱️ {r.timecode}
                                  </span>
                                )}
                              </div>
                              <p style={{ margin: 0, color: '#f8fafc', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                                {r.note}
                              </p>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Success message */}
                    {deliverableSuccessMsg[deliv.id] && (
                      <div style={{ padding: '6px 10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#34d399', fontSize: '11px', fontWeight: 600 }}>
                        {deliverableSuccessMsg[deliv.id]}
                      </div>
                    )}

                    {/* Quick Action Buttons for Demo and Master */}
                    {!isFormOpen ? (
                      <div className={styles.deliverableActionsRow}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDeliverableSubmitId(deliv.id);
                            setActiveDeliverableSubmitType('DEMO');
                            setDeliverableSubmitUrl(deliv.demoUrl || '');
                            setDeliverableNotes(deliv.notes || '');
                          }}
                          className={`${styles.quickActionBtn} ${styles.quickActionDemo}`}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>play_circle</span>
                          {deliv.demoUrl ? 'Update Demo' : '+ Demo Cut'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDeliverableSubmitId(deliv.id);
                            setActiveDeliverableSubmitType('MASTER');
                            setDeliverableSubmitUrl(deliv.finalVideoUrl || '');
                            setDeliverableNotes(deliv.notes || '');
                          }}
                          className={`${styles.quickActionBtn} ${styles.quickActionMaster}`}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified</span>
                          {deliv.finalVideoUrl ? 'Update Master' : '+ Master 4K'}
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={(e) => handleSubmitDeliverableAction(deliv.id, e)} className={styles.quickSubmitBox}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: activeDeliverableSubmitType === 'DEMO' ? '#34d399' : '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                              {activeDeliverableSubmitType === 'DEMO' ? 'movie_filter' : 'verified'}
                            </span>
                            {activeDeliverableSubmitType === 'DEMO' ? 'Submit Demo Cut' : 'Submit Final Master 4K'}: {deliv.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveDeliverableSubmitId(null)}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px', padding: '0 4px' }}
                          >
                            ✕
                          </button>
                        </div>
                        <input
                          type="url"
                          required
                          placeholder={activeDeliverableSubmitType === 'DEMO' ? "https://frame.io/... (Demo review link)" : "https://drive.google.com/... (Master 4K/ProRes)"}
                          value={deliverableSubmitUrl}
                          onChange={(e) => setDeliverableSubmitUrl(e.target.value)}
                          className={styles.inputField}
                          style={{ fontSize: '12px', padding: '6px 10px' }}
                        />
                        <input
                          type="text"
                          placeholder={activeDeliverableSubmitType === 'DEMO' ? "Notes: e.g. Color graded, sound synced v1.0" : "Notes: e.g. 4K 60fps ProRes HQ Master"}
                          value={deliverableNotes}
                          onChange={(e) => setDeliverableNotes(e.target.value)}
                          className={styles.inputField}
                          style={{ fontSize: '12px', padding: '6px 10px' }}
                        />
                        <button
                          type="submit"
                          disabled={submittingDeliverable}
                          className={styles.submitBtn}
                          style={{
                            padding: '7px 12px',
                            fontSize: '12px',
                            background: activeDeliverableSubmitType === 'DEMO'
                              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                              : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>send</span>
                          {submittingDeliverable
                            ? 'Saving...'
                            : activeDeliverableSubmitType === 'DEMO'
                            ? '🚀 Upload & Sync Demo Cut'
                            : '💎 Save Master Video to CRM'}
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2-Column Core Layout */}
        <div className={styles.portalGrid2}>
          {/* LEFT COLUMN: Specifications, Scripts, Raw Assets & Working Repositories */}
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

            {/* Creative Scripts & Storyboards Card (Stage 3) */}
            {scriptsList.length > 0 && (
              <div className={styles.portalCard} style={{ borderColor: 'rgba(251, 191, 36, 0.3)' }}>
                <div className={styles.cardHeader}>
                  <h4 className={styles.cardTitle}>
                    <span className="material-symbols-outlined" style={{ color: '#fbbf24' }}>description</span>
                    Creative Scripts & Storyboards ({scriptsList.length})
                  </h4>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', fontWeight: 700, border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                    Stage 3 Scripts
                  </span>
                </div>

                <div className={styles.scriptsGrid}>
                  {scriptsList.map((script, idx) => (
                    <div key={script.id || idx} className={styles.scriptItemCard}>
                      <div className={styles.scriptHeader}>
                        <div className={styles.scriptTitle}>
                          <span className="material-symbols-outlined" style={{ color: '#fbbf24', fontSize: '16px' }}>
                            article
                          </span>
                          <span>{script.title || `Script #${idx + 1}`}</span>
                        </div>

                        <div className={styles.scriptActions}>
                          {script.url && (
                            <a
                              href={script.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.scriptLinkBtn}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>open_in_new</span>
                              Open Doc ↗
                            </a>
                          )}
                          {script.content && (
                            <button
                              type="button"
                              onClick={() => handleCopyScript(script.id || String(idx), script.content || '')}
                              className={styles.scriptCopyBtn}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                                {copiedScriptId === (script.id || String(idx)) ? 'check' : 'content_copy'}
                              </span>
                              {copiedScriptId === (script.id || String(idx)) ? 'Copied' : 'Copy'}
                            </button>
                          )}
                        </div>
                      </div>

                      {script.content ? (
                        <div className={styles.scriptContentBox}>
                          {script.content}
                        </div>
                      ) : script.url ? (
                        <div className={styles.scriptContentEmpty}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#38bdf8' }}>link</span>
                          <span>Cloud document attached. Click <strong>Open Doc ↗</strong> above.</span>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw Assets & Cloud Repositories Multi-Links Card */}
            <div className={styles.portalCard}>
              <div className={styles.cardHeader}>
                <h4 className={styles.cardTitle}>
                  <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>folder_open</span>
                  Project Assets & Cloud Repositories ({workingFiles.filter(f => f.url).length + rawFootageLinks.filter(f => f.url).length})
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Raw Footage Links from Stage 4 */}
                {rawFootageLinks.length > 0 && rawFootageLinks.some(f => f.url) ? (
                  rawFootageLinks.filter(f => f.url).map((rf, idx) => (
                    <div key={rf.id || idx} className={styles.linkItem}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="material-symbols-outlined" style={{ color: '#f472b6', fontSize: '20px' }}>cloud_download</span>
                        <div>
                          <strong style={{ fontSize: '13px', color: '#f8fafc' }}>{rf.label || `Raw Shoot Footage #${idx + 1}`}</strong>
                          <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8' }}>Camera footage & audio takes from Stage 4</span>
                        </div>
                      </div>
                      <a href={rf.url} target="_blank" rel="noopener noreferrer" className={styles.linkBtn} style={{ background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' }}>
                        Open Raw Assets ↗
                      </a>
                    </div>
                  ))
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

          {/* RIGHT COLUMN: Separated Demo Cut vs Complete Master File & Revision Requests */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* MASTER CUT APPROVED BANNER */}
            {isMasterCutApproved && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 78, 59, 0.35) 100%)',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#34d399' }}>verified</span>
                <div>
                  <h3 style={{ margin: 0, color: '#34d399', fontSize: '16px', fontWeight: 800 }}>
                    Master Cut Approved — Project Complete! 🎉
                  </h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#cbd5e1' }}>
                    Client has approved the review cut. Deliver the final master ProRes / 4K files under Tab #2 below.
                  </p>
                </div>
              </div>
            )}

            {/* CLIENT REVISION REQUESTS & INSTRUCTIONS (FOR EDITORS) */}
            {Array.isArray(project?.revisions) && project.revisions.length > 0 && (
              <div className={styles.portalCard} style={{ padding: '18px 22px', border: '1px solid rgba(245, 158, 11, 0.35)', background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.06) 0%, rgba(15, 23, 42, 0.95) 100%)' }}>
                <div className={styles.cardHeader} style={{ paddingBottom: '8px', borderBottom: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  <div>
                    <h4 className={styles.cardTitle} style={{ color: '#fbbf24' }}>
                      <span className="material-symbols-outlined" style={{ color: '#fbbf24' }}>rate_review</span>
                      Client Revision Instructions ({project.revisions.length} Rounds)
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#cbd5e1' }}>
                      Detailed feedback & change requests submitted by client / studio manager.
                    </p>
                  </div>
                  <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', fontWeight: 700, border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                    Action Items
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px', maxHeight: '360px', overflowY: 'auto' }}>
                  {project.revisions.map((rev: any, idx: number) => (
                    <div key={rev.id || idx} style={{ padding: '12px 14px', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ color: '#fbbf24', fontSize: '13px' }}>
                            Round #{rev.roundNumber || idx + 1}: {rev.title || 'Revision'}
                          </strong>
                          {rev.targetDeliverableTitle && (
                            <span style={{ fontSize: '10px', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                              🎬 {rev.targetDeliverableTitle}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {rev.timecode && (
                            <span style={{ fontSize: '11px', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                              ⏱️ {rev.timecode}
                            </span>
                          )}
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                            {new Date(rev.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div style={{ padding: '8px 10px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px', fontSize: '12px', color: '#f8fafc', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                        {rev.note || 'No notes specified.'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SEPARATED UPLOAD CENTER */}
            <div className={styles.portalCard} style={{ padding: '18px 22px' }}>
              {/* Segmented Mode Switcher */}
              <div className={styles.uploadModeTabs}>
                <button
                  type="button"
                  onClick={() => setActiveUploadTab('DEMO')}
                  className={`${styles.uploadModeBtn} ${activeUploadTab === 'DEMO' ? styles.uploadModeBtnActiveDemo : ''}`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>movie_filter</span>
                  1. Demo / Review Cut
                </button>
                <button
                  type="button"
                  onClick={() => setActiveUploadTab('MASTER')}
                  className={`${styles.uploadModeBtn} ${activeUploadTab === 'MASTER' ? styles.uploadModeBtnActiveMaster : ''}`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>verified</span>
                  2. Complete Master File
                </button>
              </div>

              {/* TAB 1: DEMO / REVIEW CUT (STAGE 6 REVIEW PIPELINE) */}
              {activeUploadTab === 'DEMO' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                  <div className={styles.cardHeader} style={{ paddingBottom: '8px' }}>
                    <div>
                      <h4 className={styles.cardTitle}>
                        <span className="material-symbols-outlined" style={{ color: '#10b981' }}>cloud_upload</span>
                        Share Demo / Review Cut Link
                      </h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                        Draft review cut (Frame.io, Google Drive, Vimeo) for client & studio feedback rounds.
                      </p>
                    </div>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: 700, border: '1px solid rgba(52, 211, 153, 0.3)', whiteSpace: 'nowrap' }}>
                      🎬 Stage 6 Review
                    </span>
                  </div>

                  <form onSubmit={handleSubmitEditorDemo} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {demoSuccess && (
                      <div className={styles.successBanner}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check_circle</span>
                        <span>{demoSuccess}</span>
                      </div>
                    )}

                    {filteredDeliverables.length > 0 && (
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                          Target Deliverable Video (Optional Sync)
                        </label>
                        <select
                          value={selectedDeliverableId}
                          onChange={(e) => {
                            setSelectedDeliverableId(e.target.value);
                            const found = filteredDeliverables.find(v => v.id === e.target.value);
                            if (found && !demoName) {
                              setDemoName(`${found.title} (${found.aspectRatio || '9:16'}) - Review Cut`);
                            }
                          }}
                          className={styles.inputField}
                          style={{ cursor: 'pointer' }}
                        >
                          <option value="ALL">Entire Project / Master Review Cut</option>
                          {filteredDeliverables.map((v, i) => (
                            <option key={v.id || i} value={v.id}>
                              {v.title} ({v.aspectRatio || '9:16'}) — Editor: {v.assignedEditorName || 'Unassigned'}
                            </option>
                          ))}
                        </select>
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
                        Demo / Review Cut URL *
                      </label>
                      <input
                        type="url"
                        required
                        placeholder="e.g. https://frame.io/project/review-link or https://drive.google.com/..."
                        value={demoUrl}
                        onChange={(e) => setDemoUrl(e.target.value)}
                        className={styles.inputField}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                        Editor Notes & Changelog (Optional)
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
                      {submittingDemo ? 'Submitting to CRM & Client...' : '🚀 Submit Demo Cut to Review Pipeline'}
                    </button>
                  </form>

                  {/* Previously Shared Cuts List */}
                  {demoData.demoFiles && demoData.demoFiles.length > 0 && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px', marginTop: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                        Delivered Demo Cuts in Pipeline ({demoData.demoFiles.length})
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                        {demoData.demoFiles.map((file: any) => (
                          <div key={file.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', fontSize: '12px' }}>
                            <div>
                              <strong style={{ color: '#f8fafc', display: 'block' }}>{file.name}</strong>
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Uploaded {file.date} {file.uploadedBy ? `by ${file.uploadedBy}` : ''}</span>
                            </div>
                            <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(16,185,129,0.15)', color: '#34d399', textDecoration: 'none', fontWeight: 600, fontSize: '11px' }}>
                              View ↗
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: COMPLETE MASTER VIDEO (FINAL CRM STORAGE) */}
              {activeUploadTab === 'MASTER' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                  <div className={styles.cardHeader} style={{ paddingBottom: '8px' }}>
                    <div>
                      <h4 className={styles.cardTitle}>
                        <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>cloud_done</span>
                        Deliver Complete / Final Master Video
                      </h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                        Final full-resolution exports (4K / ProRes 422 HQ). Stored securely in CRM Stage 7.
                      </p>
                    </div>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 700, border: '1px solid rgba(56, 189, 248, 0.3)', whiteSpace: 'nowrap' }}>
                      🔒 CRM Master Storage
                    </span>
                  </div>

                  <form onSubmit={handleSubmitFinalVideo} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {finalVideoSuccess && (
                      <div className={styles.successBanner} style={{ background: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check_circle</span>
                        <span>{finalVideoSuccess}</span>
                      </div>
                    )}

                    {filteredDeliverables.length > 0 && (
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                          Target Deliverable Video (Optional Sync)
                        </label>
                        <select
                          value={finalDeliverableId}
                          onChange={(e) => setFinalDeliverableId(e.target.value)}
                          className={styles.inputField}
                          style={{ cursor: 'pointer' }}
                        >
                          <option value="ALL">Entire Project / Master Delivery Link</option>
                          {filteredDeliverables.map((v, i) => (
                            <option key={v.id || i} value={v.id}>
                              {v.title} ({v.aspectRatio || '9:16'}) — Editor: {v.assignedEditorName || 'Unassigned'}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                        Final Master Video / Cloud Folder URL *
                      </label>
                      <input
                        type="url"
                        required
                        placeholder="https://drive.google.com/... or https://dropbox.com/... (Master 4K/ProRes)"
                        value={finalVideoUrl}
                        onChange={(e) => setFinalVideoUrl(e.target.value)}
                        className={styles.inputField}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                        Delivery Specs & Technical Notes (Optional)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="e.g. Master ProRes 422 HQ + Clean Subtitles SRT included in folder."
                        value={finalVideoNotes}
                        onChange={(e) => setFinalVideoNotes(e.target.value)}
                        className={styles.textareaField}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <button
                        type="submit"
                        disabled={submittingFinalVideo}
                        className={styles.submitBtn}
                        style={{ flex: 1, background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                          {submittingFinalVideo ? 'hourglass_empty' : 'cloud_upload'}
                        </span>
                        {submittingFinalVideo ? 'Saving to CRM...' : finalVideoUrl ? 'Update Final Master Delivery Link' : 'Save Final Master Delivery Link'}
                      </button>

                      {finalVideoUrl && (
                        <a
                          href={finalVideoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '10px 16px',
                            borderRadius: '10px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            textDecoration: 'none',
                            fontSize: '13px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Open ↗
                        </a>
                      )}
                    </div>
                  </form>

                  {/* Delivered Deliverables Master List */}
                  {filteredDeliverables.some(v => v.finalVideoUrl) && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px', marginTop: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                        Delivered Video Deliverable Masters
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {filteredDeliverables.filter(v => v.finalVideoUrl).map((v) => (
                          <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', fontSize: '12px' }}>
                            <div>
                              <strong style={{ color: '#f8fafc', display: 'block' }}>{v.title}</strong>
                              <span style={{ fontSize: '11px', color: '#38bdf8' }}>✓ Master ProRes / 4K Linked</span>
                            </div>
                            <a href={v.finalVideoUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(56,189,248,0.15)', color: '#38bdf8', textDecoration: 'none', fontWeight: 600, fontSize: '11px' }}>
                              Open Master ↗
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
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
