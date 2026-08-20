"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

// Modular Components
import { OpportunityValue } from "../components/OpportunityValue";
import { OpportunityProbability } from "../components/OpportunityProbability";
import { OpportunityOwner } from "../components/OpportunityOwner";
import { OpportunityTimeline } from "../components/OpportunityTimeline";
import { OpportunityActivities } from "../components/OpportunityActivities";
import { OpportunityNotes } from "../components/OpportunityNotes";
import { OpportunityProducts } from "../components/OpportunityProducts";
import { OpportunityHistory } from "../components/OpportunityHistory";

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [opportunity, setOpportunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchOpportunity = async () => {
      try {
        const res = await fetch(`/api/crm/opportunities/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setOpportunity(data.opportunity || data);
        } else {
          router.push('/erp/crm/opportunities');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchOpportunity();
  }, [params.id, router]);

  if (loading) {
    return <PageContainer><div style={{ padding: '48px', textAlign: 'center' }}>Loading Opportunity...</div></PageContainer>;
  }

  if (!opportunity) return null;

  return (
    <PageContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <button 
          onClick={() => router.push('/erp/crm/opportunities')}
          className="btn btn-secondary"
          style={{ width: 'fit-content', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '13px', marginBottom: '16px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          Back to Opportunities
        </button>
          <PageHeader 
            title={opportunity.name}
            description={`Customer: ${opportunity.customer?.customerName || 'Unknown'} | Stage: ${opportunity.stage?.name || 'New'}`}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button style={{ padding: '8px 16px', background: 'var(--success-glow)', border: '1px solid var(--success)', color: 'var(--success)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>done_all</span>
            Mark as Won
          </button>
          <button style={{ padding: '8px 16px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', color: 'var(--text-main)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>receipt_long</span>
            Create Quote
          </button>
          <button 
            onClick={() => router.push(`/erp/crm/opportunities/${opportunity.id}/edit`)}
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
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Expected Revenue</div>
          <div style={{ marginTop: '8px' }}>
            <OpportunityValue amount={opportunity.expectedRevenue} currency={opportunity.currency} size="lg" />
          </div>
        </div>
        <div className="glass-card" style={{ padding: '16px', borderRadius: '12px', borderLeft: '4px solid var(--info)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Probability</div>
          <OpportunityProbability probability={opportunity.probability || 0} />
        </div>
        <div className="glass-card" style={{ padding: '16px', borderRadius: '12px', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Expected Close</div>
          <div style={{ marginTop: '8px', fontSize: '18px', fontWeight: 600, color: 'var(--text-main)' }}>
            {new Date(opportunity.expectedCloseDate).toLocaleDateString()}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '16px', borderRadius: '12px', borderLeft: '4px solid var(--success)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Owner</div>
          <OpportunityOwner ownerName={opportunity.owner?.name || opportunity.ownerId} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid var(--border-main)', marginBottom: '24px', overflowX: 'auto', paddingBottom: '2px' }}>
        {['overview', 'timeline', 'products & quotes', 'history'].map(tab => (
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Details</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Lead Source:</span>
                    <span style={{ fontWeight: 500 }}>{opportunity.leadSource || '-'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Priority:</span>
                    <span style={{ fontWeight: 500 }}>{opportunity.priority || 'Normal'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Next Step:</span>
                    <span style={{ fontWeight: 500 }}>{opportunity.nextStep || 'Follow up'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Description:</span>
                  </div>
                  <p style={{ margin: 0, padding: '12px', background: 'var(--surface-hover)', borderRadius: '8px' }}>
                    {opportunity.description || 'No description provided.'}
                  </p>
                </div>
              </div>
              <OpportunityNotes />
            </div>
            <div>
              <OpportunityActivities />
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Activity Timeline</h4>
            <OpportunityTimeline />
          </div>
        )}

        {activeTab === 'products & quotes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <OpportunityProducts />
            {/* Quotes would go here */}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Audit Logs</h4>
            <OpportunityHistory />
          </div>
        )}
      </div>

    </PageContainer>
  );
}
