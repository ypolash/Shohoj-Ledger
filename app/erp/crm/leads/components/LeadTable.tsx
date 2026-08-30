"use client";

import React from 'react';
import Link from 'next/link';
import { LeadStatus } from './LeadStatus';
import { LeadPriority } from './LeadPriority';
import { LeadOwner } from './LeadOwner';
import { LeadTags } from './LeadTags';

interface LeadTableProps {
  leads: any[];
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, newStatus: string) => void;
  onLeadClick?: (id: string) => void;
}

export function LeadTable({ leads, onDelete, onStatusChange, onLeadClick }: LeadTableProps) {
  
  const handleRowClick = (e: React.MouseEvent, id: string) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
      return;
    }
    if (onLeadClick) onLeadClick(id);
  };

  // Status color mapping for the glowing left edge
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'var(--info)';
      case 'Contacted': return 'var(--primary)';
      case 'Qualified': return 'var(--accent)';
      case 'Proposal': return 'var(--warning)';
      case 'Won': return 'var(--success)';
      case 'Lost': return 'var(--danger)';
      default: return 'var(--gray-500)';
    }
  };

  return (
    <div style={{ overflowX: 'auto', paddingBottom: '24px' }}>
      <table style={{ 
        width: '100%', 
        borderCollapse: 'separate', 
        borderSpacing: '0 12px', 
        textAlign: 'left', 
        whiteSpace: 'nowrap' 
      }}>
        <thead>
          <tr style={{ 
            color: 'var(--text-main)', 
            fontSize: '11px', 
            textTransform: 'uppercase', 
            letterSpacing: '0.1em',
          }}>
            <th style={{ padding: '0 6px 0 0', fontWeight: 600, border: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', boxSizing: 'border-box', background: 'color-mix(in srgb, var(--info) 10%, transparent)', border: '1px solid var(--info)', borderRadius: '12px', padding: '12px 16px', color: 'var(--info)' }}>
                Lead Details
              </div>
            </th>
            <th style={{ padding: '0 6px', fontWeight: 600, border: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', boxSizing: 'border-box', background: 'color-mix(in srgb, var(--primary) 10%, transparent)', border: '1px solid var(--primary)', borderRadius: '12px', padding: '12px 16px', color: 'var(--primary)' }}>
                Contact & Comms
              </div>
            </th>
            <th style={{ padding: '0 6px', fontWeight: 600, border: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', boxSizing: 'border-box', background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid var(--accent)', borderRadius: '12px', padding: '12px 16px', color: 'var(--accent)' }}>
                Pipeline Stage
              </div>
            </th>
            <th style={{ padding: '0 6px', fontWeight: 600, border: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', boxSizing: 'border-box', background: 'color-mix(in srgb, var(--warning) 10%, transparent)', border: '1px solid var(--warning)', borderRadius: '12px', padding: '12px 16px', color: 'var(--warning)' }}>
                Priority & Tags
              </div>
            </th>
            <th style={{ padding: '0 6px', fontWeight: 600, border: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', boxSizing: 'border-box', background: 'color-mix(in srgb, var(--success) 10%, transparent)', border: '1px solid var(--success)', borderRadius: '12px', padding: '12px 16px', color: 'var(--success)' }}>
                Owner
              </div>
            </th>
            <th style={{ padding: '0 0 0 6px', fontWeight: 600, border: 'none', textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%', boxSizing: 'border-box', background: 'var(--surface-hover)', border: '1px solid var(--text-muted)', borderRadius: '12px', padding: '12px 16px', color: 'var(--text-main)' }}>
                Actions
              </div>
            </th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '14px' }}>
          {leads.map((lead) => {
            const statusColor = getStatusColor(lead.status);
            
            return (
              <tr 
                key={lead.id}
                onClick={(e) => handleRowClick(e, lead.id)}
                style={{ 
                  cursor: 'pointer',
                  background: 'var(--bg-main)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative'
                }}
                className="unique-table-row"
              >
                <td style={{ 
                  padding: '20px 24px', 
                  borderRadius: '16px 0 0 16px',
                  border: '1px solid var(--border-light)',
                  borderRight: 'none',
                  borderLeft: `4px solid ${statusColor}`,
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ 
                      width: '48px', height: '48px', borderRadius: '14px', 
                      background: `color-mix(in srgb, ${statusColor} 10%, transparent)`,
                      color: statusColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '20px', fontWeight: 800, border: `1px solid color-mix(in srgb, ${statusColor} 20%, transparent)`
                    }}>
                      {lead.companyName ? lead.companyName.charAt(0).toUpperCase() : 'L'}
                    </div>
                    <div>
                      <Link href={`/erp/crm/leads/${lead.id}`} style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '15px', letterSpacing: '0.02em', transition: 'color 0.2s' }} className="lead-name-link">
                        {lead.companyName || 'Unknown Company'}
                      </Link>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
                        {lead.serviceType || 'General Inquiry'}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td style={{ padding: '20px 24px', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{lead.contactPerson || 'No Contact'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--primary)' }}>alternate_email</span>
                    {lead.email || lead.phone || 'N/A'}
                  </div>
                </td>
                
                <td style={{ padding: '20px 24px', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                    <LeadStatus status={lead.status} />
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
                      UPDATED {new Date(lead.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase()}
                    </div>
                  </div>
                </td>
                
                <td style={{ padding: '20px 24px', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                    <LeadPriority priority={lead.priority} />
                    {lead.tags && lead.tags.length > 0 && (
                      <LeadTags tags={lead.tags.slice(0, 2)} />
                    )}
                  </div>
                </td>
                
                <td style={{ padding: '20px 24px', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
                  <LeadOwner ownerName={lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : 'Unassigned'} />
                </td>
                
                <td style={{ 
                  padding: '20px 24px', textAlign: 'right',
                  borderRadius: '0 16px 16px 0',
                  border: '1px solid var(--border-light)', borderLeft: 'none'
                }}>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', opacity: 0.6, transition: 'opacity 0.2s' }} className="row-actions">
                    <Link href={`/erp/crm/leads/${lead.id}/edit`}>
                      <button className="icon-btn-unique edit-btn" title="Edit Lead">
                        <span className="material-symbols-outlined">edit_square</span>
                      </button>
                    </Link>
                    <button className="icon-btn-unique delete-btn" title="Delete Lead" onClick={() => onDelete && onDelete(lead.id)}>
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      <style dangerouslySetInnerHTML={{__html: `
        .unique-table-row:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.15) !important;
          z-index: 10;
        }
        .unique-table-row:hover .row-actions {
          opacity: 1 !important;
        }
        .unique-table-row:hover .lead-name-link {
          color: var(--primary) !important;
        }
        .icon-btn-unique {
          padding: 10px;
          border-radius: 12px;
          border: 1px solid var(--border-main);
          background: var(--bg-main);
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .icon-btn-unique span {
          font-size: 18px;
        }
        .icon-btn-unique.edit-btn:hover {
          color: var(--primary);
          border-color: var(--primary);
          background: var(--primary-glow);
          transform: translateY(-2px);
        }
        .icon-btn-unique.delete-btn:hover {
          color: var(--danger);
          border-color: var(--danger);
          background: var(--danger-glow);
          transform: translateY(-2px);
        }
      `}} />
    </div>
  );
}

