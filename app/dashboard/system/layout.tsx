"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Server, Building2, Settings, Flag, Database } from "lucide-react";

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard/system', icon: Server, exact: true },
    { name: 'Companies', href: '/dashboard/system/companies', icon: Building2, exact: false },
    { name: 'Global Settings', href: '/dashboard/system/settings', icon: Settings, exact: false },
    { name: 'Feature Flags', href: '/dashboard/system/features', icon: Flag, exact: false },
    { name: 'Backups', href: '/dashboard/system/backups', icon: Database, exact: false },
  ];

  return (
    <div className="flex h-full">
      <div className="w-64 bg-gray-900 border-r border-gray-700 p-4 space-y-2 hidden md:block">
        <h2 className="text-lg font-semibold text-white mb-4 px-2 tracking-wide uppercase text-xs">Platform Operations</h2>
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-gray-400'
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
