"use client";

import React, { useEffect } from 'react';
import { 
  X, 
  Calendar, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Printer, 
  DollarSign, 
  Users, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';

interface SettlementQuickDrawerProps {
  settlement: any | null;
  onClose: () => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function SettlementQuickDrawer({ settlement, onClose }: SettlementQuickDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!settlement) return null;

  const totalRevenue = Number(settlement.totalRevenue || 0);
  const totalExpense = Number(settlement.totalExpense || 0);
  const netProfit = Number(settlement.netProfit || 0);
  const periodName = `${MONTH_NAMES[(settlement.month || 1) - 1]} ${settlement.year}`;

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
          maxWidth: '520px',
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
              Period Settlement Voucher
            </span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '9999px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981'
            }}>
              SETTLED
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

        {/* Title Banner */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-main)' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              flexShrink: 0
            }}>
              <PieChart size={26} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '0.85rem',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  background: 'var(--primary-glow)',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  #SETTLE-{settlement.id.slice(0, 8).toUpperCase()}
                </span>
              </div>

              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', margin: '8px 0 0', lineHeight: 1.2 }}>
                {periodName}
              </h2>

              <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} />
                  Settled on {new Date(settlement.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Details */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
          
          {/* P&L Breakdown Card */}
          <div style={{
            background: 'var(--surface-hover)',
            border: '1px solid var(--border-main)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
              Period P&L Summary
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Recognized Revenue</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(totalRevenue)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Disbursed Expenses</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444', marginTop: '2px' }}>
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(totalExpense)}
                </div>
              </div>
            </div>

            <div style={{
              padding: '12px 14px',
              background: 'var(--surface-main)',
              border: '1px solid var(--border-main)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Net Distributable Profit:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: netProfit >= 0 ? '#10b981' : '#ef4444' }}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(netProfit)}
              </span>
            </div>
          </div>

          {/* Shareholder Distribution Breakdown */}
          <div style={{
            background: 'var(--surface-hover)',
            border: '1px solid var(--border-main)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={15} color="var(--primary)" />
              Shareholder Payout Allocations
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {settlement.ceoAmount !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>Founder / CEO Distribution:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(settlement.ceoAmount || 0))}
                  </span>
                </div>
              )}

              {settlement.devAmount !== undefined && Number(settlement.devAmount) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>Tech / Dev Distribution:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(settlement.devAmount || 0))}
                  </span>
                </div>
              )}

              {settlement.advisorAmount !== undefined && Number(settlement.advisorAmount) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>Advisors / Partners:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(settlement.advisorAmount || 0))}
                  </span>
                </div>
              )}

              {settlement.companyAmount !== undefined && Number(settlement.companyAmount) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', paddingTop: '6px', borderTop: '1px solid var(--border-main)' }}>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>Retained in Company Reserves:</span>
                  <span style={{ fontWeight: 800, color: '#10b981' }}>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(settlement.companyAmount || 0))}
                  </span>
                </div>
              )}
            </div>
          </div>

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
              <span>Settlement ID:</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--text-main)' }}>{settlement.id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Status:</span>
              <span style={{ fontWeight: 600, color: '#10b981' }}>Audit Complete & Settled</span>
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
            <span>Print Report</span>
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
