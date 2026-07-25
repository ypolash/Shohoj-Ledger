"use client";

import React, { useState } from 'react';
import { AccountTypeBadge } from './AccountTypeBadge';

// Helper interface
interface TreeNode {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: number;
  children?: TreeNode[];
}

export function AccountTree() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    '1000': true,
    '1100': true,
    '2000': false,
    '3000': false,
    '4000': false,
    '5000': true
  });

  const toggle = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const treeData: TreeNode[] = [
    {
      id: '1000', code: '1000', name: 'Assets', type: 'Asset', balance: 5000000,
      children: [
        {
          id: '1100', code: '1100', name: 'Current Assets', type: 'Asset', balance: 4950000,
          children: [
            { id: '1110', code: '1110', name: 'Cash on Hand', type: 'Asset', balance: 450000 },
            { id: '1120', code: '1120', name: 'City Bank (Main)', type: 'Asset', balance: 4500000 }
          ]
        },
        { id: '1200', code: '1200', name: 'Fixed Assets', type: 'Asset', balance: 50000 }
      ]
    },
    {
      id: '2000', code: '2000', name: 'Liabilities', type: 'Liability', balance: 1280000,
      children: [
        { id: '2100', code: '2100', name: 'Accounts Payable', type: 'Liability', balance: 1280000 }
      ]
    },
    {
      id: '5000', code: '5000', name: 'Expenses', type: 'Expense', balance: 250000,
      children: [
        { id: '5100', code: '5100', name: 'Operating Expense', type: 'Expense', balance: 250000,
          children: [
            { id: '5110', code: '5110', name: 'Office Supplies', type: 'Expense', balance: 250000 }
          ]
        }
      ]
    }
  ];

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isExpanded = !!expanded[node.id];
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: '1px solid var(--border-light)',
          background: depth === 0 ? 'var(--surface-hover)' : 'transparent',
          paddingLeft: (depth * 32 + 16) + 'px',
          cursor: hasChildren ? 'pointer' : 'default'
        }}
        onClick={() => hasChildren && toggle(node.id)}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {hasChildren ? (
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-muted)' }}>
                {isExpanded ? 'expand_more' : 'chevron_right'}
              </span>
            ) : (
              <span style={{ width: '18px' }}></span>
            )}
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>
              {depth === 0 ? 'account_balance_wallet' : hasChildren ? 'folder' : 'article'}
            </span>
            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{node.code}</span>
            <span style={{ fontWeight: depth === 0 ? 700 : 500, color: 'var(--text-main)' }}>{node.name}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <AccountTypeBadge type={node.type} />
            <span style={{ fontWeight: 700, width: '120px', textAlign: 'right', color: 'var(--text-main)' }}>
              {new Intl.NumberFormat('en-US').format(node.balance)}
            </span>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {node.children!.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="glass-card" style={{ borderRadius: '12px', overflowX: 'auto', minWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border-main)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--text-main)' }}>
          <span className="material-symbols-outlined">account_tree</span>
          Chart of Accounts Tree
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-hover)', fontSize: '12px', cursor: 'pointer', color: 'var(--text-main)' }}>Expand All</button>
          <button style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--surface-hover)', fontSize: '12px', cursor: 'pointer', color: 'var(--text-main)' }}>Collapse All</button>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {treeData.map(root => renderNode(root))}
      </div>
    </div>
  );
}
