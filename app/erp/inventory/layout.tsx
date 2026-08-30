"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: 'Dashboard', href: '/erp/inventory', icon: 'dashboard', exact: true },
  { name: 'Products', href: '/erp/inventory/products', icon: 'inventory_2', exact: false },
  { name: 'Categories', href: '/erp/inventory/categories', icon: 'category', exact: false },
  { name: 'Orders', href: '/erp/inventory/orders', icon: 'shopping_cart', exact: false },
  { name: 'Stock Control', href: '/erp/inventory/stock', icon: 'move_down', exact: false },
  { name: 'Purchases', href: '/erp/inventory/purchases', icon: 'shopping_bag', exact: false },
  { name: 'Payments', href: '/erp/inventory/payments', icon: 'payments', exact: false },
  { name: 'Settings', href: '/erp/inventory/settings', icon: 'settings', exact: false },
];

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const [showWarehouses, setShowWarehouses] = useState(false);

  useEffect(() => {
    const checkSettings = () => {
      setShowWarehouses(localStorage.getItem('shohoj_inventory_warehouses_enabled') === 'true');
    };
    checkSettings();
    window.addEventListener('storage', checkSettings);
    window.addEventListener('inventorySettingsChanged', checkSettings);
    return () => {
      window.removeEventListener('storage', checkSettings);
      window.removeEventListener('inventorySettingsChanged', checkSettings);
    };
  }, []);

  const dynamicNavigation = [...navigation];
  if (showWarehouses) {
    dynamicNavigation.splice(dynamicNavigation.length - 1, 0, { name: 'Warehouses', href: '/erp/inventory/warehouses', icon: 'warehouse', exact: false });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Top Navigation Wrapper */}
      <div style={{ padding: '24px 24px 0 24px', flexShrink: 0, background: 'var(--surface-bg)' }}>
        {/* Floating Pill Nav */}
        <header style={{
          background: 'var(--surface-card)',
          borderRadius: '50px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '1px solid var(--border-main)',
          padding: '8px 24px 8px 8px',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
        }}>
          {/* Left Side Pill Box (Title) */}
          <div style={{ 
            justifySelf: 'start',
            background: 'var(--text-main)', 
            color: 'var(--bg-main)', 
            padding: '8px 20px', 
            borderRadius: '50px',
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontWeight: 700,
            fontSize: '15px'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {dynamicNavigation.find(item => item.exact ? pathname === item.href : pathname.startsWith(item.href))?.icon || 'inventory'}
            </span>
            {(() => {
              const active = dynamicNavigation.find(item => item.exact ? pathname === item.href : pathname.startsWith(item.href));
              if (!active || active.name === 'Dashboard') return 'Inventory';
              return active.name;
            })()}
          </div>
          
          {/* Nav Links (Centered) */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '24px', justifyContent: 'center' }}>
            {dynamicNavigation.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  style={{
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    textDecoration: 'none',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </header>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--surface-bg)' }}>
        {children}
      </div>
    </div>
  );
}
