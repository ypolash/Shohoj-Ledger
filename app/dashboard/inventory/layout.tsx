"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, MapPin, Truck, Box, FileText, Monitor } from "lucide-react";

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard/inventory', icon: Monitor, exact: true },
    { name: 'Products', href: '/dashboard/inventory/products', icon: Package, exact: false },
    { name: 'Warehouses', href: '/dashboard/inventory/warehouses', icon: MapPin, exact: false },
    { name: 'Stock Control', href: '/dashboard/inventory/stock', icon: Box, exact: false },
    { name: 'Purchasing', href: '/dashboard/inventory/purchasing', icon: Truck, exact: false },
    { name: 'Fixed Assets', href: '/dashboard/inventory/assets', icon: Monitor, exact: false },
    { name: 'Reports', href: '/dashboard/inventory/reports', icon: FileText, exact: false },
  ];

  return (
    <div className="flex h-full">
      <div className="w-64 bg-white border-r border-gray-200 p-4 space-y-2 hidden md:block">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 px-2">Inventory</h2>
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    isActive ? 'text-blue-700' : 'text-gray-400'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex-1 overflow-auto bg-gray-50 p-4 md:p-8">
        {children}
      </div>
    </div>
  );
}
