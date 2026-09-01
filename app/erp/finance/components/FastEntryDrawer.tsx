"use client";

import React, { useEffect, useRef, useState } from "react";
import { 
  X, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Wallet, 
  Banknote, 
  Building2, 
  Smartphone, 
  Save, 
  DollarSign, 
  FileText 
} from "lucide-react";

type FastEntryProps = {
  isOpen: boolean;
  onClose: () => void;
  type: "INCOME" | "EXPENSE";
  onSuccess: () => void;
};

const DEFAULT_INCOME_CATS = ["Sales Revenue", "Consulting", "Development", "Service Income", "Maintenance", "Support", "Other Income"];
const DEFAULT_EXPENSE_CATS = ["Office Supplies", "Rent", "Utilities", "Salary", "Marketing", "Travel", "Maintenance"];

export function FastEntryDrawer({ isOpen, onClose, type, onSuccess }: FastEntryProps) {
  const [loading, setLoading] = useState(false);
  const amountInputRef = useRef<HTMLInputElement>(null);
  
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Bank Transfer" | "Cash on Hand" | "Mobile Banking">("Bank Transfer");
  const [note, setNote] = useState("");
  const [error, setError] = useState(false);
  const [categories, setCategories] = useState<string[]>(type === 'INCOME' ? DEFAULT_INCOME_CATS : DEFAULT_EXPENSE_CATS);

  useEffect(() => {
    if (isOpen) {
      setCategories(type === 'INCOME' ? DEFAULT_INCOME_CATS : DEFAULT_EXPENSE_CATS);
      setCategory(type === 'INCOME' ? "Sales Revenue" : "Office Supplies");
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, type]);

  const reset = () => {
    setAmount("");
    setCategory(type === 'INCOME' ? "Sales Revenue" : "Office Supplies");
    setPaymentMethod("Bank Transfer");
    setNote("");
    setError(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !category) {
      setError(true);
      return;
    }
    
    setLoading(true);
    try {
      const endpoint = type === "INCOME" ? "/api/income" : "/api/expenses";
      let payload: any = {};
      
      if (type === "INCOME") {
        payload = {
          amount: Number(amount),
          received: Number(amount),
          category: category,
          source: paymentMethod,
          description: note,
          shareable: true
        };
      } else {
        payload = {
          amount: Number(amount),
          category: category,
          paymentMethod: paymentMethod === 'Cash on Hand' ? 'CASH' : 'BANK',
          description: note
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        reset();
        onSuccess();
        onClose();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || "Failed to save. Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving transaction.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(4px)',
          zIndex: 1040,
          animation: 'fadeIn 0.2s ease'
        }} 
        onClick={onClose} 
      />
      <div 
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100%',
          width: '100%',
          maxWidth: '460px',
          background: 'var(--surface-main)',
          borderLeft: '1px solid var(--border-main)',
          zIndex: 1050,
          boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'drawerSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-main)',
          background: 'var(--surface-hover)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: type === 'INCOME' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: type === 'INCOME' ? '#10b981' : '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {type === 'INCOME' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Fast {type === 'INCOME' ? 'Income' : 'Expense'} Entry
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick record to ledger</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Amount (BDT) *
            </label>
            <input 
              type="number"
              ref={amountInputRef}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="1"
              step="0.01"
              style={{
                width: '100%',
                fontSize: '1.4rem',
                fontWeight: 800,
                padding: '12px 16px',
                border: '1px solid var(--border-main)',
                borderRadius: '10px',
                background: 'var(--surface-hover)',
                color: type === 'INCOME' ? 'var(--success, #10b981)' : 'var(--danger, #ef4444)',
                outline: 'none',
                fontFamily: 'monospace'
              }}
              placeholder="0.00"
            />
            {error && (!amount || Number(amount) <= 0) && <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '4px', display: 'block' }}>Valid amount required</span>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Category *
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: category === cat ? 'var(--primary)' : 'var(--surface-hover)',
                    color: category === cat ? 'white' : 'var(--text-main)',
                    border: category === cat ? '1px solid var(--primary)' : '1px solid var(--border-main)'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Channel / Account
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { id: "Bank Transfer", label: "Bank", icon: Building2 },
                { id: "Cash on Hand", label: "Cash", icon: Banknote },
                { id: "Mobile Banking", label: "bKash", icon: Smartphone }
              ].map(m => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id as any)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '10px 8px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: paymentMethod === m.id ? 'var(--primary-glow)' : 'var(--surface-hover)',
                    color: paymentMethod === m.id ? 'var(--primary)' : 'var(--text-main)',
                    border: paymentMethod === m.id ? '1px solid var(--primary)' : '1px solid var(--border-main)'
                  }}
                >
                  <m.icon size={16} />
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Note / Memo (Optional)
            </label>
            <input 
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border-main)',
                borderRadius: '8px',
                background: 'var(--surface-main)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
              placeholder="e.g. Consulting fee from client"
            />
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-main)', display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              onClick={onClose} 
              style={{
                flex: 1,
                padding: '10px',
                background: 'var(--surface-hover)',
                border: '1px solid var(--border-main)',
                color: 'var(--text-main)',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                fontWeight: 600,
                color: 'white',
                background: type === 'INCOME' ? 'var(--success, #10b981)' : 'var(--primary)',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '0.85rem'
              }}
            >
              <Save size={16} />
              <span>{loading ? 'Saving...' : 'Save Entry'}</span>
            </button>
          </div>
        </form>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes drawerSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}} />
    </>
  );
}
