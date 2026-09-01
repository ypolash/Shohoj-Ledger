"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Download, 
  RefreshCw, 
  Plus, 
  LayoutList, 
  LayoutGrid, 
  Sliders 
} from 'lucide-react';

interface ExpenseToolbarProps {
  onRefresh?: () => void;
  onExport?: () => void;
  expenses?: any[];
  viewMode?: 'table' | 'grid';
  onViewModeChange?: (mode: 'table' | 'grid') => void;
  density?: 'comfortable' | 'compact';
  onDensityChange?: (density: 'comfortable' | 'compact') => void;
}

export function ExpenseToolbar({ 
  onRefresh, 
  onExport, 
  expenses = [],
  viewMode = 'table',
  onViewModeChange,
  density = 'comfortable',
  onDensityChange
}: ExpenseToolbarProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      if (!expenses || expenses.length === 0) {
        alert("No expense records to export.");
        return;
      }
      
      const headers = ['Reference', 'Date', 'Category', 'Payment Channel', 'Amount Paid', 'Status', 'Description'];
      const csvContent = [
        headers.join(','),
        ...expenses.map((exp: any) => [
          `"EXP-${exp.id.slice(0, 8).toUpperCase()}"`,
          `"${new Date(exp.createdAt).toLocaleDateString()}"`,
          `"${exp.category || ''}"`,
          `"${exp.paymentMethod || ''}"`,
          `"${exp.amount || 0}"`,
          `"${exp.approvalStatus || 'APPROVED'}"`,
          `"${(exp.description || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `expense_export_${new Date().toISOString().split('T')[0]}.csv`);
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
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'flex-start', 
      flexWrap: 'wrap', 
      gap: '16px', 
      marginBottom: '24px' 
    }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
          Expenses & Disbursements
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>
          Track and categorize company outlays, operational costs, and vendor disbursements.
        </p>
      </div>

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

        {/* Density Switcher with Fixed Width to prevent layout shifting */}
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
          title="Refresh List"
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

        {/* Primary CTA: Record Expense */}
        <Link href="/erp/finance/expenses/create" style={{ textDecoration: 'none' }}>
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
            <span>Record Expense</span>
          </button>
        </Link>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
