"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Receipt, 
  User, 
  Building2, 
  Wallet, 
  DollarSign, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Save, 
  RefreshCw, 
  ArrowLeft,
  Banknote,
  Smartphone,
  CreditCard,
  Percent
} from 'lucide-react';
import Link from 'next/link';

interface IncomeFormProps {
  initialData?: any;
  isEdit?: boolean;
}

const DEFAULT_CATEGORIES = [
  "Sales Revenue",
  "Consulting",
  "Development",
  "Service Income",
  "Maintenance",
  "Support",
  "Training",
  "Other Income"
];

const PAYMENT_METHODS = [
  { id: "Bank Transfer", label: "Bank Transfer", icon: Building2 },
  { id: "Cash on Hand", label: "Cash", icon: Banknote },
  { id: "bKash / Nagad", label: "Mobile Banking", icon: Smartphone },
  { id: "Credit Card", label: "Card / POS", icon: CreditCard }
];

export function IncomeForm({ initialData, isEdit = false }: IncomeFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [date, setDate] = useState(
    initialData?.createdAt 
      ? new Date(initialData.createdAt).toISOString().slice(0, 10) 
      : new Date().toISOString().slice(0, 10)
  );
  const [reference, setReference] = useState(
    initialData?.id 
      ? `INC-${initialData.id.slice(0, 8).toUpperCase()}` 
      : `INC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [category, setCategory] = useState(initialData?.category || "Sales Revenue");
  const [source, setSource] = useState(initialData?.source || "");
  const [depositMethod, setDepositMethod] = useState("Bank Transfer");
  const [amount, setAmount] = useState<string>(initialData?.amount ? String(initialData.amount) : "");
  const [received, setReceived] = useState<string>(initialData?.received ? String(initialData.received) : "");
  const [description, setDescription] = useState(initialData?.description || "");

  // Load categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/income-categories');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const catNames = data.map((c: any) => c.name);
            setCategories(Array.from(new Set([...catNames, ...DEFAULT_CATEGORIES])));
          }
        }
      } catch (err) {
        console.error("Failed to load income categories", err);
      }
    };
    fetchCategories();
  }, []);

  const totalAmountNum = parseFloat(amount) || 0;
  const receivedAmountNum = parseFloat(received) || 0;
  const dueAmountNum = Math.max(0, totalAmountNum - receivedAmountNum);
  const collectionPercent = totalAmountNum > 0 ? Math.min(100, Math.round((receivedAmountNum / totalAmountNum) * 100)) : 0;
  
  const paymentStatus = receivedAmountNum >= totalAmountNum && totalAmountNum > 0
    ? 'PAID'
    : receivedAmountNum > 0
      ? 'PARTIAL'
      : 'UNPAID';

  // Quick amount helper buttons
  const handleSetFullPayment = () => {
    setReceived(amount);
  };

  const handleSetHalfPayment = () => {
    if (totalAmountNum > 0) {
      setReceived(String(totalAmountNum / 2));
    }
  };

  const handleSetUnpaid = () => {
    setReceived("0");
  };

  const generateNewReference = () => {
    setReference(`INC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || totalAmountNum <= 0) {
      setError("Please enter a valid total amount.");
      return;
    }
    if (!category) {
      setError("Please select an income category.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        category,
        source: source || depositMethod,
        amount: totalAmountNum,
        received: receivedAmountNum,
        description,
        shareable: true
      };

      const url = isEdit && initialData?.id ? `/api/income?id=${initialData.id}` : '/api/income';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        router.push('/erp/finance/income');
        router.refresh();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save income record');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error saving income record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 16px',
    borderRadius: '10px',
    border: '1px solid var(--border-main)',
    background: 'var(--surface-main)',
    color: 'var(--text-main)',
    fontSize: '0.9rem',
    outline: 'none',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
    transition: 'all 0.15s ease'
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)', gap: '24px', alignItems: 'flex-start' }}>
      
      {/* Left Form Pane */}
      <div className="glass-card" style={{ 
        padding: '28px', 
        borderRadius: '16px', 
        background: 'var(--surface-main)', 
        border: '1px solid var(--border-main)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              {isEdit ? 'Edit Income Voucher' : 'Record New Income'}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Enter revenue, customer payment, or direct earnings for the ledger.
            </p>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: 'var(--danger)',
            fontSize: '0.85rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Row 1: Date & Reference */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                <Calendar size={14} />
                Transaction Date *
              </label>
              <input 
                type="date" 
                required
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                style={inputStyle} 
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Receipt size={14} />
                  Reference / Voucher #
                </span>
                {!isEdit && (
                  <button 
                    type="button" 
                    onClick={generateNewReference}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem' }}
                  >
                    <RefreshCw size={11} /> Auto
                  </button>
                )}
              </label>
              <input 
                type="text" 
                value={reference} 
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. REC-2026-001" 
                style={{ ...inputStyle, fontFamily: 'monospace', fontWeight: 600 }} 
              />
            </div>
          </div>

          {/* Row 2: Category Selector (Interactive Pills) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Income Category *
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              {categories.slice(0, 8).map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: category === cat ? 'var(--primary)' : 'var(--surface-hover)',
                    color: category === cat ? 'white' : 'var(--text-main)',
                    border: category === cat ? '1px solid var(--primary)' : '1px solid var(--border-main)',
                    boxShadow: category === cat ? '0 2px 8px var(--primary-glow)' : 'none'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Payer / Source & Deposit Method */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                <User size={14} />
                Payer / Client / Source
              </label>
              <input 
                type="text" 
                value={source} 
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. Acme Corp / Walk-in Customer" 
                style={inputStyle} 
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                <Wallet size={14} />
                Deposit Channel
              </label>
              <select 
                value={depositMethod} 
                onChange={(e) => setDepositMethod(e.target.value)}
                style={inputStyle}
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Financial Calculation (Total Amount vs Received Now) */}
          <div style={{ 
            background: 'var(--surface-hover)', 
            padding: '18px', 
            borderRadius: '12px', 
            border: '1px solid var(--border-main)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={15} color="var(--primary)" />
              Amount & Payment Settlement
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Total Invoiced Amount (BDT) *
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  required
                  value={amount} 
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (!received || received === amount) {
                      setReceived(e.target.value);
                    }
                  }}
                  placeholder="0.00" 
                  style={{ ...inputStyle, background: 'var(--surface-main)', fontSize: '1.1rem', fontWeight: 700 }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Amount Received Now (BDT) *
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  value={received} 
                  onChange={(e) => setReceived(e.target.value)}
                  placeholder="0.00" 
                  style={{ ...inputStyle, background: 'var(--surface-main)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--success, #10b981)' }} 
                />
              </div>
            </div>

            {/* Quick Helper Buttons */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Quick Presets:</span>
              <button
                type="button"
                onClick={handleSetFullPayment}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  cursor: 'pointer'
                }}
              >
                100% Fully Received
              </button>
              <button
                type="button"
                onClick={handleSetHalfPayment}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: '#f59e0b',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  cursor: 'pointer'
                }}
              >
                50% Partial Advance
              </button>
              <button
                type="button"
                onClick={handleSetUnpaid}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  cursor: 'pointer'
                }}
              >
                Unpaid / Full Due
              </button>
            </div>
          </div>

          {/* Row 5: Memo / Notes */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
              <FileText size={14} />
              Description / Memo (Optional)
            </label>
            <textarea 
              rows={3} 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add payment notes, invoice references, or project details..." 
              style={{ ...inputStyle, resize: 'vertical' }} 
            />
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-main)' }}>
            <Link 
              href="/erp/finance/income" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid var(--border-main)',
                background: 'var(--surface-hover)',
                color: 'var(--text-main)',
                fontSize: '0.875rem',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <ArrowLeft size={16} />
              Cancel
            </Link>

            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 24px',
                borderRadius: '8px',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 10px var(--primary-glow)',
                transition: 'all 0.15s ease'
              }}
            >
              <Save size={16} />
              <span>{isSubmitting ? 'Recording Income...' : isEdit ? 'Update Income Voucher' : 'Confirm & Save Income'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Right Live Voucher Preview Pane */}
      <div style={{ position: 'sticky', top: '24px' }}>
        <div className="glass-card" style={{ 
          padding: '24px', 
          borderRadius: '16px', 
          background: 'var(--surface-main)', 
          border: '1px solid var(--border-main)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-main)', paddingBottom: '14px', marginBottom: '16px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Live Voucher Preview
            </div>
            <span style={{
              fontSize: '0.725rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '9999px',
              background: paymentStatus === 'PAID' ? 'rgba(16, 185, 129, 0.15)' : paymentStatus === 'PARTIAL' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: paymentStatus === 'PAID' ? '#10b981' : paymentStatus === 'PARTIAL' ? '#f59e0b' : '#ef4444'
            }}>
              {paymentStatus}
            </span>
          </div>

          {/* Voucher Header */}
          <div style={{ textAlign: 'center', padding: '12px 0 20px', borderBottom: '1px dashed var(--border-main)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Income Receipt Voucher</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace', margin: '4px 0' }}>
              #{reference}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          </div>

          {/* Voucher Details */}
          <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Payer / Source:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{source || 'General Revenue'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Category:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{category}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Deposit Channel:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{depositMethod}</span>
            </div>

            {description && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingTop: '6px', borderTop: '1px solid var(--border-main)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Memo:</span>
                <span style={{ color: 'var(--text-main)', fontSize: '0.8rem' }}>{description}</span>
              </div>
            )}
          </div>

          {/* Financial Calculation Box */}
          <div style={{ 
            background: 'var(--surface-hover)', 
            padding: '16px', 
            borderRadius: '12px', 
            border: '1px solid var(--border-main)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Invoiced:</span>
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(totalAmountNum)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
              <span style={{ fontWeight: 600, color: '#10b981' }}>Amount Received:</span>
              <span style={{ fontWeight: 800, color: '#10b981' }}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(receivedAmountNum)}
              </span>
            </div>

            {dueAmountNum > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingTop: '6px', borderTop: '1px solid var(--border-main)' }}>
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>Balance Due:</span>
                <span style={{ fontWeight: 800, color: '#f59e0b' }}>
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(dueAmountNum)}
                </span>
              </div>
            )}

            <div style={{ marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                <span>Settlement Progress</span>
                <span>{collectionPercent}%</span>
              </div>
              <div style={{ width: '100%', height: '4px', background: 'var(--border-main)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{
                  width: `${collectionPercent}%`,
                  height: '100%',
                  background: collectionPercent === 100 ? 'var(--success)' : collectionPercent > 0 ? 'var(--warning)' : 'var(--danger)',
                  borderRadius: '9999px'
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
