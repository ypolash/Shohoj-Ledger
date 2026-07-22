"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '../staff-management/tabs.module.css'; // Reusing tabs styles from staff-management

export default function EssLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { name: 'My Profile', path: '/dashboard/ess/profile', icon: 'person' },
    { name: 'My Documents', path: '/dashboard/ess/documents', icon: 'description' },
    { name: 'My Attendance', path: '/dashboard/ess/attendance', icon: 'how_to_reg' },
    { name: 'My Leave', path: '/dashboard/ess/leave', icon: 'event_busy' },
    { name: 'My Payroll', path: '/dashboard/ess/payroll', icon: 'payments' },
    { name: 'My Tasks', path: '/dashboard/ess/tasks', icon: 'task' },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div className="glass-card topo-bg" style={{ padding: '12px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', overflowX: 'auto', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', border: 'none' }}>
        <nav className={styles.tabContainer}>
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.path);
            return (
              <Link 
                key={tab.path} 
                href={tab.path}
                className={`${styles.tab} ${isActive ? styles.active : ''}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{tab.icon}</span>
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
