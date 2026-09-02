"use client";

import React from 'react';
import { X, PackagePlus, Edit } from 'lucide-react';
import { ProductForm, EMPTY_PRODUCT_FORM } from './ProductForm';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedProduct?: any) => void;
  editingId?: string | null;
  initialData?: any;
}

export { EMPTY_PRODUCT_FORM };

export default function ProductModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  editingId, 
  initialData 
}: ProductModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        zIndex: 1100, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'rgba(0,0,0,0.55)', 
        backdropFilter: 'blur(5px)',
        padding: '16px',
        animation: 'backdropFade 0.2s ease'
      }}
      onClick={(e) => { 
        if (e.target === e.currentTarget) onClose(); 
      }}
    >
      <div 
        className="glass-panel" 
        style={{ 
          width: '100%', 
          maxWidth: '780px', 
          borderRadius: '20px', 
          background: 'var(--surface-main)',
          border: '1px solid var(--border-main)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxHeight: '92vh', 
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Modal Header */}
        <div style={{ 
          padding: '20px 24px', 
          borderBottom: '1px solid var(--border-main)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'var(--surface-hover)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
            }}>
              {editingId ? <Edit size={18} /> : <PackagePlus size={18} />}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                {editingId ? 'Edit Product Specifications' : 'Register New Inventory Product'}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {editingId ? 'Update product pricing, stock thresholds, and attributes' : 'Add product to inventory catalog with pricing and opening stock'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              color: 'var(--text-muted)',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          <ProductForm
            initialData={initialData}
            editingId={editingId}
            onSuccess={(p) => {
              onSuccess(p);
              onClose();
            }}
            onCancel={onClose}
            isModal={true}
          />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(12px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes backdropFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}} />
    </div>
  );
}
