"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUI } from '@/lib/contexts/UIContext';
import styles from './Sidebar.module.css';
import { 
  Home, 
  Users, 
  DollarSign, 
  Box, 
  Briefcase, 
  CreditCard, 
  Folder, 
  BarChart2, 
  Settings, 
  Shield 
} from 'lucide-react';

export function Sidebar() {
  const { sidebarOpen, isMobile } = useUI();
  const pathname = usePathname() || '';

  const navItems = [
    { name: 'Dashboard', icon: Home, href: '/erp' },
    { name: 'CRM', icon: Users, href: '/erp/crm' },
    { name: 'Finance', icon: DollarSign, href: '/erp/finance' },
    { name: 'Inventory', icon: Box, href: '/erp/inventory' },
    { name: 'HR', icon: Briefcase, href: '/erp/hr' },
    { name: 'Payroll', icon: CreditCard, href: '/erp/payroll' },
    { name: 'Projects', icon: Folder, href: '/erp/projects' },
    { name: 'Reports', icon: BarChart2, href: '/erp/reports' },
  ];

  const adminItems = [
    { name: 'Settings', icon: Settings, href: '/erp/settings' },
    { name: 'Administration', icon: Shield, href: '/erp/admin' },
  ];

  const isActive = (path: string) => {
    if (path === '/erp' && pathname === '/erp') return true;
    if (path !== '/erp' && pathname.startsWith(path)) return true;
    return false;
  };

  const sidebarClass = `${styles.sidebar} ${sidebarOpen ? styles.open : styles.collapsed} ${isMobile ? styles.mobile : ''}`;

  return (
    <aside className={sidebarClass} aria-label="Main Navigation">
      <div className={styles.brand}>
        <div className={styles.logoMark}>S</div>
        {sidebarOpen && <span className={styles.brandName}>Shohoj Ledger</span>}
      </div>

      <div className={styles.navContainer}>
        {sidebarOpen && (
          <div className={styles.searchContainer}>
            <input 
              type="text" 
              placeholder="Filter menu..." 
              className={styles.searchInput}
              aria-label="Filter menu items"
            />
          </div>
        )}

        <nav className={styles.navGroup}>
          {sidebarOpen && <div className={styles.sectionHeader}>Main</div>}
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
