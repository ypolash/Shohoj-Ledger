"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

export default function CreateLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    serviceType: '',
    expectedValue: '',
    leadSource: 'Website',
    priority: 'Medium',
    industry: '',
    website: '',
    address: '',
    notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/erp/crm/leads/${data.lead.id}`);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create lead");
      }
    } catch (error) {
      console.error(error);
      alert("Error creating lead");
    } finally {
      setLoading(false);
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

  return (
    <PageContainer>
      <button 
        onClick={() => router.push('/erp/crm/leads')}
        style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}
      >
        &larr; Back to Leads
      </button>
      <PageHeader 
        title="Create New Lead"
        description="Enter the details of the prospective client."
      />

      <div className="glass-card" style={{ padding: '32px', borderRadius: '12px', maxWidth: '800px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Company Name *</label>
              <input name="companyName" required value={formData.companyName} onChange={handleChange} style={inputStyle} placeholder="e.g. Acme Corp" />
            </div>
            <div>
              <label style={labelStyle}>Contact Person *</label>
              <input name="contactPerson" required value={formData.contactPerson} onChange={handleChange} style={inputStyle} placeholder="e.g. Jane Doe" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Phone *</label>
              <input name="phone" required value={formData.phone} onChange={handleChange} style={inputStyle} placeholder="+880..." />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input name="email" type="email" value={formData.email} onChange={handleChange} style={inputStyle} placeholder="jane@example.com" />
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
              <input name="expectedValue" type="number" required value={formData.expectedValue} onChange={handleChange} style={inputStyle} placeholder="50000" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Lead Source</label>
              <select name="leadSource" value={formData.leadSource} onChange={handleChange} style={inputStyle}>
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="Cold Call">Cold Call</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Partner">Partner</option>
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

          <div>
            <label style={labelStyle}>Initial Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="Any initial observations or requirements..."></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button 
              type="button" 
              onClick={() => router.push('/erp/crm/leads')}
              style={{ padding: '10px 20px', background: 'var(--surface-hover)', color: 'var(--text-main)', border: '1px solid var(--border-main)', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              style={{ padding: '10px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
