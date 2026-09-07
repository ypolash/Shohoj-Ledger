"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  name: string;
  href: string;
  icon: string;
  exact?: boolean;
  matchAlso?: string;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/erp/crm', icon: 'dashboard', exact: true },
  { name: 'Customers', href: '/erp/crm/customers', icon: 'person_search', exact: false },
  { name: 'Leads', href: '/erp/crm/leads', icon: 'view_kanban', exact: false },
  { name: 'Opportunities', href: '/erp/crm/opportunities', icon: 'trending_up', exact: false },
  { name: 'Quotations', href: '/erp/crm/quotations', icon: 'request_quote', exact: false },
  { name: 'Reports', href: '/erp/crm/reports', icon: 'analytics', exact: false },
];

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';

  const isItemActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    if (pathname.startsWith(item.href)) {
      return true;
    }
    if (item.matchAlso && pathname.startsWith(item.matchAlso)) {
      return true;
    }
    return false;
  };

  const currentActiveItem = navigation.find(isItemActive);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Top Floating Pill Navigation */}
      <div style={{ padding: '24px 24px 0 24px', flexShrink: 0, background: 'var(--surface-bg)' }}>
        <header
          style={{
            background: 'var(--surface-card)',
            borderRadius: '50px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '1px solid var(--border-main)',
            padding: '8px 24px 8px 8px',
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            alignItems: 'center',
            gap: '16px',
            overflowX: 'auto',
          }}
        >
          {/* Left Side Pill Badge (Current Module / Section) */}
          <div
            style={{
              justifySelf: 'start',
              background: 'var(--text-main)',
              color: 'var(--bg-main)',
              padding: '8px 20px',
              borderRadius: '50px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 700,
              fontSize: '15px',
              whiteSpace: 'nowrap',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {currentActiveItem?.icon || 'groups'}
            </span>
            <span>
              {currentActiveItem && currentActiveItem.name !== 'Dashboard'
                ? `CRM · ${currentActiveItem.name}`
                : 'CRM & Sales'}
            </span>
          </div>

          {/* Navigation Links */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              justifyContent: 'center',
              flexWrap: 'nowrap',
              overflowX: 'auto',
            }}
          >
            {navigation.map((item) => {
              const active = isItemActive(item);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  style={{
                    fontSize: '14px',
                    fontWeight: active ? 600 : 500,
                    color: active ? 'var(--primary)' : 'var(--text-secondary)',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: active ? 'var(--primary-glow, rgba(59, 130, 246, 0.12))' : 'transparent',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </header>
      </div>

      {/* Main CRM Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--surface-bg)' }}>
        {children}
      </div>
    </div>
  );
}
