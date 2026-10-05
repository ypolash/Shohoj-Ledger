"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUI } from '@/lib/contexts/UIContext';
import styles from './Topbar.module.css';
import { 
  Search, 
  Bell, 
  Moon, 
  Sun, 
  Monitor, 
  Menu, 
  Shield,
  Download,
  Smartphone,
  QrCode,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Dropdown } from '@/components/ui/Dropdown/Dropdown';
import { Modal } from '@/components/ui/Modal/Modal';

export function Topbar() {
  const { toggleSidebar, theme, setTheme, pageTitleOverride } = useUI();
  const pathname = usePathname() || '';
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isStaffAppModalOpen, setIsStaffAppModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('/api/mobile/download/staff');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDownloadUrl(`${window.location.origin}/api/mobile/download/staff`);
    }
  }, []);

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

  // Basic breadcrumb generation based on pathname
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs = paths.map((path, index) => {
    const isLast = index === paths.length - 1;
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(path) || (path.length > 20 && !path.includes(' '));
    
    let name = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');

    if (isUuid) {
      const prevPath = index > 0 ? paths[index - 1] : '';
      if (prevPath === 'sales-orders' || prevPath === 'orders') {
        name = `Order #${path.substring(0, 8)}`;
      } else if (prevPath === 'quotations') {
        name = `Quotation #${path.substring(0, 8)}`;
      } else if (prevPath === 'customers') {
        name = `Customer #${path.substring(0, 8)}`;
      } else if (prevPath === 'leads') {
        name = `Lead #${path.substring(0, 8)}`;
      } else if (prevPath === 'opportunities') {
        name = `Opportunity #${path.substring(0, 8)}`;
      } else {
        name = `Details`;
      }
    }

    if (isLast && pageTitleOverride) {
      name = pageTitleOverride;
    }

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
            {/* Android Staff App Download System */}
            <button 
              onClick={() => setIsStaffAppModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15))',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#10b981',
                cursor: 'pointer',
                letterSpacing: '0.02em',
                transition: 'all 0.15s ease',
              }}
              title="Android Staff App Download System"
            >
              <Smartphone size={14} />
              <span>Staff App</span>
            </button>

            {/* If in ERP workspace and logged in as SUPER_ADMIN, provide link to Super Admin */}
            {currentUser?.platformRole === 'SUPER_ADMIN' && !pathname.startsWith('/super-admin') && (
              <Link
                href="/super-admin"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(99, 102, 241, 0.25))',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  color: '#c084fc',
                  textDecoration: 'none',
                  letterSpacing: '0.02em',
                }}
                title="Switch to Super Admin mission control"
              >
                <Shield size={14} />
                <span>Super Admin</span>
              </Link>
            )}

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
          </div>
        </div>
      </header>

      {/* Android Staff App Download Modal */}
      <Modal
        isOpen={isStaffAppModalOpen}
        onClose={() => setIsStaffAppModalOpen(false)}
        title="Shohoj Staff Android App"
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '8px 0' }}>
          {/* Header Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 95, 70, 0.15))',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
              flexShrink: 0,
            }}>
              <Smartphone size={26} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                  Shohoj Staff Mobile App
                </h3>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '99px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                }}>
                  v1.6.5 (Latest)
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '99px',
                  background: 'var(--surface-hover)',
                  color: 'var(--text-muted)',
                }}>
                  Android 8.0+
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Dedicated Android client for staff check-ins, biometric attendance, leaves, task rewards, and payslips.
              </p>
            </div>
          </div>

          {/* 2-Column: QR Code Scan & Direct Download */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
          }}>
            {/* Scan to Download */}
            <div style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-main)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                <QrCode size={16} color="var(--primary)" />
                <span>Scan with Mobile Phone</span>
              </div>
              <div style={{
                background: '#ffffff',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--border-main)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                display: 'inline-flex',
              }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(downloadUrl)}&margin=0`}
                  alt="Staff App Download QR Code"
                  width={140}
                  height={140}
                  style={{ display: 'block' }}
                />
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Point your phone camera to download APK directly
              </span>
            </div>

            {/* Direct Download & Links */}
            <div style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-main)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px',
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                  Direct Download & Share
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
                  Download the installation file (.apk) directly to your PC or Android smartphone, or copy the direct link for staff.
                </div>
                <div style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'var(--surface-subtle)',
                  border: '1px solid var(--border-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: 'var(--text-main)',
                  overflow: 'hidden',
                }}>
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    shohoj-staff-v1.6.5.apk (12.6 MB)
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(downloadUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: copiedLink ? '#10b981' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                    title="Copy direct download link"
                  >
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <a
                href="/api/mobile/download/staff"
                download="shohoj-staff-v1.6.5.apk"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13px',
                  textDecoration: 'none',
                  boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
                  transition: 'opacity 0.2s',
                }}
              >
                <Download size={16} />
                <span>Download APK (12.6 MB)</span>
              </a>
            </div>
          </div>

          {/* Installation Steps */}
          <div style={{
            background: 'var(--surface-subtle)',
            borderRadius: '10px',
            border: '1px solid var(--border-main)',
            padding: '12px 16px',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Installation Instructions for Android
            </div>
            <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <li>Scan the QR code or click <strong>Download APK</strong> on your Android device.</li>
              <li>When downloaded, open the notification or downloads folder and tap the APK.</li>
              <li>If prompted, allow <em>"Install unknown apps"</em> for your browser or file manager.</li>
              <li>Tap <strong>Install</strong>, then open the app and log in using your staff credentials.</li>
            </ol>
          </div>
        </div>
      </Modal>

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
