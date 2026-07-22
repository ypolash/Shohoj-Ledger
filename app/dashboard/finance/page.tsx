"use client";

import React, { useState, useEffect } from 'react';
import styles from "../../income/page.module.css";
import Link from 'next/link';

export default function FinanceDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/finance/dashboard`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (val: string | number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val || 0));
  };

  return (
    <div className="animate-fade-in container">
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <div>
          <h1 style={{ margin: 0 }}>Financial Overview</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>
            High-level summary of your company's financial health.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/dashboard/finance/ledger" className="btn btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>account_balance</span>
            View Ledger
          </Link>
        </div>
      </div>

      <div className={styles.container}>
        
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--spacing-5)', marginBottom: 'var(--spacing-6)' }}>
          <div className="glass-card" style={{ padding: 'var(--spacing-5)' }}>
            <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>Net Cash Flow</h3>
            <div style={{ fontSize: '24px', fontWeight: 700, color: stats?.netCashFlow >= 0 ? 'var(--success)' : 'var(--danger)', marginTop: '8px' }}>
              {isLoading ? '...' : formatCurrency(stats?.netCashFlow)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Cash In minus Cash Out</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-5)' }}>
            <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>Total Cash In</h3>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--success)', marginTop: '8px' }}>
              {isLoading ? '...' : formatCurrency(stats?.totalDebit)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>All positive ledger entries</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-5)' }}>
            <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>Total Cash Out</h3>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--danger)', marginTop: '8px' }}>
              {isLoading ? '...' : formatCurrency(stats?.totalCredit)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>All negative ledger entries</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-5)' }}>
          {/* Module Breakdown */}
          <div className="glass-card">
            <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4) 0' }}>Expenditure Breakdown</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--background)', borderRadius: '8px' }}>
                <span style={{ fontWeight: 500 }}>General Expenses</span>
                <span>{isLoading ? '...' : formatCurrency(stats?.totalExpense)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--background)', borderRadius: '8px' }}>
                <span style={{ fontWeight: 500 }}>Payroll (Salaries)</span>
                <span>{isLoading ? '...' : formatCurrency(stats?.totalPayroll)}</span>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4) 0' }}>Income Overview</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--background)', borderRadius: '8px' }}>
                <span style={{ fontWeight: 500 }}>Total Income Recorded</span>
                <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>{isLoading ? '...' : formatCurrency(stats?.totalIncome)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
