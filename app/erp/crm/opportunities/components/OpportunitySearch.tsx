"use client";

import React, { useState, useRef } from 'react';

interface OpportunitySearchProps {
  onSearch: (query: string) => void;
}

export function OpportunitySearch({ onSearch }: OpportunitySearchProps) {
  const [term, setTerm] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTerm(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearch(val);
    }, 300);
  };

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
        onChange={handleChange}
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
