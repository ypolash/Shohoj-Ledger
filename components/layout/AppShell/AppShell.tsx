"use client";

import React from 'react';
import { useUI } from '@/lib/contexts/UIContext';
import styles from './AppShell.module.css';
import { Sidebar } from '../Sidebar/Sidebar';
import { Topbar } from '../Topbar/Topbar';

interface AppShellProps {
  children: React.ReactNode;
  businessType?: string;
  companyName?: string;
  logoUrl?: string | null;
}

export function AppShell({ children, businessType = 'Product + Service', companyName = 'Shohoj Ledger', logoUrl = null }: AppShellProps) {
  const { sidebarOpen, isMobile, setSidebarOpen } = useUI();

  return (
    <div className={styles.appShell}>
      {/* Sidebar Overlay for Mobile */}
      {isMobile && sidebarOpen && (
        <div 
          className={styles.overlay} 
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <Sidebar businessType={businessType} companyName={companyName} logoUrl={logoUrl} />

      {/* Main Content Area */}
      <div 
        className={`${styles.mainWrapper} ${!sidebarOpen && !isMobile ? styles.mainWrapperExpanded : ''}`}
      >
        <Topbar />
        
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>

      {/* Global Roots for Modals, Toasts, etc. */}
      <div id="toast-root" />
      <div id="modal-root" />
      <div id="drawer-root" />
    </div>
  );
}
