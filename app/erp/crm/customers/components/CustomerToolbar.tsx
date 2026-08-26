"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface CustomerToolbarProps {
  onRefresh?: () => void;
  onExport?: () => void;
  onReference?: () => void;
  customers?: any[];
}

export function CustomerToolbar({ onRefresh, onExport, onReference }: CustomerToolbarProps) {
  const [showRefModal, setShowRefModal] = useState(false);
  const [references, setReferences] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for creating / editing reference
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    referenceText: '',
    discountAmount: '',
    description: ''
  });

  const fetchReferences = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/crm/customer-references');
      if (res.ok) {
        const data = await res.json();
        setReferences(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showRefModal) {
      fetchReferences();
    }
  }, [showRefModal]);

  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      if (!customers || customers.length === 0) {
        alert("No customers to export.");
        return;
      }
      
      const headers = ['Name', 'Email', 'Phone', 'Status', 'Balance', 'Credit Limit'];
      const csvContent = [
        headers.join(','),
        ...customers.map(c => [
          `"${c.name || ''}"`,
          `"${c.email || ''}"`,
          `"${c.phone || ''}"`,
          `"${c.status || ''}"`,
          `"${c.balance || '0'}"`,
          `"${c.creditLimit || '0'}"`
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleReferenceClick = () => {
    if (onReference) {
      onReference();
    } else {
      setShowRefModal(true);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ referenceText: '', discountAmount: '', description: '' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.referenceText.trim()) {
      alert("Please enter Reference Text");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingId 
        ? `/api/crm/customer-references/${editingId}`
        : '/api/crm/customer-references';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceText: formData.referenceText,
          discountAmount: Number(formData.discountAmount || 0),
          description: formData.description
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save reference');
      }

      resetForm();
      await fetchReferences();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error saving reference');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (ref: any) => {
    setEditingId(ref.id);
    setFormData({
      referenceText: ref.referenceText || '',
      discountAmount: ref.discountAmount ? ref.discountAmount.toString() : '',
      description: ref.description || ''
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this reference?")) return;
    try {
      const res = await fetch(`/api/crm/customer-references/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (editingId === id) resetForm();
        fetchReferences();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Export Button */}
        <button 
          onClick={handleExport}
          style={{
            padding: '10px 16px',
            background: 'var(--surface-main)',
            border: '1px solid var(--border-main)',
            borderRadius: '8px',
            color: 'var(--text-main)',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
          Export
        </button>

        {/* Reference Button - Positioned Beside Export */}
        <button 
          onClick={handleReferenceClick}
          style={{
            padding: '10px 16px',
            background: 'var(--surface-main)',
            border: '1px solid var(--border-main)',
            borderRadius: '8px',
            color: 'var(--text-main)',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>badge</span>
          Reference
        </button>

        {/* Refresh Button */}
        <button 
          onClick={onRefresh}
          title="Refresh List"
          style={{
            padding: '10px 16px',
            background: 'var(--surface-main)',
            border: '1px solid var(--border-main)',
            borderRadius: '8px',
            color: 'var(--text-main)',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
        </button>

        {/* New Customer Button */}
        <Link href="/erp/crm/customers/new" style={{ textDecoration: 'none' }}>
          <button style={{
            padding: '10px 20px',
            background: 'var(--primary)',
            border: '1px solid var(--primary-700)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
            New Customer
          </button>
        </Link>
      </div>

      {/* Customer References Modal */}
      {showRefModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ background: 'var(--surface-main)', padding: '28px', borderRadius: '14px', width: '100%', maxWidth: '580px', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '24px' }}>badge</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Manage Customer References</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Configure references and auto-applied discounts for sales orders</p>
                </div>
              </div>
              <button onClick={() => setShowRefModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Reference Form */}
            <form onSubmit={handleSave} style={{ background: 'var(--surface-hover)', padding: '16px', borderRadius: '10px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid var(--border-main)' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)' }}>
                {editingId ? '✏️ Edit Reference' : '➕ Add New Reference'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reference Text *</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.referenceText} 
                    onChange={e => setFormData({ ...formData, referenceText: e.target.value })} 
                    placeholder="e.g. VIP Member, REF-100" 
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--surface-main)', border: '1px solid var(--border-main)', borderRadius: '6px', color: 'var(--text-main)', outline: 'none', fontSize: '13px' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Other Discount Amount (BDT)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    value={formData.discountAmount} 
                    onChange={e => setFormData({ ...formData, discountAmount: e.target.value })} 
                    placeholder="e.g. 500" 
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--surface-main)', border: '1px solid var(--border-main)', borderRadius: '6px', color: 'var(--text-main)', outline: 'none', fontSize: '13px' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                {editingId && (
                  <button 
                    type="button" 
                    onClick={resetForm} 
                    style={{ padding: '8px 14px', background: 'transparent', border: '1px solid var(--border-main)', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                  >
                    Cancel Edit
                  </button>
                )}
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>save</span>
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Reference' : 'Save Reference'}
                </button>
              </div>
            </form>

            {/* Saved References Table */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
                Saved References ({references.length})
              </div>

              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Loading references...</div>
              ) : references.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', background: 'var(--surface-hover)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  No saved references yet. Use the form above to add one.
                </div>
              ) : (
                <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Reference Text</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Discount Amount</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', width: '100px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {references.map((ref: any) => (
                        <tr key={ref.id} style={{ borderTop: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-main)' }}>
                            {ref.referenceText}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>
                            BDT {Number(ref.discountAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                              <button 
                                onClick={() => handleEdit(ref)} 
                                title="Edit Reference"
                                style={{ padding: '4px 8px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', borderRadius: '4px', color: 'var(--primary)', cursor: 'pointer' }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
                              </button>
                              <button 
                                onClick={() => handleDelete(ref.id)} 
                                title="Delete Reference"
                                style={{ padding: '4px 8px', background: 'var(--danger-glow, rgba(239,68,68,0.1))', border: '1px solid var(--danger, #ef4444)', borderRadius: '4px', color: 'var(--danger, #ef4444)', cursor: 'pointer' }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRefModal(false)} style={{ padding: '8px 18px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', borderRadius: '6px', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
