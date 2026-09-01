"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Receipt, 
  Wallet, 
  DollarSign, 
  FileText, 
  AlertCircle, 
  Save, 
  RefreshCw, 
  ArrowLeft,
  Banknote,
  Smartphone,
  CreditCard,
  Building2
} from 'lucide-react';
import Link from 'next/link';

interface ExpenseFormProps {
  initialData?: any;
  isEdit?: boolean;
}

const DEFAULT_EXPENSE_CATEGORIES = [
  "Office Supplies",
  "Rent",
  "Utilities",
  "Salary",
  "Marketing",
  "Travel & Logistics",
  "Equipment & Hardware",
  "Software & Subscriptions",
  "Maintenance",
  "Other Expenses"
];

const PAYMENT_METHODS = [
  { id: "Bank Transfer", label: "Bank Transfer", icon: Building2 },
  { id: "Cash on Hand", label: "Cash", icon: Banknote },
  { id: "Mobile Banking", label: "Mobile Banking", icon: Smartphone },
  { id: "Card", label: "Card / POS", icon: CreditCard }
];

export function ExpenseForm({ initialData, isEdit = false }: ExpenseFormProps) {
  const router = useRouter();
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
      ? `EXP-${initialData.id.slice(0, 8).toUpperCase()}` 
      : `EXP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [category, setCategory] = useState(initialData?.category || "Office Supplies");
  const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || "Bank Transfer");
  const [amount, setAmount] = useState<string>(initialData?.amount ? String(initialData.amount) : "");
  const [description, setDescription] = useState(initialData?.description || "");

  const totalAmountNum = parseFloat(amount) || 0;

  const generateNewReference = () => {
    setReference(`EXP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || totalAmountNum <= 0) {
      setError("Please enter a valid expense amount.");
      return;
    }
    if (!category) {
      setError("Please select an expense category.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        category,
        paymentMethod,
        amount: totalAmountNum,
        description
      };

      const url = isEdit && initialData?.id ? `/api/expenses?id=${initialData.id}` : '/api/expenses';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        router.push('/erp/finance/expenses');
        router.refresh();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save expense record');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error saving expense record');
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
              {isEdit ? 'Edit Expense Voucher' : 'Record New Expense'}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Log outgoing disbursements, vendor invoices, or operating costs.
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
                Disbursement Date *
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
                placeholder="e.g. EXP-2026-001" 
                style={{ ...inputStyle, fontFamily: 'monospace', fontWeight: 600 }} 
              />
            </div>
          </div>

          {/* Row 2: Category Selector Pills */}
          <div>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Expense Category *
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              {DEFAULT_EXPENSE_CATEGORIES.map((cat) => (
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

          {/* Row 3: Payment Channel & Amount */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                <Wallet size={14} />
                Payment Channel *
              </label>
              <select 
                value={paymentMethod} 
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={inputStyle}
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                <DollarSign size={14} />
                Amount Paid (BDT) *
              </label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                required
                value={amount} 
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00" 
                style={{ ...inputStyle, fontSize: '1.1rem', fontWeight: 700, color: 'var(--danger, #ef4444)' }} 
              />
            </div>
          </div>

          {/* Row 4: Memo / Description */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
              <FileText size={14} />
              Description / Notes (Optional)
            </label>
            <textarea 
              rows={3} 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add expense purpose, vendor name, invoice reference..." 
              style={{ ...inputStyle, resize: 'vertical' }} 
            />
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-main)' }}>
            <Link 
              href="/erp/finance/expenses" 
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
              <span>{isSubmitting ? 'Recording Expense...' : isEdit ? 'Update Expense Voucher' : 'Confirm & Save Expense'}</span>
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
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981'
            }}>
              APPROVED
            </span>
          </div>

          {/* Voucher Header */}
          <div style={{ textAlign: 'center', padding: '12px 0 20px', borderBottom: '1px dashed var(--border-main)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Expense Disbursement Voucher</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--danger, #ef4444)', fontFamily: 'monospace', margin: '4px 0' }}>
              #{reference}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          </div>

          {/* Voucher Details */}
          <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Category:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{category}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Payment Channel:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{paymentMethod}</span>
            </div>

            {description && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingTop: '6px', borderTop: '1px solid var(--border-main)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Notes:</span>
                <span style={{ color: 'var(--text-main)', fontSize: '0.8rem' }}>{description}</span>
              </div>
            )}
          </div>

          {/* Financial Box */}
          <div style={{ 
            background: 'var(--surface-hover)', 
            padding: '16px', 
            borderRadius: '12px', 
            border: '1px solid var(--border-main)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline'
          }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Amount Disbursed:</span>
            <span style={{ fontWeight: 800, color: 'var(--danger, #ef4444)', fontSize: '1.25rem' }}>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(totalAmountNum)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
