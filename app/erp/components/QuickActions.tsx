"use client";

import React from 'react';
import Link from 'next/link';

interface QuickActionsProps {
  role: string;
}

export function QuickActions({ role }: QuickActionsProps) {
  const actions = [
    { label: 'Customer Management', icon: 'groups', roles: ['Owner', 'Sales', 'CEO'], href: '/erp/crm/customers', color: 'var(--primary)' },
    { label: 'Lead Management', icon: 'person_search', roles: ['Owner', 'Sales'], href: '/erp/crm/leads', color: 'var(--accent)' },
    { label: 'Income Management', icon: 'payments', roles: ['Owner', 'Accountant'], href: '/erp/income', color: 'var(--success)' },
    { label: 'Expense Management', icon: 'receipt_long', roles: ['Owner', 'Accountant'], href: '/erp/expenses', color: 'var(--danger)' },
  ];

  const visibleActions = actions.filter(a => a.roles.includes(role));

  if (visibleActions.length === 0) return null;

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', borderRadius: '16px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0', color: 'var(--text-main)' }}>Quick Actions</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        {visibleActions.map((action, idx) => {
          // Map color strings to class names for our global utilities
          let glowClass = 'glow-border-primary';
          if (action.color.includes('success')) glowClass = 'glow-border-success';
          if (action.color.includes('danger')) glowClass = 'glow-border-danger';
          if (action.color.includes('accent')) glowClass = 'glow-border-accent';
          if (action.color.includes('info')) glowClass = 'glow-border-info';
          if (action.color.includes('warning')) glowClass = 'glow-border-warning';
          
          return (
            <Link href={action.href} key={idx} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div 
                className={`hover-lift ${glowClass}`}
                style={{ 
                  width: '130px',
                  height: '130px',
                  borderRadius: '50%',
                  border: '1px solid var(--border-main)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'var(--surface-hover)',
                  flexShrink: 0
                }}
              >
                <span className="material-symbols-outlined" style={{ color: action.color, fontSize: '28px', opacity: 0.9 }}>
                  {action.icon}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-main)' }}>{action.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
