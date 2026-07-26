"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

// Modular Components
import { SalesOrderForm } from "../../components/SalesOrderForm";

export default function EditSalesOrderPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/crm/sales-orders/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data.order || data);
        } else {
          router.push('/erp/crm/sales-orders');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchOrder();
  }, [params.id, router]);

  if (loading) {
    return <PageContainer><div style={{ padding: '48px', textAlign: 'center' }}>Loading...</div></PageContainer>;
  }

  return (
    <PageContainer>
      <button 
        onClick={() => router.push(`/erp/crm/sales-orders/${params.id}`)}
        style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, marginBottom: '12px', background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        &larr; Back to Sales Order
      </button>
      <PageHeader 
        title={`Edit Order: ${order.orderNo || order.id.substring(0,8)}`}
        description="Modify order items, status, and dates."
      />

      <div style={{ maxWidth: '1200px' }}>
        <SalesOrderForm initialData={order} isEdit={true} />
      </div>
    </PageContainer>
  );
}
