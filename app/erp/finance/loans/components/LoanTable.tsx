"use client";

import React from 'react';

export interface CorporateLoan {
  id: string;
  bankName?: string | null;
  facilityType?: string | null;
  interestRate?: number | string | null;
  loanType?: string | null;
  amount: number | string;
  remainingAmount: number | string;
  issueDate: string;
  dueDate: string;
  status: string;
  reason?: string | null;
  isOverdue?: boolean;
}

interface LoanTableProps {
  loans: CorporateLoan[];
  loading: boolean;
  onRecordRepayment: (loan: CorporateLoan) => void;
  onToggleStatus: (id: string, newStatus: string) => void;
  onDeleteLoan: (id: string) => void;
  onOpenRecordModal: () => void;
}

export function LoanTable({
  loans,
  loading,
  onRecordRepayment,
  onToggleStatus,
  onDeleteLoan,
  onOpenRecordModal,
}: LoanTableProps) {
  const formatBDT = (amount: number | string) => {
    const val = Number(amount) || 0;
    return `৳ ${val.toLocaleString('en-US')}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '0', background: 'var(--surface-card, #0f172a)', border: '1px solid var(--border-main, rgba(255, 255, 255, 0.08))', boxShadow: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main, #f8fafc)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--primary, #3b82f6)' }}>account_balance</span>
            Active Facilities &amp; Bank Loans
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
            Showing {loans.length} active financial facilities recorded in system
          </p>
        </div>

        <button
          onClick={onOpenRecordModal}
          style={{
            padding: '8px 16px',
            borderRadius: '0',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            border: 'none',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
          New Facility
        </button>
      </div>

      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
          <thead>
            <tr style={{ background: '#10b981', color: '#ffffff', borderBottom: '1px solid #059669', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '14px 16px', fontWeight: 700, color: '#ffffff', borderBottom: '1px solid #059669' }}>Bank / Institution</th>
              <th style={{ padding: '14px 16px', fontWeight: 700, color: '#ffffff', borderBottom: '1px solid #059669' }}>Facility Type</th>
              <th style={{ padding: '14px 16px', fontWeight: 700, color: '#ffffff', borderBottom: '1px solid #059669' }}>Interest Rate</th>
              <th style={{ padding: '14px 16px', fontWeight: 700, color: '#ffffff', textAlign: 'right', borderBottom: '1px solid #059669' }}>Principal Amount</th>
              <th style={{ padding: '14px 16px', fontWeight: 700, color: '#ffffff', textAlign: 'right', borderBottom: '1px solid #059669' }}>Outstanding</th>
              <th style={{ padding: '14px 16px', fontWeight: 700, color: '#ffffff', textAlign: 'center', borderBottom: '1px solid #059669' }}>Repayment Progress</th>
              <th style={{ padding: '14px 16px', fontWeight: 700, color: '#ffffff', textAlign: 'center', borderBottom: '1px solid #059669' }}>Status</th>
              <th style={{ padding: '14px 16px', fontWeight: 700, color: '#ffffff', textAlign: 'right', borderBottom: '1px solid #059669' }}>Actions</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '13px' }}>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>progress_activity</span>
                      Loading facilities...
                    </div>
                  </td>
                </tr>
              ))
            ) : loans.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '26px', color: 'var(--text-muted)' }}>account_balance</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-main, #f8fafc)' }}>No Corporate Loans Found</div>
                    <p style={{ margin: 0, fontSize: '12px', maxWidth: '400px' }}>
                      No active bank facilities or corporate liabilities are currently recorded. Click below to record your first loan facility.
                    </p>
                    <button
                      onClick={onOpenRecordModal}
                      style={{
                        marginTop: '8px',
                        padding: '8px 20px',
                        borderRadius: '8px',
                        background: 'var(--primary, #3b82f6)',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Record Loan Facility
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              loans.map(loan => {
                const principal = Number(loan.amount) || 0;
                const remaining = Number(loan.remainingAmount) || 0;
                const repaid = Math.max(0, principal - remaining);
                const progressPct = principal > 0 ? Math.min(100, Math.round((repaid / principal) * 100)) : 0;
                const isSettled = remaining <= 0 || loan.status === 'REPAID';
                const rate = loan.interestRate !== undefined && loan.interestRate !== null && Number(loan.interestRate) > 0
                  ? `${Number(loan.interestRate)}% p.a.`
                  : 'Interest Free';

                return (
                  <tr
                    key={loan.id}
                    style={{
                      borderBottom: '1px solid var(--border-main, rgba(255,255,255,0.05))',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover, rgba(255,255,255,0.02))')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Bank / Institution */}
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: 'rgba(59, 130, 246, 0.12)',
                          color: '#3b82f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '12px',
                          flexShrink: 0
                        }}>
                          {(loan.bankName || 'BK').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--primary, #60a5fa)', fontSize: '14px' }}>
                            {loan.bankName || 'Corporate Facility'}
                          </div>
                          {loan.reason && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={loan.reason}>
                              {loan.reason}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Facility Type */}
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: 'var(--text-main, #f8fafc)',
                        border: '1px solid var(--border-main, rgba(255, 255, 255, 0.1))'
                      }}>
                        {loan.facilityType || 'Term Loan'}
                      </span>
                    </td>

                    {/* Interest Rate */}
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: Number(loan.interestRate) > 0 ? '#f43f5e' : 'var(--text-muted, #94a3b8)'
                      }}>
                        {rate}
                      </span>
                    </td>

                    {/* Principal Amount */}
                    <td style={{ padding: '16px', fontWeight: 600, textAlign: 'right', color: 'var(--text-muted, #94a3b8)' }}>
                      {formatBDT(principal)}
                    </td>

                    {/* Outstanding */}
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{
                        fontWeight: 700,
                        fontSize: '14px',
                        color: isSettled ? '#10b981' : '#f43f5e'
                      }}>
                        {formatBDT(remaining)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                        Due: {formatDate(loan.dueDate)}
                      </div>
                    </td>

                    {/* Repayment Progress */}
                    <td style={{ padding: '16px', textAlign: 'center', minWidth: '130px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100px', fontSize: '10px', color: 'var(--text-muted)' }}>
                          <span>{progressPct}% Paid</span>
                          <span>{formatBDT(repaid)}</span>
                        </div>
                        <div style={{ width: '100px', height: '6px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                          <div style={{
                            width: `${progressPct}%`,
                            height: '100%',
                            background: isSettled ? '#10b981' : 'linear-gradient(90deg, #3b82f6, #10b981)',
                            borderRadius: '3px',
                            transition: 'width 0.4s ease'
                          }} />
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: isSettled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: isSettled ? '#10b981' : '#f59e0b',
                        border: isSettled ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: isSettled ? '#10b981' : '#f59e0b'
                        }} />
                        {isSettled ? 'Settled' : 'Active'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', alignItems: 'center' }}>
                        {!isSettled && (
                          <button
                            onClick={() => onRecordRepayment(loan)}
                            title="Record Repayment"
                            style={{
                              padding: '5px 12px',
                              borderRadius: '6px',
                              background: 'rgba(59, 130, 246, 0.15)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              color: '#60a5fa',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>payments</span>
                            Repay
                          </button>
                        )}

                        <button
                          onClick={() => onToggleStatus(loan.id, isSettled ? 'ACTIVE' : 'REPAID')}
                          title={isSettled ? "Reactivate Loan" : "Mark as Settled / Closed"}
                          style={{
                            padding: '5px 8px',
                            borderRadius: '6px',
                            background: 'var(--surface-hover, rgba(255, 255, 255, 0.05))',
                            border: '1px solid var(--border-main, rgba(255, 255, 255, 0.1))',
                            color: 'var(--text-secondary, #cbd5e1)',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                            {isSettled ? 'restart_alt' : 'check_circle'}
                          </span>
                        </button>

                        <button
                          onClick={() => onDeleteLoan(loan.id)}
                          title="Delete Facility"
                          style={{
                            padding: '5px 8px',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#ef4444',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
