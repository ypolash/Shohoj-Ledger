"use client";

import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { ReportWrapper } from '@/components/reports/ReportWrapper';

export default function ReportsPage() {
  const [reportData] = useState<any[]>([]); // Placeholder data
  
  const filters = (
    <>
      <div style={{ flex: '1 1 200px' }}>
        <label className="label">Report Type</label>
        <select className="input">
          <option value="SUPPLIER_PERFORMANCE">Supplier Performance</option>
          <option value="PURCHASE_ORDERS">Purchase Orders Summary</option>
          <option value="PAYABLES">Accounts Payable</option>
          <option value="GOODS_RECEIPTS">Goods Receipts</option>
        </select>
      </div>
      <div style={{ flex: '1 1 150px' }}>
        <label className="label">Supplier</label>
        <select className="input">
          <option value="ALL">All Suppliers</option>
        </select>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '4px' }}>
        <button className="btn btn-primary">Generate</button>
      </div>
    </>
  );

  return (
    <PageContainer>
      <PageHeader 
        title="Procurement Reports" 
        description="Manage enterprise reports and track supplier metrics."
      />
      
      <ReportWrapper 
        title="Procurement Report"
        data={reportData}
        columns={['Reference ID', 'Details', 'Status', 'Date']}
        filters={filters}
      >
        <table className="table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Reference ID</th>
              <th>Details</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5 }}>local_shipping</span>
                  <p style={{ margin: 0 }}>No reports records found.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </ReportWrapper>
    </PageContainer>
  );
}
