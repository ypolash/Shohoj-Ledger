"use client";

import React from 'react';

type CustomerTagsProps = {
  tags: string[];
};

export function CustomerTags({ tags }: CustomerTagsProps) {
  if (!tags || tags.length === 0) return <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>-</span>;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
      {tags.map((tag, idx) => (
        <span key={idx} style={{
          padding: '2px 8px',
          background: 'var(--surface-hover)',
          border: '1px solid var(--border-main)',
          borderRadius: '4px',
          fontSize: '11px',
          color: 'var(--text-main)',
          whiteSpace: 'nowrap'
        }}>
          {tag}
        </span>
      ))}
    </div>
  );
}
