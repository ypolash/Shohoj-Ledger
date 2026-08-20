"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

// Modular Components
import { SalesOrderForm } from "../components/SalesOrderForm";

export default function CreateSalesOrderPage() {
  const router = useRouter();

  return (
    <PageContainer>
      <button 
          onClick={() => router.push('/dashboard/crm/sales-orders')}
          className="btn btn-secondary"
          style={{ width: 'fit-content', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '13px', marginBottom: '16px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          Back to Sales Orders
        </button>
      <PageHeader 
        title="Create Sales Order"
        description="Record a new confirmed order for processing and fulfillment."
      />

      <div style={{ maxWidth: '1200px' }}>
        <SalesOrderForm />
      </div>
    </PageContainer>
  );
}
