"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

// Modular Components
import { LeadStatus } from "../components/LeadStatus";
import { LeadPriority } from "../components/LeadPriority";
import { LeadOwner } from "../components/LeadOwner";
import { LeadTags } from "../components/LeadTags";
import { LeadTimeline } from "../components/LeadTimeline";
import { LeadNotes } from "../components/LeadNotes";
import { LeadActivity } from "../components/LeadActivity";
import { LeadHistory } from "../components/LeadHistory";
import { LeadProgress } from "../components/LeadProgress";

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const handleStatusChange = (newStatus: string) => {
    setLead((prev: any) => ({ ...prev, status: newStatus }));
  };

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const res = await fetch(`/api/crm/leads/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setLead(data.lead);
        } else {
          router.push('/erp/crm/leads');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchLead();
  }, [params.id, router]);

  if (loading) {
    return (
      <PageContainer>
        <div style={{ padding: '48px', textAlign: 'center' }}>Loading Lead Details...</div>
      </PageContainer>
    );
  }

  if (!lead) return null;

  return (
    <PageContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <button 
            onClick={() => router.push('/erp/crm/leads')}
            style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}
          >
            &larr; Back to Leads
          </button>
          <PageHeader 
            title={lead.companyName}
            description={`Contact: ${lead.contactPerson} | ${lead.email || lead.phone}`}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ padding: '8px 16px', background: 'var(--success)', color: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', border: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
            Convert
          </button>
          <button 
            onClick={() => router.push(`/erp/crm/leads/${lead.id}/edit`)}
            style={{ padding: '8px 16px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', color: 'var(--text-main)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
            Edit
          </button>
        </div>
      </div>

      {/* Progress System */}
      <LeadProgress leadId={lead.id} currentStatus={lead.status} onStatusChange={handleStatusChange} />

      {/* Hero Section */}
      <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexWrap: 'wrap', gap: '32px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</span>
          <LeadStatus status={lead.status} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Priority</span>
          <LeadPriority priority={lead.priority} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assigned To</span>
          <LeadOwner ownerName={lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : null} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Value</span>
          <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(lead.expectedValue))}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tags</span>
          <LeadTags tags={lead.tags} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid var(--border-main)', marginBottom: '24px' }}>
        {['overview', 'timeline', 'notes', 'activities', 'history'].map(tab => (
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
              transition: 'all var(--transition-fast)'
            }}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: '400px' }}>
        {activeTab === 'overview' && (
          <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Company Details</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div><strong>Industry:</strong> {lead.industry || '-'}</div>
                <div><strong>Website:</strong> {lead.website ? <a href={lead.website} target="_blank" rel="noreferrer">{lead.website}</a> : '-'}</div>
                <div><strong>Address:</strong> {lead.address || '-'}</div>
                <div><strong>Source:</strong> {lead.leadSource || '-'}</div>
              </div>
            </div>
            <div>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Contact Person</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div><strong>Name:</strong> {lead.contactPerson}</div>
                <div><strong>Phone:</strong> {lead.phone}</div>
                <div><strong>Email:</strong> {lead.email || '-'}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
            <LeadTimeline activities={lead.activities || []} />
          </div>
        )}

        {activeTab === 'notes' && (
          <LeadNotes notes={lead.notes} />
        )}

        {activeTab === 'activities' && (
          <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Activities & Tasks</h4>
              <button style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                + Add Activity
              </button>
            </div>
            <LeadActivity />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
            <h4 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 600 }}>Audit History</h4>
            <LeadHistory />
          </div>
        )}
      </div>

    </PageContainer>
  );
}
