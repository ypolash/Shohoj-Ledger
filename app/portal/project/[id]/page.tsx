"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import styles from './portal.module.css';
import RevisionChat from '@/app/erp/components/RevisionChat';

export default function CustomerProjectPortalPage() {
  const params = useParams();
  const projectId = (params?.id as string) || '';

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invoice Modal
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Stage 6 Client Revision Submission State
  const [isRevisionFormOpen, setIsRevisionFormOpen] = useState(false);
  const [isChatUnlocked, setIsChatUnlocked] = useState(false);
  const [revisionDeliverableId, setRevisionDeliverableId] = useState<string>('ALL');
  const [revisionTitle, setRevisionTitle] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  const [revisionTimecode, setRevisionTimecode] = useState('');
  const [submittingRevision, setSubmittingRevision] = useState(false);
  const [revisionSuccess, setRevisionSuccess] = useState<string | null>(null);

  // Stage 7 Client Review Submission State
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  // Script Copy & Expansion State
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);
  const [isScriptExpanded, setIsScriptExpanded] = useState<boolean>(true);

  const handleCopyScript = (id: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedScriptId(id);
    setTimeout(() => setCopiedScriptId(null), 2000);
  };

  const fetchProjectData = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/portal/project/${projectId}`);
      const data = await res.json();
      if (res.ok && data?.project) {
        setProject(data.project);
        if (data.project.reviewData) {
          setRating(data.project.reviewData.rating || 5);
          setReviewText(data.project.reviewData.reviewText || '');
        }
      } else {
        setError(data.error || 'Unable to load project tracking portal');
      }
    } catch (err: any) {
      setError('Network error connecting to client portal');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const handleClientSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionNote.trim()) return;
    setSubmittingRevision(true);
    setRevisionSuccess(null);
    try {
      const targetDeliv = videoDeliverables.find(v => v.id === revisionDeliverableId);

      const res = await fetch(`/api/portal/project/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SUBMIT_REVISION',
          title: revisionTitle.trim(),
          revisionNote: revisionNote.trim(),
          timecode: revisionTimecode.trim(),
          targetDeliverableId: targetDeliv?.id,
          targetDeliverableTitle: targetDeliv ? `${targetDeliv.title} (${targetDeliv.aspectRatio || '9:16'})` : undefined,
          targetEditorName: targetDeliv?.assignedEditorName,
          clientName: project?.clientName
        })
      });
      const data = await res.json();
      if (res.ok) {
        setRevisionSuccess('✓ Your revision request has been submitted to the production team!');
        setRevisionTitle('');
        setRevisionNote('');
        setRevisionTimecode('');
        setRevisionDeliverableId('ALL');
        setIsRevisionFormOpen(false);
        fetchProjectData();
      } else {
        alert(data.error || 'Failed to submit revision');
      }
    } catch (err) {
      alert('Network error submitting revision');
    } finally {
      setSubmittingRevision(false);
    }
  };

  const handleClientApproveDemo = async () => {
    if (!confirm('Are you sure you want to approve this deliverable as final master cut?')) return;
    try {
      const res = await fetch(`/api/portal/project/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE_DEMO' })
      });
      if (res.ok) {
        alert('🎉 Thank you! The deliverable has been approved.');
        fetchProjectData();
      }
    } catch (err) {
      alert('Network error approving demo');
    }
  };

  const handleClientSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    setReviewSuccess(null);
    try {
      const res = await fetch(`/api/portal/project/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SUBMIT_REVIEW',
          rating,
          reviewText: reviewText.trim(),
          clientName: project?.clientName
        })
      });
      const data = await res.json();
      if (res.ok) {
        setReviewSuccess('✓ Thank you for your feedback and rating!');
        fetchProjectData();
      } else {
        alert(data.error || 'Failed to submit review');
      }
    } catch (err) {
      alert('Network error submitting review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0
    }).format(Number(val || 0));
  };

  if (loading) {
    return (
      <div className={styles.portalContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#a855f7', animation: 'spin 1.5s linear infinite' }}>
            hourglass_top
          </span>
          <h3 style={{ color: '#f8fafc', marginTop: '12px' }}>Loading Live Project Tracker...</h3>
          <p style={{ fontSize: '13px' }}>Connecting to production workspace</p>
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
          <p style={{ color: '#94a3b8', fontSize: '13px' }}>{error || 'This project tracking link is invalid or has expired.'}</p>
        </div>
      </div>
    );
  }

  const currentStage = project.currentStage || 4;
  const completedStages = project.completedStages || [];
  const stageNames = project.stageNames || {};
  const productData = project.productData || {};
  const shootingData = project.shootingData || {};
  const editingData = project.editingData || {};
  const demoData = project.demoData || {};
  const reviewData = project.reviewData || null;
  const revisions = project.revisions || [];

  const videoDeliverables: Array<{
    id: string;
    title: string;
    aspectRatio: string;
    assignedEditorId?: string;
    assignedEditorName?: string;
    editorFee?: string;
    rawFootageUrl?: string;
    workingFileUrl?: string;
    demoUrl?: string;
    finalVideoUrl?: string;
    status?: string;
    notes?: string;
    dueDate?: string;
  }> = (Array.isArray(editingData?.videoDeliverables) && editingData.videoDeliverables.length > 0)
    ? editingData.videoDeliverables
    : (Array.isArray(project?.videoDeliverables) && project.videoDeliverables.length > 0)
    ? project.videoDeliverables
    : [];

  const scriptsList: Array<{ id: string; title: string; content?: string; url?: string }> =
    Array.isArray(productData?.scripts) && productData.scripts.length > 0
      ? productData.scripts
      : productData?.script
      ? [{ id: '1', title: 'Main Creative Script', content: productData.script }]
      : [];

  return (
    <div className={styles.portalContainer}>
      <div className={styles.portalInner}>
        {/* Brand & Header Bar */}
        <header className={styles.portalHeader}>
          <div className={styles.headerTop}>
            <div className={styles.brandInfo}>
              <div className={styles.brandLogo}>
                <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>photo_camera</span>
              </div>
              <div className={styles.brandText}>
                <h1>{project.company?.name || 'Studio Production Hub'}</h1>
                <p>Client Live Project Tracking Portal</p>
              </div>
            </div>

            <div className={styles.liveBadge}>
              <span className={styles.liveDot}></span>
              Live Pipeline Active • Stage {currentStage}
            </div>
          </div>

          <div className={styles.projectMetaRow}>
            <div className={styles.projectNameGroup}>
              <h2>{project.name}</h2>
              <div className={styles.pillRow}>
                {project.projectCode && (
                  <span className={styles.codeBadge}>#{project.projectCode}</span>
                )}
                {project.clientName && (
                  <span className={styles.clientBadge}>Client: {project.clientName}</span>
                )}
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Started {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsInvoiceOpen(true)}
              className={styles.invoiceBtn}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>receipt_long</span>
              Download Official Invoice / Receipt
            </button>
          </div>

          {/* Stepper Pipeline */}
          <div className={styles.stepperWrapper}>
            {[1, 2, 3, 4, 5, 6, 7].map((s) => {
              const isActive = currentStage === s;
              const isDone = completedStages.includes(s) || currentStage > s;
              const name = stageNames[s] || `Stage ${s}`;
              return (
                <div
                  key={s}
                  className={`${styles.stepItem} ${isActive ? styles.stepItemActive : isDone ? styles.stepItemCompleted : ''}`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    {isDone ? 'check_circle' : isActive ? 'radio_button_checked' : 'lock'}
                  </span>
                  <span>{name}</span>
                </div>
              );
            })}
          </div>
        </header>

        {/* Financial Highlights Grid */}
        <section className={styles.financialGrid}>
          <div className={styles.financialCard}>
            <span className={styles.financialLabel}>Total Project Budget</span>
            <div className={styles.financialValue} style={{ color: '#f8fafc' }}>
              {formatCurrency(project.budget)}
            </div>
          </div>

          <div className={styles.financialCard}>
            <span className={styles.financialLabel}>Total Advance Paid</span>
            <div className={styles.financialValue} style={{ color: '#34d399' }}>
              {formatCurrency(project.totalPaid)}
            </div>
          </div>

          <div className={styles.financialCard}>
            <span className={styles.financialLabel}>Outstanding Due Balance</span>
            <div className={styles.financialValue} style={{ color: project.due > 0 ? '#f87171' : '#34d399' }}>
              {project.due > 0 ? formatCurrency(project.due) : 'Settled (0 BDT)'}
            </div>
          </div>

          <div className={styles.financialCard}>
            <span className={styles.financialLabel}>Overall Progress</span>
            <div className={styles.financialValue} style={{ color: '#a855f7' }}>
              {project.progress || Math.round((currentStage / 7) * 100)}%
            </div>
          </div>
        </section>

        {/* ====================================================================
            STAGE 1-2 VIEW: PROJECT INITIALIZATION & PREPARATION
            ==================================================================== */}
        {currentStage < 3 && (
          <div className={styles.stageHeroBanner} style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(59,130,246,0.15) 100%)', borderColor: 'rgba(99,102,241,0.3)' }}>
            <div className={styles.stageHeroLeft}>
              <div className={styles.stageHeroIcon} style={{ background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>pending_actions</span>
              </div>
              <div className={styles.stageHeroText}>
                <h3>Project Preparation Active • Stage {currentStage}: {stageNames[currentStage] || 'Initial Setup'}</h3>
                <p>Contract and advance payment logged. Live product intake and shoot scheduling will activate on Stage 3.</p>
              </div>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#818cf8', padding: '6px 14px', borderRadius: '10px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
              Preparing Production
            </span>
          </div>
        )}

        {/* ====================================================================
            STAGE 3-4 VIEW: INTAKE, CREATIVE SCRIPTING, TALENT & SHOOTING
            ==================================================================== */}
        {(currentStage === 3 || currentStage === 4) && (
          <>
            <div className={styles.stageHeroBanner} style={{
              background: currentStage === 3 
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.25) 100%)'
                : 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(190, 24, 93, 0.25) 100%)',
              borderColor: currentStage === 3 ? 'rgba(245, 158, 11, 0.35)' : 'rgba(236, 72, 153, 0.35)'
            }}>
              <div className={styles.stageHeroLeft}>
                <div className={styles.stageHeroIcon} style={{
                  background: currentStage === 3
                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                    : 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                    {currentStage === 3 ? 'description' : 'photo_camera'}
                  </span>
                </div>
                <div className={styles.stageHeroText}>
                  <h3>
                    Stage {currentStage}: {stageNames[currentStage] || (currentStage === 3 ? (productData.projectType === 'service' ? 'Service Planning & Scripting' : 'Product Intake & Scripting') : 'Shooting & Production Execution')}
                  </h3>
                  <p>
                    {currentStage === 3
                      ? 'Product intake verified, creative script & storyboard prepared, talent assigned, and shooting schedule active.'
                      : 'Product received, creative script locked, model on set, and live studio shooting underway.'}
                  </p>
                </div>
              </div>
              <span style={{
                fontSize: '13px',
                fontWeight: 700,
                color: currentStage === 3 ? '#fbbf24' : '#f472b6',
                padding: '6px 14px',
                borderRadius: '10px',
                background: currentStage === 3 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(236, 72, 153, 0.15)',
                border: currentStage === 3 ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(236, 72, 153, 0.35)'
              }}>
                {currentStage === 3 
                  ? (productData.projectType === 'service' ? '⚡ Service & Script Active' : (productData.received ? '✓ Products & Script Active' : 'Scripting & Intake'))
                  : (shootingData.status || 'Shooting Scheduled')}
              </span>
            </div>

            <div className={styles.portalGrid2}>
              {/* Product Intake Card */}
              <div className={styles.portalCard}>
                <div className={styles.cardHeader}>
                  <h4 className={styles.cardTitle}>
                    <span className="material-symbols-outlined" style={{ color: '#fbbf24' }}>
                      {productData.projectType === 'service' ? 'design_services' : 'inventory_2'}
                    </span>
                    {productData.projectType === 'service' ? 'Service Plan & Configuration' : 'Product Intake & Inspection'}
                  </h4>
                  <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 700 }}>
                    {productData.projectType === 'service' ? '⚡ Service Ready' : '✓ Verified'}
                  </span>
                </div>

                {productData.projectType === 'service' ? (
                  <div style={{ padding: '12px 14px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '10px', fontSize: '13px', color: '#93c5fd' }}>
                    <strong style={{ display: 'block', color: '#60a5fa', marginBottom: '4px' }}>Service Based Project</strong>
                    No physical product intake required. Production schedule, script, and talent assignments are configured below.
                  </div>
                ) : productData.productsList && productData.productsList.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {productData.productsList.map((p: any, idx: number) => (
                      <div key={p.id || idx} className={styles.productItemCard}>
                        <div className={styles.productHeader}>
                          <span className={styles.productName}>
                            <span className="material-symbols-outlined" style={{ color: '#fbbf24', fontSize: '18px' }}>check_circle</span>
                            {p.name}
                          </span>
                          <div className={styles.productTags}>
                            <span className={styles.qtyTag}>{p.quantity}</span>
                            <span className={styles.condTag}>{p.condition}</span>
                          </div>
                        </div>
                        {p.notes && (
                          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                            {p.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.productItemCard}>
                    <div className={styles.productHeader}>
                      <span className={styles.productName}>
                        {productData.productName || 'Physical Inventory / Garments'}
                      </span>
                      <span className={styles.condTag}>{productData.condition || 'Good'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Shooting Schedule & Model Talent Card */}
              <div className={styles.portalCard}>
                <div className={styles.cardHeader}>
                  <h4 className={styles.cardTitle}>
                    <span className="material-symbols-outlined" style={{ color: '#f472b6' }}>face</span>
                    Shooting Schedule & Talent Details
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Shooting Date</span>
                    <span className={styles.infoValue}>
                      {productData.shootingDate ? new Date(productData.shootingDate).toLocaleDateString() : 'To Be Scheduled'}
                    </span>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Time Slot Window</span>
                    <span className={styles.infoValue}>
                      {productData.shootingTime || '10:00 AM - 04:00 PM'}
                    </span>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Studio Location</span>
                    <span className={styles.infoValue}>
                      {productData.studioLocation || 'Studio Main Floor'}
                    </span>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Assigned Model / Talent</span>
                    <span className={styles.infoValue} style={{ color: '#f472b6' }}>
                      {productData.assignedModelName || 'Talent Assigned'}
                    </span>
                  </div>

                  {productData.modelNotes && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Wardrobe / Specs</span>
                      <span className={styles.infoValue}>{productData.modelNotes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Creative Scripts & Storyboards Card (Stage 3) */}
            <div className={styles.portalCard} style={{ marginTop: '4px', borderColor: 'rgba(251, 191, 36, 0.3)', background: 'rgba(30, 41, 59, 0.7)' }}>
              <div className={styles.cardHeader}>
                <h4 className={styles.cardTitle}>
                  <span className="material-symbols-outlined" style={{ color: '#fbbf24' }}>description</span>
                  Creative Scripts & Storyboards ({scriptsList.length})
                </h4>
                <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.3)', fontWeight: 700 }}>
                  {scriptsList.length > 0 ? '✓ Script Live' : 'Drafting'}
                </span>
              </div>

              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' }}>
                Official production voiceover scripts, dialogue cues, shot-by-shot storyboards, and cloud document links approved for this shoot.
              </p>

              {scriptsList.length > 0 ? (
                <div className={styles.scriptsGrid}>
                  {scriptsList.map((script, idx) => (
                    <div key={script.id || idx} className={styles.scriptItemCard}>
                      <div className={styles.scriptHeader}>
                        <div className={styles.scriptTitle}>
                          <span className="material-symbols-outlined" style={{ color: '#fbbf24', fontSize: '18px' }}>
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
                              title="Open cloud document in new tab"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>open_in_new</span>
                              Open Cloud Doc ↗
                            </a>
                          )}
                          {script.content && (
                            <button
                              type="button"
                              onClick={() => handleCopyScript(script.id || String(idx), script.content || '')}
                              className={styles.scriptCopyBtn}
                              title="Copy script text"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                                {copiedScriptId === (script.id || String(idx)) ? 'check' : 'content_copy'}
                              </span>
                              {copiedScriptId === (script.id || String(idx)) ? 'Copied!' : 'Copy'}
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
                          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#38bdf8' }}>link</span>
                          <span>Cloud document attached. Click <strong>Open Cloud Doc ↗</strong> above to read online.</span>
                        </div>
                      ) : (
                        <div className={styles.scriptContentEmpty}>
                          <span>No script text entered yet.</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '24px 20px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px dashed rgba(251, 191, 36, 0.25)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: '8px',
                  color: '#94a3b8'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '30px', color: '#fbbf24' }}>
                    edit_note
                  </span>
                  <strong style={{ color: '#f8fafc', fontSize: '13px' }}>
                    Creative Scripts in Progress
                  </strong>
                  <p style={{ margin: 0, fontSize: '12px', maxWidth: '400px', lineHeight: '1.4' }}>
                    Scene scripts, dialogues, and storyboard documents are currently being drafted by our creative director. They will appear here automatically once logged.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ====================================================================
            STAGE 5 VIEW: EDITING & POST-PRODUCTION (Editor Progress, Status, Specs)
            ==================================================================== */}
        {currentStage === 5 && (
          <>
            <div className={styles.stageHeroBanner}>
              <div className={styles.stageHeroLeft}>
                <div className={styles.stageHeroIcon} style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>movie_edit</span>
                </div>
                <div className={styles.stageHeroText}>
                  <h3>Stage 5: {stageNames[5] || 'Post-Production & Editing'}</h3>
                  <p>Raw footage is currently being processed, color graded, and mastered by our lead editor.</p>
                </div>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#818cf8', padding: '6px 14px', borderRadius: '10px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
                {editingData.status || 'In Progress'}
              </span>
            </div>

            <div className={styles.portalGrid2}>
              {/* Editor Details Card */}
              <div className={styles.portalCard}>
                <div className={styles.cardHeader}>
                  <h4 className={styles.cardTitle}>
                    <span className="material-symbols-outlined" style={{ color: '#818cf8' }}>person_pin</span>
                    Post-Production Team & Timeline
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Assigned Editor</span>
                    <span className={styles.infoValue} style={{ color: '#818cf8' }}>
                      {shootingData.assignedEditorName || 'Lead Creative Editor'}
                    </span>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Editing Status</span>
                    <span className={styles.infoValue}>{editingData.status || 'Color Grading & Audio Sync'}</span>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Expected Delivery Date</span>
                    <span className={styles.infoValue}>
                      {shootingData.expectedEditDelivery ? new Date(shootingData.expectedEditDelivery).toLocaleDateString() : 'Scheduled'}
                    </span>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Deliverable Formats</span>
                    <span className={styles.infoValue}>{editingData.deliverableSpecs || '1080x1920 (9:16 Reels) + 4K ProRes Master'}</span>
                  </div>
                </div>
              </div>

              {/* Deliverable Formats & Asset Repository */}
              <div className={styles.portalCard}>
                <div className={styles.cardHeader}>
                  <h4 className={styles.cardTitle}>
                    <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>movie_filter</span>
                    Deliverable Formats & Export Specs
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Deliverable Formats</span>
                    <span className={styles.infoValue} style={{ color: '#a5b4fc' }}>
                      {editingData.deliverableSpecs || '1080x1920 (9:16 Reels) + 4K ProRes Master'}
                    </span>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Assigned Model / Talent</span>
                    <span className={styles.infoValue}>{productData.assignedModelName || 'Featured Talent'}</span>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Production Notes</span>
                    <span className={styles.infoValue}>{productData.studioLocation || 'Studio Production'}</span>
                  </div>

                  {editingData.editorNotes && (
                    <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '12px' }}>
                      <span style={{ display: 'block', color: '#94a3b8', fontWeight: 600, marginBottom: '2px' }}>Editor Changelog:</span>
                      <p style={{ margin: 0, color: '#f8fafc', whiteSpace: 'pre-line' }}>{editingData.editorNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stage 5 Multi-Video Deliverables Showcase */}
            {videoDeliverables.length > 0 && (
              <div className={styles.portalCard} style={{ marginTop: '16px', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
                <div className={styles.cardHeader}>
                  <h4 className={styles.cardTitle}>
                    <span className="material-symbols-outlined" style={{ color: '#c084fc' }}>video_library</span>
                    Project Video Deliverables & Formats ({videoDeliverables.length} Videos)
                  </h4>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', fontWeight: 700, border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                    In Post-Production
                  </span>
                </div>

                <div className={styles.clientDeliverablesGrid}>
                  {videoDeliverables.map((v, i) => {
                    const status = v.status || 'Assigned';
                    const statusClass = 
                      status === 'Approved' ? styles.statusApproved :
                      status === 'Completed' ? styles.statusCompleted :
                      status === 'Review Ready' ? styles.statusReviewReady :
                      status === 'In Progress' ? styles.statusInProgress :
                      styles.statusAssigned;

                    return (
                      <div key={v.id || i} className={styles.clientDeliverableCard}>
                        <div className={styles.clientDeliverableTop}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span className={styles.clientDeliverableTitle}>
                              <span className="material-symbols-outlined" style={{ color: '#a855f7', fontSize: '18px' }}>movie</span>
                              {v.title || `Video #${i + 1}`}
                            </span>
                            <span className={styles.aspectRatioTag}>
                              📐 {v.aspectRatio || '9:16 Reel'}
                            </span>
                          </div>
                          <span className={`${styles.clientStatusBadge} ${statusClass}`}>
                            {status}
                          </span>
                        </div>

                        {v.notes && (
                          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                            {v.notes}
                          </p>
                        )}

                        {v.demoUrl ? (
                          <a href={v.demoUrl} target="_blank" rel="noopener noreferrer" className={styles.clientWatchBtn}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>play_circle</span>
                            Watch Demo Cut ↗
                          </a>
                        ) : (
                          <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', padding: '4px 0' }}>
                            🎬 Editing underway by production team
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* ====================================================================
            STAGE 6 VIEW: DEMO PREVIEW & INTERACTIVE CLIENT REVISIONS
            ==================================================================== */}
        {currentStage === 6 && (
          <>
            <div className={styles.stageHeroBanner}>
              <div className={styles.stageHeroLeft}>
                <div className={styles.stageHeroIcon} style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>rate_review</span>
                </div>
                <div className={styles.stageHeroText}>
                  <h3>Stage 6: {stageNames[6] || 'Client Demo Review & Revisions'}</h3>
                  <p>Review demo cuts, request changes, or approve the final deliverable below.</p>
                </div>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', padding: '6px 14px', borderRadius: '10px', background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)' }}>
                {demoData.approvalStatus || 'Pending Client Review'}
              </span>
            </div>

            {/* Stage 6 Video Deliverables Review Matrix */}
            {videoDeliverables.length > 0 && (
              <div className={styles.portalCard} style={{ borderColor: 'rgba(56, 189, 248, 0.3)' }}>
                <div className={styles.cardHeader}>
                  <h4 className={styles.cardTitle}>
                    <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>video_library</span>
                    Video Deliverables Cuts ({videoDeliverables.length} Videos)
                  </h4>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 700, border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                    Review Pipeline
                  </span>
                </div>

                <div className={styles.clientDeliverablesGrid}>
                  {videoDeliverables.map((v, i) => {
                    const status = v.status || 'Assigned';
                    const statusClass = 
                      status === 'Approved' ? styles.statusApproved :
                      status === 'Completed' ? styles.statusCompleted :
                      status === 'Review Ready' ? styles.statusReviewReady :
                      status === 'In Progress' ? styles.statusInProgress :
                      styles.statusAssigned;

                    return (
                      <div key={v.id || i} className={styles.clientDeliverableCard}>
                        <div className={styles.clientDeliverableTop}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span className={styles.clientDeliverableTitle}>
                              <span className="material-symbols-outlined" style={{ color: '#38bdf8', fontSize: '18px' }}>movie</span>
                              {v.title || `Video #${i + 1}`}
                            </span>
                            <span className={styles.aspectRatioTag}>
                              📐 {v.aspectRatio || '9:16 Reel'}
                            </span>
                          </div>
                          <span className={`${styles.clientStatusBadge} ${statusClass}`}>
                            {status}
                          </span>
                        </div>

                        {v.notes && (
                          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                            {v.notes}
                          </p>
                        )}

                        {v.demoUrl ? (
                          <a href={v.demoUrl} target="_blank" rel="noopener noreferrer" className={styles.clientWatchBtn}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>play_circle</span>
                            Watch Review Cut ↗
                          </a>
                        ) : (
                          <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', padding: '4px 0' }}>
                            🎬 Cut rendering in progress
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={styles.portalGrid2}>
              {/* Left Card: Attached Demo Preview Files & Multiple Revisions System */}
              <div className={styles.portalCard} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div className={styles.cardHeader}>
                    <h4 className={styles.cardTitle}>
                      <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>play_circle</span>
                      Attached Demo Preview Deliverables ({demoData.demoFiles?.length || 0})
                    </h4>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                    {demoData.demoFiles && demoData.demoFiles.length > 0 ? (
                      demoData.demoFiles.map((file: any) => (
                        <div key={file.id} className={styles.demoCard}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <strong style={{ fontSize: '14px', color: '#f8fafc' }}>{file.name}</strong>
                              {file.uploadedBy && (
                                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)', fontWeight: 600 }}>
                                  🎬 {file.uploadedBy}
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                              Delivered {file.date}
                            </span>
                            {file.note && (
                              <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#cbd5e1', fontStyle: 'italic' }}>
                                "{file.note}"
                              </p>
                            )}
                          </div>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.demoLinkBtn}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
                            Watch Demo ↗
                          </a>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '13px' }}>
                        Demo cut is being rendered by our editor. Check back shortly.
                      </div>
                    )}

                    {demoData.approvalStatus !== 'Approved' && (
                      <button
                        type="button"
                        onClick={handleClientApproveDemo}
                        className={styles.actionBtnSuccess}
                        style={{ marginTop: '8px' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                        Approve Deliverable as Final Master Cut ✓
                      </button>
                    )}
                  </div>
                </div>

                {/* Multiple Revision Allowance & Billing Section */}
                {(() => {
                  const revList = Array.isArray(project.revisions) ? project.revisions : [];
                  const isVip = Boolean(demoData.isSpecialCustomerFree);
                  const freeIncluded = demoData.freeRevisionsIncluded !== undefined ? Number(demoData.freeRevisionsIncluded) : 2;
                  const costPerRev = demoData.costPerRevision !== undefined ? Number(demoData.costPerRevision) : 1000;
                  const nextRound = revList.length + 1;
                  const isNextBillable = !isVip && nextRound > freeIncluded;

                  return (
                    <div style={{ padding: '16px', background: 'rgba(251, 191, 36, 0.05)', border: '1px solid rgba(251, 191, 36, 0.25)', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="material-symbols-outlined" style={{ color: '#fbbf24', fontSize: '20px' }}>receipt_long</span>
                          <strong style={{ fontSize: '13px', color: '#fbbf24' }}>Revision Policy & Rounds</strong>
                        </div>
                        {isVip ? (
                          <span style={{ padding: '3px 10px', borderRadius: '12px', background: 'rgba(168,85,247,0.2)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.4)', fontSize: '11px', fontWeight: 700 }}>
                            👑 Special VIP Customer (Unlimited Free Revisions)
                          </span>
                        ) : (
                          <span style={{ padding: '3px 10px', borderRadius: '12px', background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', fontSize: '11px', fontWeight: 700 }}>
                            {Math.min(freeIncluded, revList.length)}/{freeIncluded} Free Used • Extra: {formatCurrency(costPerRev)}/rev
                          </span>
                        )}
                      </div>

                      {/* Request Revision Round Trigger Button */}
                      {!isRevisionFormOpen && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsRevisionFormOpen(true);
                            setIsChatUnlocked(true);
                          }}
                          className={styles.actionBtnPrimary}
                          style={{ background: isNextBillable ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
                          + Request Revision Round #{nextRound} {isNextBillable ? `(${formatCurrency(costPerRev)} Billable)` : '(FREE)'}
                        </button>
                      )}

                      {/* Revision Submission Form */}
                      {isRevisionFormOpen && (
                        <form onSubmit={handleClientSubmitRevision} style={{ padding: '14px', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '13px', color: '#f8fafc' }}>
                              Requesting Revision Round #{nextRound}
                            </strong>
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: isNextBillable ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)', color: isNextBillable ? '#fbbf24' : '#34d399', border: isNextBillable ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(16,185,129,0.4)' }}>
                              {isVip ? '👑 VIP Free' : isNextBillable ? `💳 Billable: +${formatCurrency(costPerRev)}` : `✓ Free (${nextRound}/${freeIncluded})`}
                            </span>
                          </div>

                          {/* Deliverable Selector if multiple deliverables exist */}
                          {videoDeliverables.length > 0 && (
                            <div>
                              <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                                Target Video Deliverable:
                              </label>
                              <select
                                value={revisionDeliverableId}
                                onChange={(e) => setRevisionDeliverableId(e.target.value)}
                                className={styles.portalInput}
                                style={{ width: '100%', cursor: 'pointer', background: 'rgba(15, 23, 42, 0.8)' }}
                              >
                                <option value="ALL">🎬 Entire Project / All Deliverables</option>
                                {videoDeliverables.map((v, idx) => (
                                  <option key={v.id || idx} value={v.id}>
                                    🎬 {v.title || `Video #${idx + 1}`} ({v.aspectRatio || '9:16'})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          <input
                            type="text"
                            placeholder="Revision Topic / Scope (e.g. Intro pacing and color tint)"
                            value={revisionTitle}
                            onChange={(e) => setRevisionTitle(e.target.value)}
                            className={styles.portalInput}
                          />

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="text"
                              placeholder="Timestamp (e.g. 00:15 - 00:22)"
                              value={revisionTimecode}
                              onChange={(e) => setRevisionTimecode(e.target.value)}
                              className={styles.portalInput}
                              style={{ maxWidth: '160px' }}
                            />
                            <span style={{ fontSize: '11px', color: '#94a3b8', alignSelf: 'center' }}>Optional timecode</span>
                          </div>

                          <textarea
                            rows={3}
                            required
                            placeholder="Describe requested adjustments in detail..."
                            value={revisionNote}
                            onChange={(e) => setRevisionNote(e.target.value)}
                            className={styles.portalTextarea}
                          />

                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                            <button
                              type="button"
                              onClick={() => setIsRevisionFormOpen(false)}
                              style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', fontSize: '12px', cursor: 'pointer' }}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={submittingRevision}
                              className={styles.actionBtnPrimary}
                              style={{ padding: '8px 16px', fontSize: '12px' }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>send</span>
                              {submittingRevision ? 'Submitting...' : `Submit Round #${nextRound}`}
                            </button>
                          </div>
                        </form>
                      )}

                      {revisionSuccess && (
                        <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: '#34d399', fontSize: '12px', fontWeight: 600 }}>
                          {revisionSuccess}
                        </div>
                      )}

                      {/* Previous Revision Rounds Log */}
                      {revList.length > 0 && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', marginTop: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                            Revision Rounds History ({revList.length})
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                            {revList.map((rev: any, index: number) => {
                              const roundNum = rev.roundNumber || (revList.length - index);
                              const isBill = Boolean(rev.isBillable);
                              return (
                                <div key={rev.id || index} style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '12px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <strong style={{ color: '#fbbf24', fontSize: '12px' }}>
                                        Round #{roundNum}
                                      </strong>
                                      {rev.timecode && (
                                        <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '4px', background: 'rgba(0,0,0,0.4)', color: '#38bdf8', fontFamily: 'monospace' }}>
                                          ⏱ {rev.timecode}
                                        </span>
                                      )}
                                    </div>
                                    <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: isVip ? 'rgba(168,85,247,0.15)' : isBill ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', color: isVip ? '#c084fc' : isBill ? '#fbbf24' : '#34d399', fontWeight: 600 }}>
                                      {isVip ? '👑 VIP Free' : isBill ? `💳 Billable (+${formatCurrency(rev.cost || costPerRev)})` : '✓ Free Included'}
                                    </span>
                                  </div>
                                  {rev.targetDeliverableTitle && (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 6px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '4px', fontSize: '10px', color: '#a5b4fc', marginBottom: '4px' }}>
                                      <span>🎬</span>
                                      <span>{rev.targetDeliverableTitle}</span>
                                    </div>
                                  )}
                                  <p style={{ margin: '2px 0 0 0', color: '#f8fafc', fontSize: '12px' }}>{rev.note}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Right Card: Interactive Revision Chat or Locked State */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {demoData.approvalStatus === 'Approved' ? (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 78, 59, 0.25) 100%)',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                    borderRadius: '16px',
                    padding: '36px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    minHeight: '380px',
                    gap: '12px'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#34d399' }}>check_circle</span>
                    <h4 style={{ margin: 0, color: '#34d399', fontSize: '18px', fontWeight: 800 }}>Master Cut Approved!</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', maxWidth: '320px', lineHeight: '1.5' }}>
                      You have approved this deliverable as final master cut. Production chat is concluded and contract settlement is ready.
                    </p>
                  </div>
                ) : !isChatUnlocked ? (
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '36px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    minHeight: '380px',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'rgba(251, 191, 36, 0.12)',
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fbbf24'
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>lock</span>
                    </div>
                    <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '16px', fontWeight: 700 }}>
                      Revision Chat Locked
                    </h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', maxWidth: '320px', lineHeight: '1.5' }}>
                      Live chat with the production editor is locked. To submit feedback, request timecoded changes, or discuss edits, please click the button below.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsChatUnlocked(true);
                        setIsRevisionFormOpen(true);
                      }}
                      className={styles.actionBtnPrimary}
                      style={{
                        marginTop: '8px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        fontSize: '13px'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>lock_open</span>
                      Request Revision & Unlock Chat
                    </button>
                  </div>
                ) : (
                  <RevisionChat
                    projectId={projectId}
                    currentUserRole="CLIENT"
                    currentUserName={project.clientName || "Customer"}
                    messages={project.revisionChat || []}
                    demoFiles={demoData.demoFiles || []}
                    videoDeliverables={videoDeliverables}
                    onRefresh={fetchProjectData}
                  />
                )}
              </div>
            </div>
          </>
        )}

        {/* ====================================================================
            STAGE 7 VIEW: COMPLETE & CLIENT REVIEW SYSTEM
            ==================================================================== */}
        {currentStage >= 7 && (
          <>
            <div className={styles.stageHeroBanner} style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(6,78,59,0.4) 100%)', borderColor: 'rgba(52,211,153,0.4)' }}>
              <div className={styles.stageHeroLeft}>
                <div className={styles.stageHeroIcon} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>verified</span>
                </div>
                <div className={styles.stageHeroText}>
                  <h3 style={{ color: '#34d399' }}>Project Successfully Delivered & Completed!</h3>
                  <p>All contract milestones, video mastering, and deliverable assets have been fulfilled.</p>
                </div>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', padding: '6px 14px', borderRadius: '10px', background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)' }}>
                ✓ 100% Complete & Settled
              </span>
            </div>

            <div className={styles.portalGrid2}>
              {/* Settlement & Deliverable Links Card */}
              <div className={styles.portalCard}>
                <div className={styles.cardHeader}>
                  <h4 className={styles.cardTitle}>
                    <span className="material-symbols-outlined" style={{ color: '#34d399' }}>cloud_download</span>
                    Master Assets & Contract Settlement
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Final Contract Value</span>
                    <span className={styles.infoValue} style={{ color: '#34d399' }}>{formatCurrency(project.budget)}</span>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Total Payment Received</span>
                    <span className={styles.infoValue} style={{ color: '#38bdf8' }}>{formatCurrency(project.totalPaid)}</span>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Payment Status</span>
                    <span className={styles.infoValue} style={{ color: '#34d399' }}>
                      {project.due <= 0 ? '✓ Fully Cleared & Settled' : `Due: ${formatCurrency(project.due)}`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsInvoiceOpen(true)}
                    className={styles.invoiceBtn}
                    style={{ marginTop: '10px', justifyContent: 'center' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                    Download Paid Invoice / Tax Receipt
                  </button>
                </div>
              </div>

              {/* Interactive 5-Star Rating & Review Form */}
              <div className={styles.portalCard}>
                <div className={styles.cardHeader}>
                  <h4 className={styles.cardTitle}>
                    <span className="material-symbols-outlined" style={{ color: '#fbbf24' }}>star</span>
                    Rate Your Experience & Leave a Review
                  </h4>
                </div>

                <form onSubmit={handleClientSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: '#94a3b8' }}>Select Star Rating</label>
                    <div className={styles.starRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`${styles.starBtn} ${star <= rating ? styles.starBtnActive : ''}`}
                          title={`${star} Stars`}
                        >
                          ★
                        </button>
                      ))}
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24', marginLeft: '6px' }}>
                        {rating} / 5 Stars
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: '#94a3b8' }}>Your Review / Testimonial</label>
                    <textarea
                      rows={3}
                      placeholder="Tell us about the shooting quality, turnaround time, communication, and overall experience..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      className={styles.portalTextarea}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className={styles.actionBtnPrimary}
                    style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', color: '#0f172a' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>rate_review</span>
                    {submittingReview ? 'Submitting...' : reviewData ? 'Update My Review' : 'Submit Client Review'}
                  </button>

                  {reviewSuccess && (
                    <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: '#34d399', fontSize: '12px', fontWeight: 600 }}>
                      {reviewSuccess}
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Stage 7 Completed Deliverables Showcase */}
            {videoDeliverables.length > 0 && (
              <div className={styles.portalCard} style={{ marginTop: '16px', borderColor: 'rgba(16, 185, 129, 0.35)' }}>
                <div className={styles.cardHeader}>
                  <h4 className={styles.cardTitle}>
                    <span className="material-symbols-outlined" style={{ color: '#34d399' }}>check_circle</span>
                    Delivered Master Videos ({videoDeliverables.length} Videos)
                  </h4>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.35)' }}>
                    ✓ Production Complete
                  </span>
                </div>

                <div className={styles.clientDeliverablesGrid}>
                  {videoDeliverables.map((v, i) => (
                    <div key={v.id || i} className={styles.clientDeliverableCard}>
                      <div className={styles.clientDeliverableTop}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span className={styles.clientDeliverableTitle}>
                            <span className="material-symbols-outlined" style={{ color: '#34d399', fontSize: '18px' }}>movie</span>
                            {v.title || `Video #${i + 1}`}
                          </span>
                          <span className={styles.aspectRatioTag}>
                            📐 {v.aspectRatio || '9:16 Reel'}
                          </span>
                        </div>
                        <span className={`${styles.clientStatusBadge} ${styles.statusApproved}`}>
                          {v.status || 'Approved'}
                        </span>
                      </div>

                      {v.notes && (
                        <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                          {v.notes}
                        </p>
                      )}

                      {v.demoUrl && (
                        <a href={v.demoUrl} target="_blank" rel="noopener noreferrer" className={styles.clientWatchBtn}>
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>play_circle</span>
                          Watch Deliverable ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ====================================================================
            STAGE 5-7 VIEW: STAGE 3 SCRIPT & STORYBOARD REFERENCE
            ==================================================================== */}
        {currentStage >= 5 && scriptsList.length > 0 && (
          <div className={styles.portalCard} style={{ borderColor: 'rgba(251, 191, 36, 0.25)', background: 'rgba(30, 41, 59, 0.55)' }}>
            <div
              className={styles.cardHeader}
              style={{ cursor: 'pointer', userSelect: 'none', paddingBottom: isScriptExpanded ? '12px' : 0, borderBottom: isScriptExpanded ? '1px solid rgba(255, 255, 255, 0.08)' : 'none' }}
              onClick={() => setIsScriptExpanded(!isScriptExpanded)}
            >
              <h4 className={styles.cardTitle}>
                <span className="material-symbols-outlined" style={{ color: '#fbbf24' }}>description</span>
                Stage 3 Approved Scripts & Storyboards ({scriptsList.length})
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 600 }}>
                  {isScriptExpanded ? 'Hide Scripts' : 'View Scripts'}
                </span>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#fbbf24', transition: 'transform 0.2s ease', transform: isScriptExpanded ? 'rotate(180deg)' : 'none' }}>
                  expand_more
                </span>
              </div>
            </div>

            {isScriptExpanded && (
              <div className={styles.scriptsGrid} style={{ marginTop: '6px' }}>
                {scriptsList.map((script, idx) => (
                  <div key={script.id || idx} className={styles.scriptItemCard}>
                    <div className={styles.scriptHeader}>
                      <div className={styles.scriptTitle}>
                        <span className="material-symbols-outlined" style={{ color: '#fbbf24', fontSize: '18px' }}>
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
                            title="Open cloud document in new tab"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>open_in_new</span>
                            Open Cloud Doc ↗
                          </a>
                        )}
                        {script.content && (
                          <button
                            type="button"
                            onClick={() => handleCopyScript(script.id || String(idx), script.content || '')}
                            className={styles.scriptCopyBtn}
                            title="Copy script text"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                              {copiedScriptId === (script.id || String(idx)) ? 'check' : 'content_copy'}
                            </span>
                            {copiedScriptId === (script.id || String(idx)) ? 'Copied!' : 'Copy'}
                          </button>
                        )}
                      </div>
                    </div>

                    {script.content && (
                      <div className={styles.scriptContentBox}>
                        {script.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ====================================================================
          MODAL: EXECUTIVE INVOICE & PAYMENT RECEIPT
          ==================================================================== */}
      {isInvoiceOpen && (
        <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setIsInvoiceOpen(false); }}>
          <div className={styles.invoiceModalContent}>
            {/* Invoice Header */}
            <div className={styles.invoiceHeader}>
              <div>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
                  {project.company?.name || 'STUDIO PRODUCTION LEDGER'}
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  Official Commercial Production Invoice & Payment Receipt
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#2563eb' }}>
                  INVOICE #{project.projectCode || project.id.slice(0, 8).toUpperCase()}
                </span>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                  Date: {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Billed To / Project Meta */}
            <div className={styles.invoiceMetaGrid}>
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Billed To</span>
                <strong style={{ display: 'block', fontSize: '15px', color: '#0f172a', marginTop: '4px' }}>
                  {project.clientName || 'Client / Commercial Partner'}
                </strong>
                {project.clientPhone && (
                  <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Phone: {project.clientPhone}
                  </span>
                )}
              </div>

              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Project Reference</span>
                <strong style={{ display: 'block', fontSize: '15px', color: '#0f172a', marginTop: '4px' }}>
                  {project.name}
                </strong>
                <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Pipeline Status: {stageNames[currentStage] || `Stage ${currentStage}`}
                </span>
              </div>
            </div>

            {/* Line Items Table */}
            <table className={styles.invoiceTable}>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity / Scope</th>
                  <th style={{ textAlign: 'right' }}>Amount (BDT)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Commercial Media Production & Shoot</strong>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      {productData.productName ? `Intake: ${productData.productName}` : 'Product photography, video & post-production'}
                    </div>
                  </td>
                  <td>1 Project Contract</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(project.baseBudget || project.budget)}</td>
                </tr>

                {project.totalRevisionFees > 0 && (
                  <tr style={{ background: '#fefce8' }}>
                    <td>
                      <strong style={{ color: '#854d0e' }}>Additional Revision Fees ({project.demoData?.billableRevisionsCount || 0} rounds)</strong>
                      <div style={{ fontSize: '11px', color: '#a16207', marginTop: '2px' }}>
                        Extra client modifications beyond {project.demoData?.freeRevisionsIncluded || 2} free rounds (@ {formatCurrency(project.demoData?.costPerRevision || 1000)}/round)
                      </div>
                    </td>
                    <td>{project.demoData?.billableRevisionsCount || 0} Extra Rounds</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#854d0e' }}>
                      +{formatCurrency(project.totalRevisionFees)}
                    </td>
                  </tr>
                )}

                {project.payments && project.payments.length > 0 && (
                  project.payments.map((p: any, i: number) => (
                    <tr key={p.id || i} style={{ background: '#f0fdf4' }}>
                      <td style={{ color: '#16a34a' }}>
                        ✓ Payment Received ({p.paymentMethod || 'Bank'}) {p.notes ? `- ${p.notes}` : ''}
                      </td>
                      <td style={{ color: '#16a34a', fontSize: '11px' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>
                        -{formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Totals Summary */}
            <div className={styles.invoiceTotalBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '260px', fontSize: '13px', color: '#475569' }}>
                <span>Base Contract Total:</span>
                <strong>{formatCurrency(project.baseBudget || project.budget)}</strong>
              </div>
              {project.totalRevisionFees > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '260px', fontSize: '13px', color: '#854d0e' }}>
                  <span>Revision Fees:</span>
                  <strong>+{formatCurrency(project.totalRevisionFees)}</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '260px', fontSize: '13px', color: '#16a34a' }}>
                <span>Total Paid / Advance:</span>
                <strong>-{formatCurrency(project.totalPaid)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '260px', fontSize: '16px', fontWeight: 800, color: project.due > 0 ? '#dc2626' : '#16a34a', borderTop: '2px solid #e2e8f0', paddingTop: '6px', marginTop: '4px' }}>
                <span>Balance Due:</span>
                <span>{project.due > 0 ? formatCurrency(project.due) : 'PAID (0 BDT)'}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className={styles.invoiceModalActions}>
              <button
                type="button"
                onClick={() => setIsInvoiceOpen(false)}
                style={{ padding: '10px 18px', borderRadius: '10px', background: '#e2e8f0', border: 'none', color: '#475569', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ padding: '10px 20px', borderRadius: '10px', background: '#2563eb', border: 'none', color: '#ffffff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>print</span>
                Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
