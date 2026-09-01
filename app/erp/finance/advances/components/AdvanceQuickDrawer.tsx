"use client";

import React, { useEffect, useState } from 'react';
import { 
  X, 
  Edit, 
  Calendar, 
  ArrowUpRight, 
  User, 
  FileText, 
  Printer, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from 'lucide-react';

interface AdvanceQuickDrawerProps {
  advance: any | null;
  onClose: () => void;
  onEdit?: (advance: any) => void;
}

export function AdvanceQuickDrawer({ advance, onClose, onEdit }: AdvanceQuickDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!advance) return null;

  const amount = Number(advance.amount || 0);
  const employeeName = advance.member?.name || 'Staff Member';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(4px)',
        animation: 'backdropFadeIn 0.2s ease'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '480px',
          height: '100%',
          background: 'var(--surface-main)',
          borderLeft: '1px solid var(--border-main)',
          boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'drawerSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-main)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--surface-hover)'
        }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Staff Advance Voucher
          </span>

          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Title Banner */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-main)' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
              flexShrink: 0
            }}>
              <User size={26} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '0.85rem',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: 'var(--warning, #f59e0b)',
                  background: 'rgba(245, 158, 11, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  #ADV-{advance.id.slice(0, 8).toUpperCase()}
                </span>
              </div>

              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: '8px 0 0', lineHeight: 1.2 }}>
                {employeeName}
              </h2>

              <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} />
                  {new Date(advance.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Edit */}
          {onEdit && (
            <div style={{ marginTop: '16px' }}>
              <button
                onClick={() => {
                  onClose();
                  onEdit(advance);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border-main)',
                  color: 'var(--text-main)',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <Edit size={16} />
                Edit Advance Record
              </button>
            </div>
          )}
        </div>

        {/* Financial Details */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
          <div style={{
            background: 'var(--surface-hover)',
            border: '1px solid var(--border-main)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={15} color="var(--warning)" />
              Disbursed Advance Amount
            </div>

            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--warning, #f59e0b)' }}>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(amount)}
            </div>
          </div>

          {/* Reason / Memo */}
          {advance.reason && (
            <div style={{
              background: 'var(--surface-hover)',
              border: '1px solid var(--border-main)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={15} color="var(--primary)" />
                Purpose / Reason
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                {advance.reason}
              </p>
            </div>
          )}

          {/* Metadata */}
          <div style={{
            background: 'var(--surface-hover)',
            border: '1px solid var(--border-main)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            fontSize: '0.825rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Advance ID:</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--text-main)' }}>{advance.id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Staff ID:</span>
              <span style={{ color: 'var(--text-main)' }}>{advance.memberId || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Issued Date:</span>
              <span style={{ color: 'var(--text-main)' }}>{new Date(advance.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-main)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--surface-hover)'
        }}>
          <button
            onClick={handlePrint}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid var(--border-main)',
              background: 'var(--surface-main)',
              color: 'var(--text-main)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Printer size={15} />
            <span>Print Slip</span>
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              border: '1px solid var(--border-main)',
              background: 'var(--surface-main)',
              color: 'var(--text-main)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes drawerSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes backdropFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}} />
    </div>
  );
}
