"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  name: string;
  href: string;
  icon: string;
  exact?: boolean;
}

const navigation: NavItem[] = [
  { name: 'Dashboard',    href: '/erp/hr',              icon: 'dashboard',    exact: true },
  { name: 'Employees',    href: '/erp/hr/employees',    icon: 'badge',        exact: false },
  { name: 'Members',      href: '/erp/hr/members',      icon: 'groups',       exact: false },
  { name: 'Departments',  href: '/erp/hr/departments',  icon: 'corporate_fare',exact: false },
  { name: 'Designations', href: '/erp/hr/designations', icon: 'work',         exact: false },
  { name: 'Attendance',   href: '/erp/hr/attendance',   icon: 'fact_check',   exact: false },
  { name: 'Leaves',       href: '/erp/hr/leaves',       icon: 'event_busy',   exact: false },
  { name: 'Fines',        href: '/erp/hr/fines',        icon: 'money_off',    exact: false },
  { name: 'Settings',     href: '/erp/hr/settings',     icon: 'settings',     exact: false },
];

/**
 * ERP HR & Payroll Module Layout
 * Provides consistent top-bar navigation using the enterprise design system.
 */
export default function HRLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';

  const isItemActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  const currentActiveItem = navigation.find(isItemActive);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Top Navigation Wrapper */}
      <div style={{ padding: '24px 24px 0 24px', flexShrink: 0, background: 'var(--surface-bg)' }}>
        {/* Floating Pill Nav */}
        <header style={{
          background: 'var(--surface-card)',
          borderRadius: '50px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          border: '1px solid var(--border-main)',
          padding: '4px 12px 4px 4px',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          alignItems: 'center',
          gap: '8px',
        }}>
          {/* Left Side Pill Box (Title / Section) */}
          <div style={{ 
            flexShrink: 0,
            background: 'var(--text-main)', 
            color: 'var(--bg-main)', 
            padding: '6px 14px', 
            borderRadius: '50px',
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            fontWeight: 700,
            fontSize: '13px',
            whiteSpace: 'nowrap',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>groups</span>
            <span>HR &amp; Payroll</span>
          </div>
          
          {/* Nav Links (Centered) */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            justifyContent: 'center',
            flexWrap: 'nowrap',
            width: '100%',
          }}>
            {navigation.map((item) => {
              const isActive = isItemActive(item);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  style={{
                    fontSize: '12.5px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '5px 10px',
                    borderRadius: '16px',
                    background: isActive ? 'var(--primary-glow, rgba(59, 130, 246, 0.12))' : 'transparent',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </header>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--surface-bg)' }}>
        {children}
      </div>
    </div>
  );
}
