"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";

import styles from "./inventory.module.css";

interface NavItem {
  name: string;
  href: string;
  icon: string;
  segment: string | null;
  exact?: boolean;
  matchAlso?: string;
  matchSegments?: string[];
}

const baseNavigation: NavItem[] = [
  { name: "Dashboard", href: "/erp/inventory", icon: "dashboard", segment: null, exact: true },
  { 
    name: "Products", 
    href: "/erp/inventory/products", 
    icon: "inventory_2", 
    segment: "products",
    matchSegments: ["brands", "units", "barcodes", "serials", "batches"] 
  },
  { name: "Categories", href: "/erp/inventory/categories", icon: "category", segment: "categories" },
  { name: "Suppliers", href: "/erp/inventory/suppliers", icon: "local_shipping", segment: "suppliers" },
  { name: "Orders", href: "/erp/inventory/orders", icon: "shopping_cart", segment: "orders" },
  { 
    name: "Stock", 
    href: "/erp/inventory/stock", 
    icon: "move_down", 
    segment: "stock",
    matchSegments: ["adjustments", "transfers"] 
  },
  { 
    name: "Purchases", 
    href: "/erp/inventory/purchases", 
    icon: "shopping_bag", 
    segment: "purchases",
    matchSegments: ["purchase-orders", "goods-receipt", "returns"] 
  },
  { name: "Payments", href: "/erp/inventory/payments", icon: "payments", segment: "payments" },
  { name: "Settings", href: "/erp/inventory/settings", icon: "settings", segment: "settings" },
];

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  const segment = useSelectedLayoutSegment();
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
      segment: "warehouses",
      exact: false,
    });
  }

  const isItemActive = (item: NavItem) => {
    if (segment !== undefined) {
      if (item.exact || item.segment === null) {
        if (segment === null) return true;
      } else if (item.segment && segment === item.segment) {
        return true;
      } else if (item.matchSegments && segment && item.matchSegments.includes(segment)) {
        return true;
      }
    }
    if (pathname) {
      if (item.exact) {
        return pathname === item.href;
      }
      if (pathname.startsWith(item.href)) {
        return true;
      }
      if (item.matchAlso && pathname.startsWith(item.matchAlso)) {
        return true;
      }
    }
    return false;
  };

  const currentActiveItem = navigation.find(isItemActive);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Top Floating Navigation Bar */}
      <div style={{ padding: "16px 20px 0 20px", flexShrink: 0, background: "var(--surface-bg)" }}>
        <header className={styles.subNavHeader}>
          {/* Left Side Icon Badge (Circle Mode) */}
          <div
            className={styles.circleBadge}
            suppressHydrationWarning
            title={currentActiveItem ? `Inventory · ${currentActiveItem.name}` : "Inventory & Supply"}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "17px" }}
              suppressHydrationWarning
            >
              {currentActiveItem?.icon || "inventory_2"}
            </span>
          </div>

          {/* Navigation Links (Compact to fit on one screen) */}
          <nav className={styles.subNavLinkList}>
            {navigation.map((item) => {
              const active = isItemActive(item);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  suppressHydrationWarning
                  className={`${styles.navLinkItem} ${active ? styles.navLinkItemActive : ""}`}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: "15px",
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
