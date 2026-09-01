"use client";

import React, { useState } from 'react';

const STAGES = [
  { key: 'New', label: 'New Lead', prob: '15%', icon: 'bolt' },
  { key: 'Contacted', label: 'Contacted', prob: '30%', icon: 'call' },
  { key: 'Qualified', label: 'Qualified', prob: '50%', icon: 'verified' },
  { key: 'Proposal', label: 'Proposal', prob: '70%', icon: 'description' },
  { key: 'Negotiation', label: 'Negotiation', prob: '85%', icon: 'handshake' },
  { key: 'Won', label: 'Deal Won', prob: '100%', icon: 'emoji_events' }
];

interface LeadProgressProps {
  leadId: string;
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
}

export function LeadProgress({ leadId, currentStatus, onStatusChange }: LeadProgressProps) {
  const [updating, setUpdating] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [lostReason, setLostReason] = useState('Competitor');

  const handleUpdate = async (status: string, reason?: string) => {
    if (status === currentStatus && !reason) return;
    if (updating) return;
    setUpdating(true);

    try {
      const payload: any = { status };
      if (reason) payload.lostReason = reason;

      const res = await fetch(`/api/crm/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        if (onStatusChange) onStatusChange(status);
        setShowLostModal(false);
      } else {
        alert("Failed to update status. Please try again.");
      }
    } catch (err) {
      console.error("Stage update error:", err);
      alert("An error occurred while updating stage.");
    } finally {
      setUpdating(false);
    }
  };

  const isLost = currentStatus === 'Lost';
  const isWon = currentStatus === 'Won';
  const currentIndex = STAGES.findIndex(s => s.key.toLowerCase() === (currentStatus || '').toLowerCase());
  const activeIdx = currentIndex >= 0 ? currentIndex : 0;
  const currentStageObj = STAGES[activeIdx] || STAGES[0];

  return (
    <div
      style={{
        background: 'var(--surface-main)',
        border: '1px solid var(--border-main)',
        borderRadius: '16px',
        padding: '20px 24px',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {updating && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(3px)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontWeight: 600,
            fontSize: '14px',
            color: 'var(--primary)'
          }}
        >
          <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>
            autorenew
          </span>
          Updating Pipeline Stage...
        </div>
      )}

      {/* Header with Title & Quick Won/Lost buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '18px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: '20px',
              color: isWon ? 'var(--success)' : isLost ? 'var(--danger)' : 'var(--primary)'
            }}
          >
            {isWon ? 'military_tech' : isLost ? 'cancel' : 'timeline'}
          </span>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Sales Pipeline Stage
            </span>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
              {isLost ? (
                <span style={{ color: 'var(--danger)' }}>Lost Deal</span>
              ) : (
                <span>
                  {currentStageObj.label} · <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{currentStageObj.prob} Win Probability</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isWon && !isLost && (
            <>
              <button
                type="button"
                onClick={() => handleUpdate('Won')}
                disabled={updating}
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--success)',
                  background: 'var(--success-bg)',
                  color: 'var(--success-text)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                Mark Won
              </button>
              <button
                type="button"
                onClick={() => setShowLostModal(true)}
                disabled={updating}
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--danger)',
                  background: 'var(--danger-bg)',
                  color: 'var(--danger-text)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                Mark Lost
              </button>
            </>
          )}

          {isLost && (
            <button
              type="button"
              onClick={() => handleUpdate('New')}
              disabled={updating}
              style={{
                padding: '6px 14px',
                borderRadius: '10px',
                border: '1px solid var(--primary)',
                background: 'var(--primary-glow)',
                color: 'var(--primary)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>restart_alt</span>
              Reopen Deal
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Stage Stepper Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`,
          gap: '8px',
          alignItems: 'center',
          position: 'relative'
        }}
      >
        {STAGES.map((stage, idx) => {
          const isCurrent = !isLost && (stage.key.toLowerCase() === (currentStatus || '').toLowerCase());
          const isPassed = !isLost && (currentIndex > idx || isWon);
          const isUpcoming = !isPassed && !isCurrent;

          let bg = 'var(--surface-hover)';
          let borderColor = 'var(--border-main)';
          let textColor = 'var(--text-muted)';
          let iconColor = 'var(--text-muted)';
          let badgeBg = 'rgba(0, 0, 0, 0.05)';

          if (isCurrent) {
            bg = 'linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%)';
            borderColor = 'var(--primary)';
            textColor = '#ffffff';
            iconColor = '#ffffff';
            badgeBg = 'rgba(255, 255, 255, 0.25)';
          } else if (isPassed) {
            bg = 'var(--success-bg)';
            borderColor = 'var(--success)';
            textColor = 'var(--success-text)';
            iconColor = 'var(--success)';
            badgeBg = 'rgba(16, 185, 129, 0.15)';
          }

          return (
            <div
              key={stage.key}
              onClick={() => handleUpdate(stage.key)}
              title={`Click to set stage to ${stage.label}`}
              style={{
                background: bg,
                border: `1.5px solid ${borderColor}`,
                borderRadius: '12px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                cursor: updating ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                boxShadow: isCurrent ? '0 4px 14px var(--primary-glow)' : 'none',
                transform: isCurrent ? 'translateY(-2px)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: '16px',
                      color: iconColor
                    }}
                  >
                    {isPassed && !isCurrent ? 'check_circle' : stage.icon}
                  </span>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: isCurrent ? 700 : isPassed ? 600 : 500,
                      color: textColor,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {stage.label}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '8px',
                    background: badgeBg,
                    color: isCurrent ? '#ffffff' : textColor
                  }}
                >
                  {stage.prob}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lost Reason Alert */}
      {isLost && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: 'var(--danger-bg)',
            color: 'var(--danger-text)',
            borderRadius: '10px',
            border: '1px solid var(--danger)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>cancel</span>
            <span>
              <strong>Lead Marked as Lost.</strong> Reason: {lostReason || 'Not specified'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleUpdate('New')}
            style={{
              background: '#ffffff',
              border: '1px solid var(--danger)',
              color: 'var(--danger-text)',
              padding: '4px 12px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Reactivate Lead
          </button>
        </div>
      )}

      {/* Mark Lost Modal */}
      {showLostModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              background: 'var(--surface-main)',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border-main)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', marginBottom: '8px' }}>
              <span className="material-symbols-outlined">warning</span>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>Mark Lead as Lost</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
              Specify the primary reason why this lead did not convert to help improve sales insights.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Lost Reason
              </label>
              <select
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-main)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-main)',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                <option value="Competitor">Chose a Competitor</option>
                <option value="Budget Constraint">Budget / Price Too High</option>
                <option value="Timing">Project Postponed / Bad Timing</option>
                <option value="Unresponsive">Unresponsive / No Contact</option>
                <option value="Feature Mismatch">Missing Critical Features</option>
                <option value="Other">Other / Miscellaneous</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowLostModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-main)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdate('Lost', lostReason)}
                disabled={updating}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--danger)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Confirm Lost
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
