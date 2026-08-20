"use client";

import React, { useState, useEffect } from 'react';

interface LeadNotesProps {
  leadId: string;
}

export function LeadNotes({ leadId }: LeadNotesProps) {
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");

  const fetchNotes = async () => {
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/activities?type=NOTE`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.activities || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchNotes();
    }
  }, [leadId]);

  const handleSaveNote = async () => {
    if (!newNote.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'NOTE', description: newNote })
      });
      if (res.ok) {
        setNewNote("");
        fetchNotes();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNote = async (activityId: string) => {
    if (!editNote.trim()) return;
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/activities/${activityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: editNote })
      });
      if (res.ok) {
        setEditingId(null);
        fetchNotes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNote = async (activityId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/activities/${activityId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchNotes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ padding: '16px', background: 'var(--surface-hover)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>Quick Note</h4>
        <textarea 
          placeholder="Type your note here... (Rich text ready)"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid var(--border-main)',
            background: 'var(--bg-main)',
            fontSize: '14px',
            color: 'var(--text-main)',
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
            marginBottom: '12px'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={handleSaveNote}
            disabled={loading || !newNote.trim()}
            style={{
              padding: '8px 16px',
              background: 'var(--primary)',
              color: 'white',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: (loading || !newNote.trim()) ? 'not-allowed' : 'pointer',
              border: 'none',
              opacity: (loading || !newNote.trim()) ? 0.7 : 1
          }}>{loading ? 'Saving...' : 'Save Note'}</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {fetching ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading notes...</div>
        ) : notes.length > 0 ? (
          notes.map((note) => (
            <div key={note.id} style={{ padding: '16px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--surface-main)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--warning)' }}>push_pin</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => { setEditingId(note.id); setEditNote(note.description); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}>Edit</button>
                  <button onClick={() => handleDeleteNote(note.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
                </div>
              </div>

              {editingId === note.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  <textarea 
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '60px',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-main)',
                      background: 'var(--bg-main)',
                      fontSize: '14px',
                      color: 'var(--text-main)',
                      resize: 'vertical',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button onClick={() => setEditingId(null)} style={{ padding: '4px 8px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-main)' }}>Cancel</button>
                    <button onClick={() => handleUpdateNote(note.id)} style={{ padding: '4px 8px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Save</button>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '14px', color: 'var(--text-main)', margin: 0, whiteSpace: 'pre-wrap' }}>{note.description}</p>
              )}
            </div>
          ))
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No notes available.</div>
        )}
      </div>
    </div>
  );
}
