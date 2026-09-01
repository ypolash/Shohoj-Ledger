"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";

// Modular Components
import { CustomerProfile } from "../components/CustomerProfile";
import { CustomerContacts } from "../components/CustomerContacts";
import { CustomerAddresses } from "../components/CustomerAddresses";
import { CustomerTimeline } from "../components/CustomerTimeline";
import { CustomerFinancialSummary } from "../components/CustomerFinancialSummary";
import { CustomerNotes } from "../components/CustomerNotes";
import { CustomerFiles } from "../components/CustomerFiles";
import { CustomerActivities } from "../components/CustomerActivities";
import { CustomerOrders } from "../components/CustomerOrders";
import { CustomerInvoices } from "../components/CustomerInvoices";
import { CustomerPayments } from "../components/CustomerPayments";
import { CustomerProjects } from "../components/CustomerProjects";
import { CustomerTags } from "../components/CustomerTags";

import { useUI } from "@/lib/contexts/UIContext";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { setPageTitleOverride } = useUI();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`/api/crm/customers/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        const cust = data.customer || data;
        setCustomer(cust);
        if (cust) {
          const title = cust.name || cust.customerCode || 'Customer Details';
          setPageTitleOverride(title);
        }
      } else {
        router.push('/erp/crm/customers');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) fetchCustomer();
    return () => setPageTitleOverride(null);
  }, [params.id, router, setPageTitleOverride]);

  const handleCopyPhone = (phone: string) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleQuickAddNote = async () => {
    if (!quickNote.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/crm/customers/${params.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: quickNote })
      });
      if (res.ok) {
        setQuickNote('');
        fetchCustomer();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete customer "${customer?.name}"? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/crm/customers/${params.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/erp/crm/customers');
      } else {
        alert("Failed to delete customer.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting customer.");
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px', animation: 'spin 1s linear infinite', color: 'var(--primary)' }}>
            autorenew
          </span>
          <p style={{ marginTop: '12px', fontSize: '15px', fontWeight: 600 }}>Loading Customer 360 Master...</p>
        </div>
      </PageContainer>
    );
  }

  if (!customer) return null;

  const primaryContact = (customer.contacts || []).find((c: any) => c.isPrimary) || (customer.contacts || [])[0] || {
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    designation: 'Primary Representative'
  };

  const phoneToCall = customer.phone || primaryContact.phone;
  const emailToMail = customer.email || primaryContact.email;
  const cleanPhone = (phoneToCall || '').replace(/\D/g, '');

  const formatter = new Intl.NumberFormat('en-BD', { style: 'currency', currency: customer.currency || 'BDT' });
  const creditLimit = Number(customer.creditLimit || 0);
  const outstanding = Number(customer.outstandingBalance || 0);
  const availableCredit = Math.max(0, creditLimit - outstanding);
  const creditUtilPercent = creditLimit > 0 ? Math.min(100, Math.round((outstanding / creditLimit) * 100)) : 0;

  const initials = (customer.name || customer.displayName || 'CU')
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

  return (
    <PageContainer>
      {/* 1. Breadcrumbs & Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
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
              fontSize: '13px',
              transition: 'all 0.15s ease'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
            Back to Customers
          </Link>
          <span>/</span>
          <span>CRM</span>
          <span>/</span>
          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{customer.name}</span>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Customer Since: <strong>{new Date(customer.createdAt).toLocaleDateString()}</strong>
        </div>
      </div>

      {/* 2. Executive Hero Header Card */}
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
        {/* Left: Avatar & Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', minWidth: '320px' }}>
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
              fontWeight: 800,
              boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.4)',
              flexShrink: 0
            }}
          >
            {initials}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                {customer.name}
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'var(--bg-main)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-main)',
                  fontFamily: 'monospace'
                }}
              >
                {customer.customerCode || `#${customer.id.slice(0, 8)}`}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: customer.status === 'ACTIVE' ? 'var(--success-text)' : 'var(--text-muted)',
                  background: customer.status === 'ACTIVE' ? 'var(--success-bg)' : 'var(--bg-main)',
                  textTransform: 'uppercase'
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: customer.status === 'ACTIVE' ? 'var(--success)' : 'var(--gray-400)' }} />
                {customer.status || 'ACTIVE'}
              </span>
              {customer.customerGroup && (
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                  {customer.customerGroup.name}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', fontSize: '13px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>person</span>
                <strong>{primaryContact.name || customer.name}</strong>
              </span>
              {phoneToCall && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--success)' }}>call</span>
                  {phoneToCall}
                </span>
              )}
              {emailToMail && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--info)' }}>mail</span>
                  {emailToMail}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Direct Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {phoneToCall && (
            <a
              href={`tel:${phoneToCall}`}
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
                textDecoration: 'none'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '17px', color: 'var(--success)' }}>call</span>
              Call
            </a>
          )}

          {phoneToCall && (
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
                textDecoration: 'none'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>chat</span>
              WhatsApp
            </a>
          )}

          <button
            type="button"
            onClick={() => router.push(`/erp/crm/sales-orders/new?customerId=${customer.id}`)}
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px var(--primary-glow)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_shopping_cart</span>
            New Order
          </button>

          <button
            type="button"
            onClick={() => router.push(`/erp/crm/customers/${customer.id}/edit`)}
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

      {/* 3. 4 Key Financial KPI Stat Cards */}
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
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Outstanding Balance
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: outstanding > 0 ? 'var(--warning)' : 'var(--success)' }}>
            {formatter.format(outstanding)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {outstanding > 0 ? 'Pending Payment Collection' : 'Zero Arrears · In Good Standing'}
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface-main)',
            border: '1px solid var(--border-main)',
            borderRadius: '14px',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Credit Limit & Availability
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)' }}>
            {formatter.format(availableCredit)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Limit: {formatter.format(creditLimit)} ({creditUtilPercent}% Used)
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface-main)',
            border: '1px solid var(--border-main)',
            borderRadius: '14px',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Total Sales (YTD)
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>
            {formatter.format(Number(customer.salesTotalYTD || 0))}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Gross Order Value in {new Date().getFullYear()}
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface-main)',
            border: '1px solid var(--border-main)',
            borderRadius: '14px',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Payment Terms & Cycle
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--success)' }}>schedule</span>
            {customer.priceLevel || customer.paymentTerms || 'NET 30 Days'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Standard Enterprise Credit Cycle
          </div>
        </div>
      </div>

      {/* 4. Full-Width Tabs Navigation Header */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-main)',
          marginBottom: '24px',
          width: '100%',
          flexWrap: 'wrap'
        }}
      >
        {[
          { id: 'overview', label: 'Overview', icon: 'space_dashboard' },
          { id: 'orders', label: 'Orders & Sales', icon: 'shopping_bag' },
          { id: 'financials', label: 'Financials & Invoices', icon: 'receipt_long' },
          { id: 'contacts', label: `Contacts (${(customer.contacts || []).length})`, icon: 'group' },
          { id: 'addresses', label: `Addresses (${(customer.addresses || []).length})`, icon: 'location_on' },
          { id: 'notes_files', label: 'Notes & Files', icon: 'sticky_note_2' },
          { id: 'timeline', label: 'Timeline & History', icon: 'history' }
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
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '10px 10px 0 0',
                border: 'none',
                borderBottom: active ? '3px solid var(--primary)' : '3px solid transparent',
                background: active ? 'var(--surface-main)' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: active ? 700 : 500,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 5. Tab Content Panes */}
      
      {/* TAB 1: OVERVIEW (2-Column with Intelligence Sidebar) */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '24px', alignItems: 'start' }}>
          
          {/* Main Overview Left Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Quick Note Input Box */}
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
                Quick Customer Touchpoint / Memo
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleQuickAddNote(); }}
                  placeholder="Log a client interaction, phone call outcome, or account memo..."
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
                  {savingNote ? 'Saving...' : 'Post Memo'}
                </button>
              </div>
            </div>

            {/* Main Structured Profile Cards */}
            <CustomerProfile customer={customer} />

            {/* Contacts & Recent Activities Preview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <CustomerContacts customer={customer} />
              <CustomerActivities customer={customer} />
            </div>

            {/* Addresses Preview */}
            <CustomerAddresses customer={customer} />
          </div>

          {/* Right Sidebar Intelligence Widgets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Credit Health & Risk Assessment Card */}
            <div
              style={{
                background: 'var(--surface-main)',
                border: '1px solid var(--border-main)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Credit Health & Exposure
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Credit Utilization</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: creditUtilPercent > 80 ? 'var(--danger)' : 'var(--primary)' }}>
                  {creditUtilPercent}%
                </span>
              </div>

              <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'var(--bg-main)', overflow: 'hidden', marginBottom: '16px' }}>
                <div
                  style={{
                    width: `${creditUtilPercent}%`,
                    height: '100%',
                    borderRadius: '4px',
                    background: creditUtilPercent > 80 ? 'var(--danger)' : creditUtilPercent > 50 ? 'var(--warning)' : 'var(--success)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Available Balance:</span>
                  <strong style={{ color: 'var(--success)' }}>{formatter.format(availableCredit)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Credit Risk Tier:</span>
                  <span style={{ fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified_user</span>
                    Low Risk (Tier 1)
                  </span>
                </div>
              </div>
            </div>

            {/* Tags Card */}
            <div
              style={{
                background: 'var(--surface-main)',
                border: '1px solid var(--border-main)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Customer Tags & Segments
              </div>
              <CustomerTags tags={customer.tags || []} />
            </div>

            {/* Quick Admin Actions Card */}
            <div
              style={{
                background: 'var(--surface-main)',
                border: '1px solid var(--border-main)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Administrative Actions
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleDelete}
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: '10px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    background: 'var(--danger-bg)',
                    color: 'var(--danger-text)',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                  Delete Customer Account
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: ORDERS (Full Width) */}
      {activeTab === 'orders' && (
        <div style={{ width: '100%' }}>
          <CustomerOrders customer={customer} />
        </div>
      )}

      {/* TAB 3: FINANCIALS (Full Width) */}
      {activeTab === 'financials' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
          <CustomerInvoices customer={customer} />
          <CustomerPayments customer={customer} />
        </div>
      )}

      {/* TAB 4: CONTACTS (Full Width) */}
      {activeTab === 'contacts' && (
        <div style={{ width: '100%' }}>
          <CustomerContacts customer={customer} />
        </div>
      )}

      {/* TAB 5: ADDRESSES (Full Width) */}
      {activeTab === 'addresses' && (
        <div style={{ width: '100%' }}>
          <CustomerAddresses customer={customer} />
        </div>
      )}

      {/* TAB 6: NOTES & FILES (Full Width) */}
      {activeTab === 'notes_files' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', width: '100%' }}>
          <CustomerNotes customer={customer} />
          <CustomerFiles customer={customer} />
        </div>
      )}

      {/* TAB 7: TIMELINE (Full Width) */}
      {activeTab === 'timeline' && (
        <div
          style={{
            background: 'var(--surface-main)',
            border: '1px solid var(--border-main)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
            width: '100%'
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
            Customer Account Audit & Interaction Timeline
          </h3>
          <CustomerTimeline />
        </div>
      )}

    </PageContainer>
  );
}
