"use client";

import React, { useState } from 'react';

export function JournalEntry() {
  const [lines, setLines] = useState([
    { id: 1, account: '', debit: 0, credit: 0, memo: '' },
    { id: 2, account: '', debit: 0, credit: 0, memo: '' },
  ]);

  const totalDebit = lines.reduce((acc, line) => acc + (Number(line.debit) || 0), 0);
  const totalCredit = lines.reduce((acc, line) => acc + (Number(line.credit) || 0), 0);
  const diff = Math.abs(totalDebit - totalCredit);
  const isBalanced = diff === 0 && totalDebit > 0;

  const addLine = () => {
    setLines([...lines, { id: Date.now(), account: '', debit: 0, credit: 0, memo: '' }]);
  };

  const updateLine = (id: number, field: string, value: string | number) => {
    setLines(lines.map(line => line.id === id ? { ...line, [field]: value } : line));
  };

  const removeLine = (id: number) => {
    if (lines.length > 2) {
      setLines(lines.filter(l => l.id !== id));
    }
  };

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <h2 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 600 }}>Create Journal Entry</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Posting Date <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input type="date" style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '13px' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Reference No</label>
          <input type="text" placeholder="e.g. INV-1002" style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '13px' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Journal Description</label>
          <input type="text" placeholder="Main description..." style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '13px' }} />
        </div>
      </div>

      <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600 }}>Journal Lines</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '16px' }}}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
            <th style={{ padding: '12px 16px', fontWeight: 600, width: '30%' }}>Account <span style={{ color: 'var(--danger)' }}>*</span></th>
            <th style={{ padding: '12px 16px', fontWeight: 600 }}>Memo / Details</th>
            <th style={{ padding: '12px 16px', fontWeight: 600, width: '150px' }}>Debit (BDT)</th>
            <th style={{ padding: '12px 16px', fontWeight: 600, width: '150px' }}>Credit (BDT)</th>
            <th style={{ padding: '12px 16px', fontWeight: 600, width: '60px', textAlign: 'center' }}>Act</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '13px' }}>
          {lines.map((line) => (
            <tr key={line.id}>
              <td style={{ padding: '8px 16px' }}>
                <select 
                  value={line.account} onChange={e => updateLine(line.id, 'account', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-main)', color: 'var(--text-main)' }}>
                  <option value="">Select Account...</option>
                  <option value="1000-02">1000-02 City Bank (Main)</option>
                  <option value="4000-01">4000-01 Product Sales</option>
                  <option value="5000-01">5000-01 Office Supplies</option>
                </select>
              </td>
              <td style={{ padding: '8px 16px' }}>
                <input type="text" placeholder="Line memo..." value={line.memo} onChange={e => updateLine(line.id, 'memo', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-main)', color: 'var(--text-main)' }} />
              </td>
              <td style={{ padding: '8px 16px' }}>
                <input type="number" min="0" value={line.debit} onChange={e => updateLine(line.id, 'debit', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-main)', color: 'var(--text-main)', textAlign: 'right' }} />
              </td>
              <td style={{ padding: '8px 16px' }}>
                <input type="number" min="0" value={line.credit} onChange={e => updateLine(line.id, 'credit', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-main)', color: 'var(--text-main)', textAlign: 'right' }} />
              </td>
              <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                <button type="button" onClick={() => removeLine(line.id)} disabled={lines.length <= 2}
                  style={{ background: 'transparent', border: 'none', color: lines.length > 2 ? 'var(--danger)' : 'var(--border-light)', cursor: lines.length > 2 ? 'pointer' : 'not-allowed' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button type="button" onClick={addLine} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '12px', cursor: 'pointer', marginBottom: '32px' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
        Add Line
      </button>

      {/* Validation Summary */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ width: '350px', background: 'var(--surface-hover)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Debit:</span>
            <span style={{ color: 'var(--text-main)' }}>{new Intl.NumberFormat('en-US').format(totalDebit)} BDT</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Credit:</span>
            <span style={{ color: 'var(--text-main)' }}>{new Intl.NumberFormat('en-US').format(totalCredit)} BDT</span>
          </div>
          <div style={{ height: '1px', background: 'var(--border-main)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700 }}>
            <span style={{ color: 'var(--text-main)' }}>Difference:</span>
            <span style={{ color: diff === 0 ? 'var(--success)' : 'var(--danger)' }}>{new Intl.NumberFormat('en-US').format(diff)} BDT</span>
          </div>
          
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
            background: isBalanced ? 'var(--success-glow)' : 'var(--danger-glow)',
            color: isBalanced ? 'var(--success)' : 'var(--danger)', marginTop: '8px'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              {isBalanced ? 'check_circle' : 'error'}
            </span>
            {isBalanced ? 'Journal entry is balanced.' : 'Debit and Credit must be equal.'}
          </div>
        </div>
      </div>
    </div>
  );
}
