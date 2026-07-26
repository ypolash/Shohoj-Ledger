"use client";

import React from 'react';

export function CRMLoading() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="glass-card" style={{ padding: '24px', borderRadius: '12px', height: '120px' }}>
          <div style={{ width: '40px', height: '40px', background: 'var(--surface-hover)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
          <div style={{ width: '60%', height: '24px', background: 'var(--surface-hover)', borderRadius: '4px', marginTop: '16px', animation: 'pulse 1.5s infinite' }} />
        </div>
      ))}
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
