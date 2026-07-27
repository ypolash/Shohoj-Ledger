"use client";

import React, { useState, useEffect } from 'react';

/** Warehouse record from API */
interface Warehouse {
  id: string;
  code: string;
  name: string;
  location?: string;
  status: string;
  manager?: { firstName: string; lastName: string };
  _count: { stockTransactions: number };
}

/**
 * ERP Inventory — Warehouses Page
 * Displays all warehouses in a card/table layout with manager info and transaction counts.
 * Supports creating new warehouses via a modal form.
 */
export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', location: '', status: 'ACTIVE' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { fetchWarehouses(); }, []);

  /** Loads all warehouses from the API */
  const fetchWarehouses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/inventory/warehouses');
      if (res.ok) { const d = await res.json(); setWarehouses(d.warehouses || []); }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  /** Handles form field changes */
  const handleForm = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  /** Submits the new warehouse to the API */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/inventory/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Failed to create warehouse'); return; }
      setSuccessMsg('Warehouse created successfully!');
      setShowModal(false);
      setForm({ code: '', name: '', location: '', status: 'ACTIVE' });
      fetchWarehouses();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) { setError('Network error'); }
    finally { setSubmitting(false); }
  };

  const activeCount = warehouses.filter(w => w.status === 'ACTIVE').length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Warehouses</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            {warehouses.length} warehouse{warehouses.length !== 1 ? 's' : ''} · {activeCount} active
          </p>
        </div>
        <button className="btn btn-primary hover-lift" onClick={() => { setShowModal(true); setError(''); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
          Add Warehouse
        </button>
      </div>

      {successMsg && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--success-subtle)', color: 'var(--success)', border: '1px solid var(--success)', fontSize: '14px' }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Warehouse Cards */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-4)' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-panel" style={{ borderRadius: '16px', padding: '24px', height: '140px', opacity: 0.6 }} />
          ))}
        </div>
      ) : warehouses.length === 0 ? (
        <div className="glass-panel" style={{ borderRadius: '16px', padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4, display: 'block', marginBottom: '8px' }}>warehouse</span>
          No warehouses yet. Add your first location.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-4)' }}>
          {warehouses.map(w => (
            <div key={w.id} className="glass-panel hover-lift" style={{ borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--primary)' }}>warehouse</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)' }}>{w.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, fontFamily: 'monospace' }}>{w.code}</div>
                  </div>
                </div>
                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: w.status === 'ACTIVE' ? 'var(--success)' : 'var(--text-muted)', background: w.status === 'ACTIVE' ? 'var(--success-subtle)' : 'var(--surface-hover)' }}>
                  {w.status}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '4px', borderTop: '1px solid var(--border-main)' }}>
                {w.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-muted)' }}>location_on</span>
                    {w.location}
                  </div>
                )}
                {w.manager && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-muted)' }}>person</span>
                    {w.manager.firstName} {w.manager.lastName}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-muted)' }}>swap_horiz</span>
                  {w._count.stockTransactions} stock movements
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Warehouse Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', borderRadius: '20px', padding: '32px', margin: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-main)' }}>Add Warehouse</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
              </button>
            </div>

            {error && <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', background: 'var(--danger-subtle)', color: 'var(--danger)', fontSize: '14px' }}>⚠ {error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Warehouse Code *</label>
                <input type="text" value={form.code} onChange={e => handleForm('code', e.target.value)} placeholder="e.g. WH-001" required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Warehouse Name *</label>
                <input type="text" value={form.name} onChange={e => handleForm('name', e.target.value)} placeholder="e.g. Main Storage" required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Location</label>
                <input type="text" value={form.location} onChange={e => handleForm('location', e.target.value)} placeholder="e.g. Dhaka, Bangladesh" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={form.status} onChange={e => handleForm('status', e.target.value)} style={inputStyle}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="MAINTENANCE">Under Maintenance</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' };
