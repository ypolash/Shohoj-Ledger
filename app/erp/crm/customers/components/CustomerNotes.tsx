"use client";

import React, { useState } from 'react';

export function CustomerNotes() {
  const [newNote, setNewNote] = useState("");

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
        <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No notes recorded yet.</div>
      </div>
    </div>
  );
}
