"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUI } from '@/lib/contexts/UIContext';
import styles from './Topbar.module.css';
import { 
  Search, 
  Bell, 
  Moon, 
  Sun, 
  Monitor,
  Check,
  UserCircle,
  Settings,
  LogOut,
  User,
  Menu
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Dropdown } from '@/components/ui/Dropdown/Dropdown';
import { Modal } from '@/components/ui/Modal/Modal';

export function Topbar() {
  const { toggleSidebar, theme, setTheme } = useUI();
  const pathname = usePathname() || '';
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/erp/notifications?limit=5');
        const data = await res.json();
        if (data.success) {
          setNotifications(data.data || []);
          setUnreadCount(data.meta?.unreadCount || 0);
        }
      } catch (error) {
        console.error("Failed to load notifications", error);
      }
    };
    fetchNotifications();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (e) {
      console.error('Logout error', e);
      router.push('/login');
    }
  };

  // Basic breadcrumb generation based on pathname
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs = paths.map((path, index) => {
    const isLast = index === paths.length - 1;
    const name = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
    const href = '/' + paths.slice(0, index + 1).join('/');
    return { name, isLast, href };
  });

  const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
  
  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  return (
    <>
      <header className={styles.topbar}>
        <div className={styles.leftSection}>
          <button 
            className={`${styles.iconButton} ${styles.menuButton}`} 
            onClick={toggleSidebar}
            aria-label="Toggle Menu"
            title="Toggle Menu"
          >
            <Menu size={20} />
          </button>
          
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, i) => (
              crumb.isLast ? (
                <div key={i} className={`${styles.breadcrumbItem} ${styles.active}`}>
                  {crumb.name}
                </div>
              ) : (
                <Link key={i} href={crumb.href} className={styles.breadcrumbItem}>
                  {crumb.name}
                </Link>
              )
            ))}
          </nav>
        </div>

        <div className={styles.rightSection}>
          <button className={styles.searchTrigger} aria-label="Search" onClick={() => setIsSearchOpen(true)}>
            <Search size={16} />
            <span className={styles.searchPlaceholder}>Search...</span>
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
                  {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </button>
              }
              items={
                notifications.length > 0
                  ? [
                      ...notifications.map(n => ({
                        label: n.title,
                        icon: <Bell size={16} />,
                        onClick: () => window.location.href = '/erp/notifications'
                      })),
                      { label: 'View all notifications', onClick: () => window.location.href = '/erp/notifications' }
                    ]
                  : [
                      { label: 'No new notifications', icon: <Bell size={16} /> },
                      { label: 'View all notifications', onClick: () => window.location.href = '/erp/notifications' }
                    ]
              }
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
                { label: 'Sign Out', icon: <LogOut size={16} />, danger: true, onClick: handleLogout }
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
