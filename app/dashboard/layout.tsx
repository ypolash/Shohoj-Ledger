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
          <Link href="/dashboard" className={`${styles.navLink} ${isActive('/dashboard') ? styles.active : ''}`} title="Dashboard">
            <span className="material-symbols-outlined">home</span>
          </Link>
          <Link href="/dashboard/income" className={`${styles.navLink} ${isActive('/dashboard/income') ? styles.active : ''}`} title="Income">
            <span className="material-symbols-outlined">attach_money</span>
          </Link>
          <Link href="/dashboard/expenses" className={`${styles.navLink} ${isActive('/dashboard/expenses') ? styles.active : ''}`} title="Expenses">
            <span className="material-symbols-outlined">money_off</span>
          </Link>
          <Link href="/dashboard/projects" className={`${styles.navLink} ${isActive('/dashboard/projects') ? styles.active : ''}`} title="Projects">
            <span className="material-symbols-outlined">work</span>
          </Link>
          <Link href="/dashboard/members" className={`${styles.navLink} ${isActive('/dashboard/members') ? styles.active : ''}`} title="Members">
            <span className="material-symbols-outlined">group</span>
          </Link>
          <Link href="/dashboard/funds" className={`${styles.navLink} ${isActive('/dashboard/funds') ? styles.active : ''}`} title="Funds">
            <span className="material-symbols-outlined">account_balance_wallet</span>
          </Link>
          <Link href="/dashboard/reserves" className={`${styles.navLink} ${isActive('/dashboard/reserves') ? styles.active : ''}`} title="Reserves">
            <span className="material-symbols-outlined">savings</span>
          </Link>
          <Link href="/dashboard/loans" className={`${styles.navLink} ${isActive('/dashboard/loans') ? styles.active : ''}`} title="Loans">
            <span className="material-symbols-outlined">real_estate_agent</span>
          </Link>
          <Link href="/dashboard/advances" className={`${styles.navLink} ${isActive('/dashboard/advances') ? styles.active : ''}`} title="Advances">
            <span className="material-symbols-outlined">payments</span>
          </Link>
          <Link href="/dashboard/settlement" className={`${styles.navLink} ${isActive('/dashboard/settlement') ? styles.active : ''}`} title="Settlement">
            <span className="material-symbols-outlined">handshake</span>
          </Link>
          <Link href="/dashboard/staff-management" className={`${styles.navLink} ${isActive('/dashboard/staff-management') ? styles.active : ''}`} title="Staff Management">
            <span className="material-symbols-outlined">badge</span>
          </Link>
          <Link href="/dashboard/leads" className={`${styles.navLink} ${isActive('/dashboard/leads') ? styles.active : ''}`} title="Lead Management">
            <span className="material-symbols-outlined">track_changes</span>
          </Link>
          
          <div className={styles.bottomSection}>
            <div className={styles.separator}></div>
            <Link href="/dashboard/attendance/settings" className={`${styles.navLink} ${isActive('/dashboard/attendance/settings') ? styles.active : ''}`} title="Settings">
              <span className="material-symbols-outlined">settings</span>
            </Link>
            <Link href="#" className={styles.navLink} title="Log out">
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
