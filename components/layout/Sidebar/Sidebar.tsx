"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  Megaphone,
  ShoppingCart,
  MessageSquare,
  Shield,
  Headphones,
  User,
  LogOut,
  ChevronsUpDown
} from 'lucide-react';

interface SidebarProps {
  businessType?: string;
  companyName?: string;
  logoUrl?: string | null;
}

export function Sidebar({ businessType = 'Product + Service', companyName = 'Shohoj Ledger', logoUrl = null }: SidebarProps) {
  const { sidebarOpen, isMobile } = useUI();
  const [isHovered, setIsHovered] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const pathname = usePathname() || '';
  const router = useRouter();
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const isExpanded = sidebarOpen || isHovered;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchUserData();
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close profile menu on pathname change
  useEffect(() => {
    setIsProfileMenuOpen(false);
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

  const navItems = [
    { name: 'Dashboard', icon: Home, href: '/erp' },
    { name: 'Projects', icon: Folder, href: '/erp/projects' },
    { name: 'Community', icon: MessageSquare, href: '/erp/community' },
    { name: 'CRM', icon: Users, href: '/erp/crm' },
    { name: 'Orders', icon: ShoppingCart, href: '/erp/orders' },
    { name: 'Finance', icon: DollarSign, href: '/erp/finance' },
    { name: 'Inventory', icon: Box, href: '/erp/inventory' },
    { name: 'HR', icon: Briefcase, href: '/erp/hr' },
    { name: 'Payroll', icon: CreditCard, href: '/erp/payroll' },
    { name: 'Marketing', icon: Megaphone, href: '/erp/marketing' },
    { name: 'Reports', icon: BarChart2, href: '/erp/reports' },
  ].filter(item => {
    const type = businessType.toUpperCase();
    if (item.name === 'Inventory' && type === 'SERVICE') return false;
    if (item.name === 'Projects' && type === 'PRODUCT') return false;
    if (item.name === 'Orders' && type === 'SERVICE') return false;
    return true;
  });

  const adminItems = [
    { name: 'Settings', icon: Settings, href: '/erp/settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/erp' && pathname === '/erp') return true;
    if (path === '/erp/orders') {
      return pathname.startsWith('/erp/orders');
    }
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

      {/* Bottom Title / Profile Trigger Under Settings */}
      <div className={styles.sidebarFooter} ref={profileMenuRef}>
        {/* Flyout Popover Menu */}
        {isProfileMenuOpen && (
          <div className={`${styles.profileFlyout} ${!isExpanded ? styles.flyoutCollapsed : ''}`} role="menu">
            {/* Header info */}
            <div className={styles.flyoutHeader}>
              <div className={styles.flyoutAvatar}>
                {logoUrl ? (
                  <img src={logoUrl} alt="Avatar" className={styles.avatarImg} />
                ) : (
                  <span>{currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : '🦉'}</span>
                )}
              </div>
              <div className={styles.flyoutUserInfo}>
                <div className={styles.flyoutUserName}>{currentUser?.name || companyName}</div>
                <div className={styles.flyoutUserEmail}>{currentUser?.email || companyName}</div>
                {currentUser?.platformRole && (
                  <span className={styles.flyoutRoleBadge}>
                    {currentUser.platformRole.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.flyoutDivider} />

            {/* Menu options */}
            <div className={styles.flyoutItems}>
              {currentUser?.platformRole === 'SUPER_ADMIN' && (
                <Link
                  href="/super-admin"
                  className={styles.flyoutItem}
                  onClick={() => setIsProfileMenuOpen(false)}
                >
                  <Shield size={16} className={styles.flyoutItemIcon} />
                  <span>Super Admin Portal</span>
                </Link>
              )}

              <Link
                href={currentUser?.platformRole === 'SUPER_ADMIN' ? '/super-admin/support' : '/erp/support'}
                className={styles.flyoutItem}
                onClick={() => setIsProfileMenuOpen(false)}
              >
                <Headphones size={16} className={styles.flyoutItemIcon} />
                <span>Customer Support</span>
              </Link>

              <Link
                href="/erp/settings/profile"
                className={styles.flyoutItem}
                onClick={() => setIsProfileMenuOpen(false)}
              >
                <User size={16} className={styles.flyoutItemIcon} />
                <span>My Profile</span>
              </Link>

              <Link
                href="/erp/settings"
                className={styles.flyoutItem}
                onClick={() => setIsProfileMenuOpen(false)}
              >
                <Settings size={16} className={styles.flyoutItemIcon} />
                <span>Account Settings</span>
              </Link>

              <div className={styles.flyoutDivider} />

              <button
                type="button"
                className={`${styles.flyoutItem} ${styles.dangerItem}`}
                onClick={handleLogout}
              >
                <LogOut size={16} className={styles.flyoutItemIcon} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Bottom Title Card Button */}
        <button
          type="button"
          className={`${styles.bottomBrandButton} ${isProfileMenuOpen ? styles.bottomBrandActive : ''}`}
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          title={!isExpanded ? `${companyName} - Profile Menu` : undefined}
          aria-haspopup="true"
          aria-expanded={isProfileMenuOpen}
        >
          <div className={styles.logoMark} style={{ backgroundColor: 'transparent', boxShadow: 'none', overflow: 'hidden' }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: '22px', color: '#ffffff' }}>🦉</span>
            )}
          </div>
          {isExpanded && (
            <div className={styles.brandInfo}>
              <span className={styles.brandName}>{companyName}</span>
              <span className={styles.brandSubtitle}>{currentUser?.name || currentUser?.email || 'Workspace'}</span>
            </div>
          )}
          {isExpanded && (
            <ChevronsUpDown size={16} className={styles.brandChevron} />
          )}
        </button>
      </div>
    </aside>
  );
}
