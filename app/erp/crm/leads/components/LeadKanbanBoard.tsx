"use client";

import React, { useState } from 'react';
import { LeadCard } from './LeadCard';

interface LeadKanbanBoardProps {
  leads: any[];
  onDelete?: (id: string) => void;
  onStatusChange: (leadId: string, newStatus: string) => void;
  onLeadClick?: (id: string) => void;
}

const KANBAN_STAGES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

export function LeadKanbanBoard({ leads, onDelete, onStatusChange, onLeadClick }: LeadKanbanBoardProps) {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('leadId', id);
    setDraggedLeadId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) {
      // Optimistically update the UI state
      onStatusChange(leadId, newStatus);
      
      // Trigger API call
      try {
        await fetch(`/api/crm/leads/${leadId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
      } catch (error) {
        console.error("Failed to update status", error);
      }
    }
    setDraggedLeadId(null);
  };

  return (
    <div style={{ 
      display: 'flex', 
      gap: '16px', 
      overflowX: 'auto', 
      padding: '8px 0',
      minHeight: '600px',
      alignItems: 'flex-start'
    }}>
      {KANBAN_STAGES.map(stage => {
        const stageLeads = leads.filter(l => l.status === stage || (!l.status && stage === 'New'));
        
        return (
          <div 
            key={stage}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage)}
            style={{
              minWidth: '320px',
              maxWidth: '320px',
              background: 'var(--surface-hover)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              border: '1px solid var(--border-light)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {stage}
              </h3>
              <span style={{ 
                background: 'var(--bg-main)', 
                color: 'var(--text-muted)', 
                padding: '2px 8px', 
                borderRadius: '12px', 
                fontSize: '11px', 
                fontWeight: 600 
              }}>
                {stageLeads.length}
              </span>
            </div>

            {stageLeads.map(lead => (
              <div
                key={lead.id}
                draggable
                onDragStart={(e) => handleDragStart(e, lead.id)}
                onDragEnd={() => setDraggedLeadId(null)}
                onClick={(e) => {
                  // Prevent click if we are clicking a button/link inside
                  if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
                    return;
                  }
                  if (onLeadClick) onLeadClick(lead.id);
                }}
                style={{
                  cursor: 'grab',
                  opacity: draggedLeadId === lead.id ? 0.5 : 1,
                  transform: draggedLeadId === lead.id ? 'scale(0.95)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <LeadCard lead={lead} onDelete={onDelete} />
              </div>
            ))}
            
            {stageLeads.length === 0 && (
              <div style={{ 
                padding: '24px', 
                textAlign: 'center', 
                border: '2px dashed var(--border-light)', 
                borderRadius: '8px',
                color: 'var(--text-muted)',
                fontSize: '12px'
              }}>
                Drop leads here
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
