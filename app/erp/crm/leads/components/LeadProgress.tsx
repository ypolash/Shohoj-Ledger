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
    <div style={{ position: 'relative', width: '100%', padding: '16px 0' }}>
      {updating && (
        <div style={{ position: 'absolute', inset: 0, background: 'var(--surface-glass)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
          <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>autorenew</span>
        </div>
      )}
      
      {/* The vertical line */}
      <div style={{ position: 'absolute', left: '27px', top: '32px', bottom: '32px', width: '2px', background: 'var(--border-main)', zIndex: 1 }} />
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', position: 'relative', zIndex: 2 }}>
        {STAGES.map((stage, idx) => {
          const isCompleted = isLost ? false : idx <= currentIndex;
          const isActive = !isLost && idx === currentIndex;
          
          let nodeColor = 'var(--text-muted)';
          let nodeBg = 'var(--surface-hover)';
          
          if (isActive) {
            nodeColor = 'var(--primary)';
            nodeBg = 'var(--primary)';
          } else if (isCompleted) {
            nodeColor = 'var(--success)';
            nodeBg = 'var(--success)';
          }
          
          return (
            <div 
              key={stage} 
              onClick={() => handleUpdate(stage)}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                cursor: updating ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                paddingLeft: '16px'
              }}
            >
              {/* Node Wrapper */}
              <div style={{ 
                width: '24px', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                marginRight: '20px'
              }}>
                <div style={{ 
                  width: isActive ? '12px' : '10px', 
                  height: isActive ? '12px' : '10px', 
                  borderRadius: '50%', 
                  background: nodeBg,
                  position: 'relative',
                  zIndex: 2,
                  transition: 'all 0.3s',
                  boxShadow: isActive ? '0 0 0 4px var(--primary-glow)' : 'none'
                }}>
                  {/* Inner dot or check for completed */}
                  {isCompleted && !isActive && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ width: '4px', height: '4px', background: 'var(--surface-main)', borderRadius: '50%' }}></span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Label */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {isActive && (
                  <div style={{ width: '16px', height: '2px', background: 'var(--primary)', marginRight: '-4px', opacity: 0.5, borderRadius: '2px', zIndex: 1 }} />
                )}
                <div style={{
                  background: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? 'white' : isCompleted ? 'var(--text-main)' : 'var(--text-muted)',
                  padding: isActive ? '6px 16px' : '6px 0',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.3s',
                  boxShadow: isActive ? '0 4px 12px color-mix(in srgb, var(--primary) 30%, transparent)' : 'none',
                  position: 'relative',
                  zIndex: 2
                }}>
                  {stage}
                </div>
              </div>
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
