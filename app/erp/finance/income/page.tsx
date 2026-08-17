"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { IncomeToolbar } from './components/IncomeToolbar';
import { IncomeFilters } from './components/IncomeFilters';
import { IncomeTable } from './components/IncomeTable';
import { FastEntryDrawer } from '@/app/dashboard/finance/components/FastEntryDrawer';

export default function IncomePage() {
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchIncomes = useCallback(async () => {
    try {
      const res = await fetch('/api/income');
      const data = await res.json();
      setIncomes(data);
    } catch (error) {
      console.error("Failed to fetch incomes", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes]);

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      <IncomeToolbar onRecordIncome={() => setDrawerOpen(true)} />
      <IncomeFilters />
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <IncomeTable incomes={incomes} />
      )}

      <FastEntryDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        type="INCOME"
        onSuccess={fetchIncomes}
      />
    </div>
  );
}
