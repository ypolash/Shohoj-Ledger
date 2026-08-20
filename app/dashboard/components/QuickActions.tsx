"use client";

import React from 'react';
import Link from 'next/link';

interface QuickActionsProps {
  role: string;
}

export function QuickActions({ role }: QuickActionsProps) {
  const actions = [
    { label: 'Customer Management', icon: 'groups', roles: ['Owner', 'Sales', 'CEO'], href: '/dashboard/crm/customers', color: 'var(--primary)' },
    { label: 'Lead Management', icon: 'person_search', roles: ['Owner', 'Sales'], href: '/dashboard/crm/leads', color: 'var(--accent)' },
    { label: 'New Sales Order', icon: 'add_shopping_cart', roles: ['Owner', 'Sales'], href: '/dashboard/crm/sales-orders/new', color: 'var(--warning)' },
    { label: 'Product Management', icon: 'inventory_2', roles: ['Owner', 'Inventory'], href: '/dashboard/inventory/products', color: 'var(--info)' },
    { label: 'Employee Management', icon: 'badge', roles: ['Owner', 'HR'], href: '/dashboard/staff-management/employees', color: 'var(--primary)' },
    { label: 'Attendance Management', icon: 'how_to_reg', roles: ['Owner', 'HR'], href: '/dashboard/staff-management/attendance', color: 'var(--success)' },
    { label: 'Project Management', icon: 'account_tree', roles: ['Owner', 'Project Manager'], href: '/dashboard/projects', color: 'var(--accent)' },
  ];

  const visibleActions = actions.filter(a => a.roles.includes(role));

  if (visibleActions.length === 0) return null;

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', borderRadius: '16px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0', fontFamily: 'serif' }}>Quick Actions</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 108px)', gap: '16px' }}>
        {visibleActions.map((action, idx) => (
          <Link href={action.href} key={idx} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ 
              aspectRatio: '1 / 1',
              padding: '12px', 
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
              <span className="material-symbols-outlined" style={{ color: action.color, fontSize: '28px' }}>
                {action.icon}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 500, lineHeight: '1.2' }}>{action.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
