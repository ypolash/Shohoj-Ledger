"use client";

import React from 'react';
import { Users, UserCheck, Wallet, TrendingUp, ArrowUpRight } from 'lucide-react';

interface CustomerStatisticsProps {
  total: number;
  active: number;
  outstanding: number;
  salesTotal: number;
  activeFilter?: string;
  onFilterClick?: (filterType: 'all' | 'active' | 'outstanding' | 'sales') => void;
}

export function CustomerStatistics({ 
  total, 
  active, 
  outstanding, 
  salesTotal,
  activeFilter,
  onFilterClick 
}: CustomerStatisticsProps) {
  
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }}>
      {/* 1. Total Customers */}
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
            Total Customers
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
            <Users size={20} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {total.toLocaleString()}
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
            <span>Directory</span>
            <ArrowUpRight size={12} />
          </span>
        </div>
      </div>
      
      {/* 2. Active Customers */}
      <div 
        onClick={() => onFilterClick && onFilterClick('active')}
        className="glass-card" 
        style={{ 
          padding: '20px', 
          borderRadius: '14px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          background: 'var(--surface-main)',
          border: activeFilter === 'active' ? '2px solid var(--success)' : '1px solid var(--border-main)',
          cursor: onFilterClick ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active Accounts
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
            <UserCheck size={20} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#10b981', letterSpacing: '-0.02em' }}>
            {active.toLocaleString()}
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#10b981',
            background: 'rgba(16, 185, 129, 0.12)',
            padding: '2px 8px',
            borderRadius: '9999px'
          }}>
            {total > 0 ? `${Math.round((active / total) * 100)}% active` : '100%'}
          </span>
        </div>
      </div>

      {/* 3. Outstanding Receivables */}
      <div 
        onClick={() => onFilterClick && onFilterClick('outstanding')}
        className="glass-card" 
        style={{ 
          padding: '20px', 
          borderRadius: '14px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          background: 'var(--surface-main)',
          border: activeFilter === 'outstanding' ? '2px solid var(--warning)' : '1px solid var(--border-main)',
          cursor: onFilterClick ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Outstanding Balances
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
            <Wallet size={20} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f59e0b', letterSpacing: '-0.02em' }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(outstanding)}
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#f59e0b',
            background: 'rgba(245, 158, 11, 0.12)',
            padding: '2px 8px',
            borderRadius: '9999px'
          }}>
            Receivables
          </span>
        </div>
      </div>

      {/* 4. Total Sales YTD */}
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
            Total Sales (YTD)
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
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(salesTotal)}
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--primary)',
            background: 'var(--primary-glow)',
            padding: '2px 8px',
            borderRadius: '9999px'
          }}>
            Annual YTD
          </span>
        </div>
      </div>
    </div>
  );
}
