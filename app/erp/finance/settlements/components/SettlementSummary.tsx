"use client";

import React from 'react';
import { 
  DollarSign, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Building2 
} from 'lucide-react';

interface SettlementSummaryProps {
  totalRevenue?: number;
  totalExpense?: number;
  totalProfit?: number;
  periodCount?: number;
}

export function SettlementSummary({
  totalRevenue = 0,
  totalExpense = 0,
  totalProfit = 0,
  periodCount = 0
}: SettlementSummaryProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }}>
      {/* 1. Total Net Profit Settled */}
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
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Net Profit Settled
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
            <TrendingUp size={20} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '1.85rem', fontWeight: 800, color: totalProfit >= 0 ? '#10b981' : '#ef4444', letterSpacing: '-0.02em' }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(totalProfit)}
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#10b981',
            background: 'rgba(16, 185, 129, 0.12)',
            padding: '2px 8px',
            borderRadius: '9999px'
          }}>
            Net Gain
          </span>
        </div>
      </div>
      
      {/* 2. Total Audited Revenue */}
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
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Audited Gross Revenue
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
            <DollarSign size={20} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(totalRevenue)}
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#2563eb',
            background: 'rgba(37, 99, 235, 0.12)',
            padding: '2px 8px',
            borderRadius: '9999px'
          }}>
            Inflow
          </span>
        </div>
      </div>

      {/* 3. Total Settled Expenses */}
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
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Audited Total Costs
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
            <TrendingDown size={20} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ef4444', letterSpacing: '-0.02em' }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(totalExpense)}
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#ef4444',
            background: 'rgba(239, 68, 68, 0.12)',
            padding: '2px 8px',
            borderRadius: '9999px'
          }}>
            Outflow
          </span>
        </div>
      </div>

      {/* 4. Settled Periods */}
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
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Settled Periods
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
            <Calendar size={20} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {periodCount}
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#8b5cf6',
            background: 'rgba(139, 92, 246, 0.12)',
            padding: '2px 8px',
            borderRadius: '9999px'
          }}>
            Months
          </span>
        </div>
      </div>
    </div>
  );
}
