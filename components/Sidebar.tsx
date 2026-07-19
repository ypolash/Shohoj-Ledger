"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Home, 
  DollarSign, 
  CreditCard, 
  Briefcase, 
  Users, 
  Wallet, 
  PiggyBank, 
  BadgeDollarSign,
  Coins,
  Handshake,
  UserCog,
  Target,
  Settings,
  LogOut,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Income", href: "/dashboard/income", icon: DollarSign },
  { name: "Expenses", href: "/dashboard/expenses", icon: CreditCard },
  { name: "Projects", href: "/dashboard/projects", icon: Briefcase },
  { name: "Members", href: "/dashboard/members", icon: Users },
  { name: "Funds", href: "/dashboard/funds", icon: Wallet },
  { name: "Reserves", href: "/dashboard/reserves", icon: PiggyBank },
  { name: "Loans", href: "/dashboard/loans", icon: BadgeDollarSign },
  { name: "Advances", href: "/dashboard/advances", icon: Coins },
  { name: "Settlement", href: "/dashboard/settlement", icon: Handshake },
  { name: "Staff Management", href: "/dashboard/staff-management", icon: UserCog },
  { name: "Lead Management", href: "/dashboard/leads", icon: Target },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true;
    if (path !== '/dashboard' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 transition-all duration-300">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
            S
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">Shohoj Ledger</span>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Search..." 
            className="w-full bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-500 pl-9 h-9 rounded-md focus-visible:ring-1 focus-visible:ring-blue-500"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1 custom-scrollbar">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                active 
                  ? "bg-blue-600/10 text-blue-400" 
                  : "hover:bg-slate-800/50 hover:text-slate-100"
              )}
            >
              <item.icon className={cn("h-4 w-4", active ? "text-blue-400" : "text-slate-400")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        <Link
          href="/dashboard/attendance/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
            isActive('/dashboard/attendance/settings') ? "bg-blue-600/10 text-blue-400" : "hover:bg-slate-800/50 hover:text-slate-100"
          )}
        >
          <Settings className="h-4 w-4 text-slate-400" />
          Settings
        </Link>
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors hover:bg-slate-800/50 text-slate-400 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
      
      {/* User Profile Summary */}
      <div className="p-4 border-t border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-medium">
          A
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-200">Admin User</span>
          <span className="text-xs text-slate-500">admin@shohoj.com</span>
        </div>
      </div>
    </aside>
  );
}
