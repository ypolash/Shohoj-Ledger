import { redirect } from 'next/navigation';

/**
 * HR Module Home
 * Redirects to the unified single Employee Directory & Workforce dashboard.
 */
export default function HRPage() {
  redirect('/erp/hr/employees');
}
