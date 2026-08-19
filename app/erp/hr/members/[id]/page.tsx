"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';

export default function MemberDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [member, setMember] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMember();
  }, [id]);

  const fetchMember = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/hr/members/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Member not found');
        } else {
          setError('Failed to fetch member details');
        }
        return;
      }
      setMember(await res.json());
    } catch (e) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: '24px', flexDirection: 'column' }}>
        <div className="glass-panel" style={{ height: '200px', borderRadius: '16px', opacity: 0.6 }} />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>
        <h2>Error</h2>
        <p>{error || 'Member not found'}</p>
        <button className="btn btn-secondary" onClick={() => router.push('/erp/hr/members')} style={{ marginTop: '16px' }}>Back to Members</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back Button */}
      <div style={{ marginBottom: '-8px' }}>
        <Link href="/erp/hr/members" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-main)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          Back to Members
        </Link>
      </div>

      {/* Header Profile Section */}
      <div className="glass-card" style={{ padding: '32px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '24px', position: 'relative', overflow: 'hidden' }}>
        {/* Abstract background shape */}
        <div style={{ position: 'absolute', right: '-5%', top: '-20%', width: '300px', height: '300px', background: 'var(--primary)', opacity: 0.05, borderRadius: '50%', filter: 'blur(40px)' }} />
        
        {/* Avatar */}
        <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--primary)' }}>person</span>
        </div>

        {/* Info */}
        <div style={{ flex: 1, zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
              {member.name}
            </h1>
            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: member.status === 'ACTIVE' ? 'var(--success)' : 'var(--text-muted)', background: member.status === 'ACTIVE' ? 'var(--success-subtle)' : 'var(--surface-hover)' }}>
              {member.status}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>badge</span>
            {member.role}
          </p>
        </div>
      </div>

      {/* Main Info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Contact Info Card */}
        <div className="glass-card" style={{ padding: '24px', borderRadius: '16px' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>contact_page</span>
            Contact Details
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>Email</span>
              <span style={{ color: 'var(--text-main)' }}>{member.email || '-'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>Phone</span>
              <span style={{ color: 'var(--text-main)' }}>{member.phone || '-'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>Join Date</span>
              <span style={{ color: 'var(--text-main)' }}>{new Date(member.joinedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Financial Summary Card */}
        <div className="glass-card" style={{ padding: '24px', borderRadius: '16px' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--warning)', fontSize: '20px' }}>account_balance_wallet</span>
            Financial Summary
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '16px', background: 'var(--surface-hover)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Total Earned from Settlements</span>
              <span style={{ color: 'var(--text-main)', fontSize: '20px', fontWeight: 700 }}>
                ৳ {Number(member.totalSettlementEarned || 0).toLocaleString()}
              </span>
            </div>

            <div style={{ padding: '16px', background: 'var(--surface-hover)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Outstanding Advance Balance</span>
              <span style={{ color: member.advanceBalance > 0 ? 'var(--warning)' : 'var(--text-main)', fontSize: '20px', fontWeight: 700 }}>
                ৳ {Number(member.advanceBalance || 0).toLocaleString()}
              </span>
            </div>

            <div style={{ padding: '16px', background: member.realSettlementBalance >= 0 ? 'var(--success-subtle)' : 'var(--danger-subtle)', borderRadius: '12px', border: `1px solid ${member.realSettlementBalance >= 0 ? 'var(--success)' : 'var(--danger)'}` }}>
              <span style={{ color: member.realSettlementBalance >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Real Settlement Balance</span>
              <span style={{ color: member.realSettlementBalance >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: '24px', fontWeight: 700 }}>
                ৳ {Number(member.realSettlementBalance || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Advance History */}
      <div className="glass-card" style={{ padding: '24px', borderRadius: '16px' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--info)', fontSize: '20px' }}>history</span>
          Advance History
        </h2>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Reason</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Issued Amount</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Remaining</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '14px' }}>
              {!member.advances || member.advances.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No advances found for this member.
                  </td>
                </tr>
              ) : (
                member.advances.map((adv: any) => (
                  <tr key={adv.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{new Date(adv.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-main)' }}>{adv.reason || '-'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>{Number(adv.amount).toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: adv.remainingAmount > 0 ? 'var(--warning)' : 'var(--success)' }}>{Number(adv.remainingAmount).toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', background: adv.status === 'ACTIVE' ? 'var(--warning-subtle)' : 'var(--success-subtle)', color: adv.status === 'ACTIVE' ? 'var(--warning)' : 'var(--success)' }}>
                        {adv.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
