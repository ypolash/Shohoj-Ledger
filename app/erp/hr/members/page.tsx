"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Member {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  status: string;
  joinedAt: string;
  advanceBalance?: number;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', role: '', email: '', phone: '', status: 'ACTIVE', joinedAt: new Date().toISOString().split('T')[0] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/hr/members');
      if (res.ok) {
        const data = await res.json();
        // For each member, we need their balance. But the existing GET /api/hr/members route doesn't return balances.
        // Wait, I should update GET /api/hr/members to also return advanceBalance. I'll do that separately.
        setMembers(data);
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleForm = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      const url = isEditing ? `/api/hr/members/${form.id}` : '/api/hr/members';
      const method = isEditing ? 'PUT' : 'POST';
      
      const payload = {
        name: form.name,
        role: form.role,
        email: form.email || null,
        phone: form.phone || null,
        status: form.status,
        joinedAt: new Date(form.joinedAt).toISOString(),
      };

      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Failed to save member'); return; }
      
      setSuccessMsg(isEditing ? 'Member updated!' : 'Member created!'); 
      setShowModal(false);
      resetForm();
      fetchMembers(); 
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch { setError('Network error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this member?')) return;
    try {
      const res = await fetch(`/api/hr/members/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMsg('Member deleted!');
        fetchMembers();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete member');
      }
    } catch {
      alert('Network error');
    }
  };

  const openAddModal = () => {
    resetForm();
    setIsEditing(false);
    setShowModal(true);
    setError('');
  };

  const openEditModal = (e: React.MouseEvent, member: Member) => {
    e.preventDefault();
    setForm({
      id: member.id,
      name: member.name,
      role: member.role,
      email: member.email || '',
      phone: member.phone || '',
      status: member.status,
      joinedAt: member.joinedAt ? new Date(member.joinedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setIsEditing(true);
    setShowModal(true);
    setError('');
  };

  const resetForm = () => {
    setForm({ id: '', name: '', role: '', email: '', phone: '', status: 'ACTIVE', joinedAt: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Members</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/erp/hr/members/new" className="btn btn-primary hover-lift" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>Add Member
        </Link>
      </div>

      {successMsg && <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--success-subtle)', color: 'var(--success)', border: '1px solid var(--success)', fontSize: '14px' }}>✓ {successMsg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-4)' }}>
        {isLoading ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-panel" style={{ borderRadius: '16px', padding: '24px', height: '140px', opacity: 0.6 }} />
        )) : members.length === 0 ? (
          <div className="glass-panel" style={{ borderRadius: '16px', padding: '60px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1/-1' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4, display: 'block', marginBottom: '8px' }}>groups</span>
            No members yet.
          </div>
        ) : members.map(member => (
          <Link href={`/erp/hr/members/${member.id}`} key={member.id} className="glass-panel hover-lift" style={{ borderRadius: '16px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px', textDecoration: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--primary)' }}>person</span>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)' }}>{member.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{member.role}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={(e) => openEditModal(e, member)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} title="Edit">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                </button>
                <button onClick={(e) => handleDelete(e, member.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }} title="Delete">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                </button>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              {member.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-muted)' }}>mail</span>
                  {member.email}
                </div>
              )}
              {member.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-muted)' }}>call</span>
                  {member.phone}
                </div>
              )}
            </div>

            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Joined: {new Date(member.joinedAt).toLocaleDateString()}</span>
              <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: member.status === 'ACTIVE' ? 'var(--success)' : 'var(--text-muted)', background: member.status === 'ACTIVE' ? 'var(--success-subtle)' : 'var(--surface-hover)' }}>
                {member.status}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', borderRadius: '20px', padding: '32px', margin: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-main)' }}>{isEditing ? 'Edit Member' : 'Add Member'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
              </button>
            </div>
            {error && <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', background: 'var(--danger-subtle)', color: 'var(--danger)', fontSize: '14px' }}>⚠ {error}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Field2 label="Full Name *" value={form.name} onChange={(v: string) => handleForm('name', v)} placeholder="e.g. Jane Doe" required />
              <Field2 label="Role *" value={form.role} onChange={(v: string) => handleForm('role', v)} placeholder="e.g. Volunteer" required />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Field2 label="Email" type="email" value={form.email} onChange={(v: string) => handleForm('email', v)} placeholder="jane@example.com" />
                <Field2 label="Phone" type="tel" value={form.phone} onChange={(v: string) => handleForm('phone', v)} placeholder="+1234567890" />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={ls}>Status</label>
                  <select value={form.status} onChange={e => handleForm('status', e.target.value)} style={is}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <Field2 label="Join Date" type="date" value={form.joinedAt} onChange={(v: string) => handleForm('joinedAt', v)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : (isEditing ? 'Save Changes' : 'Create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field2({ label, value, onChange, placeholder, required, type = 'text' }: any) {
  return (
    <div>
      <label style={ls}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} style={is} />
    </div>
  );
}
const ls: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' };
const is: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' };
