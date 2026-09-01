"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";

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
  const [converting, setConverting] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

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
      console.error("Failed to load lead details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) fetchLead();
  }, [params.id]);

  const handleStatusChange = (newStatus: string) => {
    setLead((prev: any) => ({ ...prev, status: newStatus }));
    fetchLead(); // Refresh activities and timeline
  };

  const handleConvert = async () => {
    if (!confirm(`Are you sure you want to convert "${lead.companyName}" to a Customer account?`)) return;
    setConverting(true);
    try {
      const res = await fetch(`/api/crm/leads/${params.id}/convert`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        router.push(`/erp/crm/customers/${data.customer.id}`);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to convert lead.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while converting the lead.");
    } finally {
      setConverting(false);
    }
  };

  const handleQuickAddNote = async () => {
    if (!quickNote.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/crm/leads/${params.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'NOTE', description: quickNote })
      });
      if (res.ok) {
        setQuickNote('');
        fetchLead();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleCopyPhone = () => {
    if (lead?.phone) {
      navigator.clipboard.writeText(lead.phone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px', animation: 'spin 1s linear infinite', color: 'var(--primary)' }}>
            autorenew
          </span>
          <p style={{ marginTop: '12px', fontSize: '15px', fontWeight: 600 }}>Loading Lead Profile...</p>
        </div>
      </PageContainer>
    );
  }

  if (!lead) return null;

  const leadVal = Number(lead.expectedValue || lead.estimatedValue || 0);
  const formattedVal = new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT' }).format(leadVal);

  const getStageProbability = (status: string) => {
    const map: Record<string, string> = {
      New: '15%',
      Contacted: '30%',
      Qualified: '50%',
      Proposal: '70%',
      Negotiation: '85%',
      Won: '100%',
      Lost: '0%'
    };
    return map[status] || '20%';
  };

  const isConverted = lead.leadStatus === 'CONVERTED';
  const cleanPhone = (lead.phone || '').replace(/\D/g, '');
  const initials = (lead.companyName || lead.contactPerson || 'LD')
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

  return (
    <PageContainer>
      {/* 1. Breadcrumb & Back Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <button
            onClick={() => router.push('/erp/crm/leads')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-main)',
              background: 'var(--surface-main)',
              color: 'var(--text-main)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
            Back to Leads
          </button>
          <span>/</span>
          <span>CRM</span>
          <span>/</span>
          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{lead.companyName}</span>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Created: <strong>{new Date(lead.createdAt).toLocaleDateString()}</strong>
        </div>
      </div>

      {/* 2. Hero Header Card */}
      <div
        style={{
          background: 'var(--surface-main)',
          border: '1px solid var(--border-main)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        {/* Left Avatar & Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', minWidth: '300px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 700,
              boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.4)',
              flexShrink: 0
            }}
          >
            {initials}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                {lead.companyName}
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'var(--bg-main)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-main)'
                }}
              >
                #{lead.id ? lead.id.slice(0, 8) : 'LEAD'}
              </span>
              <LeadStatus status={lead.status} />
              <LeadPriority priority={lead.priority} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', fontSize: '13px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>person</span>
                <strong>{lead.contactPerson}</strong>
              </span>
              {lead.phone && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--success)' }}>call</span>
                  {lead.phone}
                </span>
              )}
              {lead.email && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--info)' }}>mail</span>
                  {lead.email}
                </span>
              )}
              {lead.leadSource && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--warning)' }}>campaign</span>
                  Source: {lead.leadSource}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                borderRadius: '10px',
                background: 'var(--surface-hover)',
                border: '1px solid var(--border-main)',
                color: 'var(--text-main)',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '17px', color: 'var(--success)' }}>call</span>
              Call
            </a>
          )}

          {lead.phone && (
            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                borderRadius: '10px',
                background: 'rgba(37, 211, 102, 0.1)',
                border: '1px solid rgba(37, 211, 102, 0.3)',
                color: '#16a34a',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>chat</span>
              WhatsApp
            </a>
          )}

          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                borderRadius: '10px',
                background: 'var(--surface-hover)',
                border: '1px solid var(--border-main)',
                color: 'var(--text-main)',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '17px', color: 'var(--info)' }}>mail</span>
              Email
            </a>
          )}

          <button
            type="button"
            onClick={handleConvert}
            disabled={isConverted || converting}
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              border: 'none',
              background: isConverted ? 'var(--gray-400)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isConverted || converting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: isConverted ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {isConverted ? 'check_circle' : 'person_add'}
            </span>
            {isConverted ? 'Converted to Customer' : converting ? 'Converting...' : 'Convert to Customer'}
          </button>

          <button
            type="button"
            onClick={() => router.push(`/erp/crm/leads/${lead.id}/edit`)}
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              border: '1px solid var(--border-main)',
              background: 'var(--surface-main)',
              color: 'var(--text-main)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>edit</span>
            Edit
          </button>
        </div>
      </div>

      {/* 3. Horizontal Pipeline Stage Stepper */}
      <LeadProgress leadId={lead.id} currentStatus={lead.status} onStatusChange={handleStatusChange} />

      {/* 4. Top Key Metrics KPI Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div
          style={{
            background: 'var(--surface-main)',
            border: '1px solid var(--border-main)',
            borderRadius: '14px',
            padding: '16px 20px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Expected Deal Value
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>
            {formattedVal}
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface-main)',
            border: '1px solid var(--border-main)',
            borderRadius: '14px',
            padding: '16px 20px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Win Probability
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--success)' }}>
              {getStageProbability(lead.status)}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>based on stage</span>
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface-main)',
            border: '1px solid var(--border-main)',
            borderRadius: '14px',
            padding: '16px 20px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Assigned Owner
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'var(--primary-glow)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700
              }}
            >
              {lead.assignedTo?.firstName ? lead.assignedTo.firstName[0] : 'U'}
            </div>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
              {lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName || ''}` : 'Unassigned'}
            </span>
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface-main)',
            border: '1px solid var(--border-main)',
            borderRadius: '14px',
            padding: '16px 20px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Target Closing Date
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--warning)' }}>event</span>
            {lead.expectedClosingDate ? new Date(lead.expectedClosingDate).toLocaleDateString() : 'Not Scheduled'}
          </div>
        </div>
      </div>

      {/* 5. Main 2-Column Workstation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '24px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Tabs & Main Content */}
        <div>
          {/* Tabs Navigation Header */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              borderBottom: '1px solid var(--border-main)',
              marginBottom: '20px',
              overflowX: 'auto',
              paddingBottom: '2px'
            }}
          >
            {[
              { id: 'overview', label: 'Overview', icon: 'space_dashboard' },
              { id: 'timeline', label: `Timeline (${(lead.activities || []).length})`, icon: 'history' },
              { id: 'notes', label: 'Notes & Logs', icon: 'sticky_note_2' },
              { id: 'activities', label: 'Follow-ups & Tasks', icon: 'task_alt' },
              { id: 'history', label: 'Audit Trail', icon: 'shield' }
            ].map(tab => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    borderRadius: '10px 10px 0 0',
                    border: 'none',
                    borderBottom: active ? '3px solid var(--primary)' : '3px solid transparent',
                    background: active ? 'var(--surface-main)' : 'transparent',
                    color: active ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: active ? 700 : 500,
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Quick Note Input Card */}
              <div
                style={{
                  background: 'var(--surface-main)',
                  border: '1px solid var(--border-main)',
                  borderRadius: '14px',
                  padding: '18px 20px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>edit_note</span>
                  Quick Note / Activity Log
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleQuickAddNote(); }}
                    placeholder="Log a quick note, call outcome, or reminder for this lead..."
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-main)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-main)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddNote}
                    disabled={savingNote || !quickNote.trim()}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'var(--primary)',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: savingNote || !quickNote.trim() ? 'not-allowed' : 'pointer',
                      opacity: savingNote || !quickNote.trim() ? 0.6 : 1
                    }}
                  >
                    {savingNote ? 'Saving...' : 'Post Note'}
                  </button>
                </div>
              </div>

              {/* Deal & Requirements Card */}
              <div
                style={{
                  background: 'var(--surface-main)',
                  border: '1px solid var(--border-main)',
                  borderRadius: '14px',
                  padding: '22px 24px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-main)', paddingBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                    Deal & Requirement Profile
                  </h3>
                  <button
                    type="button"
                    onClick={() => router.push(`/erp/crm/leads/${lead.id}/edit`)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                    Edit Deal Details
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
                  <div>
                    <div style={detailLabelStyle}>Service / Product Requirement</div>
                    <div style={detailValStyle}>{lead.serviceType || 'Not specified'}</div>
                  </div>
                  <div>
                    <div style={detailLabelStyle}>Estimated Deal Value</div>
                    <div style={{ ...detailValStyle, color: 'var(--primary)', fontWeight: 700 }}>{formattedVal}</div>
                  </div>
                  <div>
                    <div style={detailLabelStyle}>Lead Source Channel</div>
                    <div style={detailValStyle}>{lead.leadSource || 'Direct Outreach'}</div>
                  </div>
                  <div>
                    <div style={detailLabelStyle}>Industry Domain</div>
                    <div style={detailValStyle}>{lead.industry || 'General Business'}</div>
                  </div>
                  <div>
                    <div style={detailLabelStyle}>Target Close Date</div>
                    <div style={detailValStyle}>{lead.expectedClosingDate ? new Date(lead.expectedClosingDate).toLocaleDateString() : 'TBD'}</div>
                  </div>
                  <div>
                    <div style={detailLabelStyle}>Deal Priority</div>
                    <div style={detailValStyle}><LeadPriority priority={lead.priority} /></div>
                  </div>
                </div>

                {lead.notes && (
                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-main)' }}>
                    <div style={detailLabelStyle}>Initial Lead Requirements / Notes</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-main)', background: 'var(--bg-main)', padding: '12px 16px', borderRadius: '10px', marginTop: '6px', lineHeight: 1.6 }}>
                      {lead.notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Organization & Location Card */}
              <div
                style={{
                  background: 'var(--surface-main)',
                  border: '1px solid var(--border-main)',
                  borderRadius: '14px',
                  padding: '22px 24px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-main)', paddingBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                    Company & Location Info
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
                  <div>
                    <div style={detailLabelStyle}>Official Entity Name</div>
                    <div style={detailValStyle}>{lead.companyName}</div>
                  </div>
                  <div>
                    <div style={detailLabelStyle}>Corporate Website</div>
                    <div style={detailValStyle}>
                      {lead.website ? (
                        <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          {lead.website}
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>open_in_new</span>
                        </a>
                      ) : (
                        'No website listed'
                      )}
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={detailLabelStyle}>Office / Operational Address</div>
                    <div style={detailValStyle}>{lead.address || 'Address not provided'}</div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: TIMELINE */}
          {activeTab === 'timeline' && (
            <div
              style={{
                background: 'var(--surface-main)',
                border: '1px solid var(--border-main)',
                borderRadius: '14px',
                padding: '24px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                  Interactive Activity Stream
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {(lead.activities || []).length} recorded touchpoint(s)
                </span>
              </div>
              <LeadTimeline activities={lead.activities || []} />
            </div>
          )}

          {/* TAB 3: NOTES */}
          {activeTab === 'notes' && (
            <LeadNotes leadId={lead.id} />
          )}

          {/* TAB 4: ACTIVITIES */}
          {activeTab === 'activities' && (
            <div
              style={{
                background: 'var(--surface-main)',
                border: '1px solid var(--border-main)',
                borderRadius: '14px',
                padding: '24px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <LeadActivity leadId={lead.id} />
            </div>
          )}

          {/* TAB 5: AUDIT HISTORY */}
          {activeTab === 'history' && (
            <div
              style={{
                background: 'var(--surface-main)',
                border: '1px solid var(--border-main)',
                borderRadius: '14px',
                padding: '24px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                Field Change History & Audit Logs
              </h3>
              <LeadHistory leadId={lead.id} />
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Sidebar Intelligence Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Primary Contact Card */}
          <div
            style={{
              background: 'var(--surface-main)',
              border: '1px solid var(--border-main)',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'var(--primary-glow)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 700
                }}
              >
                {(lead.contactPerson || 'C')[0]}
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {lead.contactPerson}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Key Decision Maker
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-main)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Phone</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong>{lead.phone || '-'}</strong>
                  {lead.phone && (
                    <button
                      onClick={handleCopyPhone}
                      title="Copy Phone"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--primary)' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                        {copiedPhone ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-main)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Email</span>
                <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>
                  {lead.email || '-'}
                </strong>
              </div>
            </div>

            {/* Direct Communication Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '14px' }}>
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'var(--surface-hover)',
                    border: '1px solid var(--border-main)',
                    color: 'var(--text-main)',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--success)' }}>call</span>
                  Call
                </a>
              )}
              {lead.phone && (
                <a
                  href={`https://wa.me/${cleanPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'rgba(37, 211, 102, 0.1)',
                    border: '1px solid rgba(37, 211, 102, 0.25)',
                    color: '#16a34a',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chat</span>
                  WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Lead Health & Tags Card */}
          <div
            style={{
              background: 'var(--surface-main)',
              border: '1px solid var(--border-main)',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Deal Intelligence & Tags
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Pipeline Stage</span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{lead.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Priority Level</span>
                <LeadPriority priority={lead.priority} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Lead Source</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{lead.leadSource || 'Organic'}</span>
              </div>

              <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-main)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
                  Associated Tags
                </div>
                <LeadTags tags={lead.tags} />
              </div>
            </div>
          </div>

          {/* Quick Actions & Danger Zone */}
          <div
            style={{
              background: 'var(--surface-main)',
              border: '1px solid var(--border-main)',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Administrative Actions
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={handleConvert}
                disabled={isConverted || converting}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isConverted ? 'var(--gray-300)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isConverted || converting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {isConverted ? 'check_circle' : 'person_add'}
                </span>
                {isConverted ? 'Lead is Converted' : 'Convert to Customer'}
              </button>

              <button
                type="button"
                onClick={() => router.push(`/erp/crm/leads/${lead.id}/edit`)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-main)',
                  background: 'var(--surface-hover)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                Edit All Fields
              </button>
            </div>
          </div>

        </div>

      </div>

    </PageContainer>
  );
}

const detailLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  letterSpacing: '0.04em',
  marginBottom: '4px'
};

const detailValStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--text-main)'
};
