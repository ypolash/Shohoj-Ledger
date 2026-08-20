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
          className="btn btn-secondary"
          style={ width: 'fit-content', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '13px', marginBottom: '16px' }
        >
          <span className="material-symbols-outlined" style={ fontSize: '18px' }>arrow_back</span>
          Back to Quotations
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
