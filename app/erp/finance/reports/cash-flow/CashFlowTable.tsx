"use client";

import React from 'react';

export function CashFlowTable() {
  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid var(--border-main)', paddingBottom: '16px', marginBottom: '16px' }}}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Statement of Cash Flows</h2>
        <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)' }}>
          Period: July 1 - July 26, 2026<br/>All amounts in BDT
        </div>
      </div>

      {/* Operating Activities */}
      <div style={{ marginBottom: '16px' }}}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>Operating Activities</h3>
        <div style={{ paddingLeft: '16px', borderLeft: '1px dashed var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '13px' }}>Net Income</span>
            <span style={{ fontSize: '13px' }}>4,600,000</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '13px' }}>Adjustments to reconcile Net Income</span>
            <span style={{ fontSize: '13px' }}>250,000</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '13px' }}>Changes in Accounts Receivable</span>
            <span style={{ fontSize: '13px', color: 'var(--danger)' }}>(500,000)</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', marginTop: '8px', borderTop: '1px solid var(--border-light)' }}>
          <span style={{ fontSize: '13px', fontWeight: 700 }}>Net Cash from Operating Activities</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>4,350,000</span>
        </div>
      </div>

      {/* Investing Activities */}
      <div style={{ marginBottom: '16px' }}}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase' }}>Investing Activities</h3>
        <div style={{ paddingLeft: '16px', borderLeft: '1px dashed var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '13px' }}>Purchase of Equipment</span>
            <span style={{ fontSize: '13px', color: 'var(--danger)' }}>(1,200,000)</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', marginTop: '8px', borderTop: '1px solid var(--border-light)' }}>
          <span style={{ fontSize: '13px', fontWeight: 700 }}>Net Cash from Investing Activities</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--danger)' }}>(1,200,000)</span>
        </div>
      </div>

      {/* Financing Activities */}
      <div style={{ marginBottom: '16px' }}}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase' }}>Financing Activities</h3>
        <div style={{ paddingLeft: '16px', borderLeft: '1px dashed var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '13px' }}>Proceeds from Bank Loan</span>
            <span style={{ fontSize: '13px' }}>5,000,000</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', marginTop: '8px', borderTop: '1px solid var(--border-light)' }}>
          <span style={{ fontSize: '13px', fontWeight: 700 }}>Net Cash from Financing Activities</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--success)' }}>5,000,000</span>
        </div>
      </div>

      {/* Net Increase */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', marginTop: '24px', background: 'var(--surface-hover)', borderRadius: '8px', border: '1px solid var(--border-main)' }}>
        <span style={{ fontSize: '15px', fontWeight: 800 }}>Net Increase in Cash</span>
        <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--success)' }}>8,150,000</span>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 16px 0 16px', color: 'var(--text-muted)' }}>
        <span style={{ fontSize: '13px', fontWeight: 600 }}>Cash at Beginning of Period</span>
        <span style={{ fontSize: '13px', fontWeight: 600 }}>1,500,000</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', color: 'var(--text-main)' }}>
        <span style={{ fontSize: '13px', fontWeight: 800 }}>Cash at End of Period</span>
        <span style={{ fontSize: '13px', fontWeight: 800 }}>9,650,000</span>
      </div>
    </div>
  );
}
