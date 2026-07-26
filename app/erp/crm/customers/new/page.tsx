"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

export default function CreateCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerCode: '',
    primaryContactPerson: '',
    phone: '',
    email: '',
    groupId: '',
    creditLimit: '',
    currency: 'BDT',
    paymentTerms: 'NET 30',
    billingAddress: '',
    shippingAddress: '',
    binNo: '',
    tinNo: '',
    registrationNo: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/crm/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/erp/crm/customers/${data.id}`);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create customer");
      }
    } catch (error) {
      console.error(error);
      alert("Error creating customer");
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
        onClick={() => router.push('/erp/crm/customers')}
        style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}
      >
        &larr; Back to Customers
      </button>
      <PageHeader 
        title="Create New Customer"
        description="Onboard a new enterprise customer to your CRM."
      />

      <div className="glass-card" style={{ padding: '32px', borderRadius: '12px', maxWidth: '900px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* General Information Section */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>General Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Company Name *</label>
                <input name="customerName" required value={formData.customerName} onChange={handleChange} style={inputStyle} placeholder="Acme Corporation" />
              </div>
              <div>
                <label style={labelStyle}>Customer Code</label>
                <input name="customerCode" value={formData.customerCode} onChange={handleChange} style={inputStyle} placeholder="AUTO-GENERATED" />
              </div>
              <div>
                <label style={labelStyle}>Customer Group</label>
                <select name="groupId" value={formData.groupId} onChange={handleChange} style={inputStyle}>
                  <option value="">None</option>
                  <option value="retail">Retail</option>
                  <option value="wholesale">Wholesale</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>Primary Contact Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Primary Contact Person *</label>
                <input name="primaryContactPerson" required value={formData.primaryContactPerson} onChange={handleChange} style={inputStyle} placeholder="John Doe" />
              </div>
              <div>
                <label style={labelStyle}>Phone *</label>
                <input name="phone" required value={formData.phone} onChange={handleChange} style={inputStyle} placeholder="+880..." />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input name="email" type="email" value={formData.email} onChange={handleChange} style={inputStyle} placeholder="john@example.com" />
              </div>
            </div>
          </div>

          {/* Financial & Address Section */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>Financial & Location</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>Credit Limit (BDT)</label>
                <input name="creditLimit" type="number" value={formData.creditLimit} onChange={handleChange} style={inputStyle} placeholder="500000" />
              </div>
              <div>
                <label style={labelStyle}>Payment Terms</label>
                <select name="paymentTerms" value={formData.paymentTerms} onChange={handleChange} style={inputStyle}>
                  <option value="NET 15">Net 15</option>
                  <option value="NET 30">Net 30</option>
                  <option value="NET 45">Net 45</option>
                  <option value="NET 60">Net 60</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Billing Address</label>
                <textarea name="billingAddress" value={formData.billingAddress} onChange={handleChange} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}></textarea>
              </div>
              <div>
                <label style={labelStyle}>Shipping Address (If different)</label>
                <textarea name="shippingAddress" value={formData.shippingAddress} onChange={handleChange} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}></textarea>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button 
              type="button" 
              onClick={() => router.push('/erp/crm/customers')}
              style={{ padding: '10px 20px', background: 'var(--surface-hover)', color: 'var(--text-main)', border: '1px solid var(--border-main)', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              style={{ padding: '10px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Creating...' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
