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
        </div>
        <nav className={styles.nav}>
          <Link href="/dashboard" className={`${styles.navLink} ${isActive('/dashboard') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">home</span>
            <div className={styles.tooltip}>Dashboard</div>
          </Link>
          <Link href="/dashboard/income" className={`${styles.navLink} ${isActive('/dashboard/income') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">attach_money</span>
            <div className={styles.tooltip}>Income</div>
          </Link>
          <Link href="/dashboard/expenses" className={`${styles.navLink} ${isActive('/dashboard/expenses') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">money_off</span>
            <div className={styles.tooltip}>Expenses</div>
          </Link>
          <Link href="/dashboard/projects" className={`${styles.navLink} ${isActive('/dashboard/projects') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">work</span>
            <div className={styles.tooltip}>Projects</div>
          </Link>
          <Link href="/dashboard/members" className={`${styles.navLink} ${isActive('/dashboard/members') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">group</span>
            <div className={styles.tooltip}>Members</div>
          </Link>
          <Link href="/dashboard/funds" className={`${styles.navLink} ${isActive('/dashboard/funds') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">account_balance_wallet</span>
            <div className={styles.tooltip}>Funds</div>
          </Link>
          <Link href="/dashboard/reserves" className={`${styles.navLink} ${isActive('/dashboard/reserves') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">savings</span>
            <div className={styles.tooltip}>Reserves</div>
          </Link>
          <Link href="/dashboard/loans" className={`${styles.navLink} ${isActive('/dashboard/loans') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">real_estate_agent</span>
            <div className={styles.tooltip}>Loans</div>
          </Link>
          <Link href="/dashboard/advances" className={`${styles.navLink} ${isActive('/dashboard/advances') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">payments</span>
            <div className={styles.tooltip}>Advances</div>
          </Link>
          <Link href="/dashboard/settlement" className={`${styles.navLink} ${isActive('/dashboard/settlement') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">handshake</span>
            <div className={styles.tooltip}>Settlement</div>
          </Link>
          <Link href="/dashboard/staff-management" className={`${styles.navLink} ${isActive('/dashboard/staff-management') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">badge</span>
            <div className={styles.tooltip}>Staff Management</div>
          </Link>
          <Link href="/dashboard/leads" className={`${styles.navLink} ${isActive('/dashboard/leads') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">track_changes</span>
            <div className={styles.tooltip}>Lead Management</div>
          </Link>
          
          <div className={styles.bottomSection}>
            <div className={styles.separator}></div>
            <Link href="/dashboard/attendance/settings" className={`${styles.navLink} ${isActive('/dashboard/attendance/settings') ? styles.active : ''}`}>
              <span className="material-symbols-outlined">settings</span>
              <div className={styles.tooltip}>Settings</div>
            </Link>
            <Link href="#" className={styles.navLink}>
              <span className="material-symbols-outlined">logout</span>
              <div className={styles.tooltip}>Logout</div>
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
