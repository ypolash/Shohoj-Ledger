"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ReserveDashboard } from './components/ReserveDashboard';

export default function ReservesPage() {
  const [data, setData] = useState<{ totalReserve: number; transactions: any[] }>({ totalReserve: 0, transactions: [] });
  const [loading, setLoading] = useState(true);

  const fetchReserves = useCallback(async () => {
    try {
      const res = await fetch('/api/reserves');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Failed to fetch reserves", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReserves();
  }, [fetchReserves]);

  const handleAction = async (type: string) => {
    const amountStr = window.prompt(`Enter amount to ${type.toLowerCase()}:`);
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert("Invalid amount");
      return;
    }
    const description = window.prompt("Enter reason:") || `Manual ${type}`;

    try {
      const res = await fetch('/api/reserves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, type, description })
      });
      if (res.ok) {
        fetchReserves();
      } else {
        alert("Failed to process transaction.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>Corporate Reserves</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Manage restricted and unrestricted equity reserves</p>
        </div>
      </div>
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <ReserveDashboard totalReserve={data.totalReserve} transactions={data.transactions} onAction={handleAction} />
      )}
    </div>
  );
}
