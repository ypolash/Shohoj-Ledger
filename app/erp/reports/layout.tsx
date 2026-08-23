"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: 'Reports Hub',    href: '/erp/reports',         icon: 'analytics',       exact: true },
  { name: 'Financial',      href: '/erp/reports/finance', icon: 'account_balance', exact: false },
  // These routes can be added later if needed
  // { name: 'Inventory',      href: '/erp/reports/inventory', icon: 'inventory_2', exact: false },
  // { name: 'HR & Payroll',   href: '/erp/reports/hr',        icon: 'groups', exact: false },
  // { name: 'CRM & Sales',    href: '/erp/reports/crm',       icon: 'trending_up', exact: false },
];

/**
 * ERP Reports Module Layout
 * Wraps the dedicated Reports section with a sidebar.
 */
export default function ReportsLayout({ children }: { children: React.ReactNode }) {
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
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>monitoring</span>
            Enterprise Reports
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
