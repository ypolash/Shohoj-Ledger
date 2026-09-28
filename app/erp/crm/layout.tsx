"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  name: string;
  href: string;
  icon: string;
  exact?: boolean;
  matchAlso?: string;
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/erp/crm", icon: "dashboard", exact: true },
  { name: "Customers", href: "/erp/crm/customers", icon: "person_search", exact: false },
  { name: "Follow Ups", href: "/erp/crm/follow-ups", icon: "event_upcoming", exact: false },
  { name: "Leads", href: "/erp/crm/leads", icon: "view_kanban", exact: false },
  { name: "Opportunities", href: "/erp/crm/opportunities", icon: "trending_up", exact: false },
  { name: "Quotations", href: "/erp/crm/quotations", icon: "request_quote", exact: false },
  { name: "Sales Orders", href: "/erp/crm/sales-orders", icon: "shopping_cart", exact: false, matchAlso: "/erp/crm/orders" },
  { name: "Reports", href: "/erp/crm/reports", icon: "analytics", exact: false },
];

export default function CRMLayout({ children }: { children: React.ReactNode }) {
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
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Top Floating Pill Navigation */}
      <div style={{ padding: "20px 24px 0 24px", flexShrink: 0, background: "var(--surface-bg)" }}>
        <header
          style={{
            background: "var(--surface-card)",
            borderRadius: "50px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
            border: "1px solid var(--border-main)",
            padding: "6px 12px 6px 6px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            overflowX: "auto",
          }}
        >
          {/* Left Side Pill Badge (Current Section) */}
          <div
            style={{
              flexShrink: 0,
              background: "var(--text-main)",
              color: "var(--bg-main)",
              padding: "7px 18px",
              borderRadius: "50px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: 700,
              fontSize: "14px",
              whiteSpace: "nowrap",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              {currentActiveItem?.icon || "groups"}
            </span>
            <span>
              {currentActiveItem && currentActiveItem.name !== "Dashboard"
                ? `CRM · ${currentActiveItem.name}`
                : "CRM & Sales"}
            </span>
          </div>

          {/* Navigation Links */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              flex: 1,
              flexWrap: "nowrap",
              overflowX: "auto",
            }}
          >
            {navigation.map((item) => {
              const active = isItemActive(item);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  style={{
                    fontSize: "13px",
                    fontWeight: active ? 600 : 500,
                    color: active ? "#ffffff" : "var(--text-secondary)",
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 14px",
                    borderRadius: "20px",
                    background: active
                      ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
                      : "transparent",
                    boxShadow: active ? "0 2px 8px rgba(37, 99, 235, 0.35)" : "none",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: "17px",
                      color: active ? "#ffffff" : "var(--text-muted)",
                    }}
                  >
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </header>
      </div>

      {/* Main CRM Content Area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px", background: "var(--surface-bg)" }}>
        {children}
      </div>
    </div>
  );
}
