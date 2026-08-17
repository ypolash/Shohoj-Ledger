"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { LeadStatus } from './LeadStatus';
import { LeadPriority } from './LeadPriority';
import { LeadOwner } from './LeadOwner';
import { LeadProgress } from './LeadProgress';

interface LeadTableProps {
  leads: any[];
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, newStatus: string) => void;
}

export function LeadTable({ leads, onDelete, onStatusChange }: LeadTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };
  return (
    <div className="glass-card" style={{ overflowX: 'auto', borderRadius: '12px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ 
            background: 'var(--surface-hover)', 
            color: 'var(--text-muted)', 
            fontSize: '12px', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            borderBottom: '1px solid var(--border-main)'
          }}>
            <th style={{ padding: '16px', fontWeight: 600 }}>Lead Name</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Company</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Contact Info</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Status</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Priority</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Assigned To</th>
            <th style={{ padding: '16px', fontWeight: 600 }}>Updated</th>
            <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '14px' }}>
          {leads.map((lead) => (
            <React.Fragment key={lead.id}>
              <tr 
                onClick={() => toggleExpand(lead.id)}
                style={{ 
                  borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  background: expandedId === lead.id ? 'var(--surface-hover)' : 'transparent',
                  transition: 'background var(--transition-fast)'
                }}
              >
              <td style={{ padding: '16px' }}>
                <Link href={`/erp/crm/leads/${lead.id}`} style={{ fontWeight: 600, color: 'var(--primary)' }}>
                  {lead.companyName}
                </Link>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{lead.serviceType}</div>
              </td>
              <td style={{ padding: '16px', color: 'var(--text-main)' }}>{lead.companyName}</td>
              <td style={{ padding: '16px' }}>
                <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{lead.contactPerson}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{lead.email || lead.phone}</div>
              </td>
              <td style={{ padding: '16px' }}>
                <LeadStatus status={lead.status} />
              </td>
              <td style={{ padding: '16px' }}>
                <LeadPriority priority={lead.priority} />
              </td>
              <td style={{ padding: '16px' }}>
                <LeadOwner 
                  ownerName={lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : null} 
                />
              </td>
              <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                {new Date(lead.updatedAt).toLocaleDateString()}
              </td>
              <td style={{ padding: '16px', textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <Link href={`/erp/crm/leads/${lead.id}/edit`}>
                    <button style={{ padding: '6px', color: 'var(--primary)', borderRadius: '6px', background: 'var(--primary-glow)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                    </button>
                  </Link>
                  <button 
                    onClick={() => onDelete && onDelete(lead.id)}
                    style={{ padding: '6px', color: 'var(--danger)', borderRadius: '6px', background: 'var(--danger-glow)' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                  </button>
                </div>
              </td>
              </tr>
              {expandedId === lead.id && (
                <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
                  <td colSpan={8} style={{ padding: '0 24px 24px 24px' }}>
                    <div style={{ padding: '16px', background: 'var(--surface-main)', borderRadius: '12px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
                      <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Progress & Actions</span>
                        <Link href={`/erp/crm/leads/${lead.id}`} style={{ color: 'var(--primary)', fontSize: '12px', fontWeight: 600 }}>
                          View Full Details &rarr;
                        </Link>
                      </h4>
                      <LeadProgress 
                        leadId={lead.id} 
                        currentStatus={lead.status} 
                        onStatusChange={(newStatus) => {
                          if (onStatusChange) onStatusChange(lead.id, newStatus);
                        }} 
                      />
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
