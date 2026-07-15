"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './tabs.module.css';

export default function StaffManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { name: 'Dashboard', path: '/dashboard/staff-management', icon: 'dashboard' },
    { name: 'Employees', path: '/dashboard/staff-management/employees', icon: 'badge' },
    { name: 'Attendance', path: '/dashboard/staff-management/attendance', icon: 'how_to_reg' },
    { name: 'Leave', path: '/dashboard/staff-management/leave', icon: 'event_busy' },
    { name: 'Payroll', path: '/dashboard/staff-management/payroll', icon: 'payments' },
    { name: 'Bonuses', path: '/dashboard/staff-management/bonuses', icon: 'redeem' },
    { name: 'Reports', path: '/dashboard/staff-management/reports', icon: 'analytics' },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div className="glass-card topo-bg" style={{ padding: '8px', borderRadius: '16px' }}>
        <nav className={styles.tabContainer}>
          {tabs.map((tab) => {
            const isActive = pathname === tab.path;
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
