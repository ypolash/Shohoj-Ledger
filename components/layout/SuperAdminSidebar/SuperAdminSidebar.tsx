"use client";

import React from 'react';
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
  Globe 
} from 'lucide-react';

export function SuperAdminSidebar() {
  const { sidebarOpen, isMobile } = useUI();
  const pathname = usePathname() || '';

  const navItems = [
    { name: 'SaaS Overview', icon: Globe, href: '/super-admin' },
    { name: 'Tenants & Companies', icon: Building2, href: '/super-admin/companies' },
    { name: 'Subscriptions & Plans', icon: Layers, href: '/super-admin/subscriptions' },
    { name: 'Billing & Invoices', icon: CreditCard, href: '/super-admin/billing' },
    { name: 'System Health', icon: Activity, href: '/super-admin/system-health' },
    { name: 'Logs & Audit', icon: FileText, href: '/super-admin/audit' },
  ];

  const adminItems = [
    { name: 'Global Settings', icon: Settings, href: '/super-admin/settings' },
    { name: 'Feature Flags', icon: ShieldCheck, href: '/super-admin/feature-flags' },
    { name: 'Database & Storage', icon: Database, href: '/super-admin/storage' },
  ];

  const isActive = (path: string) => {
    if (path === '/super-admin' && pathname === '/super-admin') return true;
    if (path !== '/super-admin' && pathname.startsWith(path)) return true;
    return false;
  };

  const sidebarClass = `${styles.sidebar} ${sidebarOpen ? styles.open : styles.collapsed} ${isMobile ? styles.mobile : ''}`;

  return (
    <aside className={sidebarClass} aria-label="Super Admin Navigation">
      <div className={styles.brand}>
        <div className={styles.logoMark} style={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
          <span style={{ fontSize: '24px', color: '#ffffff' }}>🦉</span>
        </div>
        {sidebarOpen && <span className={styles.brandName}>SaaS Admin</span>}
      </div>

      <div className={styles.navContainer}>
        {sidebarOpen && (
          <div className={styles.searchContainer}>
            <input 
              type="text" 
              placeholder="Search SaaS modules..." 
              className={styles.searchInput}
              aria-label="Filter menu items"
            />
          </div>
        )}

        <nav className={styles.navGroup}>
          {sidebarOpen && <div className={styles.sectionHeader}>Multi-Tenant</div>}
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
              title={!sidebarOpen ? item.name : undefined}
            >
              <item.icon size={20} className={styles.navIcon} />
              {sidebarOpen && <span className={styles.navText}>{item.name}</span>}
            </Link>
          ))}
        </nav>

        <nav className={styles.navGroup}>
          {sidebarOpen && <div className={styles.sectionHeader}>System</div>}
          {adminItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
              title={!sidebarOpen ? item.name : undefined}
            >
              <item.icon size={20} className={styles.navIcon} />
              {sidebarOpen && <span className={styles.navText}>{item.name}</span>}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
