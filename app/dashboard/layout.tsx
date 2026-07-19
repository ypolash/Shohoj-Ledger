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
          <div className={styles.brandIcon}>S</div>
          <span className={styles.brandText}>Shohoj Ledger</span>
        </div>
        <nav className={styles.nav}>
          <Link href="/dashboard" className={`${styles.navLink} ${isActive('/dashboard') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">home</span>
            <span className={styles.navText}>Dashboard</span>
          </Link>
          <Link href="/dashboard/income" className={`${styles.navLink} ${isActive('/dashboard/income') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">attach_money</span>
            <span className={styles.navText}>Income</span>
          </Link>
          <Link href="/dashboard/expenses" className={`${styles.navLink} ${isActive('/dashboard/expenses') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">money_off</span>
            <span className={styles.navText}>Expenses</span>
          </Link>
          <Link href="/dashboard/projects" className={`${styles.navLink} ${isActive('/dashboard/projects') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">work</span>
            <span className={styles.navText}>Projects</span>
          </Link>
          <Link href="/dashboard/members" className={`${styles.navLink} ${isActive('/dashboard/members') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">group</span>
            <span className={styles.navText}>Members</span>
          </Link>
          <Link href="/dashboard/funds" className={`${styles.navLink} ${isActive('/dashboard/funds') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">account_balance_wallet</span>
            <span className={styles.navText}>Funds</span>
          </Link>
          <Link href="/dashboard/reserves" className={`${styles.navLink} ${isActive('/dashboard/reserves') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">savings</span>
            <span className={styles.navText}>Reserves</span>
          </Link>
          <Link href="/dashboard/loans" className={`${styles.navLink} ${isActive('/dashboard/loans') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">real_estate_agent</span>
            <span className={styles.navText}>Loans</span>
          </Link>
          <Link href="/dashboard/advances" className={`${styles.navLink} ${isActive('/dashboard/advances') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">payments</span>
            <span className={styles.navText}>Advances</span>
          </Link>
          <Link href="/dashboard/settlement" className={`${styles.navLink} ${isActive('/dashboard/settlement') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">handshake</span>
            <span className={styles.navText}>Settlement</span>
          </Link>
          <Link href="/dashboard/staff-management" className={`${styles.navLink} ${isActive('/dashboard/staff-management') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">badge</span>
            <span className={styles.navText}>Staff Management</span>
          </Link>
          <Link href="/dashboard/leads" className={`${styles.navLink} ${isActive('/dashboard/leads') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">track_changes</span>
            <span className={styles.navText}>Lead Management</span>
          </Link>
          
          <Link href="#" className={styles.navLink} style={{ marginTop: 'auto' }}>
            <span className="material-symbols-outlined">logout</span>
            <span className={styles.navText}>Log out</span>
          </Link>
          <Link href="/dashboard/attendance/settings" className={`${styles.navLink} ${isActive('/dashboard/attendance/settings') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">settings</span>
            <span className={styles.navText}>Settings</span>
          </Link>
        </nav>
      </aside>
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
