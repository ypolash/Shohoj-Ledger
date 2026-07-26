import React from 'react';
import { ExpenseToolbar } from './components/ExpenseToolbar';
import { ExpenseFilters } from './components/ExpenseFilters';
import { ExpenseTable } from './components/ExpenseTable';

export default function ExpensesPage() {
  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      <ExpenseToolbar />
      <ExpenseFilters />
      <ExpenseTable />
    </div>
  );
}
