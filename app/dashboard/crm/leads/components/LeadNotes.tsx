"use client";

import React, { useState } from 'react';

interface LeadNotesProps {
  notes: string | null;
}

export function LeadNotes({ notes }: LeadNotesProps) {
  const [newNote, setNewNote] = useState("");

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
          <button style={{
            padding: '8px 16px',
            background: 'var(--primary)',
            color: 'white',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}>Save Note</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {notes ? (
          <div style={{ padding: '16px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--surface-main)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--warning)' }}>push_pin</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>PINNED NOTE</span>
              </div>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-main)', margin: 0, whiteSpace: 'pre-wrap' }}>{notes}</p>
          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No notes available.</div>
        )}
      </div>
    </div>
  );
}
