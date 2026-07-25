import React from 'react';
import { FundHistory } from './components/FundHistory';

export default function FundsPage() {
  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>Fund Management</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Inter-account transfers and liquidity</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ padding: '10px 24px', borderRadius: '8px', background: 'var(--primary)', border: 'none', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>New Transfer</button>
        </div>
      </div>
      <FundHistory />
    </div>
  );
}
