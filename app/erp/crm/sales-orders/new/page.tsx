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
        onClick={() => router.push('/erp/crm/sales-orders')}
        style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, marginBottom: '12px', background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        &larr; Back to Sales Orders
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
