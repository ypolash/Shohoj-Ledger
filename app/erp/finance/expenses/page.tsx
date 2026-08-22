"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ExpenseToolbar } from './components/ExpenseToolbar';
import { ExpenseFilters } from './components/ExpenseFilters';
import { ExpenseTable } from './components/ExpenseTable';
import { FastEntryDrawer } from '@/app/erp/finance/components/FastEntryDrawer';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchExpenses = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/expenses');
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (Array.isArray(data)) {
        setExpenses(data);
      } else {
        setExpenses([]);
        setError("API returned unexpected data format.");
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      <ExpenseToolbar onRecordExpense={() => setDrawerOpen(true)} />
      <ExpenseFilters />
      {error ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--destructive, red)' }}>
          <p>Error: {error}</p>
        </div>
      ) : loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <ExpenseTable expenses={expenses} onRefresh={fetchExpenses} />
      )}

      <FastEntryDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        type="EXPENSE"
        onSuccess={fetchExpenses}
      />
    </div>
  );
}
