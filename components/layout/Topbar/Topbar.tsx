"use client";

import React from 'react';
import Link from 'next/link';
import { useUI } from '@/lib/contexts/UIContext';
import styles from './Topbar.module.css';
import { 
  Menu, 
  Search, 
  Bell, 
  Moon, 
  Sun, 
  Monitor,
  ChevronRight,
  UserCircle
} from 'lucide-react';
import { usePathname } from 'next/navigation';

export function Topbar() {
  const { toggleSidebar, theme, setTheme } = useUI();
  const pathname = usePathname() || '';

  // Basic breadcrumb generation based on pathname
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs = paths.map((path, index) => {
    const isLast = index === paths.length - 1;
    const name = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
    return { name, isLast };
  });

  const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
  
  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  return (
    <header className={styles.topbar}>
      <div className={styles.leftSection}>

        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          <span className={styles.breadcrumbItem}>Shohoj</span>
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              <ChevronRight size={16} className={styles.breadcrumbSeparator} />
              <span className={`${styles.breadcrumbItem} ${crumb.isLast ? styles.active : ''}`}>
                {crumb.name}
              </span>
            </React.Fragment>
          ))}
        </nav>
      </div>

      <div className={styles.rightSection}>
        <button className={styles.searchTrigger} aria-label="Search" onClick={() => alert("Search functionality is currently being built.")}>
          <Search size={16} />
          <span className={styles.searchPlaceholder}>Search...</span>
          <kbd className={styles.shortcutKey}>Ctrl+K</kbd>
        </button>

        <div className={styles.actions}>
          <button 
            className={styles.iconButton} 
            onClick={() => setTheme(nextTheme)}
            aria-label={`Switch theme (current: ${theme})`}
            title={`Switch theme (current: ${theme})`}
          >
            <ThemeIcon size={20} />
          </button>

          <Link href="/erp/settings/notifications" passHref>
            <button className={styles.iconButton} aria-label="Notifications" title="Notifications">
              <Bell size={20} />
              <span className={styles.badge}>3</span>
            </button>
          </Link>

          <Link href="/erp/settings/profile" passHref>
            <button className={styles.profileButton} aria-label="Profile Menu" title="Profile Settings">
              <UserCircle size={24} />
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}
