"use client";

import React, { useState } from 'react';
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
  Settings
} from 'lucide-react';

interface SidebarProps {
  businessType?: string;
  companyName?: string;
  logoUrl?: string | null;
}

export function Sidebar({ businessType = 'Product + Service', companyName = 'Shohoj Ledger', logoUrl = null }: SidebarProps) {
  const { sidebarOpen, isMobile } = useUI();
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname() || '';

  const isExpanded = sidebarOpen || isHovered;

  const navItems = [
    { name: 'Dashboard', icon: Home, href: '/erp' },
    { name: 'CRM', icon: Users, href: '/erp/crm' },
    { name: 'Finance', icon: DollarSign, href: '/erp/finance' },
    { name: 'Inventory', icon: Box, href: '/erp/inventory' },
    { name: 'HR', icon: Briefcase, href: '/erp/hr' },
    { name: 'Payroll', icon: CreditCard, href: '/erp/payroll' },
    { name: 'Projects', icon: Folder, href: '/erp/projects' },
    { name: 'Reports', icon: BarChart2, href: '/erp/reports' },
  ].filter(item => {
    const type = businessType.toUpperCase();
    if (item.name === 'Inventory' && type === 'SERVICE') return false;
    if (item.name === 'Projects' && type === 'PRODUCT') return false;
    return true;
  });

  const adminItems = [
    { name: 'Settings', icon: Settings, href: '/erp/settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/erp' && pathname === '/erp') return true;
    if (path !== '/erp' && pathname.startsWith(path)) return true;
    return false;
  };

  const sidebarClass = `${styles.sidebar} ${isExpanded ? styles.open : styles.collapsed} ${isMobile ? styles.mobile : ''}`;

  return (
    <aside 
      className={sidebarClass} 
      aria-label="Main Navigation"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.brand}>
        <div className={styles.logoMark} style={{ backgroundColor: 'transparent', boxShadow: 'none', overflow: 'hidden' }}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontSize: '24px', color: '#ffffff' }}>🦉</span>
          )}
        </div>
        {isExpanded && <span className={styles.brandName}>{companyName}</span>}
      </div>

      <div className={styles.navContainer}>
        <nav className={styles.navGroup}>
          {isExpanded && <div className={styles.sectionHeader}>Main</div>}
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
              title={!isExpanded ? item.name : undefined}
            >
              <item.icon size={20} className={styles.navIcon} />
              {isExpanded && <span className={styles.navText}>{item.name}</span>}
            </Link>
          ))}
        </nav>

        <nav className={styles.navGroup}>
          {isExpanded && <div className={styles.sectionHeader}>System</div>}
          {adminItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
              title={!isExpanded ? item.name : undefined}
            >
              <item.icon size={20} className={styles.navIcon} />
              {isExpanded && <span className={styles.navText}>{item.name}</span>}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
