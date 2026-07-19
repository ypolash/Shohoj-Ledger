"use client";

import { usePathname } from "next/navigation";
import { Bell, Calendar as CalendarIcon, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TopBar() {
  const pathname = usePathname();
  
  // Basic breadcrumb generation based on pathname
  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard Overview";
    const parts = pathname.split("/").filter(Boolean);
    const lastPart = parts[parts.length - 1];
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1).replace("-", " ");
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5 text-slate-600" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-slate-800">{getPageTitle()}</h1>
          <div className="text-xs text-slate-500 font-medium mt-0.5">
            Shohoj Ledger <span className="mx-1">•</span> {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center bg-slate-100 rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-200">
          <CalendarIcon className="h-4 w-4 mr-2 text-slate-400" />
          <span>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
        </div>
        
        <Button variant="outline" size="icon" className="relative text-slate-500 hover:text-slate-700 bg-white border-slate-200">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </Button>
        
        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 ml-2">
          New Entry
        </Button>
      </div>
    </header>
  );
}
