"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

// Modular Components
import { CustomerProfile } from "../components/CustomerProfile";
import { CustomerContacts } from "../components/CustomerContacts";
import { CustomerAddresses } from "../components/CustomerAddresses";
import { CustomerTimeline } from "../components/CustomerTimeline";
import { CustomerFinancialSummary } from "../components/CustomerFinancialSummary";
import { CustomerNotes } from "../components/CustomerNotes";
import { CustomerFiles } from "../components/CustomerFiles";
import { CustomerActivities } from "../components/CustomerActivities";
import { CustomerOrders } from "../components/CustomerOrders";
import { CustomerInvoices } from "../components/CustomerInvoices";
import { CustomerPayments } from "../components/CustomerPayments";
import { CustomerProjects } from "../components/CustomerProjects";
import { CustomerTags } from "../components/CustomerTags";

import { useUI } from "@/lib/contexts/UIContext";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { setPageTitleOverride } = useUI();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await fetch(`/api/crm/customers/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          const cust = data.customer || data;
          setCustomer(cust);
          if (cust) {
            const title = cust.name || cust.customerCode || 'Customer Details';
            setPageTitleOverride(title);
          }
        } else {
          router.push('/erp/crm/customers');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchCustomer();
    return () => setPageTitleOverride(null);
  }, [params.id, router, setPageTitleOverride]);

  if (loading) {
    return <PageContainer><div style={{ padding: '48px', textAlign: 'center' }}>Loading Customer Master...</div></PageContainer>;
  }

  if (!customer) return null;

  return (
    <PageContainer>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <button 
          onClick={() => router.push('/erp/crm/customers')}
          className="ios-back-button"
          style={{ width: 'fit-content', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '13px' }}
        >
          Back to Customers
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <PageHeader 
            title={customer.name || customer.displayName || 'Customer Details'}
            description={`Code: ${customer.customerCode || customer.id} | Status: ${customer.status || 'ACTIVE'}`}
          />

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => router.push(`/erp/crm/sales-orders/new?customerId=${customer.id}`)}
              className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add_shopping_cart</span>
              New Order
            </button>
            <button 
              onClick={() => router.push(`/erp/crm/customers/${customer.id}/edit`)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
              Edit Customer
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <CustomerTags tags={customer.tags || []} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid var(--border-main)', marginBottom: '24px', overflowX: 'auto', paddingBottom: '2px' }}>
        {['overview', 'financials', 'related', 'timeline', 'notes & files'].map(tab => (
          <div 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 0',
              cursor: 'pointer',
              color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
              fontWeight: activeTab === tab ? 600 : 500,
              textTransform: 'capitalize',
              fontSize: '14px',
              transition: 'all var(--transition-fast)',
              whiteSpace: 'nowrap'
            }}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: '500px' }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <CustomerProfile customer={customer} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              <CustomerContacts customer={customer} />
              <CustomerActivities customer={customer} />
            </div>
            <CustomerAddresses customer={customer} />
          </div>
        )}

        {activeTab === 'financials' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <CustomerFinancialSummary customer={customer} />
            <CustomerInvoices customer={customer} />
            <CustomerPayments customer={customer} />
          </div>
        )}

        {activeTab === 'related' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <CustomerOrders customer={customer} />
            <CustomerProjects />
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
            <CustomerTimeline />
          </div>
        )}

        {activeTab === 'notes & files' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
            <CustomerNotes customer={customer} />
            <CustomerFiles customer={customer} />
          </div>
        )}
      </div>

    </PageContainer>
  );
}
