"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building, 
  Phone, 
  Mail, 
  CreditCard, 
  ShoppingBag, 
  Edit3, 
  Trash2, 
  ExternalLink,
  Eye,
  Check,
  Copy
} from 'lucide-react';

interface CustomerCardProps {
  customer: any;
  onDelete?: (id: string) => void;
  onQuickView?: (customer: any) => void;
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  'linear-gradient(135deg, #10b981, #047857)',
  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  'linear-gradient(135deg, #f59e0b, #b45309)',
  'linear-gradient(135deg, #ec4899, #be185d)',
  'linear-gradient(135deg, #06b6d4, #0e7490)',
  'linear-gradient(135deg, #6366f1, #4338ca)',
];

export function CustomerCard({ customer, onDelete, onQuickView }: CustomerCardProps) {
  const router = useRouter();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const getAvatarInfo = (name: string, id: string) => {
    const safeName = name || 'Customer';
    const initials = safeName
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    
    let hash = 0;
    for (let i = 0; i < (id || '').length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    const gradient = AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
    return { initials, gradient };
  };

  const { initials, gradient } = getAvatarInfo(customer.displayName || customer.name, customer.id);
  const balance = Number(customer.balance || customer.outstandingBalance || 0);
  const creditLimit = Number(customer.creditLimit || 0);
  const creditPercent = creditLimit > 0 ? Math.min(100, Math.round((balance / creditLimit) * 100)) : 0;
  const status = (customer.status || 'ACTIVE').toUpperCase();

  const handleCopy = (text: string, field: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div 
      className="glass-card" 
      onClick={() => router.push(`/erp/crm/customers/${customer.id}`)}
      style={{ 
        padding: '20px', 
        borderRadius: '14px', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between',
        gap: '16px', 
        cursor: 'pointer',
        background: 'var(--surface-main)',
        border: '1px solid var(--border-main)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
    >
      {/* Top Header */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: gradient,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              flexShrink: 0
            }}>
              {initials}
            </div>

            <div>
              <Link 
                href={`/erp/crm/customers/${customer.id}`} 
                onClick={(e) => e.stopPropagation()}
                style={{ 
                  fontSize: '1rem', 
                  fontWeight: 700, 
                  color: 'var(--text-main)', 
                  display: 'block',
                  lineHeight: 1.2
                }}
              >
                {customer.displayName || customer.name}
              </Link>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                {customer.customerCode && (
                  <span style={{
                    fontSize: '0.725rem',
                    fontFamily: 'monospace',
                    color: 'var(--text-muted)',
                    background: 'var(--surface-hover)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-main)'
                  }}>
                    #{customer.customerCode}
                  </span>
                )}
                <span style={{
                  fontSize: '0.725rem',
                  color: 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}>
                  <Building size={12} />
                  {customer.customerGroup?.name || customer.group?.name || 'General'}
                </span>
              </div>
            </div>
          </div>

          <span style={{
            padding: '3px 8px', 
            borderRadius: '9999px', 
            fontSize: '0.7rem', 
            fontWeight: 700, 
            textTransform: 'uppercase',
            background: status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(100, 116, 139, 0.12)',
            color: status === 'ACTIVE' ? '#10b981' : '#64748b',
            border: `1px solid ${status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(100, 116, 139, 0.25)'}`
          }}>
            {status}
          </span>
        </div>

        {/* Contact Info */}
        <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.825rem' }}>
          {customer.primaryContactPerson && (
            <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>
              {customer.primaryContactPerson}
            </div>
          )}

          {customer.email && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <a 
                href={`mailto:${customer.email}`} 
                onClick={(e) => e.stopPropagation()}
                style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Mail size={13} color="var(--text-muted)" />
                <span>{customer.email}</span>
              </a>
              <button
                onClick={(e) => handleCopy(customer.email, 'email', e)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                title="Copy Email"
              >
                {copiedField === 'email' ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
              </button>
            </div>
          )}

          {(customer.phone || customer.mobile) && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <a 
                href={`tel:${customer.phone || customer.mobile}`} 
                onClick={(e) => e.stopPropagation()}
                style={{ color: 'var(--text-main)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Phone size={13} color="var(--text-muted)" />
                <span>{customer.phone || customer.mobile}</span>
              </a>
              <button
                onClick={(e) => handleCopy(customer.phone || customer.mobile, 'phone', e)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                title="Copy Phone"
              >
                {copiedField === 'phone' ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Financial Health Box */}
      <div style={{ 
        background: 'var(--surface-hover)', 
        padding: '12px', 
        borderRadius: '10px', 
        border: '1px solid var(--border-main)' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Balance
          </span>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: balance > 0 ? 'var(--warning, #f59e0b)' : 'var(--text-main)' }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(balance)}
          </span>
        </div>

        {creditLimit > 0 ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
              <span>Limit: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(creditLimit)}</span>
              <span>{creditPercent}%</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: 'var(--border-main)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{
                width: `${creditPercent}%`,
                height: '100%',
                background: creditPercent > 90 ? 'var(--danger)' : creditPercent > 70 ? 'var(--warning)' : 'var(--success)',
                borderRadius: '9999px'
              }} />
            </div>
          </div>
        ) : (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No credit limit assigned</span>
        )}
      </div>

      {/* Action Footer */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingTop: '12px', 
        borderTop: '1px solid var(--border-main)' 
      }}>
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            router.push(`/erp/crm/sales-orders/new?customerId=${customer.id}`); 
          }}
          style={{ 
            padding: '7px 12px', 
            color: '#10b981', 
            borderRadius: '6px', 
            background: 'rgba(16, 185, 129, 0.1)', 
            border: '1px solid rgba(16, 185, 129, 0.25)', 
            fontSize: '0.8rem', 
            fontWeight: 600, 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px' 
          }}
        >
          <ShoppingBag size={14} />
          <span>Order</span>
        </button>

        <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
          {onQuickView && (
            <button
              onClick={() => onQuickView(customer)}
              style={{ padding: '6px', color: 'var(--text-muted)', borderRadius: '6px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', cursor: 'pointer' }}
              title="Quick View"
            >
              <Eye size={15} />
            </button>
          )}
          <button 
            onClick={() => router.push(`/erp/crm/customers/${customer.id}/edit`)}
            style={{ padding: '6px', color: 'var(--primary)', borderRadius: '6px', background: 'var(--primary-glow)', border: 'none', cursor: 'pointer' }}
            title="Edit Customer"
          >
            <Edit3 size={15} />
          </button>
          <button 
            onClick={() => { if (onDelete) onDelete(customer.id); }}
            style={{ padding: '6px', color: 'var(--danger)', borderRadius: '6px', background: 'var(--danger-glow)', border: 'none', cursor: 'pointer' }}
            title="Delete Customer"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
