"use client";

import React from 'react';
import Link from 'next/link';
import { UserX, Plus, RotateCcw } from 'lucide-react';

interface CustomerEmptyStateProps {
  hasFilters?: boolean;
  onResetFilters?: () => void;
}

export function CustomerEmptyState({ hasFilters, onResetFilters }: CustomerEmptyStateProps) {
  return (
    <div className="glass-card" style={{ 
      padding: '56px 24px', 
      textAlign: 'center', 
      borderRadius: '16px', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      background: 'var(--surface-main)',
      border: '1px solid var(--border-main)'
    }}>
      <div style={{ 
        width: '68px', 
        height: '68px', 
        background: 'var(--surface-hover)', 
        borderRadius: '20px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginBottom: '18px',
        color: 'var(--text-muted)',
        border: '1px solid var(--border-main)'
      }}>
        <UserX size={34} color="var(--primary)" />
      </div>

      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px 0' }}>
        {hasFilters ? 'No Customers Match Filters' : 'No Customers Found'}
      </h3>

      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 24px 0', maxWidth: '400px', lineHeight: 1.5 }}>
        {hasFilters 
          ? 'Try adjusting your search query, status, or segment filters to discover matching accounts.'
          : 'You haven\'t added any customer accounts yet. Start building your enterprise CRM directory.'}
      </p>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        {hasFilters && onResetFilters && (
          <button 
            onClick={onResetFilters}
            style={{
              padding: '10px 18px',
              background: 'var(--surface-hover)',
              border: '1px solid var(--border-main)',
              borderRadius: '8px',
              color: 'var(--text-main)',
              fontSize: '0.875rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={16} />
            <span>Reset Filters</span>
          </button>
        )}

        <Link href="/erp/crm/customers/new" style={{ textDecoration: 'none' }}>
          <button style={{
            padding: '10px 20px',
            background: 'var(--primary)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 8px var(--primary-glow)'
          }}>
            <Plus size={18} />
            <span>Add New Customer</span>
          </button>
        </Link>
      </div>
    </div>
  );
}
