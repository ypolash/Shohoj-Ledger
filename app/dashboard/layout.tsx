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
          Shohoj Ledger
        </div>
        <nav className={styles.nav}>
          <Link href="/dashboard" className={`${styles.navLink} ${isActive('/dashboard') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">home</span> Dashboard
          </Link>
          <Link href="/dashboard/income" className={`${styles.navLink} ${isActive('/dashboard/income') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">attach_money</span> Income
          </Link>
          <Link href="/dashboard/expenses" className={`${styles.navLink} ${isActive('/dashboard/expenses') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">money_off</span> Expenses
          </Link>
          <Link href="/dashboard/projects" className={`${styles.navLink} ${isActive('/dashboard/projects') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">work</span> Projects
          </Link>
          <Link href="/dashboard/members" className={`${styles.navLink} ${isActive('/dashboard/members') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">group</span> Members
          </Link>
          <Link href="/dashboard/funds" className={`${styles.navLink} ${isActive('/dashboard/funds') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">account_balance_wallet</span> Funds
          </Link>
          <Link href="/dashboard/reserves" className={`${styles.navLink} ${isActive('/dashboard/reserves') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">savings</span> Reserves
          </Link>
          <Link href="/dashboard/loans" className={`${styles.navLink} ${isActive('/dashboard/loans') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">real_estate_agent</span> Loans
          </Link>
          <Link href="/dashboard/advances" className={`${styles.navLink} ${isActive('/dashboard/advances') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">payments</span> Advances
          </Link>
          <Link href="/dashboard/settlement" className={`${styles.navLink} ${isActive('/dashboard/settlement') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">handshake</span> Settlement
          </Link>
          <Link href="/dashboard/staff-management" className={`${styles.navLink} ${isActive('/dashboard/staff-management') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">badge</span> Staff Management
          </Link>
          <Link href="/dashboard/leads" className={`${styles.navLink} ${isActive('/dashboard/leads') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">track_changes</span> Lead Management
          </Link>
          
          <Link href="#" className={styles.navLink} style={{ marginTop: 'auto' }}>
            <span className="material-symbols-outlined">logout</span> Log out
          </Link>
          <Link href="#" className={styles.navLink}>
            <span className="material-symbols-outlined">settings</span> Settings
          </Link>
        </nav>
      </aside>
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
