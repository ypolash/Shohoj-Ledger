"use client";

import React from 'react';

export function ProfitLossTable() {
  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid var(--border-main)', paddingBottom: '16px', marginBottom: '16px' }}}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Profit & Loss (Income Statement)</h2>
        <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)' }}>
          Period: July 1 - July 26, 2026<br/>All amounts in BDT
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>Operating Income</h3>
        <div style={{ paddingLeft: '16px', borderLeft: '1px dashed var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '13px' }}>Sales Revenue</span>
            <span style={{ fontSize: '13px' }}>8,500,000</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '13px' }}>Service Income</span>
            <span style={{ fontSize: '13px' }}>1,200,000</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', marginTop: '8px', borderTop: '1px solid var(--border-light)' }}>
          <span style={{ fontSize: '13px', fontWeight: 700 }}>Total Operating Income</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>9,700,000</span>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase' }}>Cost of Goods Sold</h3>
        <div style={{ paddingLeft: '16px', borderLeft: '1px dashed var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '13px' }}>Direct Materials</span>
            <span style={{ fontSize: '13px' }}>3,500,000</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', marginTop: '8px', borderTop: '1px solid var(--border-light)' }}>
          <span style={{ fontSize: '13px', fontWeight: 700 }}>Total COGS</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--warning)' }}>3,500,000</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', marginBottom: '24px', background: 'var(--surface-hover)', borderRadius: '6px' }}>
        <span style={{ fontSize: '14px', fontWeight: 700 }}>Gross Profit</span>
        <span style={{ fontSize: '14px', fontWeight: 700 }}>6,200,000</span>
      </div>

      <div style={{ marginBottom: '16px' }}}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase' }}>Operating Expenses</h3>
        <div style={{ paddingLeft: '16px', borderLeft: '1px dashed var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '13px' }}>Payroll Expense</span>
            <span style={{ fontSize: '13px' }}>1,200,000</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '13px' }}>Rent & Utilities</span>
            <span style={{ fontSize: '13px' }}>250,000</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '13px' }}>Marketing</span>
            <span style={{ fontSize: '13px' }}>150,000</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', marginTop: '8px', borderTop: '1px solid var(--border-light)' }}>
          <span style={{ fontSize: '13px', fontWeight: 700 }}>Total Operating Expenses</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--danger)' }}>1,600,000</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', marginTop: '24px', background: 'var(--success-glow)', border: '1px solid var(--success)', borderRadius: '8px' }}>
        <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--success)' }}>Net Profit</span>
        <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--success)' }}>4,600,000</span>
      </div>
    </div>
  );
}
