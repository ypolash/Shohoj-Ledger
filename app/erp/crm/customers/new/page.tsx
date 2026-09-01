"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";

export default function CreateCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [createAnother, setCreateAnother] = useState(false);
  const [customerType, setCustomerType] = useState<'CORPORATE' | 'INDIVIDUAL'>('CORPORATE');
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [tagInput, setTagInput] = useState('');

  const [formData, setFormData] = useState({
    customerName: '',
    displayName: '',
    customerCode: '',
    primaryContactPerson: '',
    designation: '',
    phone: '',
    mobile: '',
    email: '',
    website: '',
    groupId: '',
    creditLimit: '100000',
    currency: 'BDT',
    paymentTerms: 'NET 30',
    billingAddress: '',
    shippingAddress: '',
    binNo: '',
    tinNo: '',
    registrationNo: '',
    notes: '',
    tags: ['Wholesale', 'Key-Account'] as string[]
  });

  const [customerGroups, setCustomerGroups] = useState<any[]>([]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch('/api/crm/customer-groups');
        if (res.ok) {
          const data = await res.json();
          setCustomerGroups(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch customer groups", err);
      }
    };
    fetchGroups();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'billingAddress' && sameAsBilling) {
        updated.shippingAddress = value;
      }
      return updated;
    });
  };

  const handleSameAsBillingToggle = (checked: boolean) => {
    setSameAsBilling(checked);
    if (checked) {
      setFormData(prev => ({ ...prev, shippingAddress: prev.billingAddress }));
    }
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const cleanTag = tagInput.trim();
    if (!formData.tags.includes(cleanTag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, cleanTag] }));
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const handleQuickCreditPreset = (amount: string) => {
    setFormData(prev => ({ ...prev, creditLimit: amount }));
  };

  const calculateCompleteness = () => {
    let score = 0;
    if (formData.customerName) score += 25;
    if (formData.primaryContactPerson) score += 20;
    if (formData.phone) score += 20;
    if (formData.email) score += 15;
    if (formData.billingAddress) score += 10;
    if (formData.binNo || formData.tinNo) score += 10;
    return Math.min(100, score);
  };

  const handleSubmit = async (e: React.FormEvent, createNext = false) => {
    e.preventDefault();
    if (!formData.customerName.trim()) {
      alert("Company / Customer Name is required.");
      return;
    }
    if (!formData.phone.trim()) {
      alert("Primary Phone Number is required.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        primaryContactPerson: formData.primaryContactPerson || formData.customerName,
        shippingAddress: sameAsBilling ? formData.billingAddress : formData.shippingAddress
      };

      const res = await fetch('/api/crm/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (createNext) {
          setFormData({
            customerName: '',
            displayName: '',
            customerCode: '',
            primaryContactPerson: '',
            designation: '',
            phone: '',
            mobile: '',
            email: '',
            website: '',
            groupId: '',
            creditLimit: '100000',
            currency: 'BDT',
            paymentTerms: 'NET 30',
            billingAddress: '',
            shippingAddress: '',
            binNo: '',
            tinNo: '',
            registrationNo: '',
            notes: '',
            tags: ['Wholesale']
          });
          alert("Customer created successfully! Ready for the next customer.");
        } else {
          router.push(`/erp/crm/customers/${data.id}`);
        }
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create customer.");
      }
    } catch (error) {
      console.error(error);
      alert("An unexpected error occurred while creating customer.");
    } finally {
      setLoading(false);
    }
  };

  const completeness = calculateCompleteness();
  const initials = (formData.customerName || 'NC')
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  return (
    <PageContainer>
      {/* 1. Top Breadcrumb & Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <Link
              href="/erp/crm/customers"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-main)',
                background: 'var(--surface-main)',
                color: 'var(--text-main)',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '13px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
              Back to Customers
            </Link>
            <span>/</span>
            <span>CRM</span>
            <span>/</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>New Customer</span>
          </div>

          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Create New Customer
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            Onboard an enterprise organization or individual account with credit terms, contacts & billing.
          </p>
        </div>

        {/* Top Action Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => router.push('/erp/crm/customers')}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: '1px solid var(--border-main)',
              background: 'var(--surface-main)',
              color: 'var(--text-main)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: '1px solid var(--primary)',
              background: 'var(--primary-glow)',
              color: 'var(--primary)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Save & Create Another
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, false)}
            disabled={loading}
            style={{
              padding: '10px 24px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px var(--primary-glow)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {loading ? 'autorenew' : 'check_circle'}
            </span>
            {loading ? 'Creating...' : 'Create Customer'}
          </button>
        </div>
      </div>

      {/* 2. Customer Type Selector Card */}
      <div
        style={{
          background: 'var(--surface-main)',
          border: '1px solid var(--border-main)',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--primary)' }}>
            business
          </span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>Account Classification</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Choose whether this is a corporate entity or an individual account</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-main)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-main)' }}>
          <button
            type="button"
            onClick={() => setCustomerType('CORPORATE')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: customerType === 'CORPORATE' ? 'var(--primary)' : 'transparent',
              color: customerType === 'CORPORATE' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>corporate_fare</span>
            Corporate / B2B Entity
          </button>
          <button
            type="button"
            onClick={() => setCustomerType('INDIVIDUAL')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: customerType === 'INDIVIDUAL' ? 'var(--primary)' : 'transparent',
              color: customerType === 'INDIVIDUAL' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>person</span>
            Individual / Retail Client
          </button>
        </div>
      </div>

      {/* 3. Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '24px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: The Master Form */}
        <form onSubmit={(e) => handleSubmit(e, false)} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card 1: General Information */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>domain</span>
                <h2 style={cardTitleStyle}>General & Organization Info</h2>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-glow)', padding: '3px 8px', borderRadius: '6px' }}>
                STEP 1
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>
                  {customerType === 'CORPORATE' ? 'Company / Organization Name *' : 'Customer Full Name *'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    name="customerName"
                    required
                    value={formData.customerName}
                    onChange={handleChange}
                    style={{ ...inputStyle, paddingLeft: '40px' }}
                    placeholder={customerType === 'CORPORATE' ? 'e.g. Sarah Calcium Industries Ltd' : 'e.g. Dr. Mahfuzur Rahman'}
                  />
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '20px' }}>
                    {customerType === 'CORPORATE' ? 'business' : 'person'}
                  </span>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Display / Trade Name (Optional)</label>
                <input
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="e.g. Sarah Calcium"
                />
              </div>

              <div>
                <label style={labelStyle}>Customer Code</label>
                <div style={{ position: 'relative' }}>
                  <input
                    name="customerCode"
                    value={formData.customerCode}
                    onChange={handleChange}
                    style={{ ...inputStyle, fontFamily: 'monospace', fontWeight: 600 }}
                    placeholder="AUTO-GENERATED (Leave blank)"
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Customer Group / Tier</label>
                <select
                  name="groupId"
                  value={formData.groupId}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">Standard Account (No Group)</option>
                  {customerGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Base Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="BDT">BDT (৳) - Bangladeshi Taka</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Contact Person & Communication */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--success)' }}>contacts</span>
                <h2 style={cardTitleStyle}>Primary Contact Person & Reach</h2>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--success)', background: 'var(--success-bg)', padding: '3px 8px', borderRadius: '6px' }}>
                STEP 2
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
              <div>
                <label style={labelStyle}>Key Contact Person Name *</label>
                <input
                  name="primaryContactPerson"
                  required
                  value={formData.primaryContactPerson}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="e.g. Md. Tariqul Islam"
                />
              </div>

              <div>
                <label style={labelStyle}>Designation / Role</label>
                <input
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="e.g. Procurement Director / Owner"
                />
              </div>

              <div>
                <label style={labelStyle}>Primary Phone Number *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    style={{ ...inputStyle, paddingLeft: '40px' }}
                    placeholder="+880 1712-345678"
                  />
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--success)', fontSize: '20px' }}>
                    call
                  </span>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Mobile / WhatsApp (Optional)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    style={{ ...inputStyle, paddingLeft: '40px' }}
                    placeholder="+880 1812-345678"
                  />
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#16a34a', fontSize: '20px' }}>
                    chat
                  </span>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Primary Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    style={{ ...inputStyle, paddingLeft: '40px' }}
                    placeholder="procurement@company.com"
                  />
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--info)', fontSize: '20px' }}>
                    mail
                  </span>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Corporate Website</label>
                <div style={{ position: 'relative' }}>
                  <input
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    style={{ ...inputStyle, paddingLeft: '40px' }}
                    placeholder="https://company.com"
                  />
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '20px' }}>
                    language
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Financial & Credit Policies */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--warning)' }}>account_balance_wallet</span>
                <h2 style={cardTitleStyle}>Financial Policies & Credit Control</h2>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--warning)', background: 'var(--warning-bg)', padding: '3px 8px', borderRadius: '6px' }}>
                STEP 3
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
              <div>
                <label style={labelStyle}>Credit Limit ({formData.currency})</label>
                <div style={{ position: 'relative' }}>
                  <input
                    name="creditLimit"
                    type="number"
                    value={formData.creditLimit}
                    onChange={handleChange}
                    style={{ ...inputStyle, paddingLeft: '36px', fontSize: '15px', fontWeight: 700, color: 'var(--primary)' }}
                    placeholder="500000"
                  />
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--primary)' }}>
                    ৳
                  </span>
                </div>

                {/* Preset Chips */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {['50000', '100000', '500000', '1000000', '0'].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickCreditPreset(amt)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: formData.creditLimit === amt ? '1px solid var(--primary)' : '1px solid var(--border-main)',
                        background: formData.creditLimit === amt ? 'var(--primary-glow)' : 'var(--bg-main)',
                        color: formData.creditLimit === amt ? 'var(--primary)' : 'var(--text-muted)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {amt === '0' ? 'No Credit' : `৳ ${Number(amt) / 1000}K`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Payment Terms & Credit Cycle</label>
                <select
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="IMMEDIATE">Immediate / Cash on Delivery (COD)</option>
                  <option value="NET 15">Net 15 Days</option>
                  <option value="NET 30">Net 30 Days (Standard Enterprise)</option>
                  <option value="NET 45">Net 45 Days</option>
                  <option value="NET 60">Net 60 Days (Extended)</option>
                  <option value="ADVANCE">100% Advance Payment</option>
                </select>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Invoices generated for this customer will automatically follow this payment term.
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Location & Delivery Logistics */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--info)' }}>local_shipping</span>
                <h2 style={cardTitleStyle}>Addresses & Logistics</h2>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--info)', background: 'var(--info-bg)', padding: '3px 8px', borderRadius: '6px' }}>
                STEP 4
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Official Billing Address</label>
                <textarea
                  name="billingAddress"
                  value={formData.billingAddress}
                  onChange={handleChange}
                  style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }}
                  placeholder="Plot #12, Road #4, Sector #3, Uttara, Dhaka-1230, Bangladesh"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Shipping / Delivery Address</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={sameAsBilling}
                      onChange={(e) => handleSameAsBillingToggle(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    Same as Billing
                  </label>
                </div>
                <textarea
                  name="shippingAddress"
                  disabled={sameAsBilling}
                  value={sameAsBilling ? formData.billingAddress : formData.shippingAddress}
                  onChange={handleChange}
                  style={{
                    ...inputStyle,
                    minHeight: '90px',
                    resize: 'vertical',
                    opacity: sameAsBilling ? 0.7 : 1,
                    background: sameAsBilling ? 'var(--surface-hover)' : 'var(--bg-main)'
                  }}
                  placeholder="Factory or delivery warehouse address..."
                />
              </div>
            </div>
          </div>

          {/* Card 5: Statutory & Compliance */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: '#8b5cf6' }}>gavel</span>
                <h2 style={cardTitleStyle}>Statutory & Tax Compliance</h2>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.15)', padding: '3px 8px', borderRadius: '6px' }}>
                COMPLIANCE
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
              <div>
                <label style={labelStyle}>BIN / VAT Registration No</label>
                <input
                  name="binNo"
                  value={formData.binNo}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="e.g. 001234567-0101"
                />
              </div>

              <div>
                <label style={labelStyle}>e-TIN Number</label>
                <input
                  name="tinNo"
                  value={formData.tinNo}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="e.g. 123456789012"
                />
              </div>

              <div>
                <label style={labelStyle}>Trade License / Registration No</label>
                <input
                  name="registrationNo"
                  value={formData.registrationNo}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="e.g. TRAD/DNCC/123456/2026"
                />
              </div>
            </div>
          </div>

          {/* Card 6: Tags & Internal Notes */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--secondary)' }}>label</span>
                <h2 style={cardTitleStyle}>Tags & Relationship Notes</h2>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Customer Classification Tags</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                    placeholder="Add a tag (e.g. VIP, Priority, Dhaka-Hub)..."
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-main)',
                      background: 'var(--surface-hover)',
                      color: 'var(--text-main)',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Add Tag
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: 'var(--primary-glow)',
                        color: 'var(--primary)',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: '1px solid rgba(37, 99, 235, 0.2)'
                      }}
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--primary)', display: 'flex' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Internal Notes & Special Terms</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                  placeholder="Special pricing agreements, shipping instructions, or executive notes..."
                />
              </div>
            </div>
          </div>

          {/* Bottom Floating Submit Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--surface-main)',
              padding: '20px 24px',
              borderRadius: '16px',
              border: '1px solid var(--border-main)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <button
              type="button"
              onClick={() => router.push('/erp/crm/customers')}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                border: '1px solid var(--border-main)',
                background: 'transparent',
                color: 'var(--text-muted)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Discard Changes
            </button>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading}
                style={{
                  padding: '11px 20px',
                  borderRadius: '10px',
                  border: '1px solid var(--primary)',
                  background: 'var(--primary-glow)',
                  color: 'var(--primary)',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                Save & Add Another
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '11px 28px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 18px var(--primary-glow)'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {loading ? 'autorenew' : 'check_circle'}
                </span>
                {loading ? 'Onboarding Customer...' : 'Create Customer Account'}
              </button>
            </div>
          </div>

        </form>

        {/* RIGHT COLUMN: Live Customer Preview Widget (Sticky) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '24px' }}>
          
          {/* Live Preview Card */}
          <div
            style={{
              background: 'var(--surface-main)',
              border: '1px solid var(--border-main)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Live Customer Card Preview
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 800,
                  boxShadow: '0 6px 16px rgba(59, 130, 246, 0.35)',
                  flexShrink: 0
                }}
              >
                {initials}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {formData.customerName || 'Acme Corporation'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {customerType === 'CORPORATE' ? 'Corporate Account' : 'Individual Client'}
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', borderTop: '1px solid var(--border-main)', paddingTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Contact Person:</span>
                <strong>{formData.primaryContactPerson || '—'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
                <strong>{formData.phone || '—'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Credit Limit:</span>
                <strong style={{ color: 'var(--primary)' }}>
                  ৳ {new Intl.NumberFormat('en-BD').format(Number(formData.creditLimit || 0))}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payment Terms:</span>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'var(--surface-hover)', color: 'var(--text-main)' }}>
                  {formData.paymentTerms}
                </span>
              </div>
            </div>

            {/* Completeness Bar */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-main)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                <span>Profile Completeness</span>
                <span style={{ color: completeness === 100 ? 'var(--success)' : 'var(--primary)' }}>{completeness}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', borderRadius: '4px', background: 'var(--bg-main)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${completeness}%`,
                    height: '100%',
                    borderRadius: '4px',
                    background: completeness === 100 ? 'var(--success)' : 'linear-gradient(90deg, var(--primary) 0%, var(--success) 100%)',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Quick Help Card */}
          <div
            style={{
              background: 'var(--surface-main)',
              border: '1px solid var(--border-main)',
              borderRadius: '16px',
              padding: '20px',
              fontSize: '13px',
              color: 'var(--text-muted)',
              lineHeight: 1.6
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '18px' }}>info</span>
              CRM Enterprise Tip
            </div>
            Setting accurate BIN/TIN registration and payment credit cycles ensures smooth automated quotation, invoice generation, and tax compliance across all ERP sales workflows.
          </div>

        </div>

      </div>
    </PageContainer>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'var(--surface-main)',
  border: '1px solid var(--border-main)',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: 'var(--shadow-sm)'
};

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
  borderBottom: '1px solid var(--border-main)',
  paddingBottom: '14px'
};

const cardTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '16px',
  fontWeight: 700,
  color: 'var(--text-main)',
  letterSpacing: '-0.01em'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 700,
  color: 'var(--text-muted)',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.04em'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: '10px',
  border: '1px solid var(--border-main)',
  background: 'var(--bg-main)',
  fontSize: '14px',
  color: 'var(--text-main)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'all var(--transition-fast)'
};
