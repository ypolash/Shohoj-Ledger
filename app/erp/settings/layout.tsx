"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationGroups = [
  {
    group: 'General',
    items: [
      { name: 'Settings Hub', href: '/erp/settings', icon: 'settings', exact: true },
      { name: 'Company Profile', href: '/erp/settings/company', icon: 'business', exact: false },
      { name: 'Branding', href: '/erp/settings/branding', icon: 'palette', exact: false },
    ]
  },
  {
    group: 'Access Management',
    items: [
      { name: 'Users', href: '/erp/settings/users', icon: 'group', exact: false },
      { name: 'Roles', href: '/erp/settings/roles', icon: 'badge', exact: false },
      { name: 'Permissions', href: '/erp/settings/permissions', icon: 'vpn_key', exact: false },
    ]
  },
  {
    group: 'System',
    items: [
      { name: 'Modules', href: '/erp/settings/modules', icon: 'apps', exact: false },
      { name: 'Attendance', href: '/erp/settings/attendance', icon: 'co_present', exact: false },
      { name: 'Security', href: '/erp/settings/security', icon: 'security', exact: false },
      { name: 'Audit Log', href: '/erp/settings/audit-log', icon: 'history', exact: false },
    ]
  }
];

/**
 * ERP Settings Module Layout
 * Wraps the dedicated Settings section with a categorized sidebar.
 */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px', flexShrink: 0,
        background: 'var(--surface-card)',
        borderRight: '1px solid var(--border-main)',
        padding: 'var(--spacing-4)',
        display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)',
        overflowY: 'auto'
      }}>
        <div style={{ padding: '12px 8px 16px', borderBottom: '1px solid var(--border-main)', marginBottom: '16px' }}}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)', verticalAlign: 'middle', marginRight: '8px' }}>admin_panel_settings</span>
          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)', verticalAlign: 'middle' }}>Enterprise Settings</span>
        </div>
        
        {navigationGroups.map((group, gIdx) => (
          <div key={gIdx} style={{ marginBottom: '16px' }}}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', paddingLeft: '12px' }}>
              {group.group}
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {group.items.map((item) => {
                const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link key={item.name} href={item.href} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '9px 12px', borderRadius: '10px', fontSize: '14px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    background: isActive ? 'var(--primary-subtle)' : 'transparent',
                    textDecoration: 'none', transition: 'all 0.15s ease',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: isActive ? 'var(--primary)' : 'var(--text-muted)' }}>{item.icon}</span>
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </aside>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-6)', background: 'var(--surface-bg)' }}>
        {children}
      </div>
    </div>
  );
}
