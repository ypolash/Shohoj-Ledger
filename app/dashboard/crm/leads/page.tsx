"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

// Modular Components
import { LeadTable } from "./components/LeadTable";
import { LeadFilters } from "./components/LeadFilters";
import { LeadSearch } from "./components/LeadSearch";
import { LeadToolbar } from "./components/LeadToolbar";
import { LeadStats } from "./components/LeadStats";
import { LeadEmptyState } from "./components/LeadEmptyState";
import { LeadLoading } from "./components/LeadLoading";
import { LeadCard } from "./components/LeadCard";
import { FastLeadDrawer } from "../../components/FastLeadDrawer";
import { CRMFAB } from "../../components/CRMFAB";

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadDrawerOpen, setLeadDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: '', priority: '' });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
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

  // Mock Stats (In a real scenario, an API provides this)
  const stats = {
    total: leads.length,
    newLeads: leads.filter(l => l.status === 'New').length,
    qualified: leads.filter(l => l.status === 'Qualified').length,
    won: leads.filter(l => l.status === 'Won').length,
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Lead Management" 
        description="Manage your enterprise sales pipeline and prospect interactions."
      />

      <LeadStats {...stats} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <LeadSearch onSearch={(q) => setFilters(prev => ({ ...prev, search: q }))} />
          <LeadToolbar onRefresh={fetchLeads} onAddLead={() => setLeadDrawerOpen(true)} />
        </div>

        <LeadFilters onFilterChange={(newFilter) => setFilters(prev => ({ ...prev, ...newFilter }))} />

        {loading ? (
          <LeadLoading />
        ) : leads.length === 0 ? (
          <LeadEmptyState />
        ) : isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {leads.map(lead => <LeadCard key={lead.id} lead={lead} onDelete={handleDelete} />)}
          </div>
        ) : (
          <LeadTable leads={leads} onDelete={handleDelete} />
        )}
      </div>

      <FastLeadDrawer 
        isOpen={leadDrawerOpen} 
        onClose={() => setLeadDrawerOpen(false)}
        onSuccess={() => {
          setLeadDrawerOpen(false);
          fetchLeads();
        }}
      />

      <CRMFAB onAddLead={() => setLeadDrawerOpen(true)} />
    </PageContainer>
  );
}
