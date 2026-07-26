"use client";

import React from 'react';
import Link from 'next/link';
import { LeadStatus } from './LeadStatus';
import { LeadPriority } from './LeadPriority';
import { LeadOwner } from './LeadOwner';
import { LeadTags } from './LeadTags';

interface LeadCardProps {
  lead: any;
  onDelete?: (id: string) => void;
}

export function LeadCard({ lead, onDelete }: LeadCardProps) {
  return (
    <div className="glass-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Link href={`/erp/crm/leads/${lead.id}`} style={{ fontSize: '16px', fontWeight: 600, color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
            {lead.companyName}
          </Link>
          <div style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 500 }}>{lead.contactPerson}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{lead.email || lead.phone}</div>
        </div>
        <LeadStatus status={lead.status} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Priority</span>
          <LeadPriority priority={lead.priority} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Assigned</span>
          <LeadOwner ownerName={lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : null} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Tags</span>
          <LeadTags tags={lead.tags} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
        <Link href={`/erp/crm/leads/${lead.id}/edit`}>
          <button style={{ padding: '8px 16px', color: 'var(--primary)', borderRadius: '6px', background: 'var(--primary-glow)', fontSize: '12px', fontWeight: 600 }}>
            Edit
          </button>
        </Link>
        <button 
          onClick={() => onDelete && onDelete(lead.id)}
          style={{ padding: '8px 16px', color: 'var(--danger)', borderRadius: '6px', background: 'var(--danger-glow)', fontSize: '12px', fontWeight: 600 }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
