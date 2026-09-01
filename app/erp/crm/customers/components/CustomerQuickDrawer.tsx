"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  X, 
  ExternalLink, 
  Edit, 
  PlusCircle, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  User, 
  CreditCard, 
  TrendingUp, 
  Clock, 
  Copy, 
  Check, 
  ShoppingBag,
  FileText
} from 'lucide-react';

interface CustomerQuickDrawerProps {
  customer: any | null;
  onClose: () => void;
}

export function CustomerQuickDrawer({ customer, onClose }: CustomerQuickDrawerProps) {
  const router = useRouter();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!customer) return null;

  const copyToClipboard = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'C';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const status = (customer.status || 'ACTIVE').toUpperCase();
  const balance = Number(customer.balance || customer.outstandingBalance || 0);
  const creditLimit = Number(customer.creditLimit || 0);
  const creditPercent = creditLimit > 0 ? Math.min(100, Math.round((balance / creditLimit) * 100)) : 0;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(4px)',
        animation: 'backdropFadeIn 0.2s ease'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '480px',
          height: '100%',
          background: 'var(--surface-main)',
          borderLeft: '1px solid var(--border-main)',
          boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'drawerSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-main)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--surface-hover)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quick Preview
            </span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '9999px',
              background: status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
              color: status === 'ACTIVE' ? '#10b981' : '#64748b'
            }}>
              {status}
            </span>
          </div>

          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Customer Profile Banner */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-main)' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.25rem',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              flexShrink: 0
            }}>
              {getInitials(customer.displayName || customer.name)}
            </div>

            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, lineHeight: 1.2 }}>
                {customer.displayName || customer.name}
              </h2>
              {customer.customerCode && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '4px' }}>
                  #{customer.customerCode}
                </div>
              )}
              {customer.customerGroup?.name && (
                <div style={{ marginTop: '8px' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'var(--surface-hover)',
                    border: '1px solid var(--border-main)',
                    color: 'var(--text-main)'
                  }}>
                    {customer.customerGroup.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={() => router.push(`/erp/crm/sales-orders/new?customerId=${customer.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                background: 'var(--success, #10b981)',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
              }}
            >
              <ShoppingBag size={16} />
              New Order
            </button>

            <Link
              href={`/erp/crm/customers/${customer.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                background: 'var(--primary)',
                color: 'white',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.85rem',
                textDecoration: 'none',
                boxShadow: '0 2px 8px var(--primary-glow)'
              }}
            >
              <ExternalLink size={16} />
              Full Profile
            </Link>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
          
          {/* Financial Overview Card */}
          <div style={{
            background: 'var(--surface-hover)',
            border: '1px solid var(--border-main)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CreditCard size={15} color="var(--primary)" />
              Financial Health
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Outstanding Balance</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: balance > 0 ? 'var(--warning, #f59e0b)' : 'var(--text-main)', marginTop: '2px' }}>
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(balance)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Credit Limit</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                  {creditLimit > 0 ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(creditLimit) : 'No Limit'}
                </div>
              </div>
            </div>

            {creditLimit > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <span>Credit Utilized</span>
                  <span>{creditPercent}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--border-main)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${creditPercent}%`,
                    height: '100%',
                    background: creditPercent > 90 ? 'var(--danger)' : creditPercent > 70 ? 'var(--warning)' : 'var(--success)',
                    borderRadius: '9999px'
                  }} />
                </div>
              </div>
            )}
          </div>

          {/* Contact Details Card */}
          <div style={{
            background: 'var(--surface-hover)',
            border: '1px solid var(--border-main)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={15} color="var(--primary)" />
              Contact Information
            </div>

            {/* Email */}
            {customer.email && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)' }}>
                  <Mail size={16} color="var(--text-muted)" />
                  <a href={`mailto:${customer.email}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                    {customer.email}
                  </a>
                </div>
                <button 
                  onClick={() => copyToClipboard(customer.email, 'email')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                >
                  {copiedField === 'email' ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                </button>
              </div>
            )}

            {/* Phone */}
            {(customer.phone || customer.mobile) && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)' }}>
                  <Phone size={16} color="var(--text-muted)" />
                  <a href={`tel:${customer.phone || customer.mobile}`} style={{ color: 'var(--text-main)', textDecoration: 'none' }}>
                    {customer.phone || customer.mobile}
                  </a>
                </div>
                <button 
                  onClick={() => copyToClipboard(customer.phone || customer.mobile, 'phone')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                >
                  {copiedField === 'phone' ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                </button>
              </div>
            )}

            {/* Website */}
            {customer.website && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                <Globe size={16} color="var(--text-muted)" />
                <a href={customer.website.startsWith('http') ? customer.website : `https://${customer.website}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                  {customer.website}
                </a>
              </div>
            )}
          </div>

          {/* Quick Shortcuts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => router.push(`/erp/crm/quotations/new?customerId=${customer.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'var(--surface-main)',
                border: '1px solid var(--border-main)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} color="var(--primary)" />
                <span>Create Quotation</span>
              </div>
              <PlusCircle size={16} color="var(--text-muted)" />
            </button>

            <button
              onClick={() => router.push(`/erp/crm/customers/${customer.id}/edit`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'var(--surface-main)',
                border: '1px solid var(--border-main)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit size={16} color="var(--primary)" />
                <span>Edit Customer Details</span>
              </div>
              <ExternalLink size={16} color="var(--text-muted)" />
            </button>
          </div>
        </div>

        {/* Drawer Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-main)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--surface-hover)'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Shohoj CRM Customer ID: {customer.id?.slice(0, 8)}
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid var(--border-main)',
              background: 'var(--surface-main)',
              color: 'var(--text-main)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes drawerSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes backdropFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}} />
    </div>
  );
}
