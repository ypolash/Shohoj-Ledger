"use client";

import React from 'react';
import { 
  PieChart, 
  Calendar, 
  Eye, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign 
} from 'lucide-react';

interface SettlementCardProps {
  settlement: any;
  onDelete?: (id: string) => void;
  onQuickView?: (settlement: any) => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function SettlementCard({ settlement, onDelete, onQuickView }: SettlementCardProps) {
  const periodName = `${MONTH_NAMES[(settlement.month || 1) - 1]} ${settlement.year}`;
  const totalRevenue = Number(settlement.totalRevenue || 0);
  const totalExpense = Number(settlement.totalExpense || 0);
  const netProfit = Number(settlement.netProfit || 0);

  return (
    <div 
      className="glass-card" 
      onClick={() => onQuickView && onQuickView(settlement)}
      style={{ 
        padding: '20px', 
        borderRadius: '14px', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between', 
        gap: '16px', 
        cursor: 'pointer',
        background: 'var(--surface-main)',
        border: '1px solid var(--border-main)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Top Header */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.2)',
              flexShrink: 0
            }}>
              <PieChart size={20} />
            </div>

            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>
                {periodName}
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                Settled {new Date(settlement.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          <span style={{
            padding: '3px 8px', 
            borderRadius: '9999px', 
            fontSize: '0.7rem', 
            fontWeight: 700, 
            textTransform: 'uppercase',
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#10b981',
            border: '1px solid rgba(16, 185, 129, 0.25)'
          }}>
            Settled
          </span>
        </div>
      </div>

      {/* P&L Breakdown Box */}
      <div style={{ 
        background: 'var(--surface-hover)', 
        padding: '12px', 
        borderRadius: '10px', 
        border: '1px solid var(--border-main)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Revenue:</span>
          <span style={{ fontWeight: 600, color: '#10b981' }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(totalRevenue)}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Expenses:</span>
          <span style={{ fontWeight: 600, color: '#ef4444' }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(totalExpense)}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '6px', borderTop: '1px solid var(--border-main)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>Net Profit:</span>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: netProfit >= 0 ? '#10b981' : '#ef4444' }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(netProfit)}
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        alignItems: 'center', 
        paddingTop: '12px', 
        borderTop: '1px solid var(--border-main)' 
      }}>
        <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
          {onQuickView && (
            <button
              onClick={() => onQuickView(settlement)}
              style={{ padding: '6px', color: 'var(--text-muted)', borderRadius: '6px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', cursor: 'pointer' }}
              title="Quick View Settlement"
            >
              <Eye size={15} />
            </button>
          )}
          {onDelete && (
            <button 
              onClick={() => onDelete(settlement.id)}
              style={{ padding: '6px', color: 'var(--danger)', borderRadius: '6px', background: 'var(--danger-glow)', border: 'none', cursor: 'pointer' }}
              title="Delete Settlement"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
