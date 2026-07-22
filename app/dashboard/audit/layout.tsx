"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Download, Settings } from "lucide-react";

export default function AuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Activity Timeline', href: '/dashboard/audit', icon: Activity, exact: true },
    { name: 'Data Export', href: '/dashboard/audit/export', icon: Download, exact: false },
    { name: 'Retention Policies', href: '/dashboard/audit/retention', icon: Settings, exact: false },
  ];

  return (
    <div className="flex h-full">
      <div className="w-64 bg-white border-r border-gray-200 p-4 space-y-2 hidden md:block">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 px-2">Audit & Activity</h2>
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
