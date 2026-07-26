"use client";

import React from 'react';
import Link from 'next/link';

interface QuickActionsProps {
  role: string;
}

export function QuickActions({ role }: QuickActionsProps) {
  const actions = [
    { label: 'Create Customer', icon: 'person_add', roles: ['Owner', 'Sales', 'CEO'], href: '/erp/crm/customers/new', color: 'var(--primary)' },
    { label: 'Create Lead', icon: 'person_search', roles: ['Owner', 'Sales'], href: '/erp/leads/new', color: 'var(--accent)' },
    { label: 'Create Income', icon: 'payments', roles: ['Owner', 'Accountant'], href: '/erp/income/new', color: 'var(--success)' },
    { label: 'Create Expense', icon: 'receipt_long', roles: ['Owner', 'Accountant'], href: '/erp/expenses/new', color: 'var(--danger)' },
    { label: 'Create Product', icon: 'inventory_2', roles: ['Owner', 'Inventory'], href: '/erp/inventory/products/new', color: 'var(--info)' },
    { label: 'Create Employee', icon: 'badge', roles: ['Owner', 'HR'], href: '/erp/staff-management/employees/new', color: 'var(--primary)' },
    { label: 'Record Attendance', icon: 'how_to_reg', roles: ['Owner', 'HR'], href: '/erp/staff-management/attendance', color: 'var(--success)' },
    { label: 'Create Project', icon: 'account_tree', roles: ['Owner', 'Project Manager'], href: '/erp/projects/new', color: 'var(--accent)' },
  ];

  const visibleActions = actions.filter(a => a.roles.includes(role));

  if (visibleActions.length === 0) return null;

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', borderRadius: '16px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0', fontFamily: 'serif' }}>Quick Actions</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
        {visibleActions.map((action, idx) => (
          <Link href={action.href} key={idx} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ 
              padding: '16px', 
              borderRadius: '12px', 
              border: '1px solid var(--border-main)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all var(--transition-base)',
              background: 'var(--surface-hover)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = action.color;
              e.currentTarget.style.boxShadow = `0 4px 12px rgba(0,0,0,0.05)`;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-main)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <span className="material-symbols-outlined" style={{ color: action.color, fontSize: '24px' }}>
                {action.icon}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 500 }}>{action.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
