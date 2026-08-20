"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

export default function EditLeadPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    serviceType: '',
    expectedValue: '',
    leadSource: '',
    priority: '',
    status: '',
    industry: '',
    website: '',
    address: ''
  });

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const res = await fetch(`/api/crm/leads/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          const lead = data.lead;
          setFormData({
            companyName: lead.companyName || '',
            contactPerson: lead.contactPerson || '',
            phone: lead.phone || '',
            email: lead.email || '',
            serviceType: lead.serviceType || '',
            expectedValue: lead.expectedValue || '',
            leadSource: lead.leadSource || '',
            priority: lead.priority || '',
            status: lead.status || '',
            industry: lead.industry || '',
            website: lead.website || '',
            address: lead.address || ''
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchLead();
  }, [params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/crm/leads/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        router.push(`/erp/crm/leads/${params.id}`);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update lead");
      }
    } catch (error) {
      console.error(error);
      alert("Error updating lead");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid var(--border-main)',
    background: 'var(--bg-main)',
    fontSize: '14px',
    color: 'var(--text-main)',
    outline: 'none',
    transition: 'all var(--transition-fast)'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginBottom: '6px',
    textTransform: 'uppercase' as any
  };

  if (loading) {
    return <PageContainer><div style={{ padding: '48px', textAlign: 'center' }}>Loading...</div></PageContainer>;
  }

  return (
    <PageContainer>
      <button 
        onClick={() => router.push(`/erp/crm/leads/${params.id}`)}
        style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}
      >
        &larr; Back to Lead
      </button>
      <PageHeader 
        title={`Edit ${formData.companyName}`}
        description="Update lead details and status."
      />

      <div className="glass-card" style={{ padding: '32px', borderRadius: '12px', maxWidth: '800px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Company Name *</label>
              <input name="companyName" required value={formData.companyName} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Contact Person *</label>
              <input name="contactPerson" required value={formData.contactPerson} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Phone *</label>
              <input name="phone" required value={formData.phone} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input name="email" type="email" value={formData.email} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Status</label>
              <select name="status" value={formData.status} onChange={handleChange} style={inputStyle}>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Proposal">Proposal</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <select name="priority" value={formData.priority} onChange={handleChange} style={inputStyle}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Service Type *</label>
              <select name="serviceType" required value={formData.serviceType} onChange={handleChange} style={inputStyle}>
                <option value="" disabled>Select a service type</option>
                <option value="Web Development">Web Development</option>
                <option value="Mobile App Development">Mobile App Development</option>
                <option value="UI/UX Design">UI/UX Design</option>
                <option value="Digital Marketing">Digital Marketing</option>
                <option value="SEO Optimization">SEO Optimization</option>
                <option value="Custom Software">Custom Software</option>
                <option value="IT Consulting">IT Consulting</option>
                <option value="Maintenance & Support">Maintenance & Support</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Expected Value (BDT) *</label>
              <input name="expectedValue" type="number" required value={formData.expectedValue} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Industry</label>
              <input name="industry" value={formData.industry} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Website</label>
              <input name="website" type="url" value={formData.website} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Address</label>
            <input name="address" value={formData.address} onChange={handleChange} style={inputStyle} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button 
              type="button" 
              onClick={() => router.push(`/erp/crm/leads/${params.id}`)}
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
