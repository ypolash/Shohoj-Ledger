"use client";

import React from 'react';

interface QuotationTermsProps {
  terms: string;
}

export function QuotationTerms({ terms }: QuotationTermsProps) {
  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Terms & Conditions</h4>
      <div style={{ padding: '16px', background: 'var(--surface-hover)', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '14px', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
        {terms || 'Standard terms apply.'}
      </div>
    </div>
  );
}
