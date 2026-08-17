"use client";

import React, { useState } from 'react';

const STAGES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won'];

export function LeadProgress({ leadId, currentStatus, onStatusChange }: { leadId: string, currentStatus: string, onStatusChange?: (s: string) => void }) {
  const [updating, setUpdating] = useState(false);
  
  const handleUpdate = async (status: string) => {
    if (status === currentStatus || updating) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/crm/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        if (onStatusChange) onStatusChange(status);
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const currentIndex = STAGES.indexOf(currentStatus);
  const isLost = currentStatus === 'Lost';

  return (
    <div style={{ padding: '24px', background: 'var(--surface-main)', borderRadius: '12px', border: '1px solid var(--border-main)', marginBottom: '24px', position: 'relative' }}>
      {updating && (
        <div style={{ position: 'absolute', inset: 0, background: 'var(--surface-glass)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
          <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>autorenew</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '25%', left: '0', right: '0', height: '2px', background: 'var(--border-main)', zIndex: 1, transform: 'translateY(-50%)' }} />
        
        {STAGES.map((stage, idx) => {
          const isCompleted = isLost ? false : idx <= currentIndex;
          const isActive = !isLost && idx === currentIndex;
          
          let color = 'var(--text-muted)';
          let bg = 'var(--surface-hover)';
          let borderColor = 'var(--border-main)';
          
          if (isActive) {
            color = 'var(--primary)';
            bg = 'var(--primary-glow)';
            borderColor = 'var(--primary)';
          } else if (isCompleted) {
            color = 'white';
            bg = 'var(--success)';
            borderColor = 'var(--success)';
          }
          
          return (
            <div 
              key={stage} 
              onClick={() => handleUpdate(stage)}
              style={{ 
                position: 'relative', 
                zIndex: 2, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '8px',
                cursor: updating ? 'not-allowed' : 'pointer',
                flex: 1
              }}
            >
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                background: bg, 
                border: `2px solid ${borderColor}`,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: isCompleted ? 'white' : color,
                transition: 'all var(--transition-fast)',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none'
              }}>
                {isCompleted && !isActive ? (
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span>
                ) : (
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>{idx + 1}</span>
                )}
              </div>
              <span style={{ fontSize: '12px', fontWeight: isActive ? 600 : 500, color: isActive ? 'var(--text-main)' : 'var(--text-muted)' }}>
                {stage}
              </span>
            </div>
          );
        })}
      </div>
      {isLost && (
        <div style={{ marginTop: '16px', padding: '12px', background: 'var(--danger-glow)', color: 'var(--danger)', borderRadius: '8px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined">cancel</span> This lead was marked as Lost.
        </div>
      )}
    </div>
  );
}
