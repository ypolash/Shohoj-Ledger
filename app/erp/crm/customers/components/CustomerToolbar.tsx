"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Download, 
  RefreshCw, 
  Plus, 
  BadgePercent, 
  LayoutList, 
  LayoutGrid, 
  Sliders, 
  X, 
  Save, 
  Edit2, 
  Trash2,
  FileSpreadsheet
} from 'lucide-react';

interface CustomerToolbarProps {
  onRefresh?: () => void;
  onExport?: () => void;
  onReference?: () => void;
  customers?: any[];
  viewMode?: 'table' | 'grid';
  onViewModeChange?: (mode: 'table' | 'grid') => void;
  density?: 'comfortable' | 'compact';
  onDensityChange?: (density: 'comfortable' | 'compact') => void;
}

export function CustomerToolbar({ 
  onRefresh, 
  onExport, 
  onReference, 
  customers = [],
  viewMode = 'table',
  onViewModeChange,
  density = 'comfortable',
  onDensityChange
}: CustomerToolbarProps) {
  const [showRefModal, setShowRefModal] = useState(false);
  const [references, setReferences] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      
      const headers = ['Name', 'Customer Code', 'Email', 'Phone', 'Group', 'Status', 'Balance', 'Credit Limit'];
      const csvContent = [
        headers.join(','),
        ...customers.map((c: any) => [
          `"${c.displayName || c.name || ''}"`,
          `"${c.customerCode || ''}"`,
          `"${c.email || ''}"`,
          `"${c.phone || c.mobile || ''}"`,
          `"${c.customerGroup?.name || c.group?.name || ''}"`,
          `"${c.status || 'ACTIVE'}"`,
          `"${c.balance || c.outstandingBalance || 0}"`,
          `"${c.creditLimit || 0}"`
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

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    if (onRefresh) onRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
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

  const actionBtnStyle: React.CSSProperties = {
    padding: '9px 14px',
    background: 'var(--surface-main)',
    border: '1px solid var(--border-main)',
    borderRadius: '8px',
    color: 'var(--text-main)',
    fontSize: '0.85rem',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
    transition: 'all 0.15s ease'
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        
        {/* View Mode Switcher */}
        {onViewModeChange && (
          <div style={{
            display: 'inline-flex',
            background: 'var(--surface-hover)',
            borderRadius: '8px',
            padding: '3px',
            border: '1px solid var(--border-main)'
          }}>
            <button
              onClick={() => onViewModeChange('table')}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                background: viewMode === 'table' ? 'var(--surface-main)' : 'transparent',
                border: 'none',
                color: viewMode === 'table' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer'
              }}
              title="Table View"
            >
              <LayoutList size={16} />
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                background: viewMode === 'grid' ? 'var(--surface-main)' : 'transparent',
                border: 'none',
                color: viewMode === 'grid' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer'
              }}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        )}

        {/* Density Switcher with Fixed Width (Table mode only) */}
        {viewMode === 'table' && onDensityChange && (
          <button
            onClick={() => onDensityChange(density === 'comfortable' ? 'compact' : 'comfortable')}
            style={{
              ...actionBtnStyle,
              width: '126px',
              justifyContent: 'center'
            }}
            title={`Toggle Table Density (Currently: ${density})`}
          >
            <Sliders size={15} color="var(--text-muted)" />
            <span style={{ fontSize: '0.8rem' }}>{density === 'comfortable' ? 'Comfortable' : 'Compact'}</span>
          </button>
        )}

        {/* Reference Discounts Button */}
        <button 
          onClick={() => setShowRefModal(true)}
          style={actionBtnStyle}
          title="Manage Customer Discounts & References"
        >
          <BadgePercent size={16} color="var(--primary)" />
          <span>Discounts</span>
        </button>

        {/* Export Button */}
        <button 
          onClick={handleExport}
          style={actionBtnStyle}
          title="Export CSV list"
        >
          <Download size={16} />
          <span>Export</span>
        </button>

        {/* Refresh Button */}
        <button 
          onClick={handleRefreshClick}
          title="Refresh Customer List"
          style={{
            ...actionBtnStyle,
            padding: '9px 12px'
          }}
        >
          <RefreshCw 
            size={16} 
            style={{ 
              animation: isRefreshing ? 'spin 0.6s linear infinite' : 'none' 
            }} 
          />
        </button>

        {/* Primary CTA: New Customer */}
        <Link href="/erp/crm/customers/new" style={{ textDecoration: 'none' }}>
          <button style={{
            padding: '9px 18px',
            background: 'var(--primary)',
            border: '1px solid var(--primary-700, #1d4ed8)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px var(--primary-glow)',
            transition: 'all 0.15s ease'
          }}>
            <Plus size={18} />
            <span>New Customer</span>
          </button>
        </Link>
      </div>

      {/* Customer References Modal */}
      {showRefModal && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(4px)',
          zIndex: 9999, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="glass-card" style={{ 
            background: 'var(--surface-main)', 
            padding: '24px', 
            borderRadius: '16px', 
            width: '100%', 
            maxWidth: '560px', 
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            animation: 'fadeInScale 0.2s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-main)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'var(--primary-glow)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <BadgePercent size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Customer References & Discounts</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Configure references and auto-applied discounts for sales orders</p>
                </div>
              </div>
              <button 
                onClick={() => setShowRefModal(false)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Reference Form */}
            <form onSubmit={handleSave} style={{ 
              background: 'var(--surface-hover)', 
              padding: '16px', 
              borderRadius: '10px', 
              marginBottom: '20px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px', 
              border: '1px solid var(--border-main)' 
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
                {editingId ? 'Edit Reference Rule' : 'Add New Reference Rule'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reference Text *</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.referenceText} 
                    onChange={e => setFormData({ ...formData, referenceText: e.target.value })} 
                    placeholder="e.g. VIP Member, REF-100" 
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--surface-main)', border: '1px solid var(--border-main)', borderRadius: '6px', color: 'var(--text-main)', outline: 'none', fontSize: '0.85rem' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Other Discount Amount (BDT)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    value={formData.discountAmount} 
                    onChange={e => setFormData({ ...formData, discountAmount: e.target.value })} 
                    placeholder="e.g. 500" 
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--surface-main)', border: '1px solid var(--border-main)', borderRadius: '6px', color: 'var(--text-main)', outline: 'none', fontSize: '0.85rem' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                {editingId && (
                  <button 
                    type="button" 
                    onClick={resetForm} 
                    style={{ padding: '7px 12px', background: 'transparent', border: '1px solid var(--border-main)', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    Cancel
                  </button>
                )}
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  style={{ 
                    padding: '7px 16px', 
                    background: 'var(--primary)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: isSubmitting ? 'not-allowed' : 'pointer', 
                    fontSize: '0.85rem', 
                    fontWeight: 600, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px' 
                  }}
                >
                  <Save size={15} />
                  <span>{isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Save Reference'}</span>
                </button>
              </div>
            </form>

            {/* Saved References Table */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
                Active References ({references.length})
              </div>

              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading references...</div>
              ) : references.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', background: 'var(--surface-hover)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  No saved references yet. Use the form above to create one.
                </div>
              ) : (
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-main)', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Reference Text</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Discount Amount</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', width: '90px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {references.map((ref: any) => (
                        <tr key={ref.id} style={{ borderTop: '1px solid var(--border-main)' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-main)' }}>
                            {ref.referenceText}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>
                            BDT {Number(ref.discountAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                              <button 
                                onClick={() => handleEdit(ref)} 
                                title="Edit Reference"
                                style={{ padding: '4px 6px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', borderRadius: '4px', color: 'var(--primary)', cursor: 'pointer' }}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button 
                                onClick={() => handleDelete(ref.id)} 
                                title="Delete Reference"
                                style={{ padding: '4px 6px', background: 'var(--danger-glow)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '4px', color: 'var(--danger)', cursor: 'pointer' }}
                              >
                                <Trash2 size={13} />
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
              <button 
                onClick={() => setShowRefModal(false)} 
                style={{ padding: '8px 18px', background: 'var(--surface-hover)', border: '1px solid var(--border-main)', borderRadius: '8px', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}} />
    </>
  );
}
