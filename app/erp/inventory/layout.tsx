"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  name: string;
  href: string;
  icon: string;
  exact?: boolean;
  matchAlso?: string;
}

const baseNavigation: NavItem[] = [
  { name: "Dashboard", href: "/erp/inventory", icon: "dashboard", exact: true },
  { name: "Products", href: "/erp/inventory/products", icon: "inventory_2", exact: false },
  { name: "Categories", href: "/erp/inventory/categories", icon: "category", exact: false },
  { name: "Orders", href: "/erp/inventory/orders", icon: "shopping_cart", exact: false },
  { name: "Stock Control", href: "/erp/inventory/stock", icon: "move_down", exact: false },
  { name: "Purchases", href: "/erp/inventory/purchases", icon: "shopping_bag", exact: false },
  { name: "Payments", href: "/erp/inventory/payments", icon: "payments", exact: false },
  { name: "Settings", href: "/erp/inventory/settings", icon: "settings", exact: false },
];

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const [showWarehouses, setShowWarehouses] = useState(false);

  useEffect(() => {
    const checkSettings = () => {
      setShowWarehouses(localStorage.getItem("shohoj_inventory_warehouses_enabled") === "true");
    };
    checkSettings();
    window.addEventListener("storage", checkSettings);
    window.addEventListener("inventorySettingsChanged", checkSettings);
    return () => {
      window.removeEventListener("storage", checkSettings);
      window.removeEventListener("inventorySettingsChanged", checkSettings);
    };
  }, []);

  const navigation: NavItem[] = [...baseNavigation];
  if (showWarehouses) {
    navigation.splice(navigation.length - 1, 0, {
      name: "Warehouses",
      href: "/erp/inventory/warehouses",
      icon: "warehouse",
      exact: false,
    });
  }

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
              {currentActiveItem?.icon || "inventory_2"}
            </span>
            <span>
              {currentActiveItem && currentActiveItem.name !== "Dashboard"
                ? `Inventory · ${currentActiveItem.name}`
                : "Inventory & Supply"}
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

      {/* Main Inventory Content Area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px", background: "var(--surface-bg)" }}>
        {children}
      </div>
    </div>
  );
}
