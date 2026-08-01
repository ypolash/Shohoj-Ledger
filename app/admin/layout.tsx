"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./layout.module.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/admin' && pathname === '/admin') return true;
    if (path !== '/admin' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className={styles.adminContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <span className="material-symbols-outlined">admin_panel_settings</span>
          </div>
          <span className={styles.brandTitle}>Platform Admin</span>
        </div>
        <nav className={styles.nav}>
          <Link href="/admin" className={`${styles.navLink} ${isActive('/admin') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">business</span>
            Tenants
          </Link>
          <Link href="/admin/billing" className={`${styles.navLink} ${isActive('/admin/billing') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">receipt_long</span>
            Billing
          </Link>
          <Link href="/admin/system-health" className={`${styles.navLink} ${isActive('/admin/system-health') ? styles.active : ''}`}>
            <span className="material-symbols-outlined">health_and_safety</span>
            System Health
          </Link>
          
          <div className={styles.bottomSection}>
            <Link href="/" className={styles.navLink}>
              <span className="material-symbols-outlined">logout</span>
              Exit Admin
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
