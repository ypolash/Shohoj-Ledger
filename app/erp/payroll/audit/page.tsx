"use client";

import React, { useState, useEffect } from 'react';

interface AuditEntry {
  id: string; createdAt: string; oldStatus: string | null; newStatus: string; remarks: string;
  role: string;
  user?: { name: string; email: string };
  salaryPayment?: {
    month: number; year: number;
    employee: { firstName: string; lastName: string; employeeId: string };
  };
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'var(--text-muted)', SUBMITTED: 'var(--accent)', APPROVED: 'var(--primary)',
  PAID: 'var(--success)', LOCKED: 'var(--warning)', CANCELLED: 'var(--danger)',
};

/**
 * ERP Payroll — Audit Log Page
 * Shows a chronological feed of all payroll workflow transitions and status changes,
 * fetched from GET /api/payroll (includes full payments list with audit trail data).
 * Since no dedicated audit list endpoint exists, we reconstruct from payments + per-record history.
 * This page shows the summary payroll list with created/status timestamps as a change log.
 */
export default function PayrollAuditPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [audits, setAudits] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => { loadPayments(); }, []);

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/payroll');
      if (res.ok) { const d = await res.json(); setPayments(d.payments || []); }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const loadAuditHistory = async (paymentId: string) => {
    if (selectedPayment === paymentId) { setSelectedPayment(null); setAudits([]); return; }
    setSelectedPayment(paymentId);
    setAuditLoading(true);
    try {
      const res = await fetch(`/api/payroll/${paymentId}/history`);
      if (res.ok) setAudits(await res.json());
    } catch (e) { console.error(e); }
    finally { setAuditLoading(false); }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
      <div>
        <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Payroll Audit Log</h1>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
          Full history of all status transitions. Click any record to expand its audit trail.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {isLoading ? Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass-panel" style={{ borderRadius: '14px', padding: '18px', height: '70px', opacity: 0.6 }} />
        )) : payments.length === 0 ? (
          <div className="glass-panel" style={{ borderRadius: '16px', padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4, display: 'block', marginBottom: '8px' }}>history</span>
            No payroll records yet.
          </div>
        ) : payments.map(p => {
          const isExpanded = selectedPayment === p.id;
          const sc = STATUS_COLOR[p.status] || 'var(--text-muted)';
          return (
            <div key={p.id} className="glass-panel" style={{ borderRadius: '14px', overflow: 'hidden', border: isExpanded ? '1px solid var(--primary)' : '1px solid var(--border-main)' }}>
              {/* Record row */}
              <div onClick={() => loadAuditHistory(p.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', cursor: 'pointer', background: isExpanded ? 'var(--primary-subtle)' : '' }}
                onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'var(--surface-hover)'; }}
                onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = ''; }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)' }}>
                    {p.employee?.firstName?.[0]}{p.employee?.lastName?.[0]}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>
                    {p.employee?.firstName} {p.employee?.lastName}
                    <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--primary)', fontFamily: 'monospace' }}>{p.employee?.employeeId}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {MONTHS[p.month - 1]} {p.year} · Net: ৳{Number(p.netSalary).toLocaleString()}
                  </div>
                </div>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, color: sc, background: `${sc}20` }}>{p.status}</span>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(p.createdAt).toLocaleDateString()}</div>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--text-muted)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>expand_more</span>
              </div>

              {/* Audit trail expansion */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid var(--border-main)', background: 'var(--surface-bg)', padding: '16px 20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px' }}>AUDIT TRAIL</div>
                  {auditLoading ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading history…</div>
                  ) : audits.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>No audit entries found.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {audits.map((a, idx) => (
                        <div key={a.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: STATUS_COLOR[a.newStatus] || 'var(--primary)', border: '2px solid var(--border-main)', flexShrink: 0, marginTop: '4px' }} />
                            {idx < audits.length - 1 && <div style={{ width: '2px', flex: 1, background: 'var(--border-main)', minHeight: '20px' }} />}
                          </div>
                          <div style={{ flex: 1, paddingBottom: '8px' }}>
                            <div style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 500 }}>
                              {a.oldStatus ? (
                                <><span style={{ color: STATUS_COLOR[a.oldStatus] || 'var(--text-muted)', fontWeight: 700 }}>{a.oldStatus}</span> → <span style={{ color: STATUS_COLOR[a.newStatus] || 'var(--primary)', fontWeight: 700 }}>{a.newStatus}</span></>
                              ) : <span style={{ color: STATUS_COLOR[a.newStatus] || 'var(--primary)', fontWeight: 700 }}>Created as {a.newStatus}</span>}
                            </div>
                            {a.remarks && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{a.remarks}</div>}
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '10px' }}>
                              {a.user && <span>by {a.user.name || a.user.email}</span>}
                              <span>({a.role})</span>
                              <span>{new Date(a.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
