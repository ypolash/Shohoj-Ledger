"use client";

import React from 'react';
import { 
  DollarSign, 
  ArrowUpRight, 
  Wallet, 
  TrendingDown, 
  CheckCircle2, 
  Receipt, 
  Building2, 
  Calendar,
  Banknote
} from 'lucide-react';

interface ExpenseSummaryKPIProps {
  totalExpense?: number;
  bankTotal?: number;
  cashTotal?: number;
  transactionCount?: number;
  activeFilter?: string;
  onFilterClick?: (type: 'all' | 'bank' | 'cash') => void;
  expense?: any; // For individual voucher view
}

export function ExpenseSummary({ 
  totalExpense, 
  bankTotal, 
  cashTotal, 
  transactionCount,
  activeFilter,
  onFilterClick,
  expense 
}: ExpenseSummaryKPIProps) {

  // If a single expense voucher object is passed (Detail Page view)
  if (expense) {
    const total = Number(expense.amount || 0);
    const status = (expense.approvalStatus || 'APPROVED').toUpperCase();

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
                color: 'var(--danger, #ef4444)',
                background: 'var(--danger-glow, rgba(239,68,68,0.1))',
                padding: '2px 10px',
                borderRadius: '6px'
              }}>
                #EXP-{expense.id.slice(0, 8).toUpperCase()}
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '9999px',
                background: status === 'APPROVED' ? 'rgba(16, 185, 129, 0.15)' : status === 'PENDING' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: status === 'APPROVED' ? '#10b981' : status === 'PENDING' ? '#f59e0b' : '#ef4444'
              }}>
                {status}
              </span>
            </div>
            <h1 style={{ margin: '10px 0 4px', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {expense.category || 'General Expense'}
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {expense.description || `Expense recorded under ${expense.category}`}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Amount Disbursed</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--danger, #ef4444)', letterSpacing: '-0.02em' }}>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(total)}
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
              {new Date(expense.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Payment Method</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '4px', color: 'var(--primary)' }}>
              {expense.paymentMethod || 'Bank Transfer'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>System Source</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '4px', color: 'var(--text-main)' }}>
              {expense.systemSource || 'ERP'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Category</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '4px', color: 'var(--text-main)' }}>
              {expense.category}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, render Executive KPI Summary Cards for List View
  const exp = totalExpense || 0;
  const bank = bankTotal || 0;
  const cash = cashTotal || 0;
  const count = transactionCount || 0;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }}>
      {/* 1. Total Disbursed Expenses */}
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
          border: activeFilter === 'all' ? '2px solid var(--danger)' : '1px solid var(--border-main)',
          cursor: onFilterClick ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Expenses Paid
          </span>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(239, 68, 68, 0.15)'
          }}>
            <ArrowUpRight size={20} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(exp)}
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--danger)',
            background: 'var(--danger-glow, rgba(239,68,68,0.1))',
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
      
      {/* 2. Bank Disbursements */}
      <div 
        onClick={() => onFilterClick && onFilterClick('bank')}
        className="glass-card" 
        style={{ 
          padding: '20px', 
          borderRadius: '14px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          background: 'var(--surface-main)',
          border: activeFilter === 'bank' ? '2px solid var(--primary)' : '1px solid var(--border-main)',
          cursor: onFilterClick ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Bank Transfers
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
            <Building2 size={20} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#2563eb', letterSpacing: '-0.02em' }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(bank)}
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#2563eb',
            background: 'rgba(37, 99, 235, 0.12)',
            padding: '2px 8px',
            borderRadius: '9999px'
          }}>
            Banking Channel
          </span>
        </div>
      </div>

      {/* 3. Cash Disbursements */}
      <div 
        onClick={() => onFilterClick && onFilterClick('cash')}
        className="glass-card" 
        style={{ 
          padding: '20px', 
          borderRadius: '14px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          background: 'var(--surface-main)',
          border: activeFilter === 'cash' ? '2px solid var(--warning)' : '1px solid var(--border-main)',
          cursor: onFilterClick ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Cash On Hand
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
            <Banknote size={20} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f59e0b', letterSpacing: '-0.02em' }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(cash)}
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#f59e0b',
            background: 'rgba(245, 158, 11, 0.12)',
            padding: '2px 8px',
            borderRadius: '9999px'
          }}>
            Petty Cash
          </span>
        </div>
      </div>

      {/* 4. Average Expense Ticket */}
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
            Avg. Expense Ticket
          </span>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(139, 92, 246, 0.12)',
            color: '#8b5cf6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(139, 92, 246, 0.15)'
          }}>
            <TrendingDown size={20} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {count > 0 ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(exp / count) : '৳0'}
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#8b5cf6',
            background: 'rgba(139, 92, 246, 0.12)',
            padding: '2px 8px',
            borderRadius: '9999px'
          }}>
            Burn Rate
          </span>
        </div>
      </div>
    </div>
  );
}
