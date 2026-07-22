"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const STATUS_STAGES = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Negotiation",
  "Won",
  "Lost",
  "Archived"
];

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"KANBAN" | "TABLE">("KANBAN");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchLeads();
  }, [search]);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/crm/leads?search=${search}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    // Optimistic UI update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    
    try {
      await fetch(`/api/crm/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {
      console.error("Failed to update status", e);
      fetchLeads(); // Revert on failure
    }
  };

  // HTML5 Drag & Drop handlers
  const onDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("leadId", leadId);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, status: string) => {
    const leadId = e.dataTransfer.getData("leadId");
    if (leadId) {
      updateLeadStatus(leadId, status);
    }
  };

  return (
    <div className="animate-fade-in container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <div>
          <h1 style={{ margin: 0 }}>Lead Pipeline</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>
            Manage your sales leads and progression.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setViewMode(viewMode === "KANBAN" ? "TABLE" : "KANBAN")}>
            <span className="material-symbols-outlined">{viewMode === "KANBAN" ? "table_chart" : "view_kanban"}</span>
            Toggle View
          </button>
          <Link href="/dashboard/crm/leads/new" className="btn btn-primary">
            <span className="material-symbols-outlined">add</span>
            New Lead
          </Link>
        </div>
      </div>

      <div style={{ marginBottom: "var(--spacing-6)", display: "flex", gap: "12px" }}>
        <input 
          type="text" 
          className="input" 
          placeholder="Search leads by name, email, phone..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: '400px' }}
        />
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-6)' }}>Loading leads...</div>
      ) : (
        <>
          {viewMode === "KANBAN" ? (
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              overflowX: 'auto', 
              paddingBottom: '20px',
              minHeight: '600px'
            }}>
              {STATUS_STAGES.map(status => (
                <div 
                  key={status} 
                  className="glass-card"
                  style={{ 
                    minWidth: '300px', 
                    maxWidth: '300px',
                    backgroundColor: 'var(--background-alt)', 
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, status)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
                    <span>{status}</span>
                    <span style={{ fontSize: '12px', background: 'var(--border)', padding: '2px 8px', borderRadius: '12px' }}>
                      {leads.filter(l => l.status === status).length}
                    </span>
                  </div>
                  
                  {leads.filter(l => l.status === status).map(lead => (
                    <div 
                      key={lead.id} 
                      draggable
                      onDragStart={(e) => onDragStart(e, lead.id)}
                      onClick={() => router.push(`/dashboard/crm/leads/${lead.id}`)}
                      style={{ 
                        backgroundColor: 'var(--background)', 
                        padding: '12px', 
                        borderRadius: '8px',
                        cursor: 'grab',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{lead.companyName}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        {lead.contactPerson} • {lead.serviceType}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                        <span style={{ 
                          color: lead.priority === 'High' ? 'var(--danger)' : lead.priority === 'Medium' ? 'var(--warning)' : 'var(--success)'
                        }}>
                          {lead.priority} Priority
                        </span>
                        <span style={{ fontWeight: 600 }}>BDT {lead.expectedValue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px' }}>Company</th>
                    <th style={{ padding: '12px' }}>Contact Person</th>
                    <th style={{ padding: '12px' }}>Phone</th>
                    <th style={{ padding: '12px' }}>Service Type</th>
                    <th style={{ padding: '12px' }}>Value</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px' }}>Assigned To</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(lead => (
                    <tr 
                      key={lead.id} 
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                      onClick={() => router.push(`/dashboard/crm/leads/${lead.id}`)}
                      className="hover-row"
                    >
                      <td style={{ padding: '12px', fontWeight: 500 }}>{lead.companyName}</td>
                      <td style={{ padding: '12px' }}>{lead.contactPerson}</td>
                      <td style={{ padding: '12px' }}>{lead.phone}</td>
                      <td style={{ padding: '12px' }}>{lead.serviceType}</td>
                      <td style={{ padding: '12px' }}>BDT {lead.expectedValue}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ background: 'var(--border)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                          {lead.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>{lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : 'Unassigned'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
