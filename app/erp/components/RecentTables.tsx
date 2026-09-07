"use client";

import React from 'react';
import Link from 'next/link';
import styles from '../dashboard.module.css';

interface RecentTablesProps {
  data: any;
  role: string;
}

const formatCurrency = (val: number | string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(val) || 0);
};

export function RecentTables({ data, role }: RecentTablesProps) {
  if (!data) return null;

  const showFinance = ['Owner', 'CEO', 'Accountant'].includes(role);
  if (!showFinance) return null;

  const transactions = data.recentTransactions || [];

  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h3 className={styles.panelTitle}>
            <span className="material-symbols-outlined" style={{ color: '#60a5fa', fontSize: '20px' }}>
              receipt_long
            </span>
            Recent Financial Transactions
          </h3>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              padding: '2px 8px',
              borderRadius: '10px',
              border: '1px solid rgba(59, 130, 246, 0.25)'
            }}
          >
            {transactions.length} latest
          </span>
        </div>

        <Link href="/erp/income" className={styles.panelLink}>
          <span>View Complete Ledger</span>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
            arrow_forward
          </span>
        </Link>
      </div>

      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--border-main)',
                color: 'var(--text-muted)',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Description & Type</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Date</th>
              <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>Amount</th>
              <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '13px' }}>
            {transactions.length > 0 ? (
              transactions.map((tx: any) => {
                const isIncome = tx.type === 'INCOME';
                return (
                  <tr
                    key={tx.id}
                    style={{
                      borderBottom: '1px solid var(--border-main)',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isIncome ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            border: `1px solid ${isIncome ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                          }}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{
                              fontSize: '18px',
                              color: isIncome ? '#10b981' : '#ef4444'
                            }}
                          >
                            {isIncome ? 'south_west' : 'north_east'}
                          </span>
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                            {typeof tx.category === 'object' && tx.category !== null
                              ? tx.category.name
                              : tx.category || 'General Transaction'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {tx.subtitle || (isIncome ? 'Direct Revenue' : 'Operating Expense')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(tx.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td
                      style={{
                        padding: '14px',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: isIncome ? '#34d399' : '#f87171',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td style={{ padding: '14px', textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: '#34d399',
                          border: '1px solid rgba(16, 185, 129, 0.25)'
                        }}
                      >
                        Settled
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4}>
                  <div className={styles.emptyState}>
                    <span className={`material-symbols-outlined ${styles.emptyStateIcon}`}>
                      receipt
                    </span>
                    <span className={styles.emptyStateText}>
                      No financial transactions recorded yet. Use the Quick Command bar to record your first income or expense.
                    </span>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <Link
                        href="/erp/income"
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '6px 12px',
                          background: '#2563eb',
                          color: '#ffffff',
                          borderRadius: '8px'
                        }}
                      >
                        + Record Income
                      </Link>
                      <Link
                        href="/erp/expenses"
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '6px 12px',
                          background: 'rgba(30, 41, 59, 0.8)',
                          color: '#f8fafc',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px'
                        }}
                      >
                        + New Expense
                      </Link>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
