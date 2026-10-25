"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./layout.module.css";

interface NavItem {
  name: string;
  href: string;
  exact?: boolean;
  matchAlso?: string;
  badgeIcon?: string;
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/erp/finance", exact: true, badgeIcon: "dashboard" },
  { name: "Income", href: "/erp/finance/income", exact: false, badgeIcon: "trending_up" },
  { name: "Expense", href: "/erp/finance/expenses", exact: false, badgeIcon: "trending_down" },
  { name: "Loans", href: "/erp/finance/loans", exact: false, badgeIcon: "account_balance" },
  { name: "Bills Due", href: "/erp/finance/bills", exact: false, badgeIcon: "pending_actions" },
  { name: "Supplier Dues", href: "/erp/finance/payments", exact: false, badgeIcon: "payments" },
  { name: "Advance", href: "/erp/finance/advances", exact: false, badgeIcon: "payments" },
  { name: "Settlement", href: "/erp/finance/settlements", exact: false, badgeIcon: "receipt_long" },
  { name: "Export Report", href: "/erp/finance/reports/statement", matchAlso: "/erp/finance/reports", exact: false, badgeIcon: "download" },
];

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";

  const isItemActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    if (pathname.startsWith(item.href)) {
      return true;
    }
    if (item.matchAlso && pathname.startsWith(item.matchAlso)) {
      return true;
    }
    return false;
  };

  const currentActiveItem = navigation.find(isItemActive);

  return (
    <div className={styles.container}>
      {/* Top Floating Pill Navigation */}
      <div className={styles.navWrapper}>
        <header className={styles.header}>
          {/* Left Side Pill Badge (Current Section) */}
          <div className={styles.badge}>
            <span className={`material-symbols-outlined ${styles.badgeIcon}`}>
              {currentActiveItem?.badgeIcon || "account_balance"}
            </span>
            <span>
              {currentActiveItem && currentActiveItem.name !== "Dashboard"
                ? `Finance · ${currentActiveItem.name}`
                : "Finance & Accounts"}
            </span>
          </div>

          {/* Navigation Links (Text Pills) */}
          <nav className={styles.nav}>
            {navigation.map((item) => {
              const active = isItemActive(item);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                >
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </header>
      </div>

      {/* Main Finance Content Area */}
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
