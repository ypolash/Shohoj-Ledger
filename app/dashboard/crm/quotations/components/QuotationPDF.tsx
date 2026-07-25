"use client";

import React from 'react';

interface QuotationPDFProps {
  quotation: any;
}

export function QuotationPDF({ quotation }: QuotationPDFProps) {
  const items = quotation.items || [
    { id: 1, description: 'Enterprise License Tier 1', quantity: 50, unitPrice: 5000, total: 250000 },
    { id: 2, description: 'Implementation & Onboarding', quantity: 1, unitPrice: 150000, total: 150000 }
  ];

  const format = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(val);

  return (
    <div style={{ 
      background: 'white', 
      color: '#333', 
      padding: '48px', 
      borderRadius: '8px', 
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'sans-serif'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #eaeaea', paddingBottom: '24px', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#111', fontWeight: 800, letterSpacing: '-0.5px' }}>SHOHOJ LEDGER</h1>
          <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>Enterprise ERP Solutions</p>
          <div style={{ marginTop: '16px', fontSize: '12px', color: '#777', lineHeight: 1.5 }}>
            123 Business Avenue<br />
            Dhaka, Bangladesh 1212<br />
            contact@shohojledger.com
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ margin: 0, fontSize: '32px', color: '#ccc', textTransform: 'uppercase', letterSpacing: '2px' }}>Quotation</h2>
          <div style={{ marginTop: '16px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div><strong>Quote #:</strong> {quotation.quotationNo || 'QT-2026-001'}</div>
            <div><strong>Issue Date:</strong> {new Date().toLocaleDateString()}</div>
            <div><strong>Expiry Date:</strong> {new Date(Date.now() + 86400000*30).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', fontSize: '14px' }}>
        <div>
          <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#999', margin: '0 0 8px 0' }}>Prepared For:</h3>
          <div style={{ fontWeight: 600, color: '#111' }}>{quotation.customer?.customerName || 'Acme Corporation'}</div>
          <div style={{ color: '#555', marginTop: '4px', lineHeight: 1.5 }}>
            Attn: John Doe<br />
            456 Corporate Blvd<br />
            Dhaka, Bangladesh
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
        <thead>
          <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', color: '#555' }}>Description</th>
            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', textTransform: 'uppercase', color: '#555' }}>Qty</th>
            <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', textTransform: 'uppercase', color: '#555' }}>Unit Price</th>
            <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', textTransform: 'uppercase', color: '#555' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '16px', fontSize: '14px' }}>{item.description}</td>
              <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px' }}>{item.quantity}</td>
              <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px' }}>{format(item.unitPrice)}</td>
              <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: 600 }}>{format(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '48px' }}>
        <div style={{ width: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px', borderBottom: '1px solid #eee' }}>
            <span style={{ color: '#666' }}>Subtotal</span>
            <span style={{ fontWeight: 600 }}>{format(400000)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px', borderBottom: '1px solid #eee' }}>
            <span style={{ color: '#666' }}>Tax (15%)</span>
            <span style={{ fontWeight: 600 }}>{format(60000)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', fontSize: '20px', fontWeight: 'bold', color: '#111' }}>
            <span>Grand Total</span>
            <span>{format(460000)}</span>
          </div>
        </div>
      </div>

      {/* Footer / Terms */}
      <div style={{ borderTop: '2px solid #eaeaea', paddingTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ maxWidth: '60%' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#111' }}>Terms & Conditions</h4>
          <p style={{ margin: 0, fontSize: '12px', color: '#666', lineHeight: 1.5 }}>
            1. Quotation valid for 30 days from date of issue.<br />
            2. Payment terms: 50% advance, 50% upon delivery.<br />
            3. All prices are inclusive of standard taxes unless specified otherwise.
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '150px', height: '60px', borderBottom: '1px solid #111', marginBottom: '8px' }}></div>
          <span style={{ fontSize: '12px', color: '#555' }}>Authorized Signature</span>
        </div>
      </div>
    </div>
  );
}
