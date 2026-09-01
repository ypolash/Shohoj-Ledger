"use client";

import React from 'react';

interface CustomerProfileProps {
  customer: any;
}

export function CustomerProfile({ customer }: CustomerProfileProps) {
  const formatter = new Intl.NumberFormat('en-BD', { style: 'currency', currency: customer.currency || 'BDT' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Account & Legal Entity Information */}
      <div
        style={{
          background: 'var(--surface-main)',
          border: '1px solid var(--border-main)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-main)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>domain</span>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              General Account & Entity Details
            </h3>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '8px', background: 'var(--primary-glow)', color: 'var(--primary)' }}>
            {customer.customerGroup?.name || 'Standard Customer'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <div>
            <div style={labelStyle}>Customer / Legal Entity Name</div>
            <div style={valueStyle}>{customer.name || '-'}</div>
          </div>

          <div>
            <div style={labelStyle}>Customer Code</div>
            <div style={{ ...valueStyle, fontFamily: 'monospace', color: 'var(--primary)' }}>
              {customer.customerCode || customer.id?.slice(0, 8)}
            </div>
          </div>

          <div>
            <div style={labelStyle}>Trade / Display Name</div>
            <div style={valueStyle}>{customer.displayName || customer.name || '-'}</div>
          </div>

          <div>
            <div style={labelStyle}>Customer Group / Classification</div>
            <div style={valueStyle}>{customer.customerGroup?.name || 'None (General)'}</div>
          </div>

          <div>
            <div style={labelStyle}>Base Transaction Currency</div>
            <div style={valueStyle}>{customer.currency || 'BDT'} (Bangladeshi Taka)</div>
          </div>

          <div>
            <div style={labelStyle}>Onboarding Date</div>
            <div style={valueStyle}>{new Date(customer.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* 2. Financial Policies & Credit Terms */}
      <div
        style={{
          background: 'var(--surface-main)',
          border: '1px solid var(--border-main)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-main)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--warning)', fontSize: '20px' }}>account_balance_wallet</span>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Credit Terms & Payment Policies
            </h3>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <div>
            <div style={labelStyle}>Authorized Credit Limit</div>
            <div style={{ ...valueStyle, fontSize: '16px', fontWeight: 700, color: 'var(--primary)' }}>
              {formatter.format(Number(customer.creditLimit || 0))}
            </div>
          </div>

          <div>
            <div style={labelStyle}>Agreed Payment Terms</div>
            <div style={{ ...valueStyle, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--success)' }}>schedule</span>
              {customer.priceLevel || customer.paymentTerms || 'NET 30 Days'}
            </div>
          </div>

          <div>
            <div style={labelStyle}>Credit Grace Period</div>
            <div style={valueStyle}>{customer.creditDays || 0} Days</div>
          </div>

          <div>
            <div style={labelStyle}>Portal Access Status</div>
            <div style={valueStyle}>
              {customer.isPortalActive ? (
                <span style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span> Active
                </span>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>Inactive</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Statutory, Tax & Compliance Registrations */}
      <div
        style={{
          background: 'var(--surface-main)',
          border: '1px solid var(--border-main)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-main)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: '#8b5cf6', fontSize: '20px' }}>gavel</span>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Statutory & Tax Compliance Registrations
            </h3>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <div>
            <div style={labelStyle}>BIN / VAT Registration Number</div>
            <div style={valueStyle}>{customer.taxNumber || 'Not Registered / Exemption'}</div>
          </div>

          <div>
            <div style={labelStyle}>Trade License / Registration Number</div>
            <div style={valueStyle}>{customer.tradeLicense || 'Not Provided'}</div>
          </div>

          <div>
            <div style={labelStyle}>Tax Registration Status</div>
            <div style={{ ...valueStyle, color: customer.taxNumber ? 'var(--success)' : 'var(--text-muted)' }}>
              {customer.taxNumber ? 'VAT Registered Entity' : 'Standard / Unregistered'}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  letterSpacing: '0.04em',
  marginBottom: '4px'
};

const valueStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--text-main)'
};
