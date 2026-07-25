"use client";

import React from 'react';

type LeadOwnerProps = {
  ownerName: string | null;
  ownerAvatar?: string;
};

export function LeadOwner({ ownerName, ownerAvatar }: LeadOwnerProps) {
  if (!ownerName) return <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Unassigned</span>;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {ownerAvatar ? (
        <img src={ownerAvatar} alt={ownerName} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
      ) : (
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: 'var(--primary-glow)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 600,
          border: '1px solid var(--primary-100)'
        }}>
          {getInitials(ownerName)}
        </div>
      )}
      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-main)' }}>{ownerName}</span>
    </div>
  );
}
