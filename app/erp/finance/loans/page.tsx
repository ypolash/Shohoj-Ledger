"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LoanTable, CorporateLoan } from './components/LoanTable';

const FACILITY_TYPES = [
  'Term Loan',
  'Overdraft (OD)',
  'Revolving Line of Credit',
  'Time Loan',
  'Letter of Credit (LC)',
  'Commercial Paper',
  'Equipment Financing',
];

const BANK_SUGGESTIONS = [
  'Standard Chartered',
  'BRAC Bank',
  'City Bank',
  'Eastern Bank Limited',
  'Dutch-Bangla Bank',
  'Islami Bank Bangladesh',
  'HSBC Bangladesh',
  'Dhaka Bank',
  'Prime Bank',
  'Trust Bank',
];

export default function LoansPage() {
  const [loans, setLoans] = useState<CorporateLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'REPAID'>('ALL');
  const [facilityTypeFilter, setFacilityTypeFilter] = useState('ALL');

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<CorporateLoan | null>(null);

  // Form state for Record Loan
  const [form, setForm] = useState({
    bankName: 'Standard Chartered',
    facilityType: 'Term Loan',
    amount: '',
    interestRate: '8.5',
    tenureMonths: '24',
    issueDate: new Date().toISOString().slice(0, 10),
    description: '',
  });

  // Form state for Repayment
  const [repayForm, setRepayForm] = useState({
    repaymentAmount: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentSource: 'Bank Account (Main)',
    note: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showAlert = (text: string, type: 'success' | 'error' = 'success') => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // Fetch loans from API
  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/loans?loanType=ALL');
      if (res.ok) {
        const data = await res.json();
        setLoans(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch loans');
      }
    } catch (err) {
      console.error('Error loading loans:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  // Handle Record New Loan
  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bankName.trim()) {
      showAlert('Please enter bank or institution name', 'error');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      showAlert('Please enter a valid loan amount', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankName: form.bankName.trim(),
          facilityType: form.facilityType,
          interestRate: Number(form.interestRate) || 0,
          amount: Number(form.amount),
          tenureMonths: Number(form.tenureMonths) || 12,
          issueDate: form.issueDate,
          description: form.description,
          loanType: 'CORPORATE',
        }),
      });

      if (res.ok) {
        showAlert('Corporate facility recorded successfully!');
        setIsRecordModalOpen(false);
        setForm({
          bankName: '',
          facilityType: 'Term Loan',
          amount: '',
          interestRate: '8.5',
          tenureMonths: '24',
          issueDate: new Date().toISOString().slice(0, 10),
          description: '',
        });
        await fetchLoans();
      } else {
        const err = await res.json().catch(() => ({}));
        showAlert(err.error || 'Failed to record loan', 'error');
      }
    } catch {
      showAlert('Network error while saving loan', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Repayment
  const handleRepaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    const repayAmt = Number(repayForm.repaymentAmount);
    if (!repayAmt || repayAmt <= 0) {
      showAlert('Please enter a valid repayment amount', 'error');
      return;
    }

    const currentRemaining = Number(selectedLoan.remainingAmount);
    if (repayAmt > currentRemaining) {
      showAlert(`Repayment cannot exceed current outstanding (৳ ${currentRemaining.toLocaleString()})`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/loans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedLoan.id,
          repaymentAmount: repayAmt,
          note: repayForm.note,
        }),
      });

      if (res.ok) {
        showAlert(`Repayment of ৳ ${repayAmt.toLocaleString()} recorded successfully!`);
        setIsRepayModalOpen(false);
        setSelectedLoan(null);
        setRepayForm({
          repaymentAmount: '',
          paymentDate: new Date().toISOString().slice(0, 10),
          paymentSource: 'Bank Account (Main)',
          note: '',
        });
        await fetchLoans();
      } else {
        const err = await res.json().catch(() => ({}));
        showAlert(err.error || 'Failed to record repayment', 'error');
      }
    } catch {
      showAlert('Network error recording repayment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Status Toggle (Mark Repaid / Active)
  const handleToggleStatus = async (id: string, newStatus: string) => {
    const isSettling = newStatus === 'REPAID';
    if (!confirm(`Are you sure you want to mark this facility as ${isSettling ? 'Settled' : 'Active'}?`)) return;

    try {
      const res = await fetch('/api/loans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        showAlert(`Facility marked as ${newStatus}!`);
        await fetchLoans();
      } else {
        showAlert('Failed to update facility status', 'error');
      }
    } catch {
      showAlert('Network error updating status', 'error');
    }
  };

  // Handle Delete
  const handleDeleteLoan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this facility record? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/loans?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showAlert('Facility deleted successfully!');
        await fetchLoans();
      } else {
        showAlert('Failed to delete facility', 'error');
      }
    } catch {
      showAlert('Network error deleting facility', 'error');
    }
  };

  // Open Repayment Modal
  const openRepayModal = (loan: CorporateLoan) => {
    setSelectedLoan(loan);
    setRepayForm({
      repaymentAmount: '',
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentSource: 'Bank Account (Main)',
      note: `Repayment for ${loan.bankName || 'facility'}`,
    });
    setIsRepayModalOpen(true);
  };

  // Pre-load Demo Standard Chartered Facility
  const handleLoadSampleFacility = async () => {
    setSubmitting(true);
    try {
      // 1. Create 10M Standard Chartered facility
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankName: 'Standard Chartered',
          facilityType: 'Term Loan',
          interestRate: 8.5,
          amount: 10000000,
          tenureMonths: 36,
          description: 'Long-term corporate capital expenditure facility',
          loanType: 'CORPORATE',
        }),
      });

      if (res.ok) {
        const newLoan = await res.json();
        // 2. Record 3.5M repayment so outstanding is exactly 6.5M as shown in user's UI
        if (newLoan?.id) {
          await fetch('/api/loans', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: newLoan.id,
              repaymentAmount: 3500000,
            }),
          });
        }
        showAlert('Active Standard Chartered facility initialized successfully!');
        await fetchLoans();
      }
    } catch (e) {
      console.error(e);
      showAlert('Failed to initialize sample facility', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Loans
  const filteredLoans = useMemo(() => {
    return loans.filter(l => {
      const bank = (l.bankName || '').toLowerCase();
      const facility = (l.facilityType || '').toLowerCase();
      const reason = (l.reason || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      if (q && !bank.includes(q) && !facility.includes(q) && !reason.includes(q)) {
        return false;
      }

      if (statusFilter === 'ACTIVE' && (l.status === 'REPAID' || Number(l.remainingAmount) <= 0)) {
        return false;
      }
      if (statusFilter === 'REPAID' && (l.status !== 'REPAID' && Number(l.remainingAmount) > 0)) {
        return false;
      }

      if (facilityTypeFilter !== 'ALL' && (l.facilityType || 'Term Loan') !== facilityTypeFilter) {
        return false;
      }

      return true;
    });
  }, [loans, searchQuery, statusFilter, facilityTypeFilter]);

  // Aggregate KPI Metrics
  const totalPrincipal = loans.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  const totalOutstanding = loans.reduce((sum, l) => sum + (Number(l.remainingAmount) || 0), 0);
  const activeCount = loans.filter(l => l.status !== 'REPAID' && Number(l.remainingAmount) > 0).length;
  const repaidCount = loans.length - activeCount;

  const validRates = loans.map(l => Number(l.interestRate)).filter(r => !isNaN(r) && r > 0);
  const avgRate = validRates.length > 0 ? (validRates.reduce((a, b) => a + b, 0) / validRates.length).toFixed(1) : '8.5';

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast Alert */}
      {alertMsg && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          padding: '12px 20px',
          borderRadius: '10px',
          background: alertMsg.type === 'success' ? '#10b981' : '#ef4444',
          color: '#ffffff',
          fontWeight: 600,
          fontSize: '13px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            {alertMsg.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {alertMsg.text}
        </div>
      )}

      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)' }}>Finance</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>&rsaquo;</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary, #60a5fa)' }}>Loans &amp; Liabilities</span>
          </div>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: 'var(--text-main, #f8fafc)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
            Corporate Loans
            <span style={{ fontSize: '12px', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
              Liabilities
            </span>
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted, #94a3b8)' }}>
            Manage external bank facilities, commercial debt, interest rates, and loan repayments
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {loans.length === 0 && (
            <button
              onClick={handleLoadSampleFacility}
              disabled={submitting}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-main, rgba(255, 255, 255, 0.12))',
                color: 'var(--text-main, #f8fafc)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
              Load Sample Facility
            </button>
          )}

          <button
            onClick={() => setIsRecordModalOpen(true)}
            style={{
              padding: '10px 22px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              border: 'none',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.15s ease'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
            Record Loan
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {/* Active Facilities */}
        <div className="glass-card" style={{ padding: '20px', borderRadius: '12px', background: 'var(--surface-card, #0f172a)', border: '1px solid var(--border-main, rgba(255, 255, 255, 0.08))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>Active Facilities</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>account_balance</span>
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main, #f8fafc)' }}>
            {activeCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', marginTop: '4px' }}>
            {repaidCount} settled / closed
          </div>
        </div>

        {/* Total Outstanding Liabilities */}
        <div className="glass-card" style={{ padding: '20px', borderRadius: '12px', background: 'var(--surface-card, #0f172a)', border: '1px solid var(--border-main, rgba(255, 255, 255, 0.08))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>Outstanding Liability</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>trending_down</span>
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f43f5e' }}>
            ৳ {totalOutstanding.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', marginTop: '4px' }}>
            Current net corporate debt
          </div>
        </div>

        {/* Total Principal Borrowed */}
        <div className="glass-card" style={{ padding: '20px', borderRadius: '12px', background: 'var(--surface-card, #0f172a)', border: '1px solid var(--border-main, rgba(255, 255, 255, 0.08))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>Total Principal</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>monetization_on</span>
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main, #f8fafc)' }}>
            ৳ {totalPrincipal.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px', fontWeight: 600 }}>
            ৳ {(totalPrincipal - totalOutstanding).toLocaleString()} repaid so far
          </div>
        </div>

        {/* Average Rate */}
        <div className="glass-card" style={{ padding: '20px', borderRadius: '12px', background: 'var(--surface-card, #0f172a)', border: '1px solid var(--border-main, rgba(255, 255, 255, 0.08))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>Avg Interest Rate</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>percent</span>
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main, #f8fafc)' }}>
            {avgRate}% <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>p.a.</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', marginTop: '4px' }}>
            Annual financing cost
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'var(--surface-card, #0f172a)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-main, rgba(255, 255, 255, 0.08))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '18px' }}>search</span>
            <input
              type="text"
              placeholder="Search bank, facility type, notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-main, rgba(255, 255, 255, 0.1))',
                color: 'var(--text-main, #f8fafc)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          {/* Facility Type Selector */}
          <select
            value={facilityTypeFilter}
            onChange={e => setFacilityTypeFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-main, rgba(255, 255, 255, 0.1))',
              color: 'var(--text-main, #f8fafc)',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Facility Types</option>
            {FACILITY_TYPES.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {/* Status Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setStatusFilter('ALL')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: statusFilter === 'ALL' ? '1px solid var(--primary, #3b82f6)' : '1px solid transparent',
              background: statusFilter === 'ALL' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: statusFilter === 'ALL' ? 'var(--primary, #60a5fa)' : 'var(--text-secondary, #94a3b8)'
            }}
          >
            All ({loans.length})
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: statusFilter === 'ACTIVE' ? '1px solid #f59e0b' : '1px solid transparent',
              background: statusFilter === 'ACTIVE' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: statusFilter === 'ACTIVE' ? '#f59e0b' : 'var(--text-secondary, #94a3b8)'
            }}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('REPAID')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: statusFilter === 'REPAID' ? '1px solid #10b981' : '1px solid transparent',
              background: statusFilter === 'REPAID' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              color: statusFilter === 'REPAID' ? '#10b981' : 'var(--text-secondary, #94a3b8)'
            }}
          >
            Settled ({repaidCount})
          </button>

          <button
            onClick={fetchLoans}
            title="Refresh facilities"
            style={{
              padding: '7px 10px',
              borderRadius: '8px',
              background: 'transparent',
              border: '1px solid var(--border-main, rgba(255, 255, 255, 0.1))',
              color: 'var(--text-muted, #94a3b8)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <LoanTable
        loans={filteredLoans}
        loading={loading}
        onRecordRepayment={openRepayModal}
        onToggleStatus={handleToggleStatus}
        onDeleteLoan={handleDeleteLoan}
        onOpenRecordModal={() => setIsRecordModalOpen(true)}
      />

      {/* =========================================================================
          RECORD CORPORATE LOAN MODAL
         ========================================================================= */}
      {isRecordModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--surface-card, #0f172a)',
            border: '1px solid var(--border-main, rgba(255, 255, 255, 0.12))',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-main, rgba(255, 255, 255, 0.08))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>account_balance</span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-main, #f8fafc)' }}>Record Corporate Loan</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>Add a new bank credit facility or corporate liability</p>
                </div>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer', padding: '4px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleRecordSubmit}>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Bank / Institution Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)', marginBottom: '6px' }}>
                    Bank / Financial Institution *
                  </label>
                  <input
                    list="bank-suggestions"
                    type="text"
                    required
                    placeholder="e.g. Standard Chartered, BRAC Bank"
                    value={form.bankName}
                    onChange={e => setForm({ ...form, bankName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-main, rgba(255, 255, 255, 0.12))',
                      color: 'var(--text-main, #f8fafc)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  <datalist id="bank-suggestions">
                    {BANK_SUGGESTIONS.map(b => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>

                {/* Facility Type & Interest Rate */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)', marginBottom: '6px' }}>
                      Facility Type
                    </label>
                    <select
                      value={form.facilityType}
                      onChange={e => setForm({ ...form, facilityType: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-main, rgba(255, 255, 255, 0.12))',
                        color: 'var(--text-main, #f8fafc)',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    >
                      {FACILITY_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)', marginBottom: '6px' }}>
                      Interest Rate (% p.a.)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 8.5"
                      value={form.interestRate}
                      onChange={e => setForm({ ...form, interestRate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-main, rgba(255, 255, 255, 0.12))',
                        color: 'var(--text-main, #f8fafc)',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Principal Amount & Tenure */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)', marginBottom: '6px' }}>
                      Principal Amount (BDT ৳) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 10000000"
                      value={form.amount}
                      onChange={e => setForm({ ...form, amount: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-main, rgba(255, 255, 255, 0.12))',
                        color: 'var(--text-main, #f8fafc)',
                        fontSize: '13px',
                        fontWeight: 600,
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)', marginBottom: '6px' }}>
                      Tenure (Months)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 24"
                      value={form.tenureMonths}
                      onChange={e => setForm({ ...form, tenureMonths: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-main, rgba(255, 255, 255, 0.12))',
                        color: 'var(--text-main, #f8fafc)',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Disbursal Date */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)', marginBottom: '6px' }}>
                    Disbursal / Issue Date
                  </label>
                  <input
                    type="date"
                    value={form.issueDate}
                    onChange={e => setForm({ ...form, issueDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-main, rgba(255, 255, 255, 0.12))',
                      color: 'var(--text-main, #f8fafc)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Description / Notes */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)', marginBottom: '6px' }}>
                    Facility Purpose &amp; Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Working capital facility for inventory procurement"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-main, rgba(255, 255, 255, 0.12))',
                      color: 'var(--text-main, #f8fafc)',
                      fontSize: '13px',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-main, rgba(255, 255, 255, 0.08))', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: '1px solid var(--border-main, rgba(255, 255, 255, 0.15))',
                    color: 'var(--text-secondary, #cbd5e1)',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '9px 22px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? 'Saving Facility...' : 'Save Corporate Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          RECORD REPAYMENT MODAL
         ========================================================================= */}
      {isRepayModalOpen && selectedLoan && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--surface-card, #0f172a)',
            border: '1px solid var(--border-main, rgba(255, 255, 255, 0.12))',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-main, rgba(255, 255, 255, 0.08))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>payments</span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-main, #f8fafc)' }}>Record Facility Repayment</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>{selectedLoan.bankName} &bull; {selectedLoan.facilityType}</p>
                </div>
              </div>
              <button
                onClick={() => setIsRepayModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer', padding: '4px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>

            {/* Repayment Form */}
            <form onSubmit={handleRepaySubmit}>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Outstanding Pill */}
                <div style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Current Outstanding</span>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#f43f5e', marginTop: '2px' }}>
                      ৳ {Number(selectedLoan.remainingAmount).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Original Facility</span>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                      ৳ {Number(selectedLoan.amount).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Amount to Repay */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)', marginBottom: '6px' }}>
                    Repayment Amount (BDT ৳) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Enter amount to pay"
                    value={repayForm.repaymentAmount}
                    onChange={e => setRepayForm({ ...repayForm, repaymentAmount: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-main, rgba(255, 255, 255, 0.12))',
                      color: 'var(--text-main, #f8fafc)',
                      fontSize: '15px',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />

                  {/* Preset Buttons */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    {[0.25, 0.5, 1.0].map(pct => {
                      const calculated = Math.round(Number(selectedLoan.remainingAmount) * pct);
                      return (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setRepayForm({ ...repayForm, repaymentAmount: String(calculated) })}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid var(--border-main, rgba(255, 255, 255, 0.1))',
                            color: 'var(--text-secondary, #cbd5e1)'
                          }}
                        >
                          {pct === 1.0 ? 'Full Balance' : `${pct * 100}%`} (৳ {calculated.toLocaleString()})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Repayment Date */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)', marginBottom: '6px' }}>
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={repayForm.paymentDate}
                    onChange={e => setRepayForm({ ...repayForm, paymentDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-main, rgba(255, 255, 255, 0.12))',
                      color: 'var(--text-main, #f8fafc)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)', marginBottom: '6px' }}>
                    Reference / Transaction Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bank transfer ref #TX-9842"
                    value={repayForm.note}
                    onChange={e => setRepayForm({ ...repayForm, note: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-main, rgba(255, 255, 255, 0.12))',
                      color: 'var(--text-main, #f8fafc)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-main, rgba(255, 255, 255, 0.08))', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsRepayModalOpen(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: '1px solid var(--border-main, rgba(255, 255, 255, 0.15))',
                    color: 'var(--text-secondary, #cbd5e1)',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '9px 22px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? 'Recording...' : 'Confirm Repayment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
