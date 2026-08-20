"use client";

import React, { useState, useEffect } from 'react';

interface LeadActivityProps {
  leadId: string;
}

export function LeadActivity({ leadId }: LeadActivityProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('FOLLOW_UP_CALL');
  const [newDate, setNewDate] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchActivities = () => {
    setLoading(true);
    fetch(`/api/crm/leads/${leadId}/activities`)
      .then(res => res.json())
      .then(data => {
        if (data.activities) {
          const filtered = data.activities.filter((act: any) => 
            act.type && act.type.startsWith('FOLLOW_UP_')
          );
          setActivities(filtered);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (leadId) {
      fetchActivities();
    }
  }, [leadId]);

  const handleAddActivity = async () => {
    if (!newTitle.trim() || !newDate) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newType,
          description: newTitle,
          newValue: new Date(newDate).toISOString()
        })
      });
      if (res.ok) {
        setShowAddForm(false);
        setNewTitle('');
        setNewDate('');
        fetchActivities();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm("Are you sure you want to delete this activity?")) return;
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/activities/${activityId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchActivities();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Activities & Tasks</h4>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
        >
          {showAddForm ? 'Cancel' : '+ Add Activity'}
        </button>
      </div>

      {showAddForm && (
        <div style={{ padding: '16px', background: 'var(--surface-hover)', borderRadius: '8px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Activity Title</label>
            <input 
              type="text" 
              placeholder="e.g. Call client about pricing"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-main)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Type</label>
              <select 
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-main)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none' }}
              >
                <option value="FOLLOW_UP_CALL">Call</option>
                <option value="FOLLOW_UP_MEETING">Meeting</option>
                <option value="FOLLOW_UP_TASK">Task</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Date & Time</label>
              <input 
                type="datetime-local" 
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-main)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', colorScheme: 'dark' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button 
              onClick={handleAddActivity}
              disabled={saving || !newTitle.trim() || !newDate}
              style={{
                padding: '8px 16px', background: 'var(--primary)', color: 'white', borderRadius: '6px', fontSize: '13px', fontWeight: 600, border: 'none',
                cursor: (saving || !newTitle.trim() || !newDate) ? 'not-allowed' : 'pointer', opacity: (saving || !newTitle.trim() || !newDate) ? 0.7 : 1
              }}
            >
              {saving ? 'Saving...' : 'Save Activity'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading activities...</div>
      ) : activities.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No activities found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activities.map(act => {
            let status = 'COMPLETED';
            let statusColor = 'var(--success)';
            
            if (act.newValue) {
              const actDate = new Date(act.newValue);
              const now = new Date();
              if (actDate > now) {
                status = 'UPCOMING';
                statusColor = 'var(--primary)';
              } else {
                status = 'OVERDUE';
                statusColor = 'var(--danger)';
              }
            }

            let icon = 'task';
            if (act.type === 'FOLLOW_UP_CALL') icon = 'call';
            if (act.type === 'FOLLOW_UP_MEETING') icon = 'event';

            const dateStr = act.newValue ? new Date(act.newValue).toLocaleString() : new Date(act.createdAt).toLocaleString();

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
                  <div style={{ fontSize: '14px', fontWeight: 600, color: status === 'COMPLETED' ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: status === 'COMPLETED' ? 'line-through' : 'none' }}>
                    {act.description || 'Activity'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{dateStr}</div>
                </div>

                <span style={{ 
                  fontSize: '10px', fontWeight: 600, padding: '4px 8px', borderRadius: '12px',
                  color: statusColor, background: `color-mix(in srgb, ${statusColor} 10%, transparent)`
                }}>
                  {status}
                </span>
                
                <button 
                  onClick={() => handleDeleteActivity(act.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '4px', opacity: 0.7 }}
                  title="Delete Activity"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
