"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface IncomeSearchProps {
  onSearch: (query: string) => void;
  initialValue?: string;
}

export function IncomeSearch({ onSearch, initialValue = "" }: IncomeSearchProps) {
  const [query, setQuery] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;
  const isInitialMount = useRef(true);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const handler = setTimeout(() => {
      onSearchRef.current(query);
    }, 280);

    return () => clearTimeout(handler);
  }, [query]);

  // Shortcut key to focus search (Press /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClear = () => {
    setQuery("");
    onSearchRef.current("");
    inputRef.current?.focus();
  };

  return (
    <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '440px' }}>
      <Search 
        size={18} 
        style={{ 
          position: 'absolute', 
          left: '14px', 
          top: '50%', 
          transform: 'translateY(-50%)', 
          color: 'var(--text-muted)',
          pointerEvents: 'none'
        }} 
      />
      <input 
        ref={inputRef}
        type="text" 
        placeholder="Search by reference, payer, category, memo..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 65px 10px 42px',
          borderRadius: '10px',
          border: '1px solid var(--border-main)',
          background: 'var(--surface-main)',
          fontSize: '0.875rem',
          color: 'var(--text-main)',
          outline: 'none',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          transition: 'all 0.15s ease'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--primary)';
          e.target.style.boxShadow = '0 0 0 3px var(--primary-glow)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--border-main)';
          e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
        }}
      />
      
      <div style={{
        position: 'absolute',
        right: '10px',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        {query ? (
          <button
            onClick={handleClear}
            style={{
              background: 'var(--surface-hover)',
              border: 'none',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
            title="Clear search"
          >
            <X size={13} />
          </button>
        ) : (
          <kbd style={{
            fontSize: '0.7rem',
            padding: '2px 5px',
            borderRadius: '4px',
            background: 'var(--surface-hover)',
            border: '1px solid var(--border-main)',
            color: 'var(--text-muted)',
            fontFamily: 'monospace'
          }}>
            /
          </kbd>
        )}
      </div>
    </div>
  );
}
