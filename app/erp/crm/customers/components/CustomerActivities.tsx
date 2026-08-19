"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface CustomerActivitiesProps {
  customer: any;
}

export function CustomerActivities({ customer }: CustomerActivitiesProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    type: 'TASK',
    title: '',
    date: new Date().toISOString().slice(0, 16),
    status: 'UPCOMING',
    notes: ''
  });

  const fetchActivities = async () => {
    if (!customer?.id) return;
    try {
      const res = await fetch(`/api/crm/customers/${customer.id}/activities`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (customer?.id) {
      fetchActivities();
    }
  }, [customer?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/customers/${customer.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ type: 'TASK', title: '', date: new Date().toISOString().slice(0, 16), status: 'UPCOMING', notes: '' });
        fetchActivities();
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <button 
          onClick={() => setShowModal(true)}
          style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          + Add Activity
        </button>
      </div>

      {activities.map(act => {
        let statusColor = 'var(--gray-500)';
        if (act.status === 'UPCOMING') statusColor = 'var(--primary)';
        if (act.status === 'OVERDUE') statusColor = 'var(--danger)';
        if (act.status === 'COMPLETED') statusColor = 'var(--success)';

        let icon = 'task';
        if (act.type === 'CALL') icon = 'call';
        if (act.type === 'MEETING') icon = 'event';

        return (
          <div key={act.id} style={{ 
            display: 'flex', alignItems: 'center', gap: '16px', 
            padding: '16px', border: '1px solid var(--border-light)', 
            borderRadius: '8px', background: 'var(--surface-main)' 
          }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '8px', 
              background: `color-mix(in srgb, ${statusColor} 15%, transparent)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span className="material-symbols-outlined" style={{ color: statusColor }}>{icon}</span>
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{act.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {new Date(act.date).toLocaleString()}
              </div>
              {act.notes && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic' }}>
                  "{act.notes}"
                </div>
              )}
            </div>

            <span style={{ 
              fontSize: '10px', fontWeight: 600, padding: '4px 8px', borderRadius: '12px',
              color: statusColor, background: `color-mix(in srgb, ${statusColor} 10%, transparent)`
            }}>
              {act.status}
            </span>
          </div>
        );
      })}

      {activities.length === 0 && (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', background: 'var(--surface-main)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          No activities recorded yet.
        </div>
      )}

      {showModal && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'var(--surface-main)', padding: '24px', borderRadius: '12px', width: '400px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border-light)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px' }}>Add Activity</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Type *</label>
                <select name="type" value={formData.type} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-hover)', color: 'var(--text-main)' }}>
                  <option value="CALL">Call</option>
                  <option value="MEETING">Meeting</option>
                  <option value="TASK">Task</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Title *</label>
                <input required name="title" value={formData.title} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-hover)', color: 'var(--text-main)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Date/Time *</label>
                <input required type="datetime-local" name="date" value={formData.date} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-hover)', color: 'var(--text-main)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Status *</label>
                <select name="status" value={formData.status} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-hover)', color: 'var(--text-main)' }}>
                  <option value="UPCOMING">Upcoming</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Notes</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-hover)', color: 'var(--text-main)', resize: 'vertical' }} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', background: 'var(--surface-hover)', color: 'var(--text-main)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  {loading ? 'Saving...' : 'Save Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
