import Link from "next/link";
import styles from "./layout.module.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.dashboardContainer}>
      <aside className={`glass-panel ${styles.sidebar}`}>
        <div className={styles.brand}>Shohoj Ledger</div>
        <nav className={styles.nav}>
          <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
          <Link href="/dashboard/income" className={styles.navLink}>Income</Link>
          <Link href="/dashboard/expenses" className={styles.navLink}>Expenses</Link>
          <Link href="/dashboard/loans" className={styles.navLink}>Loans & Advances</Link>
          <Link href="/dashboard/settlement" className={styles.navLink}>Settlement</Link>
        </nav>
      </aside>
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
