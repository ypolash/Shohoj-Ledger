"use client";

import React from 'react';
import { useUI } from '@/lib/contexts/UIContext';
import styles from '../AppShell/AppShell.module.css'; // Reusing AppShell styles
import { SuperAdminSidebar } from '../SuperAdminSidebar/SuperAdminSidebar';
import { Topbar } from '../Topbar/Topbar';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
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

      {/* Super Admin Specialized Sidebar */}
      <SuperAdminSidebar />

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
