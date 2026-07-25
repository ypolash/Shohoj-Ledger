import React from 'react';
import { LoanTable } from './components/LoanTable';

export default function LoansPage() {
  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>Corporate Loans</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Manage external liabilities and bank loans</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ padding: '10px 24px', borderRadius: '8px', background: 'var(--primary)', border: 'none', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Record Loan</button>
        </div>
      </div>
      <LoanTable />
    </div>
  );
}
