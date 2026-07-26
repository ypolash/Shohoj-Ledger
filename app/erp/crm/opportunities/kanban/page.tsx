"use client";

import React, { useState, useEffect } from 'react';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

// Modular Components
import { OpportunityKanban } from "../components/OpportunityKanban";
import { OpportunitySearch } from "../components/OpportunitySearch";
import { OpportunityToolbar } from "../components/OpportunityToolbar";
import { OpportunityLoading } from "../components/OpportunityLoading";
import { OpportunityFilters } from "../components/OpportunityFilters";

export default function OpportunitiesKanbanPage() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ query: '', stageId: '', ownerId: '' });

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const qParams = new URLSearchParams();
      if (filters.query) qParams.append("query", filters.query);
      if (filters.stageId) qParams.append("stageId", filters.stageId);
      if (filters.ownerId) qParams.append("ownerId", filters.ownerId);

      const res = await fetch(`/api/crm/opportunities?${qParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data.opportunities || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  return (
    <PageContainer>
      <PageHeader 
        title="Kanban Board" 
        description="Visual pipeline of all your enterprise deals."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <OpportunitySearch onSearch={(q) => setFilters(prev => ({ ...prev, query: q }))} />
          <OpportunityToolbar currentView="kanban" onRefresh={fetchOpportunities} />
        </div>
        
        <OpportunityFilters onFilterChange={(newFilter) => setFilters(prev => ({ ...prev, ...newFilter }))} />

        {loading ? <OpportunityLoading /> : <OpportunityKanban opportunities={opportunities} />}
      </div>
    </PageContainer>
  );
}
