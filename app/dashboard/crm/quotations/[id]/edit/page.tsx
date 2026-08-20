"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

// Modular Components
import { QuotationForm } from "../../components/QuotationForm";

export default function EditQuotationPage() {
  const params = useParams();
  const router = useRouter();
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const res = await fetch(`/api/crm/quotations/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setQuotation(data.quotation || data);
        } else {
          router.push('/dashboard/crm/quotations');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchQuotation();
  }, [params.id, router]);

  if (loading) {
    return <PageContainer><div style={{ padding: '48px', textAlign: 'center' }}>Loading...</div></PageContainer>;
  }

  return (
    <PageContainer>
      <button 
          onClick={() => router.push(`/dashboard/crm/quotations/${params.id}`)}
          className="btn btn-secondary"
          style={{ width: 'fit-content', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '13px', marginBottom: '16px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          Back to Quotation
        </button>
      <PageHeader 
        title={`Edit Quotation: ${quotation.quotationNo || quotation.id.substring(0,8)}`}
        description="Modify quotation items, terms, and status."
      />

      <div style={{ maxWidth: '1200px' }}>
        <QuotationForm initialData={quotation} isEdit={true} />
      </div>
    </PageContainer>
  );
}
