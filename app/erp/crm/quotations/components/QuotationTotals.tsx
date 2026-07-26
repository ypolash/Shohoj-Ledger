"use client";

import React from 'react';

interface QuotationTotalsProps {
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
}

export function QuotationTotals({ subtotal, totalDiscount, totalTax, grandTotal }: QuotationTotalsProps) {
  const format = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(val);

  return (
    <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-main)' }}>
        <span>Subtotal</span>
        <span style={{ fontWeight: 500 }}>{format(subtotal)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
        <span>Discount</span>
        <span style={{ fontWeight: 500 }}>- {format(totalDiscount)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-main)' }}>
        <span>Tax (VAT)</span>
        <span style={{ fontWeight: 500 }}>+ {format(totalTax)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)', borderTop: '1px solid var(--border-main)', paddingTop: '12px', marginTop: '4px', fontSize: '18px', fontWeight: 'bold' }}>
        <span>Grand Total</span>
        <span>{format(grandTotal)}</span>
      </div>
    </div>
  );
}
