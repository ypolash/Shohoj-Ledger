"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./income/page.module.css";

type OverviewData = {
  reserveBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  outstandingLoans: number;
  activeAdvances: number;
};

export default function DashboardIndex() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await fetch("/api/overview");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val));
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <h1>Financial Overview</h1>
        <Link href="/dashboard/settlement" className="btn btn-primary">
          Run Settlement
        </Link>
      </div>

      {loading || !data ? (
        <p>Loading metrics...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-6)' }}>
          
          {/* Main Reserve Card */}
          <div className="glass-card" style={{ borderLeft: '4px solid var(--primary)', gridColumn: '1 / -1' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Company Reserve Balance
            </h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text)' }}>
              {formatCurrency(data.reserveBalance)}
            </div>
            <p style={{ marginTop: '8px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Available funds retained for business continuity.
            </p>
          </div>

          {/* Cash Flow Widget */}
          <div className="glass-card" style={{ borderLeft: '4px solid var(--success)' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Net Cash Flow
            </h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>
              {formatCurrency(data.netCashFlow)}
            </div>
            <div style={{ marginTop: '12px', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Income: {formatCurrency(data.totalIncome)}</span>
              <span style={{ color: 'var(--danger)' }}>Exp: {formatCurrency(data.totalExpenses)}</span>
            </div>
          </div>

          {/* Loans Widget */}
          <div className="glass-card" style={{ borderLeft: '4px solid var(--warning)' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Outstanding Loans
            </h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--warning)' }}>
              {formatCurrency(data.outstandingLoans)}
            </div>
            <Link href="/dashboard/loans" style={{ display: 'inline-block', marginTop: '12px', fontSize: '0.875rem', color: 'var(--primary)', textDecoration: 'none' }}>
              View Loan Book &rarr;
            </Link>
          </div>

          {/* Advances Widget */}
          <div className="glass-card" style={{ borderLeft: '4px solid var(--accent)' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Active Advances
            </h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)' }}>
              {formatCurrency(data.activeAdvances)}
            </div>
            <p style={{ marginTop: '12px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              To be deducted during next settlement.
            </p>
          </div>

        </div>
      )}
    </div>
  );
}
