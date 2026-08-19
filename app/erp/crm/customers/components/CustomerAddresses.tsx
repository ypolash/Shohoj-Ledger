"use client";

import React, { useState, useEffect } from 'react';

interface CustomerAddressesProps {
  customer: any;
}

export function CustomerAddresses({ customer }: CustomerAddressesProps) {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    type: 'Billing',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Bangladesh',
    isDefault: false
  });

  const fetchAddresses = async () => {
    try {
      const res = await fetch(`/api/crm/customers/${customer.id}/addresses`);
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [customer.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let checked = false;
    if (e.target instanceof HTMLInputElement && type === 'checkbox') {
      checked = e.target.checked;
    }
    
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
        ? `/api/crm/customers/${customer.id}/addresses/${editingId}`
        : `/api/crm/customers/${customer.id}/addresses`;
        
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        setEditingId(null);
        setFormData({ type: 'Billing', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'Bangladesh', isDefault: false });
        fetchAddresses();
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Addresses</h4>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ type: 'Billing', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'Bangladesh', isDefault: false });
            setShowModal(true);
          }}
          style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          + Add Address
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {addresses.map(a => (
          <div key={a.id} style={{ padding: '16px', border: a.isDefault ? '1px solid var(--primary)' : '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--surface-main)', position: 'relative' }}>
            {a.isDefault && (
              <span style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '10px', background: 'var(--primary)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>DEFAULT</span>
            )}
            {!a.isDefault && (
              <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => {
                    setEditingId(a.id);
                    setFormData({ type: a.type, addressLine1: a.addressLine1, addressLine2: a.addressLine2 || '', city: a.city || '', state: a.state || '', postalCode: a.postalCode || '', country: a.country || 'Bangladesh', isDefault: a.isDefault });
                    setShowModal(true);
                  }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                </button>
                <button 
                  onClick={async () => {
                    if (confirm('Are you sure you want to delete this address?')) {
                      await fetch(`/api/crm/customers/${customer.id}/addresses/${a.id}`, { method: 'DELETE' });
                      fetchAddresses();
                    }
                  }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                </button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>
                {a.type === 'Billing' ? 'receipt_long' : 'local_shipping'}
              </span>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>{a.type} Address</div>
            </div>
            
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {a.addressLine1} <br />
              {a.addressLine2 && <>{a.addressLine2}<br /></>}
              {a.city}{a.state ? `, ${a.state}` : ''} {a.postalCode} <br />
              {a.country}
            </div>
          </div>
        ))}
        {addresses.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No addresses found.</div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'var(--surface-main)', padding: '24px', borderRadius: '12px', width: '400px', border: '1px solid var(--border-light)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px' }}>{editingId ? 'Edit Address' : 'Add Address'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Type *</label>
                <select name="type" value={formData.type} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-hover)', color: 'var(--text-main)' }}>
                  <option value="Billing">Billing</option>
                  <option value="Shipping">Shipping</option>
                  <option value="Both">Both (Billing & Shipping)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Address Line 1 *</label>
                <input required name="addressLine1" value={formData.addressLine1} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-hover)', color: 'var(--text-main)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Address Line 2</label>
                <input name="addressLine2" value={formData.addressLine2} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-hover)', color: 'var(--text-main)' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>City *</label>
                  <input required name="city" value={formData.city} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-hover)', color: 'var(--text-main)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>State</label>
                  <input name="state" value={formData.state} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-hover)', color: 'var(--text-main)' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>ZIP / Postal Code</label>
                  <input name="postalCode" value={formData.postalCode} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-hover)', color: 'var(--text-main)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Country *</label>
                  <input required name="country" value={formData.country} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-hover)', color: 'var(--text-main)' }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <input type="checkbox" name="isDefault" checked={formData.isDefault} onChange={handleChange} />
                <label style={{ fontSize: '13px' }}>Set as Default Address</label>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" onClick={() => { setShowModal(false); setEditingId(null); }} style={{ padding: '8px 16px', background: 'var(--surface-hover)', color: 'var(--text-main)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  {loading ? 'Saving...' : (editingId ? 'Update Address' : 'Save Address')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
