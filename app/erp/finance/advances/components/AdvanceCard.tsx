"use client";

import React from 'react';
import { 
  User, 
  Calendar, 
  Eye, 
  Edit3, 
  Trash2, 
  DollarSign 
} from 'lucide-react';

interface AdvanceCardProps {
  advance: any;
  onEdit?: (advance: any) => void;
  onDelete?: (id: string) => void;
  onQuickView?: (advance: any) => void;
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  'linear-gradient(135deg, #10b981, #047857)',
  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  'linear-gradient(135deg, #ec4899, #be185d)',
];

export function AdvanceCard({ advance, onEdit, onDelete, onQuickView }: AdvanceCardProps) {
  const getAvatarInfo = (name: string, id: string) => {
    const safeName = name || 'Staff Member';
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

  const employeeName = advance.member?.name || 'Staff Member';
  const { initials, gradient } = getAvatarInfo(employeeName, advance.id);
  const amount = Number(advance.amount || 0);

  return (
    <div 
      className="glass-card" 
      onClick={() => onQuickView && onQuickView(advance)}
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
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
                {employeeName}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <span style={{
                  fontSize: '0.725rem',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: 'var(--warning, #f59e0b)',
                  background: 'rgba(245, 158, 11, 0.1)',
                  padding: '1px 6px',
                  borderRadius: '4px'
                }}>
                  #ADV-{advance.id.slice(0, 8).toUpperCase()}
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
            background: 'rgba(245, 158, 11, 0.12)',
            color: '#f59e0b',
            border: '1px solid rgba(245, 158, 11, 0.25)'
          }}>
            Active
          </span>
        </div>

        {/* Date & Reason */}
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
            <Calendar size={13} />
            <span>{new Date(advance.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
          {advance.reason && (
            <p style={{ margin: '2px 0 0', color: 'var(--text-main)', fontSize: '0.825rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {advance.reason}
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
            Advance Issued
          </span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--warning, #f59e0b)' }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(amount)}
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
              onClick={() => onQuickView(advance)}
              style={{ padding: '6px', color: 'var(--text-muted)', borderRadius: '6px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', cursor: 'pointer' }}
              title="Quick Voucher Preview"
            >
              <Eye size={15} />
            </button>
          )}
          {onEdit && (
            <button 
              onClick={() => onEdit(advance)}
              style={{ padding: '6px', color: 'var(--primary)', borderRadius: '6px', background: 'var(--primary-glow)', border: 'none', cursor: 'pointer' }}
              title="Edit Advance"
            >
              <Edit3 size={15} />
            </button>
          )}
          {onDelete && (
            <button 
              onClick={() => onDelete(advance.id)}
              style={{ padding: '6px', color: 'var(--danger)', borderRadius: '6px', background: 'var(--danger-glow)', border: 'none', cursor: 'pointer' }}
              title="Delete Advance"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
