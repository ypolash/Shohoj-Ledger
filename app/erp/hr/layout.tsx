"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: 'Dashboard',    href: '/erp/hr',              icon: 'dashboard',    exact: true },
  { name: 'Employees',    href: '/erp/hr/employees',    icon: 'badge',        exact: false },
  { name: 'Members',      href: '/erp/hr/members',      icon: 'groups',       exact: false },
  { name: 'Departments',  href: '/erp/hr/departments',  icon: 'corporate_fare',exact: false },
  { name: 'Designations', href: '/erp/hr/designations', icon: 'work',         exact: false },
  { name: 'Attendance',   href: '/erp/hr/attendance',   icon: 'fact_check',   exact: false },
  { name: 'Leaves',       href: '/erp/hr/leaves',       icon: 'event_busy',   exact: false },
  { name: 'Fines',        href: '/erp/hr/fines',        icon: 'money_off',    exact: false },
];

/**
 * ERP HR & Payroll Module Layout
 * Provides consistent left-sidebar navigation using the enterprise design system.
 */
export default function HRLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Top Navigation Wrapper */}
      <div style={{ padding: '24px 24px 0 24px', flexShrink: 0, background: 'var(--surface-bg)' }}>
        {/* Floating Pill Nav */}
        <header style={{
          background: 'var(--surface-card)',
          borderRadius: '50px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '1px solid var(--border-main)',
          padding: '8px 24px 8px 8px',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
        }}>
          {/* Left Side Pill Box (Title) */}
          <div style={{ 
            justifySelf: 'start',
            background: 'var(--text-main)', 
            color: 'var(--bg-main)', 
            padding: '8px 20px', 
            borderRadius: '50px',
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontWeight: 700,
            fontSize: '15px'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>groups</span>
            HR & Payroll
          </div>
          
          {/* Nav Links (Centered) */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '24px', justifyContent: 'center' }}>
            {navigation.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  style={{
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    textDecoration: 'none',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {item.name}
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
