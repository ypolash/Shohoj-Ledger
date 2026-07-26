import React from 'react';
import { JournalToolbar } from './components/JournalToolbar';
import { JournalFilters } from './components/JournalFilters';
import { JournalTable } from './components/JournalTable';

export default function JournalPage() {
  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      <JournalToolbar />
      <JournalFilters />
      <JournalTable />
    </div>
  );
}
