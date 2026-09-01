"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowDownLeft, 
  Calendar, 
  Eye, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from 'lucide-react';

interface IncomeCardProps {
  income: any;
  onDelete?: (id: string) => void;
  onQuickView?: (income: any) => void;
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #10b981, #047857)',
  'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  'linear-gradient(135deg, #f59e0b, #b45309)',
  'linear-gradient(135deg, #ec4899, #be185d)',
  'linear-gradient(135deg, #06b6d4, #0e7490)',
  'linear-gradient(135deg, #6366f1, #4338ca)',
];

export function IncomeCard({ income, onDelete, onQuickView }: IncomeCardProps) {
  const router = useRouter();

  const getAvatarInfo = (name: string, id: string) => {
    const safeName = name || 'Income';
    const initials = safeName
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    
    let hash = 0;
    for (let i = 0; i < (id || '').length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    const gradient = AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
    return { initials, gradient };
  };

  const { initials, gradient } = getAvatarInfo(income.source || income.category, income.id);
  const totalAmount = Number(income.amount || 0);
  const receivedAmount = Number(income.received || 0);
  const dueAmount = Math.max(0, totalAmount - receivedAmount);
  const percentCollected = totalAmount > 0 ? Math.min(100, Math.round((receivedAmount / totalAmount) * 100)) : 0;
  const status = (income.paymentStatus || (receivedAmount >= totalAmount ? 'PAID' : receivedAmount > 0 ? 'PARTIAL' : 'UNPAID')).toUpperCase();

  return (
    <div 
      className="glass-card" 
      onClick={() => router.push(`/erp/finance/income/${income.id}`)}
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
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
    >
      {/* Top Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: gradient,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.95rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              flexShrink: 0
            }}>
              {initials}
            </div>

            <div>
              <Link 
                href={`/erp/finance/income/${income.id}`} 
                onClick={(e) => e.stopPropagation()}
                style={{ 
                  fontSize: '1rem', 
                  fontWeight: 700, 
                  color: 'var(--text-main)', 
                  display: 'block',
                  lineHeight: 1.2
                }}
              >
                {income.source || 'General Revenue'}
              </Link>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <span style={{
                  fontSize: '0.725rem',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  background: 'var(--primary-glow)',
                  padding: '1px 6px',
                  borderRadius: '4px'
                }}>
                  #INC-{income.id.slice(0, 8).toUpperCase()}
                </span>
                <span style={{
                  fontSize: '0.725rem',
                  color: 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}>
                  {income.category}
                </span>
              </div>
            </div>
          </div>

          <span style={{
            padding: '3px 8px', 
            borderRadius: '9999px', 
            fontSize: '0.7rem', 
            fontWeight: 700, 
            textTransform: 'uppercase',
            background: status === 'PAID' ? 'rgba(16, 185, 129, 0.12)' : status === 'PARTIAL' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            color: status === 'PAID' ? '#10b981' : status === 'PARTIAL' ? '#f59e0b' : '#ef4444',
            border: `1px solid ${status === 'PAID' ? 'rgba(16, 185, 129, 0.25)' : status === 'PARTIAL' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
          }}>
            {status}
          </span>
        </div>

        {/* Date & Description */}
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
            <Calendar size={13} />
            <span>{new Date(income.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
          {income.description && (
            <p style={{ margin: '2px 0 0', color: 'var(--text-main)', fontSize: '0.825rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {income.description}
            </p>
          )}
        </div>
      </div>

      {/* Financial Health Box */}
      <div style={{ 
        background: 'var(--surface-hover)', 
        padding: '12px', 
        borderRadius: '10px', 
        border: '1px solid var(--border-main)' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Amount Received
          </span>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--success, #10b981)' }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(receivedAmount)}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
          <span>Total: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(totalAmount)}</span>
          {dueAmount > 0 ? (
            <span style={{ color: 'var(--warning, #f59e0b)', fontWeight: 600 }}>Due: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(dueAmount)}</span>
          ) : (
            <span style={{ color: 'var(--success, #10b981)', fontWeight: 600 }}>100% Settled</span>
          )}
        </div>

        <div style={{ width: '100%', height: '4px', background: 'var(--border-main)', borderRadius: '9999px', overflow: 'hidden' }}>
          <div style={{
            width: `${percentCollected}%`,
            height: '100%',
            background: percentCollected === 100 ? 'var(--success)' : percentCollected > 0 ? 'var(--warning)' : 'var(--danger)',
            borderRadius: '9999px'
          }} />
        </div>
      </div>

      {/* Action Footer */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingTop: '12px', 
        borderTop: '1px solid var(--border-main)' 
      }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {income.systemSource || 'ERP'}
        </div>

        <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
          {onQuickView && (
            <button
              onClick={() => onQuickView(income)}
              style={{ padding: '6px', color: 'var(--text-muted)', borderRadius: '6px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', cursor: 'pointer' }}
              title="Quick Voucher Preview"
            >
              <Eye size={15} />
            </button>
          )}
          <button 
            onClick={() => router.push(`/erp/finance/income/${income.id}/edit`)}
            style={{ padding: '6px', color: 'var(--primary)', borderRadius: '6px', background: 'var(--primary-glow)', border: 'none', cursor: 'pointer' }}
            title="Edit Income"
          >
            <Edit3 size={15} />
          </button>
          <button 
            onClick={() => { if (onDelete) onDelete(income.id); }}
            style={{ padding: '6px', color: 'var(--danger)', borderRadius: '6px', background: 'var(--danger-glow)', border: 'none', cursor: 'pointer' }}
            title="Delete Income"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
