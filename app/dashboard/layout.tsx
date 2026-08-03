"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./layout.module.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true;
    if (path !== '/dashboard' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className={styles.dashboardContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <span style={{ fontSize: '24px', color: '#ffffff' }}>🦉</span>
          </div>
        </div>
        <nav className={styles.nav}>
          <Link href="/dashboard" title="Dashboard" className={`${styles.navLink} ${isActive('/dashboard') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">home</span>
          </Link>
          <Link href="/dashboard/income" title="Income" className={`${styles.navLink} ${isActive('/dashboard/income') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">attach_money</span>
          </Link>
          <Link href="/dashboard/expenses" title="Expenses" className={`${styles.navLink} ${isActive('/dashboard/expenses') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">money_off</span>
          </Link>
          <Link href="/dashboard/projects" title="Projects" className={`${styles.navLink} ${isActive('/dashboard/projects') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">work</span>
          </Link>
          <Link href="/dashboard/members" title="Members" className={`${styles.navLink} ${isActive('/dashboard/members') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">group</span>
          </Link>
          <Link href="/dashboard/funds" title="Funds" className={`${styles.navLink} ${isActive('/dashboard/funds') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">account_balance_wallet</span>
          </Link>
          <Link href="/dashboard/reserves" title="Reserves" className={`${styles.navLink} ${isActive('/dashboard/reserves') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">savings</span>
          </Link>
          <Link href="/dashboard/loans" title="Loans" className={`${styles.navLink} ${isActive('/dashboard/loans') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">real_estate_agent</span>
          </Link>
          <Link href="/dashboard/advances" title="Advances" className={`${styles.navLink} ${isActive('/dashboard/advances') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">payments</span>
          </Link>
          <Link href="/dashboard/settlement" title="Settlement" className={`${styles.navLink} ${isActive('/dashboard/settlement') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">handshake</span>
          </Link>
          <Link href="/dashboard/staff-management" title="Staff Management" className={`${styles.navLink} ${isActive('/dashboard/staff-management') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">badge</span>
          </Link>
          <Link href="/dashboard/leads" title="Lead Management" className={`${styles.navLink} ${isActive('/dashboard/leads') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">track_changes</span>
          </Link>
          
          <div className={styles.bottomSection}>
            <div className={styles.separator}></div>
            <Link href="/dashboard/settings/attendance" title="Settings" className={`${styles.navLink} ${isActive('/dashboard/settings/attendance') ? styles.active : ''}`}>
              <span className="material-symbols-outlined">settings</span>
            </Link>
            <Link href="#" title="Logout" className={styles.navLink}>
              <span className="material-symbols-outlined">logout</span>
            </Link>
          </div>
        </nav>
      </aside>
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
