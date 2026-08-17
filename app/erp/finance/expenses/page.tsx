"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ExpenseToolbar } from './components/ExpenseToolbar';
import { ExpenseFilters } from './components/ExpenseFilters';
import { ExpenseTable } from './components/ExpenseTable';
import { FastEntryDrawer } from '@/app/dashboard/finance/components/FastEntryDrawer';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await fetch('/api/expenses');
      const data = await res.json();
      setExpenses(data);
    } catch (error) {
      console.error("Failed to fetch expenses", error);
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
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <ExpenseTable expenses={expenses} />
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
