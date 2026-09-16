"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUI } from '@/lib/contexts/UIContext';
import styles from '../Sidebar/Sidebar.module.css'; // Reusing the exact same Sidebar styles
import { 
  Building2, 
  CreditCard, 
  FileText, 
  Settings, 
  Activity, 
  Database, 
  ShieldCheck, 
  Layers, 
  Globe,
  Users,
  Headphones,
  Tag,
  ArrowLeft,
  LayoutDashboard
} from 'lucide-react';

export function SuperAdminSidebar() {
  const { sidebarOpen, isMobile } = useUI();
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname() || '';

  const isExpanded = sidebarOpen || isHovered;

  const multiTenantItems = [
    { name: 'SaaS Overview', icon: Globe, href: '/super-admin' },
    { name: 'User Management', icon: Users, href: '/super-admin/users' },
    { name: 'Customer Support', icon: Headphones, href: '/super-admin/support' },
    { name: 'Tenants & Companies', icon: Building2, href: '/super-admin/companies' },
    { name: 'Subscriptions', icon: CreditCard, href: '/super-admin/subscriptions' },
    { name: 'Pricing Plans', icon: Layers, href: '/super-admin/plans' },
    { name: 'Billing & Invoices', icon: FileText, href: '/super-admin/billing' },
  ];

  const systemItems = [
    { name: 'System Health', icon: Activity, href: '/super-admin/system-health' },
    { name: 'Logs & Audit', icon: FileText, href: '/super-admin/audit' },
    { name: 'Feature Flags', icon: ShieldCheck, href: '/super-admin/feature-flags' },
    { name: 'Database & Storage', icon: Database, href: '/super-admin/storage' },
    { name: 'Global Settings', icon: Settings, href: '/super-admin/settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/super-admin' && pathname === '/super-admin') return true;
    if (path !== '/super-admin' && pathname.startsWith(path)) return true;
    return false;
  };

  const sidebarClass = `${styles.sidebar} ${isExpanded ? styles.open : styles.collapsed} ${isMobile ? styles.mobile : ''}`;

  return (
    <aside 
      className={sidebarClass} 
      aria-label="Super Admin Navigation"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.brand}>
        <div className={styles.logoMark} style={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
          <span style={{ fontSize: '24px', color: '#ffffff' }}>🛡️</span>
        </div>
        {isExpanded && <span className={styles.brandName}>Super Admin</span>}
      </div>

      <div className={styles.navContainer}>
        {/* Multi-Tenant Group */}
        <nav className={styles.navGroup}>
          {isExpanded && <div className={styles.sectionHeader}>Platform Control</div>}
          {multiTenantItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
              title={!isExpanded ? item.name : undefined}
            >
              <item.icon size={19} className={styles.navIcon} />
              {isExpanded && <span className={styles.navText}>{item.name}</span>}
            </Link>
          ))}
        </nav>

        {/* System Group */}
        <nav className={styles.navGroup}>
          {isExpanded && <div className={styles.sectionHeader}>Platform Infrastructure</div>}
          {systemItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
              title={!isExpanded ? item.name : undefined}
            >
              <item.icon size={19} className={styles.navIcon} />
              {isExpanded && <span className={styles.navText}>{item.name}</span>}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
