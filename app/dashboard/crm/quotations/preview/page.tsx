"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Modular Components
import { QuotationPDF } from "../components/QuotationPDF";

export default function PreviewQuotationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams?.get('id');
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const res = await fetch(`/api/crm/quotations/${id}`);
        if (res.ok) {
          const data = await res.json();
          setQuotation(data.quotation || data);
        } else {
          router.push('/dashboard/crm/quotations');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchQuotation();
    else router.push('/dashboard/crm/quotations');
  }, [id, router]);

  if (loading) {
    return <div style={{ padding: '48px', textAlign: 'center' }}>Loading PDF Preview...</div>;
  }

  if (!quotation) return null;

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', padding: '32px' }}>
      
      {/* Top action bar */}
      <div style={{ 
        maxWidth: '800px', margin: '0 auto 24px auto', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'white', padding: '16px 24px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
      }}>
        <button 
          onClick={() => router.back()}
          style={{ background: 'transparent', border: '1px solid #ddd', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
        >
          Close Preview
        </button>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ 
            background: 'white', border: '1px solid #ddd', padding: '8px 16px', borderRadius: '6px', 
            cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>print</span>
            Print
          </button>
          <button style={{ 
            background: 'var(--primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', 
            cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
            Download PDF
          </button>
        </div>
      </div>

      {/* The Printable PDF Wrapper */}
      <QuotationPDF quotation={quotation} />

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #pdf-content, #pdf-content * { visibility: visible; }
          #pdf-content { position: absolute; left: 0; top: 0; }
        }
      `}} />
    </div>
  );
}
