"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export function CustomerNotes({ customer }: { customer: any }) {
  const [newNote, setNewNote] = useState(customer?.notes || "");
  const [displayedNote, setDisplayedNote] = useState(customer?.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!customer?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/crm/customers/${customer.id}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: newNote })
      });
      if (res.ok) {
        setDisplayedNote(newNote);
      } else {
        throw new Error("Failed to save note");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ padding: '16px', background: 'var(--surface-hover)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>Quick Note</h4>
        <textarea 
          placeholder="Type your note here..."
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
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '8px 16px',
              background: 'var(--primary)',
              color: 'white',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              opacity: saving ? 0.7 : 1
            }}>
            {saving ? "Saving..." : "Save Note"}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {displayedNote ? (
          <div style={{ padding: '16px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--surface-main)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--warning)' }}>push_pin</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>PINNED NOTE</span>
              </div>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-main)', margin: 0, whiteSpace: 'pre-wrap' }}>{displayedNote}</p>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No notes recorded yet.</div>
        )}
      </div>
    </div>
  );
}
