"use client";

import React, { useState, useEffect } from 'react';

type Bonus = {
  employeeId: string;
  employeeName: string;
  bonusAmount: number;
  bonusReason: string;
  bonusDate: string;
};

export default function BonusesPage() {
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBonuses() {
      try {
        const res = await fetch('/api/staff/bonus');
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to fetch bonuses');
        }
        const data = await res.json();
        setBonuses(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchBonuses();
  }, []);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', fontFamily: 'serif' }}>Bonuses</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#94a3b8' }}>Manage and view employee bonuses</p>
        </div>
      </div>

      <div className="glass-card topo-bg" style={{ padding: '24px', borderRadius: '16px', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading bonuses...</div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>Error: {error}</div>
        ) : bonuses.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No data found</div>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '12px 16px', fontWeight: '500' }}>Employee</th>
                <th style={{ padding: '12px 16px', fontWeight: '500' }}>Amount</th>
                <th style={{ padding: '12px 16px', fontWeight: '500' }}>Reason</th>
                <th style={{ padding: '12px 16px', fontWeight: '500' }}>Date</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '14px' }}>
              {bonuses.map((bonus, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '500', color: '#f8fafc' }}>{bonus.employeeName}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>ID: {bonus.employeeId}</div>
                  </td>
                  <td style={{ padding: '16px', fontWeight: '600', color: '#10b981' }}>
                    ৳{bonus.bonusAmount.toLocaleString()}
                  </td>
                  <td style={{ padding: '16px', color: '#e2e8f0' }}>{bonus.bonusReason}</td>
                  <td style={{ padding: '16px', color: '#94a3b8' }}>
                    {new Date(bonus.bonusDate).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
