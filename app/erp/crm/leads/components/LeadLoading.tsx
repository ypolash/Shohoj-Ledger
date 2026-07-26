"use client";

import React from 'react';

export function LeadLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Fake Toolbar Skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ width: '200px', height: '40px', background: 'var(--surface-hover)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ width: '100px', height: '40px', background: 'var(--surface-hover)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
          <div style={{ width: '120px', height: '40px', background: 'var(--primary-glow)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
        </div>
      </div>

      {/* Fake Table Skeleton */}
      <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '16px 0',
            borderBottom: i !== 5 ? '1px solid var(--border-light)' : 'none'
          }}>
            <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
              <div style={{ width: '150px', height: '20px', background: 'var(--surface-hover)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
              <div style={{ width: '100px', height: '20px', background: 'var(--surface-hover)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
              <div style={{ width: '80px', height: '20px', background: 'var(--surface-hover)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ width: '30px', height: '30px', background: 'var(--surface-hover)', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
              <div style={{ width: '30px', height: '30px', background: 'var(--surface-hover)', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
            </div>
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }
      `}} />
    </div>
  );
}
