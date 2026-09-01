"use client";

import React from 'react';
import { 
  DollarSign, 
  UserCheck, 
  Wallet, 
  Users, 
  TrendingUp, 
  Clock 
} from 'lucide-react';

interface AdvanceSummaryProps {
  totalAmount?: number;
  totalCount?: number;
  uniqueMembersCount?: number;
  activeFilter?: string;
  onFilterClick?: (type: 'all') => void;
}

export function AdvanceSummary({
  totalAmount = 0,
  totalCount = 0,
  uniqueMembersCount = 0,
  activeFilter,
  onFilterClick
}: AdvanceSummaryProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }}>
      {/* 1. Total Advances Issued */}
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
          border: '1px solid var(--border-main)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Advances Issued
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
          <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--warning, #f59e0b)', letterSpacing: '-0.02em' }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(totalAmount)}
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--warning, #f59e0b)',
            background: 'rgba(245, 158, 11, 0.12)',
            padding: '2px 8px',
            borderRadius: '9999px'
          }}>
            Active
          </span>
        </div>
      </div>
      
      {/* 2. Staff Count */}
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
            Beneficiary Staff
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
            {uniqueMembersCount}
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#2563eb',
            background: 'rgba(37, 99, 235, 0.12)',
            padding: '2px 8px',
            borderRadius: '9999px'
          }}>
            Employees
          </span>
        </div>
      </div>

      {/* 3. Total Advance Slips */}
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
            Active Slips
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
            {totalCount}
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#10b981',
            background: 'rgba(16, 185, 129, 0.12)',
            padding: '2px 8px',
            borderRadius: '9999px'
          }}>
            Vouchers
          </span>
        </div>
      </div>

      {/* 4. Average Ticket */}
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
            Avg. Advance Amount
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
            <TrendingUp size={20} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {totalCount > 0 ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(totalAmount / totalCount) : '৳0'}
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#8b5cf6',
            background: 'rgba(139, 92, 246, 0.12)',
            padding: '2px 8px',
            borderRadius: '9999px'
          }}>
            Average
          </span>
        </div>
      </div>
    </div>
  );
}
