"use client";

import React from 'react';
import Link from 'next/link';
import styles from '../dashboard.module.css';

interface QuickActionsProps {
  role: string;
}

export function QuickActions({ role }: QuickActionsProps) {
  const allActions = [
    // Finance
    {
      label: 'Record Income',
      sub: 'Ledger Inflow',
      icon: 'add_circle',
      roles: ['Owner', 'CEO', 'Accountant'],
      href: '/erp/income',
      color: '#34d399',
      bgColor: 'rgba(16, 185, 129, 0.15)',
      borderColor: 'rgba(16, 185, 129, 0.3)'
    },
    {
      label: 'New Expense',
      sub: 'Operating Outflow',
      icon: 'remove_circle',
      roles: ['Owner', 'CEO', 'Accountant'],
      href: '/erp/expenses',
      color: '#f87171',
      bgColor: 'rgba(239, 68, 68, 0.15)',
      borderColor: 'rgba(239, 68, 68, 0.3)'
    },
    {
      label: 'Bank & Reserves',
      sub: 'Liquidity Pools',
      icon: 'account_balance',
      roles: ['Owner', 'CEO', 'Accountant'],
      href: '/erp/reserves',
      color: '#60a5fa',
      bgColor: 'rgba(59, 130, 246, 0.15)',
      borderColor: 'rgba(59, 130, 246, 0.3)'
    },
    // CRM & Sales
    {
      label: 'Customer Master',
      sub: 'Directory & 360°',
      icon: 'groups',
      roles: ['Owner', 'Sales', 'CEO'],
      href: '/erp/crm/customers',
      color: '#38bdf8',
      bgColor: 'rgba(14, 165, 233, 0.15)',
      borderColor: 'rgba(14, 165, 233, 0.3)'
    },
    {
      label: 'Lead Pipeline',
      sub: 'Prospects & Funnel',
      icon: 'person_search',
      roles: ['Owner', 'Sales', 'CEO'],
      href: '/erp/crm/leads',
      color: '#818cf8',
      bgColor: 'rgba(99, 102, 241, 0.15)',
      borderColor: 'rgba(99, 102, 241, 0.3)'
    },
    {
      label: 'New Sales Order',
      sub: 'Create & Bill',
      icon: 'add_shopping_cart',
      roles: ['Owner', 'Sales', 'CEO'],
      href: '/erp/crm/sales-orders/new',
      color: '#fbbf24',
      bgColor: 'rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.3)'
    },
    // HR & Staff
    {
      label: 'Staff Directory',
      sub: 'Employee Records',
      icon: 'badge',
      roles: ['HR'],
      href: '/erp/hr',
      color: '#38bdf8',
      bgColor: 'rgba(14, 165, 233, 0.15)',
      borderColor: 'rgba(14, 165, 233, 0.3)'
    },
    {
      label: 'Run Payroll',
      sub: 'Salary Processing',
      icon: 'payments',
      roles: ['Owner', 'CEO', 'HR'],
      href: '/erp/payroll/run',
      color: '#c084fc',
      bgColor: 'rgba(168, 85, 247, 0.15)',
      borderColor: 'rgba(168, 85, 247, 0.3)'
    },
    {
      label: 'Mark Attendance',
      sub: 'Daily Check-in',
      icon: 'fact_check',
      roles: ['HR'],
      href: '/erp/attendance',
      color: '#34d399',
      bgColor: 'rgba(16, 185, 129, 0.15)',
      borderColor: 'rgba(16, 185, 129, 0.3)'
    },
    // Inventory
    {
      label: 'Product Catalog',
      sub: 'SKU & Pricing',
      icon: 'inventory_2',
      roles: ['Inventory'],
      href: '/erp/inventory',
      color: '#818cf8',
      bgColor: 'rgba(99, 102, 241, 0.15)',
      borderColor: 'rgba(99, 102, 241, 0.3)'
    },
    {
      label: 'Stock Movement',
      sub: 'In / Out / Transfer',
      icon: 'sync_alt',
      roles: ['Inventory'],
      href: '/erp/inventory',
      color: '#34d399',
      bgColor: 'rgba(16, 185, 129, 0.15)',
      borderColor: 'rgba(16, 185, 129, 0.3)'
    },
    // Projects
    {
      label: 'Projects Workspace',
      sub: 'Milestones & Tasks',
      icon: 'account_tree',
      roles: ['Project Manager'],
      href: '/erp/projects',
      color: '#c084fc',
      bgColor: 'rgba(168, 85, 247, 0.15)',
      borderColor: 'rgba(168, 85, 247, 0.3)'
    },
    // Reports
    {
      label: 'Financial Reports',
      sub: 'P&L, Balance Sheet',
      icon: 'bar_chart',
      roles: ['Owner', 'CEO', 'Accountant'],
      href: '/erp/reports/finance',
      color: '#60a5fa',
      bgColor: 'rgba(59, 130, 246, 0.15)',
      borderColor: 'rgba(59, 130, 246, 0.3)'
    }
  ];

  const userRoles = (role || '').split(',').map((r: string) => r.trim());
  const visibleActions = allActions.filter((a: any) => a.roles.some((r: string) => userRoles.includes(r)));

  if (visibleActions.length === 0) return null;

  return (
    <div className={styles.quickCommandBar}>
      <div className={styles.commandBarHeader}>
        <div className={styles.commandBarTitle}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#60a5fa' }}>
            bolt
          </span>
          Executive Quick Command
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
          {visibleActions.length} Shortcuts Available
        </span>
      </div>

      <div className={styles.actionsGrid}>
        {visibleActions.map((action, idx) => (
          <Link href={action.href} key={idx} className={styles.actionPill}>
            <div
              className={styles.actionIconBox}
              style={{
                background: action.bgColor,
                border: `1px solid ${action.borderColor}`
              }}
            >
              <span className="material-symbols-outlined" style={{ color: action.color, fontSize: '20px' }}>
                {action.icon}
              </span>
            </div>
            <div className={styles.actionInfo}>
              <span className={styles.actionLabel}>{action.label}</span>
              <span className={styles.actionSub}>{action.sub}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
