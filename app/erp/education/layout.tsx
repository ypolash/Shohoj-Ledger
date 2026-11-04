"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavTab {
  name: string;
  href: string;
  icon: string;
}

const ACADEMY_TABS: NavTab[] = [
  { name: "Students", href: "/erp/education/students", icon: "school" },
  { name: "Teachers", href: "/erp/education/teachers", icon: "group" },
  { name: "Subjects", href: "/erp/education/subjects", icon: "menu_book" },
  { name: "Departments", href: "/erp/education/departments", icon: "corporate_fare" },
  { name: "Classes", href: "/erp/education/classes", icon: "calendar_month" },
  { name: "Finance", href: "/erp/education/finance", icon: "payments" },
];

export default function EducationLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";

  const isItemActive = (item: NavTab) => {
    return pathname.startsWith(item.href);
  };

  const currentActiveItem = ACADEMY_TABS.find(isItemActive);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Top Floating Navigation with 0px Precision */}
      <div style={{ padding: "16px 24px 0 24px", flexShrink: 0, background: "var(--surface-bg)" }}>
        <header
          style={{
            background: "var(--surface-card)",
            borderRadius: "0px",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
            border: "1px solid var(--border-main)",
            padding: "6px 12px 6px 6px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            overflowX: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {/* Left Side Section Badge (0px radius) */}
          <div
            style={{
              flexShrink: 0,
              background: "var(--text-main)",
              color: "var(--bg-main)",
              padding: "7px 18px",
              borderRadius: "0px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: 700,
              fontSize: "14px",
              whiteSpace: "nowrap",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              {currentActiveItem?.icon || "school"}
            </span>
            <span>
              {currentActiveItem
                ? `Education · ${currentActiveItem.name}`
                : "Student & Teacher Academy"}
            </span>
          </div>

          {/* Navigation Links (0px radius) */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              flex: 1,
              flexWrap: "nowrap",
              overflowX: "auto",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {ACADEMY_TABS.map((item) => {
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
                    padding: "6px 16px",
                    borderRadius: "0px",
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
                      fontSize: "16px",
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

      {/* Main Workspace Content Area with 0px Radius */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          background: "var(--surface-bg)",
          minHeight: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}
