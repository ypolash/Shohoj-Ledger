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
          router.push('/dashboard/crm/sales-orders');
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
          onClick={() => router.push(`/dashboard/crm/sales-orders/${params.id}`)}
          className="btn btn-secondary"
          style={ width: 'fit-content', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '13px', marginBottom: '16px' }
        >
          <span className="material-symbols-outlined" style={ fontSize: '18px' }>arrow_back</span>
          Back to Sales Order
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
