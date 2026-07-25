"use client";

import React from 'react';
import Link from 'next/link';
import { QuotationStatus } from './QuotationStatus';

interface QuotationTableProps {
  quotations: any[];
  onDelete?: (id: string) => void;
}

export function QuotationTable({ quotations, onDelete }: QuotationTableProps) {
  return (
    <div className="glass-card" style={{ overflowX: 'auto', borderRadius: '12px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
            <th style={{ padding: '16px 24px', fontWeight: 600 }}>Quotation No</th>
            <th style={{ padding: '16px 24px', fontWeight: 600 }}>Customer</th>
            <th style={{ padding: '16px 24px', fontWeight: 600 }}>Issue Date</th>
            <th style={{ padding: '16px 24px', fontWeight: 600 }}>Expiry Date</th>
            <th style={{ padding: '16px 24px', fontWeight: 600 }}>Total Amount</th>
            <th style={{ padding: '16px 24px', fontWeight: 600 }}>Status</th>
            <th style={{ padding: '16px 24px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '14px' }}>
          {quotations.map((quote) => (
            <tr key={quote.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background var(--transition-fast)' }} className="hover-row">
              <td style={{ padding: '16px 24px' }}>
                <Link href={`/dashboard/crm/quotations/${quote.id}`} style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>
                  {quote.quotationNo || quote.id.substring(0, 8)}
                </Link>
              </td>
              <td style={{ padding: '16px 24px', color: 'var(--text-main)', fontWeight: 500 }}>
                {quote.customer?.customerName || '-'}
              </td>
              <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>
                {new Date(quote.issueDate || quote.createdAt).toLocaleDateString()}
              </td>
              <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>
                {quote.expiryDate ? new Date(quote.expiryDate).toLocaleDateString() : '-'}
              </td>
              <td style={{ padding: '16px 24px', fontWeight: 600 }}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: quote.currency || 'BDT', maximumFractionDigits: 0 }).format(quote.grandTotal || quote.totalAmount || 0)}
              </td>
              <td style={{ padding: '16px 24px' }}>
                <QuotationStatus status={quote.status} />
              </td>
              <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <Link href={`/dashboard/crm/quotations/preview?id=${quote.id}`}>
                    <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} title="Preview PDF">
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>picture_as_pdf</span>
                    </button>
                  </Link>
                  <Link href={`/dashboard/crm/quotations/${quote.id}/edit`}>
                    <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} title="Edit">
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit</span>
                    </button>
                  </Link>
                  <button onClick={() => onDelete && onDelete(quote.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)' }} title="Delete">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <style dangerouslySetInnerHTML={{__html: `
        .hover-row:hover { background: var(--surface-hover); }
      `}} />
    </div>
  );
}
