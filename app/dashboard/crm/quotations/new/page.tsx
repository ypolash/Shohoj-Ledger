"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

// Modular Components
import { QuotationForm } from "../components/QuotationForm";

export default function CreateQuotationPage() {
  const router = useRouter();

  return (
    <PageContainer>
      <button 
        onClick={() => router.push('/dashboard/crm/quotations')}
        style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, marginBottom: '12px', background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        &larr; Back to Quotations
      </button>
      <PageHeader 
        title="Create Quotation"
        description="Build a new price quote for a customer or opportunity."
      />

      <div style={{ maxWidth: '1200px' }}>
        <QuotationForm />
      </div>
    </PageContainer>
  );
}
