"use client";

import React from 'react';

export function BalanceSheetTree() {
  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid var(--border-main)', paddingBottom: '16px', marginBottom: '16px' }}}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Balance Sheet</h2>
        <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)' }}>
          As of July 26, 2026<br/>All amounts in BDT
        </div>
      </div>

      {/* Assets */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>Assets</h3>
        
        <div style={{ paddingLeft: '16px', borderLeft: '1px dashed var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Current Assets</span>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>14,500,000</span>
          </div>
          
          <div style={{ paddingLeft: '16px', borderLeft: '1px dashed var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '13px' }}>Cash and Cash Equivalents</span>
              <span style={{ fontSize: '13px' }}>2,500,000</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '13px' }}>Accounts Receivable</span>
              <span style={{ fontSize: '13px' }}>12,000,000</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', marginTop: '8px', borderTop: '1px solid var(--border-main)' }}>
          <span style={{ fontSize: '14px', fontWeight: 700 }}>Total Assets</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)' }}>14,500,000</span>
        </div>
      </div>

      {/* Liabilities */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase' }}>Liabilities</h3>
        
        <div style={{ paddingLeft: '16px', borderLeft: '1px dashed var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Current Liabilities</span>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>4,000,000</span>
          </div>
          
          <div style={{ paddingLeft: '16px', borderLeft: '1px dashed var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '13px' }}>Accounts Payable</span>
              <span style={{ fontSize: '13px' }}>1,500,000</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '13px' }}>Short Term Loans</span>
              <span style={{ fontSize: '13px' }}>2,500,000</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', marginTop: '8px', borderTop: '1px solid var(--border-main)' }}>
          <span style={{ fontSize: '14px', fontWeight: 700 }}>Total Liabilities</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--danger)' }}>4,000,000</span>
        </div>
      </div>

      {/* Equity */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase' }}>Equity</h3>
        
        <div style={{ paddingLeft: '16px', borderLeft: '1px dashed var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Owner's Equity</span>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>10,500,000</span>
          </div>
          
          <div style={{ paddingLeft: '16px', borderLeft: '1px dashed var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '13px' }}>Retained Earnings</span>
              <span style={{ fontSize: '13px' }}>6,000,000</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '13px' }}>Current Year Net Income</span>
              <span style={{ fontSize: '13px' }}>4,500,000</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', marginTop: '8px', borderTop: '1px solid var(--border-main)' }}>
          <span style={{ fontSize: '14px', fontWeight: 700 }}>Total Equity</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--success)' }}>10,500,000</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', marginTop: '16px', background: 'var(--surface-hover)', borderRadius: '8px' }}>
        <span style={{ fontSize: '15px', fontWeight: 800 }}>Total Liabilities & Equity</span>
        <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary)' }}>14,500,000</span>
      </div>
    </div>
  );
}
