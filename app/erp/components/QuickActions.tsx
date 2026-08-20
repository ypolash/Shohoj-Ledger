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
    { label: 'New Sales Order', icon: 'add_shopping_cart', roles: ['Owner', 'Sales'], href: '/erp/crm/sales-orders/new', color: 'var(--warning)' },
  ];

  const visibleActions = actions.filter(a => a.roles.includes(role));

  if (visibleActions.length === 0) return null;

  return (
    <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: '16px', borderRadius: '16px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0', color: 'var(--text-main)' }}>Quick Actions</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 108px)', gap: '16px' }}>
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
                  aspectRatio: '1 / 1',
                  borderRadius: '12px',
                  border: '1px solid var(--border-main)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px',
                  gap: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'var(--surface-hover)'
                }}
              >
                <span className="material-symbols-outlined" style={{ color: action.color, fontSize: '28px', opacity: 0.9 }}>
                  {action.icon}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-main)', lineHeight: '1.2' }}>{action.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
