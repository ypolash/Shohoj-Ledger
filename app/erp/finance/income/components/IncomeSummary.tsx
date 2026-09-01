"use client";

import React from 'react';
import { 
  DollarSign, 
  ArrowDownLeft, 
  Wallet, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpRight,
  Receipt,
  Building,
  Calendar
} from 'lucide-react';

interface IncomeSummaryKPIProps {
  totalRevenue?: number;
  totalReceived?: number;
  totalDue?: number;
  transactionCount?: number;
  activeFilter?: string;
  onFilterClick?: (type: 'all' | 'paid' | 'due') => void;
  income?: any; // For individual voucher view
}

export function IncomeSummary({ 
  totalRevenue, 
  totalReceived, 
  totalDue, 
  transactionCount,
  activeFilter,
  onFilterClick,
  income 
}: IncomeSummaryKPIProps) {

  // If a single income voucher object is passed (Detail Page view)
  if (income) {
    const total = Number(income.amount || 0);
    const received = Number(income.received || 0);
    const due = Math.max(0, total - received);
    const status = (income.paymentStatus || (received >= total ? 'PAID' : received > 0 ? 'PARTIAL' : 'UNPAID')).toUpperCase();

    return (
      <div className="glass-card" style={{ 
        padding: '28px', 
        borderRadius: '16px',
        background: 'var(--surface-main)',
        border: '1px solid var(--border-main)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontFamily: 'monospace',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--primary)',
                background: 'var(--primary-glow)',
                padding: '2px 10px',
                borderRadius: '6px'
              }}>
                #INC-{income.id.slice(0, 8).toUpperCase()}
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '9999px',
                background: status === 'PAID' ? 'rgba(16, 185, 129, 0.15)' : status === 'PARTIAL' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: status === 'PAID' ? '#10b981' : status === 'PARTIAL' ? '#f59e0b' : '#ef4444'
              }}>
                {status}
              </span>
            </div>
            <h1 style={{ margin: '10px 0 4px', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {income.source || 'General Revenue'}
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {income.description || `Income recorded under ${income.category}`}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Amount Received</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success, #10b981)', letterSpacing: '-0.02em' }}>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(received)}
            </div>
          </div>
        </div>

        {/* 4-Stat Metric Bar */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '16px', 
          padding: '20px', 
          background: 'var(--surface-hover)', 
          borderRadius: '12px',
          border: '1px solid var(--border-main)'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Date Recorded</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '4px', color: 'var(--text-main)' }}>
              {new Date(income.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Billed</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '4px', color: 'var(--primary)' }}>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(total)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Balance Due</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '4px', color: due > 0 ? 'var(--warning, #f59e0b)' : 'var(--success, #10b981)' }}>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(due)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Category</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '4px', color: 'var(--text-main)' }}>
              {income.category}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, render Executive KPI Summary Cards for List View
  const rev = totalRevenue || 0;
  const rec = totalReceived || 0;
  const due = totalDue || Math.max(0, rev - rec);
  const count = transactionCount || 0;
  const collectionRate = rev > 0 ? Math.min(100, Math.round((rec / rev) * 100)) : 100;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }}>
      {/* 1. Total Recognized Revenue */}
      <div 
        onClick={() => onFilterClick && onFilterClick('all')}
        className="glass-card" 
        style={{ 
          padding: '20px', 
          borderRadius: '14px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          background: 'var(--surface-main)',
          border: activeFilter === 'all' ? '2px solid var(--primary)' : '1px solid var(--border-main)',
          cursor: onFilterClick ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Invoiced
          </span>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(37, 99, 235, 0.12)',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.15)'
          }}>
            <Receipt size={20} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(rev)}
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--primary)',
            background: 'var(--primary-glow)',
            padding: '2px 8px',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
          }}>
            <span>{count} records</span>
          </span>
        </div>
      </div>
      
      {/* 2. Total Received Cash */}
      <div 
        onClick={() => onFilterClick && onFilterClick('paid')}
        className="glass-card" 
        style={{ 
          padding: '20px', 
          borderRadius: '14px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          background: 'var(--surface-main)',
          border: activeFilter === 'paid' ? '2px solid var(--success)' : '1px solid var(--border-main)',
          cursor: onFilterClick ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Cash Collected
          </span>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.15)'
          }}>
            <ArrowDownLeft size={20} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#10b981', letterSpacing: '-0.02em' }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(rec)}
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#10b981',
            background: 'rgba(16, 185, 129, 0.12)',
            padding: '2px 8px',
            borderRadius: '9999px'
          }}>
            {collectionRate}% collected
          </span>
        </div>
      </div>

      {/* 3. Pending Receivables / Due */}
      <div 
        onClick={() => onFilterClick && onFilterClick('due')}
        className="glass-card" 
        style={{ 
          padding: '20px', 
          borderRadius: '14px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          background: 'var(--surface-main)',
          border: activeFilter === 'due' ? '2px solid var(--warning)' : '1px solid var(--border-main)',
          cursor: onFilterClick ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Receivables (Due)
          </span>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.12)',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(245, 158, 11, 0.15)'
          }}>
            <Clock size={20} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f59e0b', letterSpacing: '-0.02em' }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(due)}
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#f59e0b',
            background: 'rgba(245, 158, 11, 0.12)',
            padding: '2px 8px',
            borderRadius: '9999px'
          }}>
            Outstanding
          </span>
        </div>
      </div>

      {/* 4. Average Ticket Size */}
      <div 
        className="glass-card" 
        style={{ 
          padding: '20px', 
          borderRadius: '14px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          background: 'var(--surface-main)',
          border: '1px solid var(--border-main)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Avg. Transaction
          </span>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(99, 102, 241, 0.12)',
            color: '#6366f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(99, 102, 241, 0.15)'
          }}>
            <TrendingUp size={20} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em' }}>
            {count > 0 ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(rev / count) : '৳0'}
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--primary)',
            background: 'var(--primary-glow)',
            padding: '2px 8px',
            borderRadius: '9999px'
          }}>
            Yield
          </span>
        </div>
      </div>
    </div>
  );
}
