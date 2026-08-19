"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    registrationNo: '',
    status: 'Active'
  });

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await fetch(`/api/crm/customers/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          const customer = data.customer || data;
          setFormData({
            customerName: customer.name || '',
            customerCode: customer.customerCode || '',
            primaryContactPerson: customer.contacts?.[0]?.name || '',
            phone: customer.phone || '',
            email: customer.email || '',
            groupId: customer.customerGroupId || '',
            creditLimit: customer.creditLimit || '',
            currency: customer.currency || 'BDT',
            paymentTerms: customer.priceLevel || 'NET 30',
            billingAddress: customer.addresses?.find((a: any) => a.type === 'BILLING')?.addressLine1 || '',
            shippingAddress: customer.addresses?.find((a: any) => a.type === 'SHIPPING')?.addressLine1 || '',
            binNo: customer.taxNumber || '',
            registrationNo: customer.tradeLicense || '',
            status: customer.status || 'Active'
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchCustomer();
  }, [params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/crm/customers/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        router.push(`/erp/crm/customers/${params.id}`);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update customer");
      }
    } catch (error) {
      console.error(error);
      alert("Error updating customer");
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
        onClick={() => router.push(`/erp/crm/customers/${params.id}`)}
        style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}
      >
        &larr; Back to Customer
      </button>
      <PageHeader 
        title={`Edit ${formData.customerName}`}
        description="Update customer details and status."
      />

      <div className="glass-card" style={{ padding: '32px', borderRadius: '12px', maxWidth: '900px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Company/Customer Name *</label>
              <input name="customerName" required value={formData.customerName} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Customer Code</label>
              <input name="customerCode" value={formData.customerCode} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Customer Group</label>
              <select name="groupId" value={formData.groupId} onChange={handleChange} style={inputStyle}>
                <option value="">None</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select name="status" value={formData.status} onChange={handleChange} style={inputStyle}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Primary Contact Person *</label>
              <input name="primaryContactPerson" required value={formData.primaryContactPerson} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone *</label>
              <input name="phone" required value={formData.phone} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input name="email" type="email" value={formData.email} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Credit Limit (BDT)</label>
              <input name="creditLimit" type="number" value={formData.creditLimit} onChange={handleChange} style={inputStyle} />
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <label style={labelStyle}>BIN / VAT / TIN No</label>
              <input name="binNo" value={formData.binNo} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Trade License / Registration No</label>
              <input name="registrationNo" value={formData.registrationNo} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button 
              type="button" 
              onClick={() => router.push(`/erp/crm/customers/${params.id}`)}
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
