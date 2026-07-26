"use client";

import React from 'react';

export function IncomeExpenseChart() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const income = [12, 14, 13, 16, 18, 15];
  const expense = [8, 9, 7, 10, 11, 9];

  const maxVal = Math.max(...income, ...expense) * 1.2;

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 600 }}>Income vs Expense (YTD)</h3>
      
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', paddingBottom: '24px' }}>
        {months.map((m, i) => (
          <div key={m} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
            <div style={{ height: '200px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '4px' }}>
              <div style={{ width: '40%', height: `${(income[i] / maxVal) * 100}%`, background: 'var(--primary)', borderRadius: '4px 4px 0 0' }} title={`Income: ${income[i]}M`}></div>
              <div style={{ width: '40%', height: `${(expense[i] / maxVal) * 100}%`, background: 'var(--danger)', borderRadius: '4px 4px 0 0' }} title={`Expense: ${expense[i]}M`}></div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m}</div>
          </div>
        ))}
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--primary)' }}></div>
          <span style={{ color: 'var(--text-muted)' }}>Income</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--danger)' }}></div>
          <span style={{ color: 'var(--text-muted)' }}>Expense</span>
        </div>
      </div>
    </div>
  );
}
