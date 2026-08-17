"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { FundHistory } from './components/FundHistory';

export default function FundsPage() {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFunds = useCallback(async () => {
    try {
      const res = await fetch('/api/funds');
      const data = await res.json();
      setFunds(data.funds || []);
    } catch (error) {
      console.error("Failed to fetch funds", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFunds();
  }, [fetchFunds]);

  const handleAddFund = async () => {
    const amountStr = window.prompt("Enter amount to add:");
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert("Invalid amount");
      return;
    }
    const source = window.prompt("Enter source (e.g., Shareholder, Investor):") || "Internal";
    const description = window.prompt("Enter description:") || "Fund added";

    try {
      const res = await fetch('/api/funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, source, description })
      });
      if (res.ok) {
        fetchFunds();
      } else {
        alert("Failed to add fund");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>Fund Management</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Inter-account transfers and liquidity</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleAddFund} style={{ padding: '10px 24px', borderRadius: '8px', background: 'var(--primary)', border: 'none', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            Add Funds
          </button>
        </div>
      </div>
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <FundHistory funds={funds} />
      )}
    </div>
  );
}
