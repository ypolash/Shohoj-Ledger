"use client";

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

// Modular Components
import { SalesOrderForm } from "../components/SalesOrderForm";

function CreateSalesOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customerId') || '';

  return (
    <PageContainer>
      <button 
          onClick={() => router.push('/erp/crm/sales-orders')}
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
        <SalesOrderForm initialData={{ customerId }} />
      </div>
    </PageContainer>
  );
}

export default function CreateSalesOrderPage() {
  return (
    <Suspense fallback={<PageContainer><div style={{ padding: '48px', textAlign: 'center' }}>Loading...</div></PageContainer>}>
      <CreateSalesOrderContent />
    </Suspense>
  );
}
