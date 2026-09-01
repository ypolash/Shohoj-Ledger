"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  X, 
  ExternalLink, 
  Edit, 
  Copy, 
  Check, 
  Receipt, 
  Wallet, 
  Calendar, 
  ArrowDownLeft, 
  Building, 
  FileText, 
  Printer, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from 'lucide-react';

interface IncomeQuickDrawerProps {
  income: any | null;
  onClose: () => void;
}

export function IncomeQuickDrawer({ income, onClose }: IncomeQuickDrawerProps) {
  const router = useRouter();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!income) return null;

  const copyToClipboard = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const totalAmount = Number(income.amount || 0);
  const receivedAmount = Number(income.received || 0);
  const dueAmount = Math.max(0, totalAmount - receivedAmount);
  const percentCollected = totalAmount > 0 ? Math.min(100, Math.round((receivedAmount / totalAmount) * 100)) : 0;
  const status = (income.paymentStatus || (receivedAmount >= totalAmount ? 'PAID' : receivedAmount > 0 ? 'PARTIAL' : 'UNPAID')).toUpperCase();

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Income Voucher Preview
            </span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '9999px',
              background: status === 'PAID' ? 'rgba(16, 185, 129, 0.15)' : status === 'PARTIAL' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: status === 'PAID' ? '#10b981' : status === 'PARTIAL' ? '#f59e0b' : '#ef4444'
            }}>
              {status}
            </span>
          </div>

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

        {/* Voucher Title Banner */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-main)' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #047857)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              flexShrink: 0
            }}>
              <ArrowDownLeft size={26} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '0.9rem',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  background: 'var(--primary-glow)',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  #INC-{income.id.slice(0, 8).toUpperCase()}
                </span>
                <button
                  onClick={() => copyToClipboard(`INC-${income.id.slice(0, 8).toUpperCase()}`, 'ref')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                  title="Copy Reference"
                >
                  {copiedField === 'ref' ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                </button>
              </div>

              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: '8px 0 0', lineHeight: 1.2 }}>
                {income.source || 'Direct Revenue'}
              </h2>

              <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border-main)',
                  color: 'var(--text-main)'
                }}>
                  {income.category || 'Revenue'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} />
                  {new Date(income.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '20px' }}>
            <Link
              href={`/erp/finance/income/${income.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                background: 'var(--primary)',
                color: 'white',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.85rem',
                textDecoration: 'none',
                boxShadow: '0 2px 8px var(--primary-glow)'
              }}
            >
              <ExternalLink size={16} />
              Full Details
            </Link>

            <Link
              href={`/erp/finance/income/${income.id}/edit`}
              style={{
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
                textDecoration: 'none'
              }}
            >
              <Edit size={16} />
              Edit Voucher
            </Link>
          </div>
        </div>

        {/* Financial Breakdown Card */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
          
          <div style={{
            background: 'var(--surface-hover)',
            border: '1px solid var(--border-main)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wallet size={15} color="var(--primary)" />
              Financial Breakdown
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Amount Billed</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(totalAmount)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Amount Received</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success, #10b981)', marginTop: '2px' }}>
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(receivedAmount)}
                </div>
              </div>
            </div>

            {dueAmount > 0 ? (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '8px',
                marginBottom: '12px'
              }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f59e0b' }}>Balance Due / Receivable:</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f59e0b' }}>
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(dueAmount)}
                </span>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '8px',
                marginBottom: '12px',
                color: '#10b981',
                fontSize: '0.8rem',
                fontWeight: 600
              }}>
                <CheckCircle2 size={16} />
                <span>Fully Collected & Settled</span>
              </div>
            )}

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>Collection Progress</span>
                <span>{percentCollected}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--border-main)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{
                  width: `${percentCollected}%`,
                  height: '100%',
                  background: percentCollected === 100 ? 'var(--success)' : percentCollected > 0 ? 'var(--warning)' : 'var(--danger)',
                  borderRadius: '9999px'
                }} />
              </div>
            </div>
          </div>

          {/* Description / Memo */}
          {income.description && (
            <div style={{
              background: 'var(--surface-hover)',
              border: '1px solid var(--border-main)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={15} color="var(--primary)" />
                Description / Memo
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {income.description}
              </p>
            </div>
          )}

          {/* Additional Metadata */}
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
              <span>Transaction ID:</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--text-main)' }}>{income.id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>System Source:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{income.systemSource || 'ERP'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Created Timestamp:</span>
              <span style={{ color: 'var(--text-main)' }}>{new Date(income.createdAt).toLocaleString()}</span>
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
            <span>Print Receipt</span>
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
