"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  name: string;
  href: string;
  icon: string;
  exact?: boolean;
}

const navigation: NavItem[] = [
  { name: "Campaigns", href: "/erp/marketing", icon: "campaign", exact: true },
  { name: "Google Ads", href: "/erp/marketing#google-ads", icon: "ads_click", exact: false },
  { name: "Facebook Ads", href: "/erp/marketing#facebook-ads", icon: "public", exact: false },
  { name: "Channels", href: "/erp/marketing#channels", icon: "hub", exact: false },
  { name: "Performance", href: "/erp/marketing#performance", icon: "monitoring", exact: false },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";

  const isItemActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
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
          {/* Left Side Pill Badge */}
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
              {currentActiveItem?.icon || "campaign"}
            </span>
            <span>
              {currentActiveItem && currentActiveItem.name !== "Campaigns"
                ? `Marketing · ${currentActiveItem.name}`
                : "Marketing & Growth"}
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

      {/* Main Marketing Content Area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px", background: "var(--surface-bg)" }}>
        {children}
      </div>
    </div>
  );
}
