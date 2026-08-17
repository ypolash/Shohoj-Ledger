"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    fetchMember();
  }, [unwrappedParams.id]);

  const fetchMember = async () => {
    try {
      const res = await fetch(`/api/members/${unwrappedParams.id}`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          name: data.name || '',
          role: data.role || '',
          email: data.email || '',
          phone: data.phone || '',
          status: data.status || 'ACTIVE'
        });
      } else {
        setError("Member not found");
      }
    } catch (err) {
      setError("Error loading member");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/members/${unwrappedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        router.push(`/erp/members/${unwrappedParams.id}`);
        router.refresh();
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || 'Failed to update member');
      }
    } catch (err) {
      setError('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href={`/erp/members/${unwrappedParams.id}`} style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>Edit Member / Shareholder</h1>
      </div>

      <div className="glass-card" style={{ padding: '24px', borderRadius: '16px' }}>
        {error && (
          <div style={{ padding: '12px', background: 'var(--danger-glow)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '20px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Full Name <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '14px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Role / Title <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input 
              type="text" 
              required
              placeholder="e.g. CEO, Shareholder, Lead Developer"
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value})}
              style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '14px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Email (Optional)</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '14px' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Phone (Optional)</label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '14px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Status <span style={{ color: 'var(--danger)' }}>*</span></label>
            <select 
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value})}
              style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--surface-main)', color: 'var(--text-main)', fontSize: '14px' }}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>

          <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
            <Link href={`/erp/members/${unwrappedParams.id}`} style={{ flex: 1 }}>
              <button type="button" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--surface-hover)', border: '1px solid var(--border-light)', color: 'var(--text-main)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
            </Link>
            <button type="submit" disabled={saving} style={{ flex: 2, padding: '12px', borderRadius: '8px', background: 'var(--primary)', border: 'none', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
