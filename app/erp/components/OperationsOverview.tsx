"use client";

import React from 'react';
import Link from 'next/link';
import styles from '../dashboard.module.css';

interface OperationsOverviewProps {
  data: any;
  role: string;
}

const formatCurrency = (val: number | string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(val) || 0);
};

export function OperationsOverview({ data, role }: OperationsOverviewProps) {
  if (!data) return null;

  const totalEmp = data.totalEmployees || 0;
  const attToday = data.attendanceToday || 0;
  const attendanceRate = totalEmp > 0 ? Math.round((attToday / totalEmp) * 100) : 0;
  const inventoryVal = data.inventoryValue || 0;
  const activeProj = data.activeProjects || 0;

  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <h3 className={styles.panelTitle}>
          <span className="material-symbols-outlined" style={{ color: '#38bdf8', fontSize: '20px' }}>
            monitoring
          </span>
          Operations & Resource Health
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* 1. Workforce Attendance */}
        <div
          style={{
            padding: '12px 14px',
            background: 'rgba(30, 41, 59, 0.45)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#38bdf8' }}>
                badge
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>Staff Attendance</span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: attendanceRate >= 80 ? '#34d399' : '#fbbf24' }}>
              {attToday}/{totalEmp} ({attendanceRate}%)
            </span>
          </div>

          <div
            style={{
              width: '100%',
              height: '6px',
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '3px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${attendanceRate}%`,
                height: '100%',
                background: attendanceRate >= 80
                  ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                  : 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
                borderRadius: '3px',
                transition: 'width 0.5s ease'
              }}
            />
          </div>
        </div>

        {/* 2. Inventory & Stock Valuation */}
        <div
          style={{
            padding: '12px 14px',
            background: 'rgba(30, 41, 59, 0.45)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#818cf8' }}>
              inventory_2
            </span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>Inventory Valuation</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>FIFO Asset Holding</div>
            </div>
          </div>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#818cf8' }}>
            {formatCurrency(inventoryVal)}
          </span>
        </div>

        {/* 3. Project Execution */}
        <div
          style={{
            padding: '12px 14px',
            background: 'rgba(30, 41, 59, 0.45)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#c084fc' }}>
              account_tree
            </span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>Active Projects</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Ongoing Client Milestones</div>
            </div>
          </div>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#c084fc' }}>
            {activeProj} Projects
          </span>
        </div>
      </div>
    </div>
  );
}
