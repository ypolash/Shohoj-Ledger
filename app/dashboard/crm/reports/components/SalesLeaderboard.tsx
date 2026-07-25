"use client";

import React from 'react';

export function SalesLeaderboard() {
  const users = [
    { rank: 1, name: 'Jane Smith', deals: 45, revenue: 15200000, conversion: 32 },
    { rank: 2, name: 'Robert Chen', deals: 38, revenue: 12400000, conversion: 28 },
    { rank: 3, name: 'Emily Davis', deals: 29, revenue: 9800000, conversion: 24 },
    { rank: 4, name: 'Michael Brown', deals: 16, revenue: 7800000, conversion: 18 }
  ];

  const maxRev = users[0].revenue;

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Sales Leaderboard</h3>
        <select style={{ background: 'var(--surface-hover)', border: 'none', color: 'var(--text-main)', fontSize: '12px', padding: '4px 8px', borderRadius: '4px', outline: 'none' }}>
          <option>This Quarter</option>
          <option>This Month</option>
          <option>This Year</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {users.map((user) => (
          <div key={user.rank} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '50%', 
              background: user.rank === 1 ? 'var(--warning)' : user.rank === 2 ? '#C0C0C0' : user.rank === 3 ? '#CD7F32' : 'var(--surface-hover)',
              color: user.rank <= 3 ? 'white' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '14px'
            }}>
              {user.rank}
            </div>
            
            <div style={{ width: '120px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{user.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.deals} Deals ({user.conversion}%)</div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ height: '8px', background: 'var(--surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: \`\${(user.revenue / maxRev) * 100}%\`, background: 'var(--primary)', borderRadius: '4px' }}></div>
              </div>
            </div>

            <div style={{ width: '100px', textAlign: 'right', fontWeight: 600, fontSize: '13px', color: 'var(--text-main)' }}>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', notation: 'compact' }).format(user.revenue)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
