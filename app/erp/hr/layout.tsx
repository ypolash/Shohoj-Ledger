"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  name: string;
  href: string;
  icon: string;
  exact?: boolean;
}

const row1Nav: NavItem[] = [
  { name: 'Dashboard',    href: '/erp/hr',              icon: 'dashboard',    exact: true },
  { name: 'Employees',    href: '/erp/hr/employees',    icon: 'badge',        exact: false },
  { name: 'Freelance',    href: '/erp/hr/freelance',    icon: 'laptop_chromebook', exact: false },
  { name: 'Models',       href: '/erp/hr/models',       icon: 'face_3',       exact: false },
  { name: 'Members',      href: '/erp/hr/members',      icon: 'groups',       exact: false },
  { name: 'Departments',  href: '/erp/hr/departments',  icon: 'corporate_fare',exact: false },
  { name: 'Designations', href: '/erp/hr/designations', icon: 'work',         exact: false },
];

const row2Nav: NavItem[] = [
  { name: 'Attendance',   href: '/erp/hr/attendance',   icon: 'fact_check',   exact: false },
  { name: 'Leaves',       href: '/erp/hr/leaves',       icon: 'event_busy',   exact: false },
  { name: 'Tasks',        href: '/erp/hr/tasks',        icon: 'assignment',   exact: false },
  { name: 'Task Rewards', href: '/erp/hr/task-rewards', icon: 'military_tech',exact: false },
  { name: 'Notices',      href: '/erp/hr/notices',      icon: 'campaign',     exact: false },
  { name: 'Fines',        href: '/erp/hr/fines',        icon: 'money_off',    exact: false },
  { name: 'Settings',     href: '/erp/hr/settings',     icon: 'settings',     exact: false },
];

/**
 * ERP HR & Payroll Module Layout
 * Provides consistent 2-line top-bar navigation using the enterprise design system.
 */
export default function HRLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';

  const isItemActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  const renderNavLink = (item: NavItem) => {
    const isActive = isItemActive(item);
    return (
      <Link
        key={item.name}
        href={item.href}
        style={{
          fontSize: '13px',
          fontWeight: isActive ? 600 : 500,
          color: isActive ? '#ffffff' : 'var(--text-secondary)',
          textDecoration: 'none',
          transition: 'all 0.15s ease',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: '10px',
          background: isActive
            ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
            : 'transparent',
          boxShadow: isActive ? '0 2px 8px rgba(37, 99, 235, 0.35)' : 'none',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: '16px',
            color: isActive ? '#ffffff' : 'var(--text-muted)'
          }}
        >
          {item.icon}
        </span>
        <span>{item.name}</span>
      </Link>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Top Navigation Wrapper */}
      <div style={{ padding: '20px 24px 0 24px', flexShrink: 0, background: 'var(--surface-bg)' }}>
        {/* Floating 2-Line Categorized Nav Card */}
        <header style={{
          background: 'var(--surface-card)',
          borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          border: '1px solid var(--border-main)',
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          {/* Row 1: Workforce & Structure */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}>
            {/* Category Tag 1 */}
            <div style={{ 
              flexShrink: 0,
              background: 'rgba(37, 99, 235, 0.12)', 
              color: '#3b82f6', 
              border: '1px solid rgba(37, 99, 235, 0.25)',
              padding: '4px 10px', 
              borderRadius: '8px',
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              fontWeight: 700,
              fontSize: '11px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              width: '128px',
              boxSizing: 'border-box',
              justifyContent: 'center',
              whiteSpace: 'nowrap',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>groups</span>
              <span>Workforce</span>
            </div>

            <nav style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              flexWrap: 'wrap',
              flex: 1,
            }}>
              {row1Nav.map(renderNavLink)}
            </nav>
          </div>

          {/* Divider */}
          <div style={{
            height: '1px',
            background: 'var(--border-main)',
            opacity: 0.6,
            margin: '0 2px',
          }} />

          {/* Row 2: Operations & Policies */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}>
            {/* Category Tag 2 */}
            <div style={{ 
              flexShrink: 0,
              background: 'rgba(16, 185, 129, 0.12)', 
              color: '#10b981', 
              border: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '4px 10px', 
              borderRadius: '8px',
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              fontWeight: 700,
              fontSize: '11px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              width: '128px',
              boxSizing: 'border-box',
              justifyContent: 'center',
              whiteSpace: 'nowrap',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>event_note</span>
              <span>Operations</span>
            </div>

            <nav style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              flexWrap: 'wrap',
              flex: 1,
            }}>
              {row2Nav.map(renderNavLink)}
            </nav>
          </div>
        </header>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--surface-bg)' }}>
        {children}
      </div>
    </div>
  );
}
