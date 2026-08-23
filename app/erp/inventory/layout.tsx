"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: 'Dashboard', href: '/erp/inventory', icon: 'dashboard', exact: true },
  { name: 'Products', href: '/erp/inventory/products', icon: 'inventory_2', exact: false },
  { name: 'Categories', href: '/erp/inventory/categories', icon: 'category', exact: false },
  { name: 'Stock Control', href: '/erp/inventory/stock', icon: 'move_down', exact: false },
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
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
      {/* Sidebar */}
      <aside style={{
        width: '220px',
        flexShrink: 0,
        background: 'var(--surface-card)',
        borderRight: '1px solid var(--border-main)',
        padding: 'var(--spacing-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-1)',
      }}>
        <div style={{ padding: '12px 8px 16px', borderBottom: '1px solid var(--border-main)', marginBottom: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)', verticalAlign: 'middle', marginRight: '8px' }}>inventory</span>
          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)', verticalAlign: 'middle' }}>Inventory</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {dynamicNavigation.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--primary-subtle)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: isActive ? 'var(--primary)' : 'var(--text-muted)' }}>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-6)', background: 'var(--surface-bg)' }}>
        {children}
      </div>
    </div>
  );
}
