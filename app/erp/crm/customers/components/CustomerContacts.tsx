"use client";

import React, { useState, useEffect } from 'react';

interface CustomerContactsProps {
  customer: any;
}

export function CustomerContacts({ customer }: CustomerContactsProps) {
  const [contacts, setContacts] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    email: '',
    phone: '',
    mobile: '',
    isPrimary: false
  });

  const fetchContacts = async () => {
    try {
      const res = await fetch(`/api/crm/customers/${customer.id}/contacts`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [customer.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingId 
        ? `/api/crm/customers/${customer.id}/contacts/${editingId}`
        : `/api/crm/customers/${customer.id}/contacts`;
        
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        setEditingId(null);
        setFormData({ name: '', designation: '', email: '', phone: '', mobile: '', isPrimary: false });
        fetchContacts();
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Contacts</h4>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ name: '', designation: '', email: '', phone: '', mobile: '', isPrimary: false });
            setShowModal(true);
          }}
          style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          + Add Contact
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {contacts.map(c => (
          <div key={c.id} style={{ padding: '16px', border: c.isPrimary ? '1px solid var(--primary)' : '1px solid var(--border-light)', borderRadius: '8px', background: c.isPrimary ? 'var(--primary-glow)' : 'var(--surface-main)', position: 'relative' }}>
            {c.isPrimary && (
              <span style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '10px', background: 'var(--primary)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>PRIMARY</span>
            )}
            {!c.isPrimary && (
              <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => {
                    setEditingId(c.id);
                    setFormData({ name: c.name, designation: c.designation || '', email: c.email || '', phone: c.phone || '', mobile: c.mobile || '', isPrimary: c.isPrimary });
                    setShowModal(true);
                  }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                </button>
                <button 
                  onClick={async () => {
                    if (confirm('Are you sure you want to delete this contact?')) {
                      await fetch(`/api/crm/customers/${customer.id}/contacts/${c.id}`, { method: 'DELETE' });
                      fetchContacts();
                    }
                  }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                </button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {c.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>{c.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.designation || 'Contact Person'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-muted)' }}>call</span>
                {c.phone || c.mobile || '-'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-muted)' }}>mail</span>
                {c.email || '-'}
              </div>
            </div>
          </div>
        ))}
        {contacts.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No contacts found.</div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'var(--surface-main)', padding: '24px', borderRadius: '12px', width: '400px', border: '1px solid var(--border-light)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px' }}>{editingId ? 'Edit Contact' : 'Add Contact'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Name *</label>
                <input required name="name" value={formData.name} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-hover)', color: 'var(--text-main)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Designation</label>
                <input name="designation" value={formData.designation} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-hover)', color: 'var(--text-main)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-hover)', color: 'var(--text-main)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Phone</label>
                <input name="phone" value={formData.phone} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-hover)', color: 'var(--text-main)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <input type="checkbox" name="isPrimary" checked={formData.isPrimary} onChange={handleChange} />
                <label style={{ fontSize: '13px' }}>Set as Primary Contact</label>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" onClick={() => { setShowModal(false); setEditingId(null); }} style={{ padding: '8px 16px', background: 'var(--surface-hover)', color: 'var(--text-main)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  {loading ? 'Saving...' : (editingId ? 'Update Contact' : 'Save Contact')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
