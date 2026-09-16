"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUI } from '@/lib/contexts/UIContext';
import styles from './superAdminSidebar.module.css';
import { 
  Building2, 
  CreditCard, 
  Settings, 
  Activity, 
  Database, 
  ShieldCheck, 
  Layers, 
  Users, 
  Headphones, 
  SlidersHorizontal, 
  ArrowLeftRight, 
  HardDrive, 
  Shield, 
  LayoutDashboard, 
  Receipt,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

export function SuperAdminSidebar() {
  const { sidebarOpen, toggleSidebar, isMobile } = useUI();
  const pathname = usePathname() || '';

  const isExpanded = sidebarOpen;

  const platformControlItems = [
    { name: 'SaaS Overview', icon: LayoutDashboard, href: '/super-admin' },
    { name: 'User Management', icon: Users, href: '/super-admin/users' },
    { name: 'Customer Support', icon: Headphones, href: '/super-admin/support' },
    { name: 'Tenants & Companies', icon: Building2, href: '/super-admin/companies' },
    { name: 'Subscriptions', icon: CreditCard, href: '/super-admin/subscriptions' },
    { name: 'Pricing Plans', icon: Layers, href: '/super-admin/plans' },
    { name: 'Billing & Invoices', icon: Receipt, href: '/super-admin/billing' },
  ];

  const infrastructureItems = [
    { name: 'System Health', icon: Activity, href: '/super-admin/system-health', hasPulse: true },
    { name: 'Logs & Audit', icon: ShieldCheck, href: '/super-admin/audit' },
    { name: 'Feature Flags', icon: SlidersHorizontal, href: '/super-admin/feature-flags' },
    { name: 'Storage & Backups', icon: HardDrive, href: '/super-admin/storage' },
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
    >
      {/* Brand Header */}
      <div className={styles.brand}>
        <div className={styles.brandLeft}>
          <div className={styles.logoMark} title={!isExpanded ? "Super Admin Mission Control" : undefined}>
            <Shield size={20} color="#ffffff" />
          </div>
          {isExpanded && (
            <div className={styles.brandInfo}>
              <span className={styles.brandName}>Shohoj Admin</span>
              <span className={styles.brandBadge}>Mission Control</span>
            </div>
          )}
        </div>

        {/* Collapse / Expand Toggle Button */}
        {!isMobile && isExpanded && (
          <button
            onClick={toggleSidebar}
            className={styles.collapseToggleBtn}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose size={15} />
          </button>
        )}
      </div>

      {/* Main Navigation Scroll Area */}
      <div className={styles.navContainer}>
        {/* Multi-Tenant Group */}
        <nav className={styles.navGroup}>
          {isExpanded && <div className={styles.sectionHeader}>Platform Control</div>}
          {platformControlItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`${styles.navItem} ${active ? styles.active : ''}`}
                title={!isExpanded ? item.name : undefined}
              >
                <div className={styles.navIconWrapper}>
                  <item.icon size={18} />
                </div>
                {isExpanded && <span className={styles.navText}>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* System & Infrastructure Group */}
        <nav className={styles.navGroup}>
          {isExpanded && <div className={styles.sectionHeader}>Platform Infrastructure</div>}
          {infrastructureItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`${styles.navItem} ${active ? styles.active : ''}`}
                title={!isExpanded ? item.name : undefined}
              >
                <div className={styles.navIconWrapper}>
                  <item.icon size={18} />
                </div>
                {isExpanded && <span className={styles.navText}>{item.name}</span>}
                {isExpanded && item.hasPulse && <span className={styles.pulseDotLive} />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Quick Switcher & Operator Status */}
      <div className={styles.sidebarFooter}>
        <Link 
          href="/erp" 
          className={styles.erpSwitchBtn}
          title="Exit to ERP Portal"
        >
          <ArrowLeftRight size={15} />
          {isExpanded && <span>Exit to ERP Portal</span>}
        </Link>

        {isExpanded && (
          <div className={styles.operatorCard}>
            <div className={styles.operatorAvatar}>
              <span>SA</span>
              <span className={styles.onlineIndicator} />
            </div>
            <div className={styles.operatorInfo}>
              <span className={styles.operatorName}>Platform Master</span>
              <span className={styles.operatorRole}>SUPER_ADMIN &bull; Active</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
