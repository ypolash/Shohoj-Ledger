"use client";

import React, { useState, useEffect } from 'react';
import { InventoryDataTable, InventoryColumn } from '../components/InventoryDataTable';

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
 * ERP Inventory — Warehouses Page (Universal Table Redesign 2.0)
 * Displays all warehouses in a unified table layout with manager info and transaction counts.
 * Supports creating new warehouses via a modal form.
 */
export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [search, setSearch] = useState('');
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

  // Filter warehouses by search
  const filteredWarehouses = warehouses.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.code.toLowerCase().includes(search.toLowerCase()) ||
    (w.location && w.location.toLowerCase().includes(search.toLowerCase()))
  );

  const columns: InventoryColumn<Warehouse>[] = [
    {
      key: 'code',
      header: 'Code',
      width: '120px',
      render: (w) => (
        <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--primary, #38bdf8)', fontWeight: 600 }}>
          {w.code}
        </span>
      )
    },
    {
      key: 'name',
      header: 'Warehouse Name',
      render: (w) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary, #38bdf8)' }}>warehouse</span>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>{w.name}</div>
          </div>
        </div>
      )
    },
    {
      key: 'location',
      header: 'Location / Address',
      render: (w) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-muted)' }}>location_on</span>
          {w.location || '—'}
        </div>
      )
    },
    {
      key: 'manager',
      header: 'Manager / Lead',
      render: (w) => w.manager ? (
        <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>
          {w.manager.firstName} {w.manager.lastName}
        </span>
      ) : <span style={{ color: 'var(--text-muted)' }}>— Unassigned</span>
    },
    {
      key: 'transactions',
      header: 'Stock Movements',
      render: (w) => (
        <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'var(--surface-hover)', color: 'var(--text-main)', fontSize: '12px', fontWeight: 600, border: '1px solid var(--border-main)' }}>
          {w._count.stockTransactions} transactions
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (w) => (
        <span
          style={{
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 600,
            color: w.status === 'ACTIVE' ? 'var(--success, #10b981)' : 'var(--text-muted)',
            background: w.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.12)' : 'var(--surface-hover)'
          }}
        >
          {w.status}
        </span>
      )
    }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Warehouses & Storage</h1>
        </div>
        <button className="btn btn-primary hover-lift" onClick={() => { setShowModal(true); setError(''); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
          Add Warehouse
        </button>
      </div>

      {successMsg && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success, #10b981)', border: '1px solid var(--success)', fontSize: '14px' }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Universal Inventory Table */}
      <InventoryDataTable
        columns={columns}
        data={filteredWarehouses}
        isLoading={isLoading}
        emptyIcon="warehouse"
        emptyTitle="No warehouses found"
        emptySubtitle="Add storage locations to manage multi-warehouse inventory."
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search warehouse by name, code, or location..."
      />

      {/* Add Warehouse Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', borderRadius: '20px', padding: '32px', margin: '16px', border: '1px solid var(--border-main)', background: 'var(--surface-bg, #1e293b)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-main)' }}>Add Warehouse</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
              </button>
            </div>

            {error && <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger, #ef4444)', fontSize: '14px' }}>⚠ {error}</div>}

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
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input, rgba(15, 23, 42, 0.6))', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' };
