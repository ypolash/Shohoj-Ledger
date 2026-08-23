"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface UIContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  isMobile: boolean;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  pageTitleOverride: string | null;
  setPageTitleOverride: (title: string | null) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

import { usePathname } from 'next/navigation';

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [theme, setThemeState] = useState<Theme>('system');
  const [pageTitleOverride, setPageTitleOverride] = useState<string | null>(null);
  const pathname = usePathname();

  // Reset page title override on route change
  useEffect(() => {
    setPageTitleOverride(null);
  }, [pathname]);

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false); // Collapse on mobile by default
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle Theme
  useEffect(() => {
    const storedTheme = localStorage.getItem('shohoj-theme') as Theme | null;
    if (storedTheme) {
      setThemeState(storedTheme);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('shohoj-theme', newTheme);
  };

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    <UIContext.Provider value={{ sidebarOpen, setSidebarOpen, toggleSidebar, isMobile, theme, setTheme, pageTitleOverride, setPageTitleOverride }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
