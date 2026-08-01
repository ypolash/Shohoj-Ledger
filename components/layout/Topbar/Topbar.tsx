"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useUI } from '@/lib/contexts/UIContext';
import styles from './Topbar.module.css';
import { 
  Search, 
  Bell, 
  Moon, 
  Sun, 
  Monitor,
  ChevronRight,
  UserCircle,
  Settings,
  LogOut,
  User
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Dropdown } from '@/components/ui/Dropdown/Dropdown';
import { Modal } from '@/components/ui/Modal/Modal';

export function Topbar() {
  const { toggleSidebar, theme, setTheme } = useUI();
  const pathname = usePathname() || '';
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
    <>
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
          <button className={styles.searchTrigger} aria-label="Search" onClick={() => setIsSearchOpen(true)}>
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

            <Dropdown 
              align="right"
              trigger={
                <button className={styles.iconButton} aria-label="Notifications" title="Notifications">
                  <Bell size={20} />
                  <span className={styles.badge}>3</span>
                </button>
              }
              items={[
                { label: 'System update available', icon: <Bell size={16} /> },
                { label: 'New employee onboarded', icon: <Bell size={16} /> },
                { label: 'Monthly report generated', icon: <Bell size={16} /> },
                { label: 'View all notifications', onClick: () => window.location.href = '/erp/settings/notifications' }
              ]}
            />

            <Dropdown 
              align="right"
              trigger={
                <button className={styles.profileButton} aria-label="Profile Menu" title="Profile Settings">
                  <UserCircle size={24} />
                </button>
              }
              items={[
                { label: 'My Profile', icon: <User size={16} />, onClick: () => window.location.href = '/erp/settings/profile' },
                { label: 'Account Settings', icon: <Settings size={16} />, onClick: () => window.location.href = '/erp/settings' },
                { label: 'Sign Out', icon: <LogOut size={16} />, danger: true, onClick: () => alert('Sign out logic here') }
              ]}
            />
          </div>
        </div>
      </header>

      <Modal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        title="Global Search"
        size="md"
      >
        <div style={{ padding: '16px 0' }}>
          <input 
            type="text" 
            placeholder="Search for employees, transactions, or settings..." 
            className="input" 
            autoFocus 
            style={{ width: '100%', fontSize: '16px', padding: '12px' }} 
          />
          <div style={{ marginTop: '24px', color: 'var(--text-muted)' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Searches</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', cursor: 'pointer', borderRadius: '6px', background: 'var(--surface-hover)' }}>
                <Search size={14} />
                <span style={{ fontSize: '14px' }}>John Doe (Employee)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', cursor: 'pointer', borderRadius: '6px', background: 'var(--surface-hover)' }}>
                <Search size={14} />
                <span style={{ fontSize: '14px' }}>Q3 Revenue Report</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
