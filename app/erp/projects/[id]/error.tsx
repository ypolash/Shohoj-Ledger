"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';

export default function ProjectWorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Project Workspace Error:", error);
  }, [error]);

  return (
    <PageContainer>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '40px 20px',
        color: '#f8fafc'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          color: '#f87171'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
            error_outline
          </span>
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0', color: '#f8fafc' }}>
          Unable to Load Project Workspace
        </h2>

        <p style={{ maxWidth: '460px', fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 24px 0' }}>
          {error?.message || 'An unexpected error occurred while rendering this project workspace. Please try reloading or return to the project portfolio.'}
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => reset()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
            Try Again
          </button>

          <Link
            href="/erp/projects"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              fontWeight: 600,
              fontSize: '13px',
              textDecoration: 'none'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
            Return to Projects
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
