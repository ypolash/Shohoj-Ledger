"use client";

import React, { useState, useEffect } from 'react';

interface OpportunitySearchProps {
  onSearch: (query: string) => void;
}

export function OpportunitySearch({ onSearch }: OpportunitySearchProps) {
  const [term, setTerm] = useState("");

  useEffect(() => {
    const delay = setTimeout(() => {
      onSearch(term);
    }, 300); // 300ms debounce
    return () => clearTimeout(delay);
  }, [term, onSearch]);

  return (
    <div style={{ position: 'relative', flex: '1 1 250px', maxWidth: '400px' }}>
      <span className="material-symbols-outlined" style={{
        position: 'absolute',
        left: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--text-muted)',
        fontSize: '18px'
      }}>
        search
      </span>
      <input
        type="text"
        placeholder="Search opportunities..."
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px 10px 40px',
          borderRadius: '8px',
          border: '1px solid var(--border-main)',
          background: 'var(--bg-main)',
          color: 'var(--text-main)',
          fontSize: '14px',
          outline: 'none',
          transition: 'border-color var(--transition-fast)'
        }}
      />
    </div>
  );
}
