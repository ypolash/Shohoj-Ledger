"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrderNewRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/erp/inventory/orders/new?from=/erp/orders');
  }, [router]);

  return (
    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
      Opening Create Order...
    </div>
  );
}
