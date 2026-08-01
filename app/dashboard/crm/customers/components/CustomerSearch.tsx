"use client";

import React, { useState, useEffect } from 'react';

interface CustomerSearchProps {
  onSearch: (query: string) => void;
}

export function CustomerSearch({ onSearch }: CustomerSearchProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(query);
    }, 300); // Debounce

    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div style={{ position: 'relative', width: '300px' }}>
      <span 
        className="material-symbols-outlined" 
        style={{ 
          position: 'absolute', 
          left: '12px', 
          top: '50%', 
          transform: 'translateY(-50%)', 
          color: 'var(--text-muted)',
          fontSize: '20px'
        }}
      >
        search
      </span>
      <input 
        type="text" 
        placeholder="Search customers, contacts, emails..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 16px 10px 40px',
          borderRadius: '8px',
          border: '1px solid var(--border-main)',
          background: 'var(--surface-main)',
          fontSize: '14px',
          color: 'var(--text-main)',
          outline: 'none',
          boxShadow: 'var(--shadow-sm)'
        }}
      />
    </div>
  );
}
