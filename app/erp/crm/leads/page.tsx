"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

// Modular Components
import { LeadTable } from "./components/LeadTable";
import { LeadFilters } from "./components/LeadFilters";
import { LeadSearch } from "./components/LeadSearch";
import { LeadToolbar } from "./components/LeadToolbar";
import { LeadEmptyState } from "./components/LeadEmptyState";
import { LeadLoading } from "./components/LeadLoading";
import { LeadCard } from "./components/LeadCard";
import { LeadKanbanBoard } from "./components/LeadKanbanBoard";

import { LeadProgress } from "./components/LeadProgress";
import { Drawer } from "@/components/ui/Drawer/Drawer";
import Link from "next/link";

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');
  const [loading, setLoading] = useState(true);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  
  const [filters, setFilters] = useState({ 
    search: '', 
    status: '', 
    priority: '', 
    source: '', 
    assignedToId: '', 
    dateFrom: '', 
    dateTo: '' 
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.search) query.append("search", filters.search);
      if (filters.status) query.append("status", filters.status);
      if (filters.priority) query.append("priority", filters.priority);
      if (filters.source) query.append("source", filters.source);
      if (filters.assignedToId) query.append("assignedToId", filters.assignedToId);
      if (filters.dateFrom) query.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) query.append("dateTo", filters.dateTo);

      const res = await fetch(`/api/crm/leads?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      const res = await fetch(`/api/crm/leads/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLeads();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  return (
    <PageContainer>
      <PageHeader 
        title="Lead Management" 
        description="Manage your enterprise sales pipeline and prospect interactions."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <LeadSearch onSearch={(q) => setFilters(prev => ({ ...prev, search: q }))} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', background: 'var(--surface-hover)', borderRadius: '8px', padding: '4px', border: '1px solid var(--border-light)' }}>
              <button 
                onClick={() => setViewMode('table')}
                style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: viewMode === 'table' ? 'var(--primary-glow)' : 'transparent', color: viewMode === 'table' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>table_rows</span>
                Table
              </button>
              <button 
                onClick={() => setViewMode('board')}
                style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: viewMode === 'board' ? 'var(--primary-glow)' : 'transparent', color: viewMode === 'board' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>view_kanban</span>
                Board
              </button>
            </div>
            <LeadToolbar leads={leads} onRefresh={fetchLeads} />
          </div>
        </div>

        <LeadFilters filters={filters} onFilterChange={(newFilter) => setFilters(prev => ({ ...prev, ...newFilter }))} />

        {loading ? (
          <LeadLoading />
        ) : leads.length === 0 ? (
          <LeadEmptyState />
        ) : isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {leads.map(lead => <LeadCard key={lead.id} lead={lead} onDelete={handleDelete} />)}
          </div>
        ) : viewMode === 'board' ? (
          <LeadKanbanBoard 
            leads={leads}
            onDelete={handleDelete}
            onLeadClick={(id) => setSelectedLeadId(id)}
            onStatusChange={(id, newStatus) => {
              setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
            }}
          />
        ) : (
          <LeadTable 
            leads={leads} 
            onDelete={handleDelete} 
            onLeadClick={(id) => setSelectedLeadId(id)}
            onStatusChange={(id, newStatus) => {
              setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
            }}
          />
        )}
      </div>

      <Drawer 
        isOpen={!!selectedLeadId} 
        onClose={() => setSelectedLeadId(null)}
        position="right"
        size="md"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 600 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>assignment_ind</span>
            Lead Profile
          </div>
        }
      >
        {selectedLead && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Hero Section */}
            <div style={{ 
              padding: '32px 24px', 
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 10%, transparent), transparent)',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex', gap: '20px', alignItems: 'center'
            }}>
              <div style={{ 
                width: '64px', height: '64px', borderRadius: '16px', 
                background: 'var(--primary-glow)', color: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', fontWeight: 800,
                border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
                boxShadow: '0 8px 16px color-mix(in srgb, var(--primary) 15%, transparent)'
              }}>
                {selectedLead.companyName ? selectedLead.companyName.charAt(0).toUpperCase() : 'L'}
              </div>
              <div>
                <h2 style={{ margin: '0 0 6px 0', fontSize: '24px', color: 'var(--text-main)', fontWeight: 700, letterSpacing: '-0.02em' }}>
                  {selectedLead.companyName || 'Unknown Company'}
                </h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>business_center</span>
                  {selectedLead.serviceType || 'General Inquiry'}
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, overflowY: 'auto' }}>
              
              {/* Quick Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Primary Contact</div>
                  <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '14px' }}>{selectedLead.contactPerson || 'N/A'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>mail</span>
                    {selectedLead.email || selectedLead.phone || 'No Email'}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Lead Priority</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '10px', height: '10px', borderRadius: '50%', 
                      background: selectedLead.priority === 'High' ? 'var(--danger)' : selectedLead.priority === 'Medium' ? 'var(--warning)' : 'var(--success)',
                      boxShadow: `0 0 8px ${selectedLead.priority === 'High' ? 'var(--danger)' : selectedLead.priority === 'Medium' ? 'var(--warning)' : 'var(--success)'}`
                    }}></div>
                    <span style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '14px' }}>{selectedLead.priority || 'Normal'}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Updated {new Date(selectedLead.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Pipeline Section */}
              <div style={{ 
                background: 'var(--surface-hover)', 
                border: '1px solid var(--border-light)', 
                borderRadius: '16px', 
                padding: '24px',
                boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>conversion_path</span>
                    Sales Pipeline
                  </h3>
                  <div style={{ 
                    background: 'var(--primary)', color: 'white', 
                    padding: '4px 12px', borderRadius: '20px', 
                    fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase'
                  }}>
                    {selectedLead.status}
                  </div>
                </div>
                
                <LeadProgress 
                  leadId={selectedLead.id} 
                  currentStatus={selectedLead.status} 
                  onStatusChange={(newStatus) => {
                    setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, status: newStatus } : l));
                  }} 
                />
              </div>
              
              {/* Actions */}
              <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
                <Link href={`/erp/crm/leads/${selectedLead.id}`} style={{ flex: 1 }}>
                  <button style={{ 
                    width: '100%', padding: '14px', background: 'var(--primary)', color: 'white', 
                    border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                    boxShadow: '0 4px 12px var(--primary-glow)',
                    transition: 'all 0.2s', fontSize: '14px'
                  }} 
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px color-mix(in srgb, var(--primary) 40%, transparent)'; }} 
                  onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px var(--primary-glow)'; }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
                    View Full Profile
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </PageContainer>
  );
}
