"use client";

import React, { useState, useEffect } from 'react';
import { AdvanceTable } from './components/AdvanceTable';

export default function AdvancesPage() {
  const [advances, setAdvances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Modal state
  const [members, setMembers] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ memberId: '', amount: '', reason: '', date: new Date().toISOString().split('T')[0] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAdvances();
    fetchMembers();
  }, []);

  const fetchAdvances = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/finance/advances');
      if (res.ok) setAdvances(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/hr/members');
      if (res.ok) setMembers(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const url = editingId ? `/api/finance/advances/${editingId}` : '/api/finance/advances';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || `Failed to ${editingId ? 'update' : 'issue'} advance`);
        return;
      }

      setSuccess(editingId ? 'Advance updated successfully' : 'Advance issued successfully');
      setShowModal(false);
      setEditingId(null);
      setForm({ memberId: '', amount: '', reason: '', date: new Date().toISOString().split('T')[0] });
      fetchAdvances();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (advance: any) => {
    setForm({
      memberId: advance.memberId,
      amount: advance.amount.toString(),
      reason: advance.reason || '',
      date: new Date(advance.createdAt).toISOString().split('T')[0]
    });
    setEditingId(advance.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this advance?')) return;
    try {
      const res = await fetch(`/api/finance/advances/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccess('Advance deleted successfully');
        fetchAdvances();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete advance');
      }
    } catch (e) {
      setError('Network error');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>Vendor & Staff Advances</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Manage prepayments and temporary capital issuance</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => {
              setEditingId(null);
              setForm({ memberId: '', amount: '', reason: '', date: new Date().toISOString().split('T')[0] });
              setShowModal(true);
            }}
            style={{ padding: '10px 24px', borderRadius: '8px', background: 'var(--primary)', border: 'none', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary-dark)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'var(--primary)'}
          >
            Issue Advance
          </button>
        </div>
      </div>

      {success && (
        <div style={{ marginBottom: '24px', padding: '12px 16px', borderRadius: '8px', background: 'var(--success-subtle)', color: 'var(--success)', border: '1px solid var(--success)' }}>
          ✓ {success}
        </div>
      )}

      <AdvanceTable advances={advances} isLoading={isLoading} onEdit={handleEdit} onDelete={handleDelete} />

      {/* Modal for Issuing Advance */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', borderRadius: '20px', padding: '32px', margin: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-main)' }}>{editingId ? 'Edit Advance' : 'Issue Advance'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
              </button>
            </div>
            
            {error && <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', background: 'var(--danger-subtle)', color: 'var(--danger)', fontSize: '14px' }}>⚠ {error}</div>}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Select Beneficiary *</label>
                <select 
                  value={form.memberId} 
                  onChange={e => setForm(f => ({ ...f, memberId: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px' }}
                >
                  <option value="">-- Select Beneficiary --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Amount *</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  value={form.amount} 
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00" 
                  required 
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Date *</label>
                <input 
                  type="date" 
                  value={form.date} 
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  required 
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Reason (Optional)</label>
                <textarea 
                  value={form.reason} 
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="e.g. For project materials" 
                  rows={3}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }} 
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--surface-hover)', color: 'var(--text-main)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                  {submitting ? (editingId ? 'Updating...' : 'Issuing...') : (editingId ? 'Update Advance' : 'Issue Advance')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
