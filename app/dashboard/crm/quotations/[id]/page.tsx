"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

// Modular Components
import { QuotationStatus } from "../components/QuotationStatus";
import { QuotationItems } from "../components/QuotationItems";
import { QuotationTotals } from "../components/QuotationTotals";
import { QuotationTimeline } from "../components/QuotationTimeline";
import { QuotationHistory } from "../components/QuotationHistory";
import { QuotationNotes } from "../components/QuotationNotes";
import { QuotationAttachments } from "../components/QuotationAttachments";
import { QuotationTerms } from "../components/QuotationTerms";

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

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
    return <PageContainer><div style={{ padding: '48px', textAlign: 'center' }}>Loading Quotation...</div></PageContainer>;
  }

  if (!quotation) return null;

  return (
    <PageContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <button 
          onClick={() => router.push('/dashboard/crm/quotations')}
          className="btn btn-secondary"
          style={{ width: 'fit-content', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '13px', marginBottom: '16px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          Back to Quotations
        </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <PageHeader 
              title={quotation.quotationNo || `Quotation ${quotation.id.substring(0,8)}`}
              description={`Customer: ${quotation.customer?.customerName || 'Unknown'}`}
            />
            <div style={{ marginTop: '-8px' }}>
              <QuotationStatus status={quotation.status} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button style={{ padding: '8px 16px', background: 'var(--success-glow)', border: '1px solid var(--success)', color: 'var(--success)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>shopping_cart_checkout</span>
            Convert to Order
          </button>
          <button 
            onClick={() => router.push(`/dashboard/crm/quotations/preview?id=${quotation.id}`)}
            style={{ padding: '8px 16px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', color: 'var(--text-main)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>picture_as_pdf</span>
            Preview PDF
          </button>
          <button 
            onClick={() => router.push(`/dashboard/crm/quotations/${quotation.id}/edit`)}
            style={{ padding: '8px 16px', background: 'var(--primary)', border: 'none', color: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
            Edit
          </button>
        </div>
      </div>

      {/* KPI Header Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-card" style={{ padding: '16px', borderRadius: '12px', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Grand Total</div>
          <div style={{ marginTop: '8px', fontSize: '20px', fontWeight: 600, color: 'var(--text-main)' }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: quotation.currency || 'BDT', maximumFractionDigits: 0 }).format(quotation.grandTotal || quotation.totalAmount || 0)}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '16px', borderRadius: '12px', borderLeft: '4px solid var(--info)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Issue Date</div>
          <div style={{ marginTop: '8px', fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>
            {new Date(quotation.issueDate || quotation.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '16px', borderRadius: '12px', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Expiry Date</div>
          <div style={{ marginTop: '8px', fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>
            {quotation.expiryDate ? new Date(quotation.expiryDate).toLocaleDateString() : 'N/A'}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '16px', borderRadius: '12px', borderLeft: '4px solid var(--success)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Opportunity</div>
          <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>
            {quotation.opportunity?.name || '-'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid var(--border-main)', marginBottom: '24px', overflowX: 'auto', paddingBottom: '2px' }}>
        {['overview', 'timeline', 'attachments', 'history'].map(tab => (
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
            <QuotationItems items={quotation.items || []} readOnly={true} />
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', gap: '32px', flexWrap: 'wrap' }}>
              <QuotationTerms terms={quotation.terms} />
              
              <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', background: 'var(--surface-main)' }}>
                <QuotationTotals 
                  subtotal={quotation.subtotal || 0} 
                  totalDiscount={quotation.discount || 0} 
                  totalTax={quotation.tax || 0} 
                  grandTotal={quotation.grandTotal || quotation.totalAmount || 0} 
                />
              </div>
            </div>
            
            <div style={{ maxWidth: '600px' }}>
              <QuotationNotes />
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Activity Timeline</h4>
            <QuotationTimeline />
          </div>
        )}

        {activeTab === 'attachments' && (
          <QuotationAttachments />
        )}

        {activeTab === 'history' && (
          <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Audit Logs</h4>
            <QuotationHistory />
          </div>
        )}
      </div>

    </PageContainer>
  );
}
