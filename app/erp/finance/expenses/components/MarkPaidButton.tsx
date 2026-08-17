"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export function MarkPaidButton({ expenseId, initialStatus }: { expenseId: string, initialStatus: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (initialStatus === 'APPROVED') {
    return (
      <button disabled style={{ padding: '10px 24px', borderRadius: '8px', background: 'var(--success-glow)', border: '1px solid var(--success)', color: 'var(--success)', fontSize: '13px', fontWeight: 600, cursor: 'not-allowed' }}>
        Paid
      </button>
    );
  }

  const handleMarkPaid = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/expenses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: expenseId, approvalStatus: 'APPROVED' })
      });
      if (!res.ok) throw new Error('Failed to update expense');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Failed to mark expense as paid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleMarkPaid}
      disabled={loading}
      style={{ padding: '10px 24px', borderRadius: '8px', background: 'var(--primary)', border: 'none', color: 'white', fontSize: '13px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
    >
      {loading ? 'Processing...' : 'Mark as Paid'}
    </button>
  );
}
