"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

export default function EditOpportunityPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    customerId: '',
    expectedRevenue: '',
    currency: 'BDT',
    probability: '',
    expectedCloseDate: '',
    stageId: '',
    leadSource: '',
    priority: 'Normal',
    nextStep: '',
    description: ''
  });

  useEffect(() => {
    const fetchOpportunity = async () => {
      try {
        const res = await fetch(`/api/crm/opportunities/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          const opp = data.opportunity || data;
          setFormData({
            name: opp.name || '',
            customerId: opp.customerId || '',
            expectedRevenue: opp.expectedRevenue || '',
            currency: opp.currency || 'BDT',
            probability: opp.probability || '',
            expectedCloseDate: opp.expectedCloseDate ? new Date(opp.expectedCloseDate).toISOString().split('T')[0] : '',
            stageId: opp.stageId || 'prospecting',
            leadSource: opp.leadSource || '',
            priority: opp.priority || 'Normal',
            nextStep: opp.nextStep || '',
            description: opp.description || ''
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchOpportunity();
  }, [params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        expectedRevenue: Number(formData.expectedRevenue),
        probability: Number(formData.probability),
      };

      const res = await fetch(`/api/crm/opportunities/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        router.push(`/erp/crm/opportunities/${params.id}`);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update opportunity");
      }
    } catch (error) {
      console.error(error);
      alert("Error updating opportunity");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-main)',
    background: 'var(--bg-main)', fontSize: '14px', color: 'var(--text-main)', outline: 'none', transition: 'all var(--transition-fast)'
  };

  const labelStyle = {
    display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' as any
  };

  if (loading) {
    return <PageContainer><div style={{ padding: '48px', textAlign: 'center' }}>Loading...</div></PageContainer>;
  }

  return (
    <PageContainer>
      <button 
          onClick={() => router.push(`/erp/crm/opportunities/${params.id}`)}
          className="btn btn-secondary"
          style={{ width: 'fit-content', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '13px', marginBottom: '16px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          Back to Opportunity
        </button>
      <PageHeader 
        title={`Edit ${formData.name}`}
        description="Update opportunity details, stage, and revenue."
      />

      <div className="glass-card" style={{ padding: '32px', borderRadius: '12px', maxWidth: '900px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Opportunity Name *</label>
              <input name="name" required value={formData.name} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Stage</label>
              <select name="stageId" value={formData.stageId} onChange={handleChange} style={inputStyle}>
                <option value="prospecting">Prospecting</option>
                <option value="qualification">Qualification</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="won">Closed Won</option>
                <option value="lost">Closed Lost</option>
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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Expected Revenue (BDT) *</label>
              <input name="expectedRevenue" type="number" required value={formData.expectedRevenue} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Probability (%) *</label>
              <input name="probability" type="number" required min="0" max="100" value={formData.probability} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Expected Close Date *</label>
              <input name="expectedCloseDate" type="date" required value={formData.expectedCloseDate} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
             <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Next Step</label>
              <input name="nextStep" value={formData.nextStep} onChange={handleChange} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}></textarea>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button 
              type="button" 
              onClick={() => router.push(`/erp/crm/opportunities/${params.id}`)}
              style={{ padding: '10px 20px', background: 'var(--surface-hover)', color: 'var(--text-main)', border: '1px solid var(--border-main)', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving}
              style={{ padding: '10px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
