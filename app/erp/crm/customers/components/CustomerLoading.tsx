"use client";

import React from 'react';

export function CustomerLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Table Skeleton Container */}
      <div className="glass-card" style={{ 
        background: 'var(--surface-main)', 
        borderRadius: '12px', 
        border: '1px solid var(--border-main)',
        overflow: 'hidden' 
      }}>
        {/* Skeleton Header */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '44px 2fr 1.5fr 1fr 1.2fr 1fr 1fr', 
          padding: '14px 16px', 
          background: 'var(--surface-hover)', 
          borderBottom: '1px solid var(--border-main)',
          gap: '12px',
          alignItems: 'center'
        }}>
          <div style={{ width: '18px', height: '18px', background: 'var(--border-main)', borderRadius: '4px' }} />
          <div style={{ width: '120px', height: '14px', background: 'var(--border-main)', borderRadius: '4px' }} />
          <div style={{ width: '90px', height: '14px', background: 'var(--border-main)', borderRadius: '4px' }} />
          <div style={{ width: '70px', height: '14px', background: 'var(--border-main)', borderRadius: '4px' }} />
          <div style={{ width: '110px', height: '14px', background: 'var(--border-main)', borderRadius: '4px' }} />
          <div style={{ width: '60px', height: '14px', background: 'var(--border-main)', borderRadius: '4px' }} />
          <div style={{ width: '50px', height: '14px', background: 'var(--border-main)', borderRadius: '4px', marginLeft: 'auto' }} />
        </div>

        {/* Skeleton Rows */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div 
            key={i} 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: '44px 2fr 1.5fr 1fr 1.2fr 1fr 1fr', 
              padding: '16px', 
              borderBottom: i !== 6 ? '1px solid var(--border-light, var(--border-main))' : 'none',
              gap: '12px',
              alignItems: 'center',
              animation: 'shimmer 1.5s infinite ease-in-out'
            }}
          >
            {/* Checkbox */}
            <div style={{ width: '18px', height: '18px', background: 'var(--surface-hover)', borderRadius: '4px' }} />

            {/* Customer & Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--surface-hover)', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ width: '130px', height: '14px', background: 'var(--surface-hover)', borderRadius: '4px' }} />
                <div style={{ width: '70px', height: '11px', background: 'var(--surface-hover)', borderRadius: '3px' }} />
              </div>
            </div>

            {/* Contact Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ width: '100px', height: '13px', background: 'var(--surface-hover)', borderRadius: '4px' }} />
              <div style={{ width: '140px', height: '11px', background: 'var(--surface-hover)', borderRadius: '3px' }} />
            </div>

            {/* Group */}
            <div style={{ width: '80px', height: '24px', background: 'var(--surface-hover)', borderRadius: '6px' }} />

            {/* Financial Health */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ width: '90px', height: '14px', background: 'var(--surface-hover)', borderRadius: '4px' }} />
              <div style={{ width: '100%', height: '4px', background: 'var(--surface-hover)', borderRadius: '9999px' }} />
            </div>

            {/* Status */}
            <div style={{ width: '70px', height: '22px', background: 'var(--surface-hover)', borderRadius: '9999px' }} />

            {/* Actions */}
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
              <div style={{ width: '60px', height: '28px', background: 'var(--surface-hover)', borderRadius: '6px' }} />
              <div style={{ width: '28px', height: '28px', background: 'var(--surface-hover)', borderRadius: '6px' }} />
            </div>
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
      `}} />
    </div>
  );
}
