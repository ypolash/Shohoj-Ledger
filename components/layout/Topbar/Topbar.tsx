"use client";

import React from 'react';
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
        {/* Command Palette Trigger */}
        <button className={styles.searchTrigger} aria-label="Search">
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

          <button className={styles.iconButton} aria-label="Notifications">
            <Bell size={20} />
            <span className={styles.badge}>3</span>
          </button>

          <button className={styles.profileButton} aria-label="Profile Menu">
            <UserCircle size={24} />
          </button>
        </div>
      </div>
    </header>
  );
}
