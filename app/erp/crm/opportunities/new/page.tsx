"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

export default function CreateOpportunityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    customerId: '',
    expectedRevenue: '',
    currency: 'BDT',
    probability: '',
    expectedCloseDate: '',
    stageId: '',
    pipelineId: '',
    leadSource: '',
    priority: 'Normal',
    nextStep: '',
    description: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        expectedRevenue: Number(formData.expectedRevenue),
        probability: Number(formData.probability),
      };

      const res = await fetch('/api/crm/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const data = await res.json();
        router.push(`/erp/crm/opportunities/${data.id}`);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create opportunity");
      }
    } catch (error) {
      console.error(error);
      alert("Error creating opportunity");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-main)',
    background: 'var(--bg-main)', fontSize: '14px', color: 'var(--text-main)', outline: 'none', transition: 'all var(--transition-fast)'
  };

  const labelStyle = {
    display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' as any
  };

  return (
    <PageContainer>
      <button 
          onClick={() => router.push('/erp/crm/opportunities')}
          className="btn btn-secondary"
          style={ width: 'fit-content', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '13px', marginBottom: '16px' }
        >
          <span className="material-symbols-outlined" style={ fontSize: '18px' }>arrow_back</span>
          Back to Opportunities
        </button>
      <PageHeader 
        title="Create Opportunity"
        description="Add a new deal to your sales pipeline."
      />

      <div className="glass-card" style={{ padding: '32px', borderRadius: '12px', maxWidth: '900px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>Basic Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Opportunity Name *</label>
                <input name="name" required value={formData.name} onChange={handleChange} style={inputStyle} placeholder="e.g. Acme Corp 2026 License" />
              </div>
              <div>
                <label style={labelStyle}>Customer *</label>
                <select name="customerId" required value={formData.customerId} onChange={handleChange} style={inputStyle}>
                  <option value="">Select Customer...</option>
                  <option value="mock-1">Acme Corporation</option>
                  {/* Real implementation would fetch and map customers */}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Lead Source</label>
                <select name="leadSource" value={formData.leadSource} onChange={handleChange} style={inputStyle}>
                  <option value="">Select Source...</option>
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="Cold Call">Cold Call</option>
                  <option value="Partner">Partner</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>Revenue & Probability</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Expected Revenue (BDT) *</label>
                <input name="expectedRevenue" type="number" required value={formData.expectedRevenue} onChange={handleChange} style={inputStyle} placeholder="50000" />
              </div>
              <div>
                <label style={labelStyle}>Probability (%) *</label>
                <input name="probability" type="number" required min="0" max="100" value={formData.probability} onChange={handleChange} style={inputStyle} placeholder="50" />
              </div>
              <div>
                <label style={labelStyle}>Expected Close Date *</label>
                <input name="expectedCloseDate" type="date" required value={formData.expectedCloseDate} onChange={handleChange} style={inputStyle} />
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>Pipeline Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Stage</label>
                <select name="stageId" value={formData.stageId} onChange={handleChange} style={inputStyle}>
                  <option value="prospecting">Prospecting</option>
                  <option value="qualification">Qualification</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Priority</label>
                <select name="priority" value={formData.priority} onChange={handleChange} style={inputStyle}>
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Next Step</label>
                <input name="nextStep" value={formData.nextStep} onChange={handleChange} style={inputStyle} placeholder="e.g. Follow up email" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}></textarea>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button 
              type="button" 
              onClick={() => router.push('/erp/crm/opportunities')}
              style={{ padding: '10px 20px', background: 'var(--surface-hover)', color: 'var(--text-main)', border: '1px solid var(--border-main)', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              style={{ padding: '10px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Creating...' : 'Create Opportunity'}
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
