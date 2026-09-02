"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, PackagePlus, Sparkles } from 'lucide-react';
import { ProductForm } from '../../components/ProductForm';

export default function NewProductPage() {
  const router = useRouter();

  const handleSuccess = (savedProduct: any) => {
    router.push('/erp/inventory/products');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Link 
              href="/erp/inventory/products"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--surface-main)',
                border: '1px solid var(--border-main)',
                color: 'var(--text-muted)',
                textDecoration: 'none'
              }}
            >
              <ArrowLeft size={16} />
            </Link>
            <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em' }}>
              Register New Inventory Item
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Configure product metadata, pricing, barcode, and initial warehouse stock thresholds.
          </p>
        </div>
      </div>

      {/* Main Product Form Container */}
      <ProductForm
        onSuccess={handleSuccess}
        onCancel={() => router.push('/erp/inventory/products')}
        isModal={false}
      />
    </div>
  );
}
