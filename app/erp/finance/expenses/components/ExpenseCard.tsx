"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowUpRight, 
  Calendar, 
  Eye, 
  Edit3, 
  Trash2, 
  Building2, 
  Banknote, 
  CreditCard, 
  Smartphone 
} from 'lucide-react';

interface ExpenseCardProps {
  expense: any;
  onDelete?: (id: string) => void;
  onQuickView?: (expense: any) => void;
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #ef4444, #b91c1c)',
  'linear-gradient(135deg, #f97316, #c2410c)',
  'linear-gradient(135deg, #ec4899, #be185d)',
  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  'linear-gradient(135deg, #6366f1, #4338ca)',
  'linear-gradient(135deg, #0ea5e9, #0369a1)',
];

export function ExpenseCard({ expense, onDelete, onQuickView }: ExpenseCardProps) {
  const router = useRouter();

  const getAvatarInfo = (name: string, id: string) => {
    const safeName = name || 'Expense';
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

  const { initials, gradient } = getAvatarInfo(expense.category, expense.id);
  const amount = Number(expense.amount || 0);
  const status = (expense.approvalStatus || 'APPROVED').toUpperCase();

  return (
    <div 
      className="glass-card" 
      onClick={() => router.push(`/erp/finance/expenses/${expense.id}`)}
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
                href={`/erp/finance/expenses/${expense.id}`} 
                onClick={(e) => e.stopPropagation()}
                style={{ 
                  fontSize: '1rem', 
                  fontWeight: 700, 
                  color: 'var(--text-main)', 
                  display: 'block',
                  lineHeight: 1.2
                }}
              >
                {expense.category || 'General Expense'}
              </Link>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <span style={{
                  fontSize: '0.725rem',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: 'var(--danger, #ef4444)',
                  background: 'var(--danger-glow, rgba(239, 68, 68, 0.1))',
                  padding: '1px 6px',
                  borderRadius: '4px'
                }}>
                  #EXP-{expense.id.slice(0, 8).toUpperCase()}
                </span>
                <span style={{
                  fontSize: '0.725rem',
                  color: 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}>
                  {expense.paymentMethod || 'Bank Transfer'}
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
            background: status === 'APPROVED' ? 'rgba(16, 185, 129, 0.12)' : status === 'PENDING' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            color: status === 'APPROVED' ? '#10b981' : status === 'PENDING' ? '#f59e0b' : '#ef4444',
            border: `1px solid ${status === 'APPROVED' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`
          }}>
            {status}
          </span>
        </div>

        {/* Date & Description */}
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
            <Calendar size={13} />
            <span>{new Date(expense.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
          {expense.description && (
            <p style={{ margin: '2px 0 0', color: 'var(--text-main)', fontSize: '0.825rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {expense.description}
            </p>
          )}
        </div>
      </div>

      {/* Financial Box */}
      <div style={{ 
        background: 'var(--surface-hover)', 
        padding: '12px', 
        borderRadius: '10px', 
        border: '1px solid var(--border-main)' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Amount Paid
          </span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--danger, #ef4444)' }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(amount)}
          </span>
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
          {expense.systemSource || 'ERP'}
        </div>

        <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
          {onQuickView && (
            <button
              onClick={() => onQuickView(expense)}
              style={{ padding: '6px', color: 'var(--text-muted)', borderRadius: '6px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', cursor: 'pointer' }}
              title="Quick Voucher Preview"
            >
              <Eye size={15} />
            </button>
          )}
          <button 
            onClick={() => router.push(`/erp/finance/expenses/${expense.id}/edit`)}
            style={{ padding: '6px', color: 'var(--primary)', borderRadius: '6px', background: 'var(--primary-glow)', border: 'none', cursor: 'pointer' }}
            title="Edit Expense"
          >
            <Edit3 size={15} />
          </button>
          <button 
            onClick={() => { if (onDelete) onDelete(expense.id); }}
            style={{ padding: '6px', color: 'var(--danger)', borderRadius: '6px', background: 'var(--danger-glow)', border: 'none', cursor: 'pointer' }}
            title="Delete Expense"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
