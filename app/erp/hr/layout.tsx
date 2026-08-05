"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: 'Dashboard',    href: '/erp/hr',              icon: 'dashboard',    exact: true },
  { name: 'Employees',    href: '/erp/hr/employees',    icon: 'badge',        exact: false },
  { name: 'Departments',  href: '/erp/hr/departments',  icon: 'corporate_fare',exact: false },
  { name: 'Designations', href: '/erp/hr/designations', icon: 'work',         exact: false },
  { name: 'Attendance',   href: '/erp/hr/attendance',   icon: 'fact_check',   exact: false },
  { name: 'Leaves',       href: '/erp/hr/leaves',       icon: 'event_busy',   exact: false },
  { name: 'Fines',        href: '/erp/hr/fines',        icon: 'money_off',    exact: false },
  { name: 'Payroll',      href: '/erp/hr/payroll',      icon: 'payments',     exact: false },
];

/**
 * ERP HR & Payroll Module Layout
 * Provides consistent left-sidebar navigation using the enterprise design system.
 */
export default function HRLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
      {/* Sidebar */}
      <aside style={{
        width: '220px',
        flexShrink: 0,
        background: 'var(--surface-card)',
        borderRight: '1px solid var(--border-main)',
        padding: 'var(--spacing-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-1)',
      }}>
        <div style={{ padding: '12px 8px 16px', borderBottom: '1px solid var(--border-main)', marginBottom: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)', verticalAlign: 'middle', marginRight: '8px' }}>groups</span>
          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)', verticalAlign: 'middle' }}>HR & Payroll</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navigation.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--primary-subtle)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: isActive ? 'var(--primary)' : 'var(--text-muted)' }}>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-6)', background: 'var(--surface-bg)' }}>
        {children}
      </div>
    </div>
  );
}
